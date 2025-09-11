import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GridBackground } from './components/ui/grid-background'; // Import the new grid

// The base URL for your backend API
const API_URL = 'http://localhost:5001/api';

// --- TypeScript Interfaces ---
interface Stats {
  processed: number;
  replied: number;
  escalated: number;
  ignored: number;
}

interface ActivityLog {
  id: string;
  from: string;
  intent: string;
  action: string;
  time: string;
}

interface DashboardData {
  bot_status: string;
  stats: Stats;
  activity_log: ActivityLog[];
}

function App() {
  // --- State Management ---
  const [botStatus, setBotStatus] = useState<string>('Offline');
  const [stats, setStats] = useState<Stats>({ processed: 0, replied: 0, escalated: 0, ignored: 0 });
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- Data Fetching ---
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get<DashboardData>(`${API_URL}/dashboard-data`);
      const data = response.data;
      setBotStatus(data.bot_status);
      setStats(data.stats);
      setActivityLog(data.activity_log);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setBotStatus('Offline');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effect Hook ---
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- API Call Handlers ---
  const handleStartBot = async () => {
    try {
      setBotStatus('Starting...');
      await axios.post(`${API_URL}/start`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to start bot:", error);
      alert("Error: Could not start the bot.");
    }
  };

  const handleStopBot = async () => {
    try {
      setBotStatus('Stopping...');
      await axios.post(`${API_URL}/stop`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to stop bot:", error);
      alert("Error: Could not stop the bot.");
    }
  };

  // --- UI Rendering ---
  const statusColor = botStatus === 'Running' ? 'bg-green-500' : 
                      botStatus === 'Offline' ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <GridBackground className="min-h-screen font-sans text-white">
      <div className="relative z-10 container mx-auto p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-100">Gmail AutoReply Bot</h1>
          <div className="flex items-center space-x-4">
            <span className={`w-4 h-4 rounded-full animate-pulse ${statusColor}`}></span>
            <span className="text-lg font-semibold">{botStatus}</span>
          </div>
        </header>

        {/* Controls */}
        <div className="mb-10 flex space-x-4">
          <button 
            onClick={handleStartBot} 
            disabled={botStatus === 'Running'}
            className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed">
            Start Bot
          </button>
          <button 
            onClick={handleStopBot} 
            disabled={botStatus !== 'Running'}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed">
            Stop Bot
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Stats Section */}
          <div className="lg:col-span-1 bg-black/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Statistics</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                        <p className="text-4xl font-bold">{isLoading ? '...' : value}</p>
                        <p className="text-zinc-400 capitalize">{key}</p>
                    </div>
                ))}
            </div>
          </div>

          {/* Activity Log Section */}
          <div className="lg:col-span-2 bg-black/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Activity Log</h2>
            <div className="overflow-x-auto h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="border-b border-zinc-700">
                  <tr>
                    <th className="py-3 px-4">From</th>
                    <th className="py-3 px-4">Intent</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && <tr><td colSpan={4} className="text-center py-8">Loading logs...</td></tr>}
                  {!isLoading && activityLog.length === 0 && <tr><td colSpan={4} className="text-center py-8">No activity to display.</td></tr>}
                  {activityLog.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                      <td className="py-4 px-4 break-all">{log.from}</td>
                      <td className="py-4 px-4">{log.intent}</td>
                      <td className="py-4 px-4">{log.action}</td>
                      <td className="py-4 px-4 text-zinc-400">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </GridBackground>
  );
}

export default App;