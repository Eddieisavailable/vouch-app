import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { CheckCircle, Info, MessageSquare, AlertCircle, Trash2, CheckSquare, Bell, Clock, Zap, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All'|'Unread'|'Read'>('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await api.get('/notifications/all');
      setNotifications(res.data);
    } catch (err) { }
    finally { setLoading(false); }
  };

  const markRead = async (id: string, url: string) => {
    try {
      if (!notifications.find(n => n.notification_id === id)?.is_read) {
         await api.put(`/notifications/${id}/read`);
      }
      navigate(url);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
      toast.success('All marked as read');
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Read') return n.is_read;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'job_completed': case 'payment_confirmed': return <div className="p-3 bg-success/10 text-success rounded-2xl border border-success/10"><CheckCircle size={24} /></div>;
      case 'dispute': return <div className="p-3 bg-coral/10 text-coral rounded-2xl border border-coral/10"><AlertCircle size={24} /></div>;
      case 'message_received': return <div className="p-3 bg-blue-50 text-vouch-blue rounded-2xl border border-blue-100"><MessageSquare size={24} /></div>;
      case 'bid_received': return <div className="p-3 bg-gray-900 text-white rounded-2xl"><Zap size={24} /></div>;
      case 'new_user_registration': return <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100"><ShieldCheck size={24} /></div>;
      case 'verification_error': return <div className="p-3 bg-red-50 text-coral rounded-2xl border border-red-100"><AlertCircle size={24} /></div>;
      default: return <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100"><Info size={24} /></div>;
    }
  }

  const grouped = filtered.reduce((acc, curr) => {
     const date = new Date(curr.created_at);
     const today = new Date();
     const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
     let group = 'Archive';
     if (date.toDateString() === today.toDateString()) group = 'Today';
     else if (date.toDateString() === yesterday.toDateString()) group = 'Yesterday';
     else if (date.getTime() > today.getTime() - 7*24*60*60*1000) group = 'Recent History';
     
     if (!acc[group]) acc[group] = [];
     acc[group].push(curr);
     return acc;
  }, {} as Record<string, any[]>);

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <SEO title="Activity Feed | Vouch" description="Stay updated with your latest project alerts, messages, and milestones." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-coral rounded-xl text-white shadow-lg shadow-red-900/20">
                    <Bell size={20} />
                 </div>
                 <span className="text-xs font-black text-coral uppercase tracking-widest pl-1">Live Feed</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Notification Hub</h1>
              <p className="text-lg text-gray-500 font-medium">Real-time coordinates for your active Vouch operations.</p>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-1 rounded-2xl flex">
                {(['All', 'Unread', 'Read'] as const).map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filter===f ? 'bg-white shadow-sm text-vouch-blue' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                        {f}
                    </button>
                ))}
              </div>
              <button 
                onClick={markAllRead} 
                className="btn-secondary h-12 px-6 flex items-center gap-2 !rounded-2xl"
              >
                <CheckSquare size={18} /> Clear All
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <main className="lg:col-span-8 space-y-12">
            <AnimatePresence mode="popLayout">
            {Object.keys(grouped).length === 0 ? (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bento-card p-20 text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
                        <Mail size={48} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Broadcast Inbox is Empty</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">All signals have been processed. We'll alert you as soon as new activity triggers.</p>
                </div>
                <Link to="/dashboard" className="btn-primary mx-auto inline-flex">Return to Bridge</Link>
                </motion.div>
            ) : (
                ['Today', 'Yesterday', 'Recent History', 'Archive'].map(group => {
                if (!grouped[group]) return null;
                return (
                    <div key={group} className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">{group}</span>
                            <div className="flex-1 h-[1px] bg-gray-100"></div>
                        </div>
                        <div className="space-y-4">
                            {grouped[group].map((n, idx) => (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={n.notification_id} 
                                    onClick={() => markRead(n.notification_id, n.link_url)} 
                                    className={`bento-card !p-8 group cursor-pointer transition-all border-2 flex items-start gap-6 relative overflow-hidden ${!n.is_read ? 'border-vouch-blue bg-blue-50/20 shadow-xl shadow-blue-900/5' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <div className="relative shrink-0">
                                        {getNotifIcon(n.type)}
                                        {!n.is_read && <div className="absolute -top-1 -right-1 w-4 h-4 bg-vouch-blue rounded-full border-4 border-white"></div>}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 pr-8">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`text-xl font-black tracking-tight tracking-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {n.title}
                                            </h3>
                                        </div>
                                        <p className={`text-base font-medium leading-relaxed max-w-2xl ${!n.is_read ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-4 mt-6">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                                <Clock size={12} /> {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {!n.is_read && (
                                                <div className="text-[10px] font-black uppercase tracking-widest text-vouch-blue flex items-center gap-1">
                                                    Action Required <ArrowRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Link Reveal */}
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                                        <div className="w-12 h-12 flex items-center justify-center bg-gray-900 text-white rounded-2xl shadow-xl">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
                })
            )}
            </AnimatePresence>
        </main>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bento-card p-8 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <ShieldCheck size={16} /> Privacy Guard
                </h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">Notifications are encrypted and only accessible to your verified session.</p>
                <div className="pt-6 border-t border-gray-50">
                    <Link to="/settings" className="flex items-center justify-between group">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Notification Settings</span>
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl group-hover:bg-vouch-blue group-hover:text-white transition-all">
                            <ArrowRight size={16} />
                        </div>
                    </Link>
                </div>
            </div>

            <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-xl font-black mb-4 tracking-tight">Vouch Pro Alerts</h4>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed">Get real-time project updates directly on your primary device. Coming soon to Liberia.</p>
               </div>
               <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Zap size={150} />
               </div>
            </div>
        </aside>
      </div>
    </div>
  );
};
