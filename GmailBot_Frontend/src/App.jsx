import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Mail, Zap, UserCheck, EyeOff, Clock, Inbox, AlertCircle, ArrowRight, Loader2, ServerCrash, Play, Square } from 'lucide-react';
import { GoogleGeminiEffect } from './components/GeminiEffect.jsx';
import { BackgroundLines } from './components/BackgroundLines.jsx';
import GlowingEffectDemo from './components/ui/GlowingEffectDemo.jsx'; // Import the new component

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
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className="flex items-center space-x-4 p-4 hover:bg-neutral-800/60 rounded-lg transition-colors duration-200"
  >
    <div className={`p-3 rounded-full bg-neutral-800 border border-neutral-700`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
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

const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-20 text-neutral-500">
    <Loader2 className="w-12 h-12 animate-spin" />
    <p className="mt-4 text-lg">{message}</p>
  </div>
);

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
  const [botStatus, setBotStatus] = useState('Offline');
  const [stats, setStats] = useState({ processed: 0, replied: 0, escalated: 0, ignored: 0 });
  const [activity, setActivity] = useState([]);
  const [apiState, setApiState] = useState('loading');
  const [isControlBusy, setIsControlBusy] = useState(false); // For Start/Stop buttons

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const API_BASE_URL = 'http://127.0.0.1:5001/api';

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard-data`);
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      const data = await response.json();
      setStats(data.stats);
      setBotStatus(data.bot_status);
      setActivity(data.activity_log);
      setApiState('success');
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setApiState('error');
      setBotStatus('Offline');
    }
  };
  
  // --- NEW: Bot Control Functions ---
  const handleStartBot = async () => {
    if (botStatus === 'Running' || botStatus === 'Starting...') return;
    setIsControlBusy(true);
    setBotStatus('Starting...'); 
    try {
      await fetch(`${API_BASE_URL}/start`, { method: 'POST' });
    } catch (error) {
      console.error("Failed to start bot:", error);
      setBotStatus('Error');
    } finally {
      setIsControlBusy(false);
      fetchData(); // Fetch immediately after action
    }
  };

  const handleStopBot = async () => {
    if (botStatus === 'Offline' || botStatus === 'Error') return;
    setIsControlBusy(true);
    try {
      await fetch(`${API_BASE_URL}/stop`, { method: 'POST' });
      setBotStatus('Offline');
    } catch (error) {
      console.error("Failed to stop bot:", error);
    } finally {
      setIsControlBusy(false);
      fetchData();
    }
  };


  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 2000); // Poll faster for more "real-time" feel
    return () => clearInterval(intervalId);
  }, []);

  const getActionDetails = (action) => {
    switch (action) {
      case 'Replied': return { icon: Zap, color: 'text-blue-400' };
      case 'Escalated': return { icon: AlertCircle, color: 'text-amber-400' };
      case 'Ignored': return { icon: EyeOff, color: 'text-gray-500' };
      case 'Ready': return { icon: UserCheck, color: 'text-green-400'};
      default: return { icon: Mail, color: 'text-neutral-400' };
    }
  };

  const getStatusIndicator = () => {
    switch (botStatus) {
      case 'Running': return { bg: 'bg-green-500 animate-pulse', text: 'text-green-400' };
      case 'Starting...': return { bg: 'bg-yellow-500 animate-pulse', text: 'text-yellow-400' };
      case 'Error': case 'Offline': return { bg: 'bg-red-500', text: 'text-red-400' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-400' };
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
            Real-time monitoring and control of your AI email assistant.
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
            
            {/* --- NEW: BOT CONTROLS --- */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700/80 rounded-xl p-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${statusColors.bg}`}></div>
                <p className="text-lg text-neutral-200">
                  Bot Status: <span className={statusColors.text}>{botStatus}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleStartBot}
                  disabled={isControlBusy || botStatus === 'Running' || botStatus === 'Starting...'}
                  className="px-4 py-2 bg-green-600/50 text-green-300 rounded-lg flex items-center gap-2 hover:bg-green-600/80 transition-all disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
                >
                  {botStatus === 'Starting...' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Bot
                </button>
                <button 
                  onClick={handleStopBot}
                  disabled={isControlBusy || botStatus === 'Offline' || botStatus === 'Error'}
                  className="px-4 py-2 bg-red-600/50 text-red-300 rounded-lg flex items-center gap-2 hover:bg-red-600/80 transition-all disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
                >
                  {isControlBusy && botStatus !== 'Offline' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  Stop Bot
                </button>
              </div>
            </motion.div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard icon={Inbox} title="Emails Processed" value={stats.processed} color="text-indigo-400" />
              <StatCard icon={Zap} title="AI Replies Sent" value={stats.replied} color="text-blue-400" />
              <StatCard icon={UserCheck} title="Escalated to Human" value={stats.escalated} color="text-amber-400" />
              <StatCard icon={EyeOff} title="Ignored" value={stats.ignored} color="text-gray-500" />
            </div>

            {/* --- NEW: Glowing Effect Demo Section --- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='mb-12'
            >
              <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">Bot Features</h2>
              <GlowingEffectDemo />
            </motion.div>


            {/* Recent Activity Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700/80 rounded-xl min-h-[400px]"
            >
              <div className="p-6 border-b border-neutral-700/80">
                <h2 className="text-2xl font-semibold text-neutral-100 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-neutral-400" />
                  Recent Activity
                </h2>
              </div>
              
              {apiState === 'loading' && <LoadingState message="Connecting to bot backend..." />}
              {apiState === 'error' && (
                <div className="p-4">
                  <ErrorState 
                    message="Could not fetch data. Is the backend server running?"
                    onRetry={fetchData}
                  />
                </div>
              )}
              {apiState === 'success' && (
                <>
                  <div className="p-4 space-y-2">
                    {activity.length === 0 && (
                      <div className="text-center py-16 text-neutral-500">
                        <Inbox className="w-10 h-10 mx-auto" />
                        <p className="mt-4 text-lg">No recent activity.</p>
                        <p>Start the bot and wait for new emails.</p>
                      </div>
                    )}
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