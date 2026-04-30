import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Server, Lock } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2
          }}
          className="relative mb-12"
        >
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 flex items-center justify-center p-6 border border-gray-50 relative overflow-hidden group">
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src="https://ais-pre-5xennj5vm5gwe76i3cyqfb-159706747447.europe-west3.run.app/assets/logo_vouch_blue.png" 
                alt="Vouch" 
                className="w-full h-full object-contain"
              />
            </motion.div>
            
            {/* Holographic scanning effect */}
            <motion.div 
              animate={{ y: [-100, 200] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent w-full h-20 -skew-y-12"
            />
          </div>

          {/* Orbiting Icons */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 pointer-events-none"
          >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-vouch-blue">
               <ShieldCheck size={16} />
             </div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-vouch-blue">
               <Lock size={16} />
             </div>
          </motion.div>
        </motion.div>

        {/* Text & Status */}
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-black text-gray-900 tracking-tight mb-2"
          >
            Vouch SecureID
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-vouch-blue">
              <Zap size={12} className="fill-vouch-blue animate-pulse" />
              Initializing Node
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Verifying Trust Protocol
            </div>
          </motion.div>
        </div>

        {/* Loading Bar */}
        <div className="w-48 h-1.5 bg-gray-100 rounded-full mt-10 overflow-hidden relative border border-gray-50">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="h-full bg-vouch-blue shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          />
        </div>
      </div>

      {/* Security Footer */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex items-center gap-4 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-200/50"
      >
        <Server size={14} className="text-gray-400" />
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          Encrypted Connection <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </motion.div>
    </motion.div>
  );
};
