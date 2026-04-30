import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { FeedbackModal } from '@/components/FeedbackModal';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';
import { Gavel, Clock, CheckCircle, XCircle, ArrowRight, MessageSquare, Briefcase, Zap, Info, ShieldCheck } from 'lucide-react';

export const MyBids: React.FC = () => {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<{isOpen: boolean; type: 'success' | 'confirm' | 'error'; title: string; message: string; onConfirm?: () => void;}>({
    isOpen: false, type: 'success', title: '', message: ''
  });

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = () => {
    setLoading(true);
    api.get('/bids/my-bids')
      .then(res => setBids(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleWithdraw = (bidId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Deactivate Proposal?',
      message: 'Are you sure you want to withdraw your bid from this professional marketplace listing? You will need to re-apply if you change your mind.',
      onConfirm: async () => {
        try {
          await api.delete(`/bids/${bidId}`);
          toast.success('Bid withdrawn');
          fetchBids();
        } catch (err) {
          toast.error('Sync failed');
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
        case 'pending': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-600 border border-yellow-100 flex items-center gap-1.5 rounded-full"><Clock size={10}/> Under Review</span>;
        case 'accepted': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-success/10 text-success border border-success/20 flex items-center gap-1.5 rounded-full"><CheckCircle size={10}/> Hired</span>;
        case 'rejected': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-red-50 text-coral border border-red-100 flex items-center gap-1.5 rounded-full"><XCircle size={10}/> Declined</span>;
        case 'withdrawn': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 rounded-full">Withdrawn</span>;
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
      <SEO title="My Proposals | Vouch Professional" description="Manage your active bids and track client responses securely on Vouch Liberia." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-gray-900 rounded-xl text-white shadow-lg shadow-gray-900/20">
                    <Gavel size={20} />
                 </div>
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Professional terminal</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Proposal Journal</h1>
              <p className="text-lg text-gray-500 font-medium">Coordinate your bidding activities and track incoming client approvals.</p>
          </div>
          
          <Link to="/jobs" className="btn-primary h-16 px-10 !rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-900/10">
             <Briefcase size={20} /> Browse Market Listings
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
        {bids.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="col-span-full bento-card p-20 text-center space-y-6"
          >
             <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
                <Zap size={48} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your proposal log is clear</h3>
                <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">You haven't applied for any jobs yet. Start broadcasting your expertise to employers across Liberia.</p>
             </div>
             <Link to="/jobs" className="btn-primary mx-auto inline-flex">Explore Market Jobs</Link>
          </motion.div>
        ) : (
          bids.map((bid, idx) => (
            <motion.div 
              layout
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={bid.bid_id} 
              className="bento-card p-8 group relative overflow-hidden flex flex-col justify-between hover:border-blue-100 hover:bg-blue-50/10 transition-all border-2 border-transparent"
            >
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-start">
                    {getStatusBadge(bid.status)}
                    <Link to={`/jobs/${bid.job_id}`} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-vouch-blue transition-colors">
                        <ArrowRight size={20} />
                    </Link>
                 </div>

                 <div>
                    <h3 className="text-2xl font-black text-gray-900 line-clamp-2 leading-tight tracking-tight mb-2">
                       {bid.job_title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">
                       <Clock size={12} /> {new Date(bid.created_at).toLocaleDateString()}
                    </div>
                 </div>

                 <div className="flex items-center justify-between py-5 border-y border-gray-50">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Your Proposal</span>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">
                            <span className="text-vouch-blue text-lg mr-1">L$</span>
                            {bid.proposed_price_lrd.toLocaleString()}
                        </span>
                    </div>
                    {bid.status === 'accepted' && (
                        <div className="bg-success text-white p-2 rounded-xl">
                            <ShieldCheck size={20} />
                        </div>
                    )}
                 </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 pt-6 group-hover:pt-4 transition-all relative z-10">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                        {bid.employer_username?.[0].toUpperCase() || 'E'}
                    </div>
                    <span className="text-xs font-bold text-gray-500">{bid.employer_username || 'Employer'}</span>
                 </div>
                 
                 <div className="flex gap-2">
                    {bid.status === 'pending' && (
                        <button 
                            onClick={() => handleWithdraw(bid.bid_id)}
                            className="bg-red-50 text-coral h-11 px-4 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100 hover:bg-coral hover:text-white transition-all shadow-sm shadow-red-900/10"
                        >
                            Withdraw
                        </button>
                    )}
                    {bid.status === 'accepted' && (
                        <Link 
                            to={`/messages`} 
                            className="btn-primary h-11 px-6 !rounded-xl !bg-gray-900 hover:!bg-vouch-blue flex items-center gap-2 text-xs"
                        >
                            <MessageSquare size={14} /> Message
                        </Link>
                    )}
                    <Link 
                        to={`/jobs/${bid.job_id}`} 
                        className="w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-vouch-blue hover:text-white transition-all border border-gray-100"
                    >
                        <Info size={20} />
                    </Link>
                 </div>
              </div>

              {/* BG Background Accents */}
              <div className="absolute -bottom-6 -right-6 opacity-[0.02] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <Gavel size={140} />
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
