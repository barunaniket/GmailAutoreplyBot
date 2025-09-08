import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Mail, Zap, UserCheck, EyeOff, ShieldCheck, Clock, Inbox, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

// --- GoogleGeminiEffect Component ---
const GoogleGeminiEffect = () => {
  const progress = useMotionValue(0);

  useEffect(() => {
    const animation = animate(progress, 1, {
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    });
    return () => animation.stop();
  }, [progress]);

  const pathLengths = [
    useTransform(progress, [0, 1], [0.2, 1.2]),
    useTransform(progress, [0, 1], [0.15, 1.2]),
    useTransform(progress, [0, 1], [0.1, 1.2]),
    useTransform(progress, [0, 1], [0.05, 1.2]),
    useTransform(progress, [0, 1], [0, 1.2]),
  ];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 890"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
        </defs>
        {/* Animated Paths */}
        <motion.path d="M0 663C145.5 663 191 666.265 269 647C326.5 630 339.5 621 397.5 566C439 531.5 455 529.5 490 523C509.664 519.348 521 503.736 538 504.236C553.591 504.236 562.429 514.739 584.66 522.749C592.042 525.408 600.2 526.237 607.356 523.019C624.755 515.195 641.446 496.324 657 496.735C673.408 496.735 693.545 519.572 712.903 526.769C718.727 528.934 725.184 528.395 730.902 525.965C751.726 517.115 764.085 497.106 782 496.735C794.831 496.47 804.103 508.859 822.469 518.515C835.13 525.171 850.214 526.815 862.827 520.069C875.952 513.049 889.748 502.706 903.5 503.736C922.677 505.171 935.293 510.562 945.817 515.673C954.234 519.76 963.095 522.792 972.199 524.954C996.012 530.611 1007.42 534.118 1034 549C1077.5 573.359 1082.5 594.5 1140 629C1206 670 1328.5 662.5 1440 662.5" stroke="#FFB7C5" strokeWidth="2" fill="none" style={{ pathLength: pathLengths[0] }} />
        <motion.path d="M0 587.5C147 587.5 277 587.5 310 573.5C348 563 392.5 543.5 408 535C434 523.5 426 526.235 479 515.235C494 512.729 523 510.435 534.5 512.735C554.5 516.735 555.5 523.235 576 523.735C592 523.735 616 496.735 633 497.235C648.671 497.235 661.31 515.052 684.774 524.942C692.004 527.989 700.2 528.738 707.349 525.505C724.886 517.575 741.932 498.33 757.5 498.742C773.864 498.742 791.711 520.623 810.403 527.654C816.218 529.841 822.661 529.246 828.451 526.991C849.246 518.893 861.599 502.112 879.5 501.742C886.47 501.597 896.865 506.047 907.429 510.911C930.879 521.707 957.139 519.639 982.951 520.063C1020.91 520.686 1037.5 530.797 1056.5 537C1102.24 556.627 1116.5 570.704 1180.5 579.235C1257.5 589.5 1279 587 1440 588" stroke="#FFDDB7" strokeWidth="2" fill="none" style={{ pathLength: pathLengths[1] }} />
        <motion.path d="M0 514C147.5 514.333 294.5 513.735 380.5 513.735C405.976 514.94 422.849 515.228 436.37 515.123C477.503 514.803 518.631 506.605 559.508 511.197C564.04 511.706 569.162 512.524 575 513.735C588 516.433 616 521.702 627.5 519.402C647.5 515.402 659 499.235 680.5 499.235C700.5 499.235 725 529.235 742 528.735C757.654 528.735 768.77 510.583 791.793 500.59C798.991 497.465 807.16 496.777 814.423 499.745C832.335 507.064 850.418 524.648 866 524.235C882.791 524.235 902.316 509.786 921.814 505.392C926.856 504.255 932.097 504.674 937.176 505.631C966.993 511.248 970.679 514.346 989.5 514.735C1006.3 515.083 1036.5 513.235 1055.5 513.235C1114.5 513.235 1090.5 513.235 1124 513.235C1177.5 513.235 1178.99 514.402 1241 514.402C1317.5 514.402 1274.5 512.568 1440 513.235" stroke="#B1C5FF" strokeWidth="2" fill="none" style={{ pathLength: pathLengths[2] }} />
        <motion.path d="M0 438.5C150.5 438.5 261 438.318 323.5 456.5C351 464.5 387.517 484.001 423.5 494.5C447.371 501.465 472 503.735 487 507.735C503.786 512.212 504.5 516.808 523 518.735C547 521.235 564.814 501.235 584.5 501.235C604.5 501.235 626 529.069 643 528.569C658.676 528.569 672.076 511.63 695.751 501.972C703.017 499.008 711.231 498.208 718.298 501.617C735.448 509.889 751.454 529.98 767 529.569C783.364 529.569 801.211 507.687 819.903 500.657C825.718 498.469 832.141 499.104 837.992 501.194C859.178 508.764 873.089 523.365 891 523.735C907.8 524.083 923 504.235 963 506.735C1034.5 506.735 1047.5 492.68 1071 481.5C1122.5 457 1142.23 452.871 1185 446.5C1255.5 436 1294 439 1439.5 439" stroke="#4FABFF" strokeWidth="2" fill="none" style={{ pathLength: pathLengths[3] }} />
        <motion.path d="M0.5 364C145.288 362.349 195 361.5 265.5 378C322 391.223 399.182 457.5 411 467.5C424.176 478.649 456.916 491.677 496.259 502.699C498.746 503.396 501.16 504.304 503.511 505.374C517.104 511.558 541.149 520.911 551.5 521.236C571.5 521.236 590 498.736 611.5 498.736C631.5 498.736 652.5 529.236 669.5 528.736C685.171 528.736 697.81 510.924 721.274 501.036C728.505 497.988 736.716 497.231 743.812 500.579C761.362 508.857 778.421 529.148 794 528.736C810.375 528.736 829.35 508.68 848.364 502.179C854.243 500.169 860.624 500.802 866.535 502.718C886.961 509.338 898.141 519.866 916 520.236C932.8 520.583 934.5 510.236 967.5 501.736C1011.5 491 1007.5 493.5 1029.5 480C1069.5 453.5 1072 440.442 1128.5 403.5C1180.5 369.5 1275 360.374 1439 364" stroke="#076EFF" strokeWidth="2" fill="none" style={{ pathLength: pathLengths[4] }} />
        {/* Blurred Background Paths */}
        <path d="M0 663C145.5 663 191 666.265 269 647C326.5 630 339.5 621 397.5 566C439 531.5 455 529.5 490 523C509.664 519.348 521 503.736 538 504.236C553.591 504.236 562.429 514.739 584.66 522.749C592.042 525.408 600.2 526.237 607.356 523.019C624.755 515.195 641.446 496.324 657 496.735C673.408 496.735 693.545 519.572 712.903 526.769C718.727 528.934 725.184 528.395 730.902 525.965C751.726 517.115 764.085 497.106 782 496.735C794.831 496.47 804.103 508.859 822.469 518.515C835.13 525.171 850.214 526.815 862.827 520.069C875.952 513.049 889.748 502.706 903.5 503.736C922.677 505.171 935.293 510.562 945.817 515.673C954.234 519.76 963.095 522.792 972.199 524.954C996.012 530.611 1007.42 534.118 1034 549C1077.5 573.359 1082.5 594.5 1140 629C1206 670 1328.5 662.5 1440 662.5" stroke="#FFB7C5" strokeWidth="2" fill="none" pathLength={1} filter="url(#blurMe)" />
      </svg>
    </div>
  );
};

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

// --- Components ---
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


const App = () => {
  const [botStatus] = useState('Running');
  const [stats, setStats] = useState(mockStats);
  const [activity, setActivity] = useState(mockActivity);

  const getActionDetails = (action) => {
    switch (action) {
      case 'Replied': return { icon: Zap, color: 'text-blue-400' };
      case 'Escalated': return { icon: AlertCircle, color: 'text-amber-400' };
      case 'Ignored': return { icon: EyeOff, color: 'text-gray-500' };
      default: return { icon: Mail, color: 'text-neutral-400' };
    }
  };

  return (
    <div className="bg-black text-white min-h-screen font-sans relative overflow-hidden">
      <GoogleGeminiEffect />
      <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="py-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
          >
            Gmail Auto-Reply Bot
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-lg text-neutral-300 max-w-2xl mx-auto"
          >
            Real-time monitoring of your AI email assistant.
          </motion.p>
        </header>

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
  );
};

export default App;
