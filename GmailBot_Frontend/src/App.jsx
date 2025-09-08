import React, { useState, useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { Mail, Zap, UserCheck, EyeOff, Clock, Inbox, AlertCircle, ArrowRight } from 'lucide-react';
import { GoogleGeminiEffect } from './components/GeminiEffect.jsx';
import { BackgroundLines } from './components/BackgroundLines.jsx';

// --- Mock Data ---
const mockStats = {
  processed: 1345,
  replied: 890,
  escalated: 112,
  ignored: 343,
};

const mockActivity = [
  { id: 1, from: 'john.doe@example.com', intent: 'question', action: 'Replied', time: '2m ago' },
  { id: 2, from: 'jane.smith@corp.com', intent: 'escalation_request', action: 'Escalated', time: '15m ago' },
  { id: 3, from: 'support@service.com', intent: 'follow_up', action: 'Ignored', time: '45m ago' },
  { id: 4, from: 'test.user@domain.net', intent: 'question', action: 'Replied', time: '1h ago' },
  { id: 5, from: 'angry.customer@mail.org', intent: 'escalation_request', action: 'Escalated', time: '3h ago' },
];

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
  <div className="flex items-center space-x-4 p-4 hover:bg-neutral-800/60 rounded-lg transition-colors duration-200">
    <div className={`p-3 rounded-full bg-neutral-800 border border-neutral-700`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-neutral-200">{from}</p>
      <div className="flex items-center text-sm text-neutral-400">
        <span>Intent: <span className="font-medium text-neutral-300">{intent}</span></span>
        <span className="mx-2">|</span>
        <span>Action: <span className={`font-medium ${color}`}>{action}</span></span>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-neutral-500">{time}</p>
    </div>
  </div>
);

// --- Main App Component ---
const App = () => {
  const [botStatus] = useState('Running');
  const [stats] = useState(mockStats);
  const [activity] = useState(mockActivity);
  
  // Ref for the container to track scroll progress
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const getActionDetails = (action) => {
    switch (action) {
      case 'Replied': return { icon: Zap, color: 'text-blue-400' };
      case 'Escalated': return { icon: AlertCircle, color: 'text-amber-400' };
      case 'Ignored': return { icon: EyeOff, color: 'text-gray-500' };
      default: return { icon: Mail, color: 'text-neutral-400' };
    }
  };

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
            <GoogleGeminiEffect
              scrollYProgress={scrollYProgress}
            />
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
              <div className={`w-3 h-3 rounded-full ${botStatus === 'Running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <p className="text-lg text-neutral-200">
                Bot Status: <span className={`${botStatus === 'Running' ? 'text-green-400' : 'text-red-400'}`}>{botStatus}</span>
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard icon={Inbox} title="Emails Processed" value={stats.processed} color="text-indigo-400" />
              <StatCard icon={Zap} title="AI Replies Sent" value={stats.replied} color="text-blue-400" />
              <StatCard icon={UserCheck} title="Escalated to Human" value={stats.escalated} color="text-amber-400" />
              <StatCard icon={EyeOff} title="Ignored" value={stats.ignored} color="text-gray-500" />
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700/80 rounded-xl"
            >
              <div className="p-6 border-b border-neutral-700/80">
                <h2 className="text-2xl font-semibold text-neutral-100 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-neutral-400" />
                  Recent Activity
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {activity.map(item => {
                  const { icon, color } = getActionDetails(item.action);
                  return <ActivityItem key={item.id} {...item} icon={icon} color={color} />;
                })}
              </div>
              <div className="p-4 border-t border-neutral-700/80 text-center">
                <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center w-full">
                  View Full Log <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

