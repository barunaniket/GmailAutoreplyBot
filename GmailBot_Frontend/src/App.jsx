import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion'; // <-- Import AnimatePresence
import { Mail, Zap, UserCheck, EyeOff, Clock, Inbox, AlertCircle, ArrowRight, Loader2, ServerCrash } from 'lucide-react'; // <-- Import new icons
import { GoogleGeminiEffect } from './components/GeminiEffect.jsx';
import { BackgroundLines } from './components/BackgroundLines.jsx';

// --- REMOVED MOCK DATA ---

// --- Reusable Components ---
const StatCard = ({ icon: Icon, title, value, color }) => (
  <motion.div
    className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700/80 rounded-xl p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center justify-between">
      <p className="text-neutral-400 text-lg">{title}</p>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
    <p className="text-4xl font-bold text-neutral-100 mt-2">{value}</p>
  </motion.div>
);

const ActivityItem = ({ from, intent, action, time, icon: Icon, color }) => (
  // This motion.div is new! It's for the AnimatePresence animation
  <motion.div
    layout // Ensures smooth re-ordering if the list changes
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -50 }} // Animation for item leaving
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className="flex items-center space-x-4 p-4 hover:bg-neutral-800/60 rounded-lg transition-colors duration-200"
  >
    <div className={`p-3 rounded-full bg-neutral-800 border border-neutral-700`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper text truncation */}
      <p className="font-semibold text-neutral-200 truncate" title={from}>{from}</p>
      <div className="flex items-center text-sm text-neutral-400 flex-wrap">
        <span>Intent: <span className="font-medium text-neutral-300">{intent}</span></span>
        <span className="mx-2 hidden sm:inline">|</span>
        <span className="sm:ml-0 ml-2">Action: <span className={`font-medium ${color}`}>{action}</span></span>
      </div>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-sm text-neutral-500 whitespace-nowrap">{time}</p>
    </div>
  </motion.div>
);

// --- NEW Data Loading Component ---
const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-20 text-neutral-500">
    <Loader2 className="w-12 h-12 animate-spin" />
    <p className="mt-4 text-lg">{message}</p>
  </div>
);

// --- NEW Error Component ---
const ErrorState = ({ message, onRetry }) => (
   <div className="flex flex-col items-center justify-center p-20 text-red-400 border border-red-900/50 bg-red-900/20 rounded-lg">
    <ServerCrash className="w-12 h-12" />
    <p className="mt-4 text-lg font-semibold text-red-300">Connection Failed</p>
    <p className="text-neutral-400">{message}</p>
    <button
      onClick={onRetry}
      className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
    >
      Retry Connection
    </button>
  </div>
);


