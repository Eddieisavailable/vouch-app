import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, AlertOctagon, Info, ShieldAlert, CheckCircle, ArrowLeft, Send, Zap, Briefcase, UserCircle, MoreVertical, ShieldCheck, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';

export const DisputeDetailPage: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const { auth } = useAuth();
  const [data, setData] = useState<{dispute: any, messages: any[]}>({ dispute: null, messages: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Admin resolution
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionAction, setAction] = useState('no_action');
  const [resolutionNotes, setNotes] = useState('');
  const [nextStatus, setNextStatus] = useState('completed');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDispute();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [data.messages]);

  const fetchDispute = async () => {
    try {
      const res = await api.get(`/disputes/${id}`);
      setData(res.data);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const res = await api.post(`/disputes/${id}/messages`, { message_text: message });
      setMessage('');
      fetchDispute();
    } catch(err) {
      toast.error('Failed to transmit message');
    }
  };

  const resolveDispute = async (e: any) => {
    e.preventDefault();
    try {
      await api.put(`/disputes/${id}/resolve`, { resolution_action: resolutionAction, resolution_notes: resolutionNotes, next_job_status: nextStatus });
      setShowResolve(false);
      toast.success('Dispute resolved successfully');
      fetchDispute();
    } catch(err) {
      toast.error('Resolution failed');
    }
  };

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
      </div>
  );
  if (!data.dispute) return (
      <div className="p-20 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
            <ShieldAlert size={48} />
        </div>
        <h3 className="text-2xl font-black text-gray-900">Case Not Found</h3>
        <p className="text-gray-500 font-medium">The requested dispute record does not exist or access is restricted.</p>
        <Link to="/disputes" className="btn-primary inline-flex">Return to Journal</Link>
      </div>
  );

  const d = data.dispute;
  const isAdmin = auth.user?.user_type === 'admin';

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
       <SEO title={`Case #${d.dispute_id.substring(0,8)} | Vouch Resolution`} description="Review active project dispute details and participate in the mediation process." />
       
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
             <Link to="/disputes" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors">
                <ArrowLeft size={14} /> Back to Dispute Journal
             </Link>
             <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-coral rounded-xl text-white shadow-lg shadow-red-900/20">
                        <AlertOctagon size={20} />
                    </div>
                    <span className="text-xs font-black text-coral uppercase tracking-widest pl-1">Confidential Case File</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Case Verification</h1>
                <p className="text-lg text-gray-500 font-medium max-w-2xl">Official mediation bridge for project <b>"{d.job_title}"</b>.</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <span className={`px-5 h-12 flex items-center text-xs font-black uppercase tracking-widest rounded-2xl border-2 ${d.status==='resolved'?'bg-success/10 text-success border-success/20' : 'bg-red-50 text-coral border-red-100 shadow-xl shadow-red-900/5'}`}>
               Status: {d.status === 'resolved' ? 'Resolved' : 'In Mediation'}
             </span>
             {isAdmin && d.status !== 'resolved' && (
               <button onClick={() => setShowResolve(true)} className="btn-primary h-12 px-8 !rounded-2xl">
                  Resolve Dispute
               </button>
             )}
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Dispute Context Sidebar */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 order-2 lg:order-1">
             <div className="bento-card p-8 space-y-8">
                <div className="space-y-6">
                    <div className="group">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Project Correlation</span>
                        <Link to={`/jobs/${d.job_id}`} className="text-lg font-black text-gray-900 group-hover:text-vouch-blue transition-colors line-clamp-1 truncate block">{d.job_title}</Link>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disputant (Complainant)</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[8px] font-black">{d.raised_by_user[0]}</div>
                                <Link to={`/user/${d.raised_by}`} className="text-sm font-bold text-vouch-blue hover:underline">{d.raised_by_user}</Link>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Counterpart</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[8px] font-black">{d.against_username[0]}</div>
                                <Link to={`/user/${d.against_user}`} className="text-sm font-bold text-vouch-blue hover:underline">{d.against_username}</Link>
                            </div>
                        </div>
                    </div>

                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Category of Dispute</span>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs font-black text-gray-500 uppercase tracking-widest inline-block">
                            {d.dispute_type.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Case Specification</span>
                    <div className="p-6 bg-red-50/50 text-coral rounded-2xl border border-coral/10 font-medium italic leading-relaxed text-sm">
                        "{d.description}"
                    </div>
                </div>
                
                {d.status === 'resolved' && (
                  <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="p-6 bg-success/5 border border-success/20 rounded-2xl space-y-4">
                     <h3 className="text-xs font-black text-success uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16}/> Resolution Verdict
                     </h3>
                     <div className="text-[10px] font-black text-success/60 uppercase tracking-widest">Action: {d.resolution_action.replace('_', ' ')}</div>
                     <p className="text-sm font-medium text-success leading-relaxed">{d.resolution_notes}</p>
                  </motion.div>
                )}
             </div>

             <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-xl font-black mb-4 tracking-tight">Mediation Protocol</h4>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed">Provide all evidence through this secure bridge. Our mediators will review the project log, chats, and milestone records to reach a final decision.</p>
               </div>
               <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                   <ShieldCheck size={150} />
               </div>
            </div>
          </aside>

          {/* Discussion Thread */}
          <main className="lg:col-span-8 flex flex-col h-[700px] bento-card !p-0 overflow-hidden order-1 lg:order-2">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-vouch-blue rounded-xl">
                          <MessageSquare size={20} />
                      </div>
                      <h2 className="text-lg font-black text-gray-900 tracking-tight">Case Discussion Bridge</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      <Zap size={10} className="text-vouch-blue" /> Secure AES-256 Thread
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30 scroll-smooth">
                 {data.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200">
                            <Info size={32} />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Waiting for Initial Debrief...</p>
                    </div>
                 ) : (
                   data.messages.map((m, idx) => {
                     const amISender = m.sender_id === auth.user?.user_id;
                     const msgIsAdmin = !!m.is_admin;
                     
                     return (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.message_id} 
                        className={`flex flex-col ${amISender ? 'items-end' : 'items-start'}`}
                       >
                          <div className={`flex items-center gap-2 mb-2 px-1 ${amISender ? 'flex-row-reverse' : ''}`}>
                             <div className={`text-[10px] font-black uppercase tracking-widest ${msgIsAdmin ? 'text-vouch-blue' : 'text-gray-400'}`}>
                                {msgIsAdmin ? 'Resolution Agent' : (amISender ? 'Me' : m.sender_name)}
                             </div>
                             <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                             <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                             </div>
                          </div>
                          <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 ${
                            msgIsAdmin ? 'bg-vouch-blue text-white rounded-tr-none' :
                            amISender ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'
                          }`}>
                            <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{m.message_text}</p>
                          </div>
                       </motion.div>
                     );
                   })
                 )}
                 <div ref={messagesEndRef} />
              </div>

              {d.status !== 'resolved' && (
                 <div className="p-8 bg-white border-t border-gray-50">
                    <form onSubmit={sendMessage} className="flex gap-4 items-end max-w-5xl mx-auto">
                        <div className="flex-1 relative group">
                            <textarea 
                                rows={1} 
                                required 
                                placeholder="Submit evidence or clarify points..." 
                                value={message} 
                                onChange={e=>setMessage(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl px-8 py-5 text-base font-medium outline-none focus:border-coral focus:bg-white transition-all ring-0 resize-none min-h-[64px]"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!message.trim()}
                            className="bg-coral text-white w-16 h-16 rounded-2xl flex items-center justify-center hover:bg-gray-900 disabled:opacity-50 transition-all shadow-xl shadow-red-900/10"
                        >
                            <Send size={24} />
                        </button>
                    </form>
                    <div className="flex items-center gap-2 mt-4 px-2">
                        <ShieldCheck size={14} className="text-success" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your evidence is stored in a secure platform vault.</span>
                    </div>
                 </div>
              )}
          </main>
       </div>

       {/* Resolution Modal for Admin */}
       <AnimatePresence>
       {showResolve && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-xl"
          >
             <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl relative"
             >
                <button onClick={()=>setShowResolve(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors p-2 bg-gray-50 rounded-xl">
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-vouch-blue rounded-3xl text-white">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Issue Resolution Verdict</h2>
                        <p className="text-sm text-gray-500 font-medium">This command will close the case and release funds accordingly.</p>
                    </div>
                </div>

                <form onSubmit={resolveDispute} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Financial Settlement</label>
                        <select value={resolutionAction} onChange={e=>setAction(e.target.value)} className="w-full h-14 px-6 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue focus:bg-white outline-none transition-all">
                          <option value="release_payment">Full Release to Tradesperson</option>
                          <option value="refund_payment">Full Refund to Employer</option>
                          <option value="partial_refund">Equitable Split (Partial)</option>
                          <option value="no_action">Dismissal / No Action</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Final Operational Status</label>
                        <select value={nextStatus} onChange={e=>setNextStatus(e.target.value)} className="w-full h-14 px-6 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-vouch-blue focus:bg-white outline-none transition-all">
                          <option value="completed">Mark as Completed</option>
                          <option value="cancelled">Mark as Cancelled</option>
                          <option value="in_progress">Return to Production</option>
                        </select>
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Official Resolution Narrative</label>
                     <textarea 
                        required 
                        rows={5} 
                        value={resolutionNotes} 
                        onChange={e=>setNotes(e.target.value)} 
                        placeholder="Detailed justification for this verdict..."
                        className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] text-base font-medium focus:border-vouch-blue focus:bg-white outline-none transition-all resize-none" 
                     />
                   </div>

                   <div className="flex gap-4 pt-4">
                     <button type="button" onClick={()=>setShowResolve(false)} className="btn-secondary flex-1 h-16 !rounded-2xl">Cancel Decision</button>
                     <button type="submit" className="btn-primary flex-1 h-16 !rounded-2xl">Confirm & Execute Verdict</button>
                   </div>
                </form>
             </motion.div>
          </motion.div>
       )}
       </AnimatePresence>
    </div>
  );
};
