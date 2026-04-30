import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Link } from 'react-router-dom';
import { AlertOctagon, CheckCircle, Clock, ArrowRight, ShieldCheck, FileText, Search, Zap, Info, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

export const DisputesPage: React.FC = () => {
  const { auth } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/disputes/my-disputes')
      .then(res => setDisputes(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <SEO title="Member Disputes | Vouch Resolution" description="Track and manage active project disputes and mediation progress on Vouch." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-coral rounded-xl text-white shadow-lg shadow-red-900/20">
                    <AlertOctagon size={20} />
                 </div>
                 <span className="text-xs font-black text-coral uppercase tracking-widest pl-1">Resolution Center</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Conflict Journal</h1>
              <p className="text-lg text-gray-500 font-medium">Clear, auditable records for active and resolved project disputes.</p>
          </div>
          
          <Link to="/help" className="btn-secondary h-16 px-8 !rounded-2xl flex items-center gap-2 group">
            <Info size={20} /> Resolution Guidelines
          </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <main className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="popLayout">
            {disputes.length === 0 ? (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bento-card p-20 text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
                        <CheckCircle size={48} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">System Status: Balanced</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">You have no active or historical disputes in your record. Keep up the professional collaboration!</p>
                    </div>
                    <Link to="/dashboard" className="btn-primary mx-auto inline-flex">Go to Dashboard</Link>
                </motion.div>
            ) : (
                <div className="space-y-4">
                {disputes.map((d, idx) => (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={d.dispute_id} 
                        className="bento-card !p-0 overflow-hidden hover:border-coral/20 transition-all group border-2 border-transparent"
                    >
                        <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border ${d.status === 'resolved' ? 'bg-success/10 text-success border-success/20' : 'bg-coral/10 text-coral border-coral/20'}`}>
                                        {d.status === 'resolved' ? 'Case Resolved' : 'Active Mediation'}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">{d.dispute_type.replace('_', ' ')}</span>
                                </div>
                                
                                <div>
                                    <Link to={`/disputes/${d.dispute_id}`} className="text-2xl font-black text-gray-900 group-hover:text-coral transition-colors tracking-tighter leading-tight block mb-2">
                                        {d.job_title}
                                    </Link>
                                    <p className="text-base text-gray-500 font-medium line-clamp-2 leading-relaxed italic pr-10">"{d.description}"</p>
                                    {auth.user?.user_type === 'admin' && (
                                       <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-vouch-blue">
                                          <Users size={12}/> {d.raised_by_name} vs {d.against_name}
                                       </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        <Clock size={12} /> Filed {new Date(d.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-vouch-blue uppercase tracking-widest">
                                        <Zap size={10} /> Track ID: {d.dispute_id.substring(0,8)}...
                                    </div>
                                </div>
                            </div>

                            <Link to={`/disputes/${d.dispute_id}`} className="shrink-0 btn-primary h-14 !rounded-2xl !bg-gray-100 !text-gray-900 hover:!bg-coral hover:!text-white shadow-none px-8 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                Audit Details <ArrowRight size={18} />
                            </Link>
                        </div>
                    </motion.div>
                ))}
                </div>
            )}
            </AnimatePresence>
        </main>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bento-card p-8 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <ShieldCheck size={16} /> Mediation Protocol
                </h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">Vouch Resolution agents act as neutral third-parties to verify evidence and ensure fair outcomes for both sides.</p>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-vouch-blue uppercase tracking-widest leading-relaxed">Payments are locked in Escrow until the mediator reaches a verdict or the dispute is withdrawn.</p>
                </div>
            </div>

            <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-xl font-black mb-4 tracking-tight">Need Urgent Help?</h4>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed">Our legal support team is available mon-fri to assist with complex cases.</p>
               </div>
               <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                   <FileText size={150} />
               </div>
            </div>
        </aside>
      </div>
    </div>
  );
};