// --- Main App Component ---
const App = () => {
  // --- NEW: API Data State ---
  const [botStatus, setBotStatus] = useState('Connecting...'); // Start with a connecting status
  const [stats, setStats] = useState({ processed: 0, replied: 0, escalated: 0, ignored: 0 }); // Default empty stats
  const [activity, setActivity] = useState([]); // Start with empty activity
  const [apiState, setApiState] = useState('loading'); // 'loading', 'success', 'error'
  
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // --- NEW: API Polling Function ---
  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/dashboard-data');
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      const data = await response.json();
      
      // Update all states from the API response
      setStats(data.stats);
      setBotStatus(data.bot_status);
      setActivity(data.activity_log); // The backend log is already sorted (newest first)
      
      setApiState('success'); // Set state to success
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setApiState('error'); // Set to error state on failure
      setBotStatus('Offline');
    }
  };

  // --- NEW: useEffect for Polling ---
  useEffect(() => {
    // Fetch immediately on component mount
    fetchData();
    
    // Then, set up an interval to poll every 5 seconds
    const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds

    // Cleanup function: clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs only once (on mount)


  const getActionDetails = (action) => {
    switch (action) {
      case 'Replied': return { icon: Zap, color: 'text-blue-400' };
      case 'Escalated': return { icon: AlertCircle, color: 'text-amber-400' };
      case 'Ignored': return { icon: EyeOff, color: 'text-gray-500' };
      default: return { icon: Mail, color: 'text-neutral-400' };
    }
  };
  
  // Helper function to get status colors
  const getStatusIndicator = () => {
    switch (botStatus) {
      case 'Running':
        return { bg: 'bg-green-500 animate-pulse', text: 'text-green-400' };
      case 'STARTING':
      case 'Connecting...':
        return { bg: 'bg-yellow-500 animate-pulse', text: 'text-yellow-400' };
      case 'Error':
      case 'Offline':
        return { bg: 'bg-red-500', text: 'text-red-400' };
      default:
        return { bg: 'bg-gray-500', text: 'text-gray-400' };
    }
  };
  
  const statusColors = getStatusIndicator();

  return (
    <div className="bg-black text-white font-sans relative">
      <BackgroundLines />
      <main className="relative z-10">
        {/* Section 1: Hero Title */}
        <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
          >
            Gmail Auto-Reply Bot
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-lg text-neutral-300 max-w-2xl mx-auto"
          >
            Real-time monitoring of your AI email assistant. Scroll down to see the dashboard.
          </motion.p>
        </div>

        {/* Section 2: Gemini Animation */}
        <div ref={ref} className="h-[200vh] relative">
          <div className="sticky top-0 h-screen">
            <GoogleGeminiEffect scrollYProgress={scrollYProgress} />
          </div>
        </div>

        {/* Section 3: The Dashboard */}
        <div className="container mx-auto px-4 py-20 relative z-10 bg-black -mt-[100vh]">
          <div className="max-w-7xl mx-auto">
            {/* Bot Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center space-x-3 mb-12"
            >
              <div className={`w-3 h-3 rounded-full ${statusColors.bg}`}></div>
              <p className="text-lg text-neutral-200">
                Bot Status: <span className={statusColors.text}>{botStatus}</span>
              </p>
            </motion.div>

            {/* Stats Grid - Now uses live data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard icon={Inbox} title="Emails Processed" value={stats.processed} color="text-indigo-400" />
              <StatCard icon={Zap} title="AI Replies Sent" value={stats.replied} color="text-blue-400" />
              <StatCard icon={UserCheck} title="Escalated to Human" value={stats.escalated} color="text-amber-400" />
              <StatCard icon={EyeOff} title="Ignored" value={stats.ignored} color="text-gray-500" />
            </div>

            {/* Recent Activity Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700/80 rounded-xl min-h-[400px]" // Added min-height
            >
              <div className="p-6 border-b border-neutral-700/80">
                <h2 className="text-2xl font-semibold text-neutral-100 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-neutral-400" />
                  Recent Activity
                </h2>
              </div>
              
              {/* --- NEW: Conditional Rendering for API State --- */}
              {apiState === 'loading' && (
                <LoadingState message="Connecting to bot backend..." />
              )}
              
              {apiState === 'error' && (
                <div className="p-4">
                  <ErrorState 
                    message="Could not fetch data from the backend server."
                    onRetry={fetchData} // Pass the fetchData function to the retry button
                  />
                </div>
              )}
              
              {apiState === 'success' && (
                <>
                  <div className="p-4 space-y-2">
                    {/* If there's no activity, show an empty state message */}
                    {activity.length === 0 && (
                      <div className="text-center py-16 text-neutral-500">
                        <Inbox className="w-10 h-10 mx-auto" />
                        <p className="mt-4 text-lg">No recent activity.</p>
                        <p>The bot is running and waiting for emails.</p>
                      </div>
                    )}
                  
                    {/* --- ENHANCEMENT: AnimatePresence --- */}
                    {/* This wraps the list. It detects when items are added/removed */}
                    {/* from the 'activity' array and animates them based on their key. */}
                    <AnimatePresence>
                      {activity.map(item => {
                        const { icon, color } = getActionDetails(item.action);
                        return <ActivityItem key={item.id} {...item} icon={icon} color={color} />;
                      })}
                    </AnimatePresence>
                  </div>
                  <div className="p-4 border-t border-neutral-700/80 text-center">
                    <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center w-full disabled:text-neutral-600" disabled>
                      View Full Log (coming soon) <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;