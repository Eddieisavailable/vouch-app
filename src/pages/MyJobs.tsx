import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Trash2, Users, CheckCircle, Briefcase, Plus, Search, Filter, ArrowRight, Zap, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { FeedbackModal } from '@/components/FeedbackModal';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';

export const MyJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [modal, setModal] = useState<{isOpen: boolean; type: 'success' | 'confirm' | 'error'; title: string; message: string; onConfirm?: () => void;}>({
    isOpen: false, type: 'success', title: '', message: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    api.get('/jobs/my-jobs')
      .then(res => setJobs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleDelete = (jobId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Decommission Project?',
      message: 'This will permanently remove the project from the marketplace and terminate all pending bids. This action is irreversible.',
      onConfirm: async () => {
        try {
          await api.delete(`/jobs/${jobId}`);
          toast.success('Job decommissioned');
          fetchJobs();
        } catch (err) {
          toast.error('Failed to remove job');
        }
      }
    });
  };

  const handleMarkComplete = (jobId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Project Success?',
      message: 'By confirming, you verify that the execution meets your standards. This will trigger the final payment phase.',
      onConfirm: async () => {
        try {
          await api.put(`/jobs/${jobId}/complete`);
          toast.success('Project marked as successful!');
          fetchJobs();
        } catch (err) {
          toast.error('Verification failed');
        }
      }
    });
  };

  const filteredJobs = activeTab === 'All' ? jobs : jobs.filter(j => 
    activeTab === 'Open' ? j.status === 'open' :
    activeTab === 'In Progress' ? j.status === 'in_progress' :
    activeTab === 'Completed' ? j.status === 'completed' :
    activeTab === 'Cancelled' ? j.status === 'cancelled' : true
  );

  const tabs = ['All', 'Open', 'In Progress', 'Completed', 'Cancelled'];

  const getStatusBadge = (status: string) => {
     switch(status) {
       case 'pending_approval': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-600 border border-yellow-100 flex items-center gap-1.5 rounded-full"><Clock size={10}/> Verification</span>;
       case 'open': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-vouch-blue border border-blue-100 flex items-center gap-1.5 rounded-full"><Zap size={10}/> Active Market</span>;
       case 'in_progress': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white flex items-center gap-1.5 rounded-full"><ShieldCheck size={10}/> Execution</span>;
       case 'completed': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-green-50 text-success border border-success/20 flex items-center gap-1.5 rounded-full"><CheckCircle size={10}/> Fulfilled</span>;
       case 'cancelled': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-red-50 text-coral border border-red-100 flex items-center gap-1.5 rounded-full"><AlertCircle size={10}/> Terminated</span>;
       default: return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 rounded-full">{status}</span>;
     }
  };

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <SEO title="My Postings | Vouch Portfolio" description="Manage your verified job requests and track project progress across Liberia." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-vouch-blue rounded-xl text-white shadow-lg shadow-blue-900/20">
                    <Briefcase size={20} />
                 </div>
                 <span className="text-xs font-black text-vouch-blue uppercase tracking-widest pr-2">Employer Console</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">My Project Journal</h1>
              <p className="text-lg text-gray-500 font-medium">Coordinate your hiring pipeline and track live executions.</p>
          </div>
          
          <Link to="/post-job" className="btn-primary h-16 px-10 !rounded-2xl flex items-center gap-3">
             <Plus size={20} /> New Job Request
          </Link>
      </div>

      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-[2rem] w-fit hide-scrollbar mb-4">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-8 py-3 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === tab ? 'bg-white shadow-xl text-vouch-blue' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
        {filteredJobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full bento-card p-20 text-center space-y-6"
          >
             <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
                <Search size={48} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">No match found</h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">You haven't posted any jobs in this category. Start your first project to find verified local talent.</p>
             </div>
             <Link to="/post-job" className="btn-primary mx-auto inline-flex">Post First Job</Link>
          </motion.div>
        ) : (
          filteredJobs.map((job, idx) => (
            <motion.div 
              layout
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={job.job_id} 
              className="bento-card p-8 group relative overflow-hidden flex flex-col justify-between hover:border-blue-100 hover:bg-blue-50/10 transition-all border-2 border-transparent"
            >
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-start">
                    {getStatusBadge(job.status)}
                    <div className={`p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-vouch-blue group-hover:text-white transition-all`}>
                        <ArrowRight size={20} />
                    </div>
                 </div>

                 <div>
                    <Link to={`/jobs/${job.job_id}`} className="text-2xl font-black text-gray-900 block tracking-tight group-hover:text-vouch-blue transition-colors line-clamp-2 leading-tight mb-2">
                       {job.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">
                       <Zap size={14} className="text-vouch-blue" /> {job.category_name}
                    </div>
                 </div>

                 <div className="flex items-center justify-between py-4 border-y border-gray-50">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Budget Volume</span>
                        <span className="text-lg font-black text-gray-900">
                            {job.currency === 'USD' ? '$' : 'L$'}{job.budget_max_lrd.toLocaleString()}
                        </span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Market Interests</span>
                        <div className="flex items-center gap-1.5 justify-end font-black text-blue-600">
                           <Users size={16} /> {job.bid_count} Bids
                        </div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-gray-50 relative z-10">
                 <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={16} />
                    <span className="text-xs font-bold">{new Date(job.created_at).toLocaleDateString()}</span>
                 </div>
                 
                 <div className="flex gap-2">
                    {job.status === 'in_progress' && (
                        <button 
                            onClick={() => handleMarkComplete(job.job_id)}
                            className="btn-primary h-12 px-4 shadow-none !rounded-xl !bg-success hover:!bg-gray-900 text-[10px] items-center gap-1.5"
                        >
                            <CheckCircle size={14} /> Fulfill
                        </button>
                    )}

                    {parseInt(job.bid_count) > 0 && job.status !== 'in_progress' && job.status !== 'completed' && (
                        <Link to={`/jobs/${job.job_id}/bids`} className="btn-primary h-12 px-4 shadow-none !rounded-xl text-[10px]">
                            Review Bids
                        </Link>
                    )}
                    
                    {(job.status === 'open' || job.status === 'pending_approval') && (
                        <button onClick={() => handleDelete(job.job_id)} className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-coral transition-colors" title="Decommission">
                            <Trash2 size={24} />
                        </button>
                    )}
                 </div>
              </div>

              {/* BG Decorative icon */}
              <div className="absolute -bottom-6 -right-6 opacity-[0.02] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <Briefcase size={140} />
              </div>
            </motion.div>
          ))
        )}
        </AnimatePresence>
      </div>

      <FeedbackModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
};
