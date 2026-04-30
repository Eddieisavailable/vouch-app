import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Search, CheckCircle, XCircle, Clock, Eye, ShieldCheck, UserCircle, Briefcase, Zap, AlertOctagon, X, ArrowRight, ShieldAlert, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

export const AdminVerificationQueue: React.FC = () => {
   const navigate = useNavigate();
   const [docs, setDocs] = useState<any[]>([]);
   const [errors, setErrors] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedDoc, setSelectedDoc] = useState<any>(null);
   const [rejectionReason, setRejectionReason] = useState('');
   const [activeTab, setActiveTab] = useState<'pending' | 'errors'>('pending');

   useEffect(() => {
      fetchDocs();
      fetchErrors();
   }, []);

   const fetchDocs = async () => {
      try {
         const res = await api.get('/admin/verification/pending');
         setDocs(res.data);
      } catch(e) {
         toast.error("Failed to sync queue");
      } finally {
         setLoading(false);
      }
   };

   const fetchErrors = async () => {
       try {
          const res = await api.get('/admin/verification/errors');
          setErrors(res.data);
       } catch(e) {
          console.error("Failed to fetch verification errors");
       }
   };

   const approve = async (id: string | number) => {
      try {
         await api.put(`/admin/verification/${id}/approve`);
         toast.success("Identity verified successfully!");
         setSelectedDoc(null);
         fetchDocs();
      } catch(e) { toast.error("Verification command failed"); }
   };

   const reject = async (id: string | number) => {
      if (!rejectionReason) return toast.error("Rejection reason mandate");
      try {
         await api.put(`/admin/verification/${id}/reject`, { rejection_reason: rejectionReason });
         toast.success("Document rejected");
         setSelectedDoc(null);
         setRejectionReason('');
         fetchDocs();
      } catch(e) { toast.error("Command failed"); }
   };

   const markErrorReviewed = async (id: string | number) => {
       try {
          await api.put(`/admin/verification/errors/${id}/review`);
          toast.success("Error marked as reviewed");
          setErrors(prev => prev.filter(err => err.error_id !== id));
       } catch(e) { toast.error("Action failed"); }
   };

   if (loading) return (
       <div className="flex items-center justify-center min-h-[60vh]">
           <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
       </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
         <SEO title="Moderation Bridge | Vouch Admin" description="Official identity verification queue for the Vouch marketplace." />
         
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
             <div className="space-y-4">
                 <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors group mb-2"
                 >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                 </button>
                 <div className="space-y-2">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-vouch-blue rounded-xl text-white shadow-lg shadow-blue-900/20">
                           <ShieldCheck size={20} />
                        </div>
                        <span className="text-xs font-black text-vouch-blue uppercase tracking-widest pl-1">Trust Oversight</span>
                     </div>
                     <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Verification Queue</h1>
                     <p className="text-lg text-gray-500 font-medium">Coordinate the verified status of nodes entering the Vouch network.</p>
                 </div>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className="px-6 h-14 bg-blue-50 text-vouch-blue rounded-2xl flex items-center gap-3 border border-blue-100 shadow-xl shadow-blue-900/5">
                    <Zap size={20} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">{docs.length} Active Audits</span>
                 </div>
                 {errors.length > 0 && (
                    <div className="px-6 h-14 bg-red-50 text-coral rounded-2xl flex items-center gap-3 border border-red-100 shadow-xl shadow-red-900/5">
                        <AlertOctagon size={20} className="animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">{errors.length} Critical Errors</span>
                    </div>
                 )}
             </div>
         </div>

         <div className="flex gap-4 border-b border-gray-100 pb-4">
             <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-vouch-blue text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-900'}`}
             >
                Pending Documents ({docs.length})
             </button>
             <button 
                onClick={() => setActiveTab('errors')}
                className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'errors' ? 'bg-coral text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-gray-900'}`}
             >
                Upload Errors ({errors.length})
             </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
            {activeTab === 'pending' ? (
                docs.length === 0 ? (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="col-span-full bento-card p-20 text-center space-y-6"
                    >
                        <div className="w-24 h-24 bg-success/5 rounded-[2rem] flex items-center justify-center text-success mx-auto">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">System Synced: All Clear</h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">Zero pending verification documents in the global queue. High trust standards maintained.</p>
                        </div>
                        <Link to="/admin" className="btn-primary mx-auto inline-flex">Return to Dashboard</Link>
                    </motion.div>
                ) : (
                    docs.map((doc, idx) => (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={doc.document_id} 
                            className="bento-card !p-0 overflow-hidden hover:border-blue-100 transition-all group flex flex-col justify-between"
                        >
                            <div 
                                className="h-56 bg-gray-50 relative group/img cursor-pointer overflow-hidden border-b border-gray-100" 
                                onClick={() => setSelectedDoc(doc)}
                            >
                                {doc.file_type === 'pdf' ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                                        <FileText size={48} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">PDF Transcript</span>
                                    </div>
                                ) : (
                                    <img src={doc.file_url} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" alt="Identity Document" />
                                )}
                                <div className="absolute inset-0 bg-gray-900/0 group-hover/img:bg-gray-900/20 transition-all flex items-center justify-center">
                                    <div className="opacity-0 group-hover/img:opacity-100 bg-white text-gray-900 h-12 px-8 rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover/img:translate-y-0 transition-all font-black uppercase text-[10px] tracking-widest">
                                        <Eye size={16} /> Audit Record
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight capitalize leading-tight">{doc.document_type.replace('_', ' ')}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <Clock size={12} /> {format(new Date(doc.submitted_at), 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                    <span className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-100 flex items-center gap-1.5"><Zap size={10}/> Pending</span>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                    <div className="w-12 h-12 bg-blue-50 text-vouch-blue rounded-xl flex items-center justify-center font-black text-xl border border-blue-100">
                                        {doc.profile_photo_url ? (
                                            <img src={doc.profile_photo_url} className="w-full h-full rounded-xl object-cover" />
                                        ) : doc.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black text-gray-900 group-hover:text-vouch-blue transition-colors">@{doc.username}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{doc.user_type}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )
            ) : (
                errors.length === 0 ? (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="col-span-full bento-card p-20 text-center space-y-6"
                    >
                        <div className="w-24 h-24 bg-success/5 rounded-[2rem] flex items-center justify-center text-success mx-auto">
                            <ShieldCheck size={48} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Technical Harmony</h3>
                            <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">Zero reported upload errors. The verification pipeline is running smoothly.</p>
                        </div>
                    </motion.div>
                ) : (
                    errors.map((err, idx) => (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={err.error_id} 
                            className="bento-card border-red-100 bg-red-50/10 flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-red-50 text-coral rounded-2xl shadow-sm">
                                        <AlertOctagon size={24} />
                                    </div>
                                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-red-100 text-coral rounded-lg">Critical Error</span>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Error Log</h4>
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed bg-white p-4 rounded-2xl border border-red-50 shadow-inner">
                                        {err.error_message}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-red-50">
                                    <div className="w-10 h-10 bg-white text-coral rounded-xl flex items-center justify-center font-black border border-red-100">
                                        {err.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black text-gray-900">@{err.username}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{format(new Date(err.created_at), 'MMM d, p')}</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => markErrorReviewed(err.error_id)}
                                className="mt-8 w-full py-4 bg-white border border-red-100 text-coral font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-coral hover:text-white transition-all shadow-xl shadow-red-900/5 group"
                            >
                                Mark as Investigated
                            </button>
                        </motion.div>
                    ))
                )
            )}
            </AnimatePresence>
         </div>

         {/* Verification Detail Overlay */}
         <AnimatePresence>
         {selectedDoc && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[200] p-6 lg:p-12"
            >
               <motion.div 
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   className="bg-white rounded-[3rem] w-full max-w-7xl flex flex-col lg:flex-row overflow-hidden shadow-2xl max-h-[90vh] relative border border-white/20"
               >
                  <button onClick={() => { setSelectedDoc(null); setRejectionReason(''); }} className="absolute top-8 right-8 z-50 p-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl transition-all shadow-xl">
                      <X size={24}/>
                  </button>
                  
                  {/* Ledger/Image Zone */}
                  <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-8 lg:p-12 relative group">
                     {selectedDoc.file_type === 'pdf' ? (
                        <iframe src={selectedDoc.file_url} className="w-full h-full min-h-[600px] border-0 rounded-2xl shadow-xl bg-white" title="Identity Transcript" />
                     ) : (
                        <img src={selectedDoc.file_url} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="Document full size" />
                     )}
                     <div className="absolute bottom-8 left-8 p-4 bg-gray-900/80 backdrop-blur-md text-white rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
                         <ShieldAlert size={20} className="text-vouch-blue" />
                         Integrity Verification Interface
                     </div>
                  </div>

                  {/* Audit Control Zone */}
                  <div className="w-full lg:w-[450px] bg-white p-10 lg:p-14 overflow-y-auto border-l border-gray-100">
                     <div className="space-y-10">
                        <div>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Audit Protocol</span>
                           <h2 className="text-3xl font-black text-gray-900 tracking-tighter capitalize leading-tight">{selectedDoc.document_type.replace('_', ' ')}</h2>
                        </div>

                        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-5">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden shrink-0">
                               {selectedDoc.profile_photo_url ? (
                                  <img src={selectedDoc.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="flex items-center justify-center h-full font-black text-2xl text-vouch-blue">
                                     {selectedDoc.username.charAt(0).toUpperCase()}
                                  </div>
                               )}
                            </div>
                            <div>
                               <p className="text-xl font-black text-gray-900">@{selectedDoc.username}</p>
                               <p className="text-xs font-black text-vouch-blue uppercase tracking-widest">{selectedDoc.user_type}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                           <div className="bg-blue-50/50 text-vouch-blue p-6 rounded-3xl border border-blue-100">
                              <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <AlertOctagon size={16} /> Moderation Checklist
                              </h4>
                              <ul className="space-y-3">
                                 <li className="flex items-start gap-2 text-xs font-bold leading-relaxed">
                                    <div className="w-1 h-1 bg-vouch-blue rounded-full mt-1.5"></div>
                                    <span>Identity match validation against database profile photo</span>
                                 </li>
                                 <li className="flex items-start gap-2 text-xs font-bold leading-relaxed">
                                    <div className="w-1 h-1 bg-vouch-blue rounded-full mt-1.5"></div>
                                    <span>Clarity and legibility of official identity serial numbers</span>
                                 </li>
                                 <li className="flex items-start gap-2 text-xs font-bold leading-relaxed">
                                    <div className="w-1 h-1 bg-vouch-blue rounded-full mt-1.5"></div>
                                    <span>Official issuer authenticity and document expiration</span>
                                 </li>
                              </ul>
                           </div>
                        </div>

                        <div className="space-y-6 pt-10 border-t border-gray-100">
                           <button 
                              onClick={() => approve(selectedDoc.document_id)} 
                              className="w-full bg-success text-white h-16 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-gray-900 transition-all shadow-xl shadow-green-900/10"
                           >
                              <ShieldCheck size={20} /> Authorize Identity
                           </button>
                           
                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Moderation Logic (Broadcast to User)</label>
                                 <textarea 
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 text-sm font-medium focus:border-red-500 focus:bg-white outline-none transition-all resize-none"
                                    rows={4} 
                                    placeholder="Decline justification..."
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                 ></textarea>
                              </div>
                              <button 
                                 onClick={() => reject(selectedDoc.document_id)}
                                 disabled={!rejectionReason.trim()}
                                 className="w-full bg-white text-coral h-14 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-red-100 hover:bg-coral hover:text-white transition-all disabled:opacity-30"
                              >
                                 Reject Identity Record
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
         </AnimatePresence>
      </div>
   );
};
