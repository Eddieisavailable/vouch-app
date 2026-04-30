import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Mail, Shield, Save, Check, User, Lock, ExternalLink, Globe, Smartphone, Heart, Zap, ShieldCheck, MessageSquare, Star, Key, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

export const SettingsPage: React.FC = () => {
   const { auth } = useAuth();
   const [settings, setSettings] = useState<any>(null);
   const [saving, setSaving] = useState(false);
   const [showPasscodeModal, setShowPasscodeModal] = useState(false);
   const [passcodeData, setPasscodeData] = useState({ current: '', new: '', confirm: '' });
   const [passcodeLoading, setPasscodeLoading] = useState(false);

   useEffect(() => {
      api.get('/settings').then(res => setSettings(res.data)).catch(console.error);
   }, []);

   if (!settings) return (
       <div className="flex items-center justify-center min-h-[60vh]">
           <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
       </div>
   );

   const handleChange = (key: string, val: boolean) => {
      setSettings((s: any) => ({ ...s, [key]: val }));
   };

   const saveSettings = async () => {
      setSaving(true);
      try {
         await api.put('/settings', settings);
         toast.success('Preferences updated!');
      } catch(e) {
         toast.error('Sync failed');
      } finally {
         setSaving(false);
      }
   };

   const handlePasscodeReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (passcodeData.new !== passcodeData.confirm) return toast.error("Keys do not match");
      if (passcodeData.new.length < 8) return toast.error("Key must be 8+ characters");
      
      setPasscodeLoading(true);
      try {
         await api.post('/auth/change-password', {
            currentPassword: passcodeData.current,
            newPassword: passcodeData.new
         });
         toast.success("Security key rotated!");
         setShowPasscodeModal(false);
         setPasscodeData({ current: '', new: '', confirm: '' });
      } catch(err: any) {
         toast.error(err.response?.data?.error || "Rotation failed");
      } finally {
         setPasscodeLoading(false);
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
         <SEO title="Member Settings | Vouch" description="Securely manage your Vouch account preferences, security, and notification settings." />
         
         <AnimatePresence>
            {showPasscodeModal && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
                     onClick={() => setShowPasscodeModal(false)}
                  />
                  <motion.div 
                     initial={{ scale: 0.9, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 0.9, opacity: 0, y: 20 }}
                     className="relative bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-3xl shadow-blue-900/20 overflow-hidden"
                  >
                     <div className="flex justify-between items-center mb-10">
                        <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-xl">
                           <Key size={24} />
                        </div>
                        <button onClick={() => setShowPasscodeModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                           <X size={20} className="text-gray-400" />
                        </button>
                     </div>

                     <div className="mb-8">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Rotate Security Key</h3>
                        <p className="text-sm text-gray-500 font-medium">Rotate your master encryption key regularly for maximum security.</p>
                     </div>

                     <form onSubmit={handlePasscodeReset} className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Current Key</label>
                           <input 
                              type="password" 
                              required 
                              className="input-field" 
                              value={passcodeData.current}
                              onChange={e => setPasscodeData(d => ({...d, current: e.target.value}))}
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">New Secret Key</label>
                           <input 
                              type="password" 
                              required 
                              className="input-field" 
                              value={passcodeData.new}
                              onChange={e => setPasscodeData(d => ({...d, new: e.target.value}))}
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Confirm New Key</label>
                           <input 
                              type="password" 
                              required 
                              className="input-field" 
                              value={passcodeData.confirm}
                              onChange={e => setPasscodeData(d => ({...d, confirm: e.target.value}))}
                           />
                        </div>

                        <button 
                           type="submit" 
                           disabled={passcodeLoading}
                           className="w-full btn-primary h-16 text-sm flex items-center justify-center gap-2 group"
                        >
                           {passcodeLoading ? 'Rotating...' : (
                              <>Commit New Key <Zap size={18} className="group-hover:animate-pulse" /></>
                           )}
                        </button>
                     </form>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
         
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
             <div className="space-y-2">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-gray-900 rounded-xl text-white">
                       <Smartphone size={20} />
                    </div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Configuration Hub</span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Account Center</h1>
                 <p className="text-lg text-gray-500 font-medium">Control your digital presence on the Vouch network.</p>
             </div>
             
             <button 
                onClick={saveSettings} 
                disabled={saving} 
                className="btn-primary h-16 px-10 !rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-900/10 disabled:opacity-50"
             >
                {saving ? (
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <><Save size={20} /> Deploy Changes</>
                )}
             </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Nav Cards */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <div className="bento-card p-4 space-y-1">
                    {[
                        { icon: User, label: 'Profile Controls', active: true },
                        { icon: Bell, label: 'Alert Routing', active: false },
                        { icon: Lock, label: 'Encryption & Privacy', active: false },
                        { icon: Globe, label: 'Regional Display', active: false },
                    ].map((item, i) => (
                        <button 
                            key={i} 
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm ${item.active ? 'bg-vouch-blue text-white shadow-xl shadow-blue-900/10' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Standard</span>
                        </div>
                        <div>
                            <h4 className="text-xl font-black mb-2">Vouch SecureID</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">Your identity is protected by the highest standard of platform security available in the market.</p>
                        </div>
                        <button 
                           onClick={() => setShowPasscodeModal(true)}
                           className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            Reset Passcode <ExternalLink size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Settings Form */}
            <main className="lg:col-span-8 space-y-8">
               <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bento-card p-10"
               >
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-50">
                     <div className="p-3 bg-blue-50 text-vouch-blue rounded-2xl border border-blue-100"><Mail size={24}/></div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Email Notifications</h3>
                        <p className="text-sm text-gray-500 font-medium">Coordinate your project alerts and communication.</p>
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group">
                        <div className="space-y-1">
                           <span className="text-base font-black text-gray-900 tracking-tight">Master Synchronization</span>
                           <span className="text-xs text-gray-500 font-medium block">Route all verified project triggers to {auth.user?.email}</span>
                        </div>
                        <div 
                           className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${settings.email_notifications_enabled ? 'bg-success' : 'bg-gray-200'}`} 
                           onClick={() => handleChange('email_notifications_enabled', !settings.email_notifications_enabled)}
                        >
                           <div className={`bg-white w-6 h-6 rounded-full shadow-lg transform transition-transform duration-300 ${settings.email_notifications_enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                     </div>

                     <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${!settings.email_notifications_enabled ? 'opacity-20 pointer-events-none scale-95 grayscale' : 'opacity-100'}`}>
                        {[
                           { key: 'notify_bid_received', label: 'Bid Proposals', desc: 'When new bids land on your requests', icon: Zap },
                           { key: 'notify_bid_accepted', label: 'Bid Status', desc: 'Success alerts for your proposals', icon: Check },
                           { key: 'notify_job_completed', label: 'Milestones', desc: 'When project execution is verified', icon: ShieldCheck },
                           { key: 'notify_payment_received', label: 'Financials', desc: 'Release and recording of funds', icon: Heart },
                           { key: 'notify_review_received', label: 'Reputation', desc: 'New verified testimonial published', icon: Star },
                           { key: 'notify_messages', label: 'Direct Messages', desc: 'Incoming secure project chats', icon: MessageSquare }
                        ].map(opt => (
                           <label key={opt.key} className="flex items-start gap-4 p-5 rounded-[2rem] border-2 border-gray-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer group">
                              <div className="mt-1">
                                <input type="checkbox" className="w-6 h-6 rounded-xl border-gray-300 text-vouch-blue focus:ring-vouch-blue transition-all" 
                                   checked={settings[opt.key]}
                                   onChange={(e) => handleChange(opt.key, e.target.checked)}
                                />
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-black text-gray-900 group-hover:text-vouch-blue transition-colors uppercase tracking-tight">{opt.label}</span>
                                    <opt.icon size={14} className="text-gray-300 group-hover:text-vouch-blue transition-colors" />
                                 </div>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">{opt.desc}</span>
                              </div>
                           </label>
                        ))}
                     </div>
                  </div>
               </motion.div>

               <div className="bento-card p-10 bg-gray-50 flex items-center justify-between border-gray-200 border-dashed">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl text-gray-400"><Lock size={20} /></div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900">Security Snapshot</h4>
                            <p className="text-xs text-gray-400 font-medium">Your session is currently protected by standard platform encryption.</p>
                        </div>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest text-coral hover:underline">Revoke All Access</button>
               </div>
            </main>
         </div>
      </div>
   );
};
