import os
import sys
import json
import atexit
import uuid
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from multiprocessing import Process, Manager, Queue, freeze_support
from main import main as run_bot_main # Import the bot's main function

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# This will hold our single bot process
bot_process = None
# This manager will be created inside the main block
shared_state = None

# --- API Endpoints ---
@app.route('/api/start', methods=['POST'])
def start_bot():
    global bot_process
    if bot_process and bot_process.is_alive():
        return jsonify({"status": "error", "message": "Bot is already running."}), 400

    shared_state['bot_status'] = 'Starting...'
    
    # Pass the shared state to the target function
    bot_process = Process(target=run_bot_main, args=(shared_state, None)) # Queue is not used for now
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
    bot_process.join(timeout=5)
    bot_process = None
    
    if shared_state:
        shared_state['bot_status'] = 'Offline'
        shared_state['bot_process_pid'] = None
    
    return jsonify({"status": "success", "message": "Bot stopped."})

@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    if not shared_state:
         return jsonify({
            "bot_status": "Offline",
            "stats": {"processed": 0, "replied": 0, "escalated": 0, "ignored": 0},
            "activity_log": []
         })

    # Prune old log entries
    activity_log = shared_state.get('activity_log', [])
    while len(activity_log) > 50:
        activity_log.pop()
    
    data = {
        "bot_status": shared_state.get('bot_status', 'Unknown'),
        "stats": dict(shared_state.get('stats', {})),
        "activity_log": list(activity_log)
    }
    return jsonify(data)

# --- Main Execution Block ---
if __name__ == '__main__':
    # This is necessary for Windows multiprocessing
    freeze_support()

    # Initialize the manager and shared state here
    manager = Manager()
    shared_state = manager.dict()
    shared_state['bot_status'] = 'Offline'
    shared_state['stats'] = manager.dict({"processed": 0, "replied": 0, "escalated": 0, "ignored": 0})
    shared_state['activity_log'] = manager.list()
    
    # Define cleanup function here to have access to bot_process
    def cleanup():
        global bot_process
        if bot_process and bot_process.is_alive():
            print("Flask app is shutting down. Terminating bot process...")
            bot_process.terminate()
            bot_process.join()

    atexit.register(cleanup)

    # Start the Flask server
    app.run(port=5001, debug=True, use_reloader=False)