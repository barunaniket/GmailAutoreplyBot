import os.path
import base64
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import openai
import re
import os
import sys
from dotenv import load_dotenv

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
SUPPORT_EMAIL = "your-support-team-email@example.com" 

openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    print("ERROR: OpenAI API key not found.")
    print("Please set the OPENAI_API_KEY in your .env file.")
    sys.exit(1)

def get_gmail_service():
    """Authenticates with the Gmail API and returns a service object."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open("token.json", "w") as token:
            token.write(creds.to_json())
            
    return build("gmail", "v1", credentials=creds)

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
                body = body.split("\n\n---")[0]

            if body:
                conversation_history.append({"role": role, "content": body})
                full_conversation_text += f"From: {sender_header}\nDate: {date_header}\n\n{body}\n\n{'='*40}\n\n"
        
        return conversation_history, full_conversation_text
    except HttpError as error:
        print(f"An error occurred fetching thread: {error}")
        return [], ""

def fetch_unread_emails(service):
    """Fetches the metadata for unread emails."""
    try:
        result = service.users().messages().list(userId="me", labelIds=['INBOX'], q="is:unread").execute()
        messages = result.get('messages', [])
        if not messages: return []

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
        print(f"An error occurred: {error}")
        return []

# `def determine_user_intent(last_message_content):
#     """
#     Uses OpenAI to classify the user's intent. This is the 'Agent Brain'.
#     """
#     print("Determining user intent...")
#     intent_prompt = f"""
#       Analyze the following email and classify its primary intent.
#       Choose one of the following categories:
#       - "question": The user is asking for help, information, or how to do something.
#       - "escalation_request": The user is explicitly asking for a human, a support agent, to create a ticket, or expresses strong frustration.
#       - "other": The post is a general comment, feedback, or does not fit the other categories.

#       Email: "{last_message_content}"
      
#       Intent:"""

#     try:
#         response = openai.chat.completions.create(
#             model="gpt-4o",
#             messages=[{"role": "user", "content": intent_prompt}],
#             max_tokens=10,
#             temperature=0
#         )
#         intent = response.choices[0].message.content.strip().lower().replace("\"", "")
#         print(f"Intent classified as: {intent}")
#         return intent
#     except Exception as e:
#         print(f"Error determining intent: {e}")
#         return "question"

def generate_ai_reply(email_subject, conversation_history):
    """Generates a standard AI reply for user questions."""
    print("Generating AI reply...")
    knowledge_base_context = "Placeholder for info from your backend. Our return policy is 30 days."
    system_prompt = f"""You are an expert AI assistant for the email thread with subject "{email_subject}".
      Instructions: Use the KNOWLEDGE BASE. Analyze conversation history for context, but focus on the latest post. Be concise.
      --- KNOWLEDGE BASE ---
      {knowledge_base_context}"""
    
    messages_for_api = [{"role": "system", "content": system_prompt}] + conversation_history
    try:
        response = openai.chat.completions.create(model="gpt-4o", messages=messages_for_api, max_tokens=400)
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating AI reply: {e}")
        return "I'm sorry, I encountered an error. A human agent will get back to you shortly."

def send_email(service, to, subject, message_text, thread_id):
    """Creates and sends an email reply."""
    try:
        recipient_email = to.split('<')[-1].strip('>')
        reply_subject = f"Re: {subject}" if not subject.lower().startswith("re:") else subject
        message = MIMEText(message_text)
        message['to'], message['from'], message['subject'] = recipient_email, 'me', reply_subject
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        body = {'raw': raw_message, 'threadId': thread_id}
        sent_message = service.users().messages().send(userId='me', body=body).execute()
        print(f"Email sent to {recipient_email}.")
    except HttpError as error:
        print(f"An error occurred while sending email: {error}")

def forward_email_to_support(service, user_email, subject, full_conversation_text):
    """Forwards the entire conversation to the support email address."""
    print(f"Forwarding conversation to support at {SUPPORT_EMAIL}...")
    try:
        forward_subject = f"Escalated Support Request from {user_email}: {subject}"
        forward_body = (f"This email thread from {user_email} has been automatically escalated for human review.\n\n"
                        f"--- Full Conversation History ---\n\n{full_conversation_text}")
        message = MIMEText(forward_body)
        message['to'], message['from'], message['subject'] = SUPPORT_EMAIL, 'me', forward_subject
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        print("Forwarded to support successfully.")
    except HttpError as error:
        print(f"An error occurred while forwarding email: {error}")

def mark_as_read(service, msg_id):
    """Marks an email as read."""
    try:
        service.users().messages().modify(userId='me', id=msg_id, body={'removeLabelIds': ['UNREAD']}).execute()
    except HttpError as error:
        print(f"An error occurred while marking as read: {error}")

def main():
    service = get_gmail_service()
    print("\nStarting Agent Brain... Checking for new messages.")
    unread_emails = fetch_unread_emails(service)
    
    if unread_emails:
        print(f"\n--- Found {len(unread_emails)} new emails ---")
        for email in unread_emails:
            print(f"\nProcessing email from: {email['from']} | Subject: {email['subject']}")
            
            conversation_history, full_text = fetch_thread_history(service, email['threadId'])
            if not conversation_history:
                print("Could not fetch conversation history. Skipping."); continue

            last_message = conversation_history[-1]['content']

            reply_text = generate_ai_reply(email['subject'], conversation_history)
            print(f"Generated Reply: {reply_text}")
            send_email(service, email['from'], email['subject'], reply_text, email['threadId'])
            

if __name__ == "__main__":
    main()

