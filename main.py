import os.path
import base64
import json
import sys
import re
import time  # NEW: For the polling loop
import openai
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

# NEW: Added gmail.labels scope to manage labels
SCOPES = ["https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/gmail.labels"]

openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    print("ERROR: OpenAI API key not found.")
    print("Please set the OPENAI_API_KEY in your .env file.")
    sys.exit(1)

def load_config():
    """Loads the configuration from config.json."""
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
        print(f"Configuration loaded. Running Bot Version: {config.get('bot_version', 'unknown')}")
        return config
    except FileNotFoundError:
        print("ERROR: config.json not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print("ERROR: config.json is not valid JSON.")
        sys.exit(1)

def get_gmail_service():
    """Authenticates with the Gmail API and returns a service object."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Token refresh failed: {e}. Deleting token.json for re-authentication.")
                os.remove("token.json")  # NEW: Delete bad token
                creds = None  # Force re-auth
        
        if not creds:  # Run auth flow if no creds or refresh failed
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open("token.json", "w") as token:
            token.write(creds.to_json())
            
    return build("gmail", "v1", credentials=creds)

# NEW: Helper function to find a label by name or create it
def get_or_create_label_id(service, label_name):
    """Finds a label ID by name. If it doesn't exist, creates it."""
    try:
        results = service.users().labels().list(userId='me').execute()
        labels = results.get('labels', [])
        
        for label in labels:
            if label['name'].lower() == label_name.lower():
                return label['id']
        
        # Label not found, create it
        print(f"Label '{label_name}' not found. Creating it...")
        label_body = {'name': label_name, 'labelListVisibility': 'labelShow', 'messageListVisibility': 'show'}
        created_label = service.users().labels().create(userId='me', body=label_body).execute()
        print(f"Label created with ID: {created_label['id']}")
        return created_label['id']
        
    except HttpError as error:
        print(f"An error occurred managing labels: {error}")
        sys.exit(1)

def get_body_from_message(message_part):
    """Decodes and extracts the email body from a message part."""
    body = ""
    if message_part.get('body') and message_part['body'].get('data'):
        data = message_part['body']['data']
        body = base64.urlsafe_b64decode(data).decode('utf-8')
    elif message_part.get('parts'):
        for part in message_part['parts']:
            if part['mimeType'] == 'text/plain':
                return get_body_from_message(part)
    return body.strip()

def fetch_thread_history(service, thread_id):
    """Fetches and reconstructs the conversation history from an email thread."""
    try:
        thread = service.users().threads().get(userId='me', id=thread_id).execute()
        messages = thread['messages']
        
        profile = service.users().getProfile(userId='me').execute()
        my_email = profile['emailAddress']
        
        conversation_history = []
        full_conversation_text = ""
        
        for msg in messages:
            headers = msg['payload']['headers']
            sender_header = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
            date_header = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')
            
            sender_email_match = re.search(r'<(.+?)>', sender_header)
            sender_email = sender_email_match.group(1) if sender_email_match else sender_header
            
            role = 'assistant' if sender_email == my_email else 'user'
            body = get_body_from_message(msg['payload'])

            if role == 'assistant':
                body = body.split("\n\n---")[0].strip()

            if body:
                conversation_history.append({"role": role, "content": body})
                full_conversation_text += f"From: {sender_header}\nDate: {date_header}\n\n{body}\n\n{'='*40}\n\n"
        
        return conversation_history, full_conversation_text
    except HttpError as error:
        print(f"An error occurred fetching thread: {error}")
        return [], ""

def fetch_unread_emails(service, label_config):
    """
    Fetches unread emails, EXCLUDING any that have already been processed by the bot.
    """
    # NEW: Build a query to exclude emails we've already labeled
    labels_to_exclude = " ".join([f"-label:\"{name}\"" for name in label_config.values()])
    query = f"is:unread {labels_to_exclude}"
    print(f"Searching with query: {query}")
    
    try:
        result = service.users().messages().list(userId="me", labelIds=['INBOX'], q=query).execute()
        messages = result.get('messages', [])
        if not messages: 
            return []

        email_data = []
        for msg_summary in messages:
            msg = service.users().messages().get(userId='me', id=msg_summary['id'], format='metadata', metadataHeaders=['Subject', 'From']).execute()
            headers = msg['payload']['headers']
            email_data.append({
                "id": msg_summary['id'], "threadId": msg['threadId'],
                "subject": next((h['value'] for h in headers if h['name'] == 'Subject'), ''),
                "from": next((h['value'] for h in headers if h['name'] == 'From'), ''),
            })
        return email_data
    except HttpError as error:
        print(f"An error occurred fetching emails: {error}")
        return []

def determine_user_intent(last_message_content, config):
    """
    Uses OpenAI to classify the user's intent. Robustly checks response.
    """
    print("Determining user intent...")
    intent_prompt_template = config['prompts']['intent_classifier']
    intent_prompt = intent_prompt_template.format(last_message_content=last_message_content)
    
    try:
        response = openai.chat.completions.create(
            model=config['settings']['openai_model'],
            messages=[{"role": "user", "content": intent_prompt}],
            max_tokens=config['settings']['max_intent_tokens'],
            temperature=0
        )
        raw_intent_output = response.choices[0].message.content.strip().lower().replace("\"", "")
        
        clean_intent = "other" 
        if "escalation_request" in raw_intent_output:
            clean_intent = "escalation_request"
        elif "question" in raw_intent_output:
            clean_intent = "question"
        elif "other" in raw_intent_output:
            clean_intent = "other"

        print(f"Raw model output: '{raw_intent_output}'. ---> Cleaned Intent: '{clean_intent}'")
        return clean_intent
        
    except Exception as e:
        print(f"Error determining intent: {e}")
        return "question"

def generate_ai_reply(email_subject, conversation_history, config):
    """Generates a standard AI reply for user questions."""
    print("Generating AI reply...")
    knowledge_base_context = config['knowledge_base']
    system_prompt_template = config['prompts']['ai_reply_system']
    system_prompt = system_prompt_template.format(
        email_subject=email_subject,
        knowledge_base_context=knowledge_base_context
    )
    
    messages_for_api = [{"role": "system", "content": system_prompt}] + conversation_history
    
    try:
        response = openai.chat.completions.create(
            model=config['settings']['openai_model'],
            messages=messages_for_api,
            max_tokens=config['settings']['max_reply_tokens']
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating AI reply: {e}")
        return "I'm sorry, I encountered an error. A human agent will get back to you shortly."

def send_email(service, to, subject, message_text, thread_id):
    """Creates and sends an email reply."""
    try:
        recipient_email = to.split('<')[-1].strip('>')
        reply_subject = f"Re: {subject}" if not subject.lower().startswith("re:") else subject
        message_text += f"\n\n--- \nThis is an automated reply."

        message = MIMEText(message_text)
        message['to'], message['from'], message['subject'] = recipient_email, 'me', reply_subject
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {'raw': raw_message, 'threadId': thread_id}
        sent_message = service.users().messages().send(userId='me', body=body).execute()
        print(f"Email reply sent to {recipient_email}.")
    except HttpError as error:
        print(f"An error occurred while sending email: {error}")

def forward_email_to_support(service, user_email, subject, full_conversation_text, config):
    """Forwards the entire conversation to the support email address."""
    support_email = config['settings']['support_email']
    print(f"Forwarding conversation to support at {support_email}...")
    try:
        forward_subject = f"[Bot Escalation] from {user_email}: {subject}"
        forward_body = (f"This email thread from {user_email} has been automatically escalated by the AI bot for human review.\n\n"
                        f"--- Full Conversation History ---\n\n{full_conversation_text}")
        message = MIMEText(forward_body)
        message['to'], message['from'], message['subject'] = support_email, 'me', forward_subject
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        print("Forwarded to support successfully.")
    except HttpError as error:
        print(f"An error occurred while forwarding email: {error}")

# NEW: Replaces mark_as_read. This function marks as read AND applies a label in one API call.
def modify_message(service, msg_id, add_label_id):
    """Marks an email as read and applies a specified label."""
    try:
        body = {
            'removeLabelIds': ['UNREAD'],
            'addLabelIds': [add_label_id]
        }
        service.users().messages().modify(userId='me', id=msg_id, body=body).execute()
    except HttpError as error:
        print(f"An error occurred while modifying message: {error}")

# NEW: This function holds the core logic that used to be in main().
def process_email_batch(service, config, label_ids):
    """Fetches and processes one batch of unread emails."""
    print("\nStarting Smart Agent Brain... Checking for new messages.")
    unread_emails = fetch_unread_emails(service, config['labels'])
    
    if not unread_emails:
        print("No new emails found.")
        return

    print(f"\n--- Found {len(unread_emails)} new emails ---")
    for email in unread_emails:
        print(f"\nProcessing email from: {email['from']} | Subject: {email['subject']}")
        
        conversation_history, full_text = fetch_thread_history(service, email['threadId'])
        if not conversation_history:
            print("Could not fetch conversation history. Skipping.")
            continue

        last_message = conversation_history[-1]['content']
        intent = determine_user_intent(last_message, config)

        label_to_apply = None

        match intent:
            case "question":
                print("Action: Generating AI reply.")
                reply_text = generate_ai_reply(email['subject'], conversation_history, config)
                print(f"Generated Reply: {reply_text[:100]}...")
                send_email(service, email['from'], email['subject'], reply_text, email['threadId'])
                label_to_apply = label_ids['replied']
            
            case "escalation_request":
                print("Action: Escalating to human support.")
                forward_email_to_support(service, email['from'], email['subject'], full_text, config)
                confirm_text = "Thank you for reaching out. Your request has been escalated to our human support team, and they will get back to you shortly."
                send_email(service, email['from'], email['subject'], confirm_text, email['threadId'])
                label_to_apply = label_ids['escalated']

            case "other":
                print("Action: Intent is 'other' (e.g., spam, feedback). Marking as read and ignoring.")
                label_to_apply = label_ids['ignored']
            
            case _:
                print(f"Action: Unknown intent '{intent}'. Defaulting to ignore.")
                label_to_apply = label_ids['ignored']

        # NEW: Apply the correct label and mark as read
        if label_to_apply:
            modify_message(service, email['id'], label_to_apply)
        
        print(f"--- Finished processing email {email['id']} ---")


# NEW: The main() function is now a launcher and a persistent loop
def main():
    config = load_config()
    service = get_gmail_service()
    
    # NEW: On startup, get the IDs for our labels
    print("Setting up Gmail labels...")
    label_ids = {
        "replied": get_or_create_label_id(service, config['labels']['replied']),
        "escalated": get_or_create_label_id(service, config['labels']['escalated']),
        "ignored": get_or_create_label_id(service, config['labels']['ignored'])
    }
    print("Label setup complete. Bot is now running...")
    
    interval = config['settings']['polling_interval_seconds']
    
    # NEW: This is the main bot loop
    try:
        while True:
            process_email_batch(service, config, label_ids)
            print(f"Cycle complete. Sleeping for {interval} seconds. (Press Ctrl+C to stop)")
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\nShutdown signal received. Exiting bot.")
    except Exception as e:
        print(f"\nAn unexpected error occurred in the main loop: {e}")
        print("Bot is stopping.")

if __name__ == "__main__":
    main()