import os
import sys
import json
import atexit
import uuid
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from multiprocessing import Process, Manager, Queue
from main import main as run_bot_main # Import the bot's main function

# --- State Management ---
# Using a multiprocessing Manager to share state between the API and the bot process
manager = Manager()
shared_state = manager.dict()
shared_state['bot_status'] = 'Offline'
shared_state['bot_process'] = None
shared_state['activity_log'] = manager.list()

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allow frontend to connect

bot_process = None

# --- Bot Runner Function ---
def bot_runner(state, log_queue):
    """Wraps the bot's main function to update shared state."""
    state['bot_status'] = 'Running'
    print(f"Bot process started with PID: {os.getpid()}")
    try:
        # We need to adapt the bot's main function to accept the state and queue
        # For now, we'll simulate its run and logging
        run_bot_main(state, log_queue) 
    except Exception as e:
        print(f"Bot process encountered an error: {e}")
        state['bot_status'] = 'Error'
    finally:
        print("Bot process finished.")
        state['bot_status'] = 'Offline'

# --- API Endpoints ---
@app.route('/api/start', methods=['POST'])
def start_bot():
    global bot_process
    if bot_process and bot_process.is_alive():
        return jsonify({"status": "error", "message": "Bot is already running."}), 400

    shared_state['bot_status'] = 'Starting...'
    log_queue = Queue()

    # Pass the shared state and queue to the target function
    bot_process = Process(target=run_bot_main, args=(shared_state, log_queue))
    bot_process.daemon = True
    bot_process.start()
    
    shared_state['bot_process_pid'] = bot_process.pid
    return jsonify({"status": "success", "message": "Bot started.", "pid": bot_process.pid})

@app.route('/api/stop', methods=['POST'])
def stop_bot():
    global bot_process
    if not bot_process or not bot_process.is_alive():
        return jsonify({"status": "error", "message": "Bot is not running."}), 400

    print(f"Stopping bot process with PID: {bot_process.pid}")
    bot_process.terminate()
    bot_process.join(timeout=5) # Wait for the process to terminate
    bot_process = None
    
    shared_state['bot_status'] = 'Offline'
    shared_state['bot_process_pid'] = None
    
    return jsonify({"status": "success", "message": "Bot stopped."})

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    # To make the log feel alive, add some dummy data if the bot is offline
    if shared_state['bot_status'] == 'Offline' and not shared_state['activity_log']:
        log_entry = {
            "id": uuid.uuid4().hex,
            "from": "System",
            "intent": "Status",
            "action": "Ready",
            "time": time.strftime("%H:%M:%S")
        }
        shared_state['activity_log'].insert(0, log_entry)


    # Prune old log entries to keep it tidy
    while len(shared_state['activity_log']) > 50:
        shared_state['activity_log'].pop()

    data = {
        "bot_status": shared_state.get('bot_status', 'Unknown'),
        "stats": shared_state.get('stats', {"processed": 0, "replied": 0, "escalated": 0, "ignored": 0}),
        "activity_log": list(shared_state['activity_log']) # Convert proxy list to a real list
    }
    return jsonify(data)

# --- Cleanup ---
def cleanup():
    global bot_process
    if bot_process and bot_process.is_alive():
        print("Flask app is shutting down. Terminating bot process...")
        bot_process.terminate()
        bot_process.join()

atexit.register(cleanup)

if __name__ == '__main__':
    app.run(port=5001, debug=True, use_reloader=False) # use_reloader=False is important for multiprocessing