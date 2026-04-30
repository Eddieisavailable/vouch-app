import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';

export const SuspendedPage: React.FC = () => {
    const location = useLocation();
    const reason = location.state?.reason;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
            <SEO title="Account Suspended | Vouch" description="Your account has been suspended" />
            
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-lg w-full bg-white rounded-[2.5rem] p-10 shadow-xl shadow-red-900/5 text-center border border-red-50 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-coral"></div>
                
                <div className="w-24 h-24 bg-red-50 text-coral rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner font-black text-4xl">
                    <ShieldAlert size={48} />
                </div>
                
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Account Suspended</h1>
                
                <p className="text-gray-500 font-medium mb-6 leading-relaxed">
                    Your Vouch account has been temporarily deactivated due to a violation of our community standards or a security flag. 
                </p>

                {reason && (
                    <div className="mb-8 p-4 bg-red-50/50 border-2 border-red-100 rounded-2xl text-left relative group">
                        <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black uppercase tracking-widest text-coral border border-red-100 rounded-md">
                            Formal Reason
                        </div>
                        <div className="flex gap-3">
                            <AlertTriangle size={18} className="text-coral shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-gray-800 italic leading-relaxed">
                                "{reason}"
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 flex flex-col gap-2 border border-gray-100">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">Next Steps</span>
                    <span className="text-sm font-bold text-gray-700">
                        Please contact our Trust & Safety team to appeal this decision or clarify the situation.
                    </span>
                    <a href="mailto:support@vouch.com" className="inline-flex items-center justify-center gap-2 mt-4 text-vouch-blue font-black hover:underline group">
                        <Mail size={16} /> Contact Support
                    </a>
                </div>
                
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={16} /> Return to Homepage
                </Link>
            </motion.div>
        </div>
    );
};
