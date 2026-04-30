import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Clock, Briefcase, Award, Star, CheckCircle, AlertOctagon, DollarSign, ArrowRight, Zap, ShieldCheck, User, MessageSquare, ChevronRight, BadgeCheck, ArrowLeft, Heart } from 'lucide-react';
import api from '@/services/api';
import { FeedbackModal } from '@/components/FeedbackModal';
import { JobTimeline } from '@/components/JobTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const { auth } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState<{isOpen: boolean; type: 'success' | 'confirm' | 'error'; title: string; message: string; onConfirm?: () => void;}>({
    isOpen: false, type: 'success', title: '', message: ''
  });

  const [showBidModal, setShowBidModal] = useState(false);
  const [bidForm, setBidForm] = useState({ price: '', days: '', cover: '' });
  const [bidLoading, setBidLoading] = useState(false);
  
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ type: 'payment_issue', desc: '' });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    overall_rating: 0, quality_rating: 0, professionalism_rating: 0,
    timeliness_rating: 0, value_rating: 0, communication_rating: 0, testimonial_text: ''
  });
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => { 
      fetchJob(); 
      if (auth.user) fetchFavoriteStatus();
  }, [id, navigate, auth.user]);

  const fetchFavoriteStatus = async () => {
      try {
          const res = await api.get('/favorites/jobs');
          const myFavs = res.data;
          const found = myFavs.find((f: any) => f.job_id === id);
          if (found) {
              setIsFavorited(true);
              setFavoriteId(found.favorite_id);
          }
      } catch(e) {}
  };

  const toggleFavorite = async () => {
      if (!auth.user) {
          toast.error("Please login to save jobs.");
          return;
      }
      try {
          if (isFavorited && favoriteId) {
             await api.delete(`/favorites/jobs/${favoriteId}`);
             setIsFavorited(false);
             setFavoriteId(null);
             toast.success("Removed from saved jobs");
          } else {
             const res = await api.post('/favorites/jobs', { job_id: id });
             setIsFavorited(true);
             setFavoriteId(res.data.favorite_id);
             toast.success("Job saved to favorites");
          }
      } catch (e) {
          toast.error("Failed to update favorite status");
      }
  };

  const fetchJob = () => {
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data))
      .catch(err => { console.error(err); navigate('/jobs'); })
      .finally(() => setLoading(false));
  };

  const isOwner = auth.user?.user_id === job?.employer_id;
  const isAssigned = auth.user?.user_id === job?.tp_id;
  const canBid = auth.user?.user_type !== 'employer' && !isOwner && job?.status === 'open';

  const actionJob = async (endpoint: string, successMsg: string) => {
    try {
      await api.put(`/jobs/${id}/${endpoint}`);
      toast.success(successMsg);
      fetchJob();
    } catch(err: any) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  const confirmPayment = async () => {
    if (!job?.pending_tx_id) return;
    try {
      await api.put(`/transactions/${job.pending_tx_id}/confirm`);
      toast.success('Payment receipt confirmed!');
      fetchJob();
    } catch(err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm receipt');
    }
  };

  const submitBid = async (e: any) => {
    e.preventDefault();
    setBidLoading(true);
    try {
      await api.post('/bids', { job_id: id, proposed_price_lrd: Number(bidForm.price), estimated_days: Number(bidForm.days), cover_message: bidForm.cover });
      setShowBidModal(false);
      toast.success('Your bid has been submitted!');
      fetchJob();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit bid');
    } finally { setBidLoading(false); }
  };

  const recordPayment = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/transactions', { job_id: id, amount_lrd: paymentForm.amount, notes: paymentForm.notes, transaction_type: 'deposit' });
      setShowPaymentModal(false);
      toast.success('Payment recorded. Awaiting confirmation.');
      fetchJob();
    } catch(err: any) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const submitDispute = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/disputes', { job_id: id, dispute_type: disputeForm.type, description: disputeForm.desc });
      setShowDisputeModal(false);
      toast.success('Dispute filed successfully.');
      fetchJob();
    } catch(err: any) {
      toast.error(err.response?.data?.error || 'Failed to file dispute');
    }
  };

  const submitReview = async (e: any) => {
      e.preventDefault();
      setReviewLoading(true);
      try {
        await api.post('/reviews', { ...reviewForm, job_id: id });
        setReviewSuccess(true);
        toast.success('Review submitted successfully!');
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to submit review');
      } finally {
        setReviewLoading(false);
      }
  };

  const StarSelector = ({ label, field, value }: {label: string, field: string, value: number}) => (
      <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(star => (
            <Star 
              key={star} 
              className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 active:scale-90 ${star <= value ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
              onClick={() => setReviewForm(prev => ({...prev, [field]: star}))}
            />
          ))}
        </div>
      </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-full"></div>
        </div>
    </div>
  );

  if (!job) return (
     <div className="max-w-7xl mx-auto py-20 text-center">
        <AlertOctagon size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-black text-gray-900">Job Not Found</h2>
        <Link to="/jobs" className="btn-primary mt-6 inline-flex">Go Back to Marketplace</Link>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <SEO title={`${job.title} | Vouch Liberia`} description={job.description.substring(0, 160)} />

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors group mb-2"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Top Banner Status Notification */}
      <AnimatePresence>
          {job.status === 'disputed' && (
            <motion.div 
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-coral/10 text-coral p-5 rounded-3xl border border-coral/20 flex items-center gap-4 shadow-sm"
            >
              <div className="p-2 bg-coral rounded-xl text-white"><AlertOctagon size={20} /></div>
              <p className="font-bold text-sm">Project Paused. A dispute has been filed and an administrator is currently mediating the resolution.</p>
            </motion.div>
          )}
      </AnimatePresence>

      <div className="bento-card p-4 md:p-8 !bg-gray-900 border-none">
          <JobTimeline status={job.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
           <div className="bento-card p-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 pb-8 border-b border-gray-50">
                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="bg-blue-50 text-vouch-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">{job.category_name}</span>
                       {job.urgency_level === 'urgent' && (
                         <span className="bg-red-50 text-coral px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 animate-pulse">Urgent Project</span>
                       )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight flex items-center gap-4">
                       {job.title}
                       {!isOwner && (
                           <button 
                              onClick={toggleFavorite} 
                              className={`p-3 rounded-full hover:bg-red-50 transition-colors ${isFavorited ? 'text-coral bg-red-50' : 'text-gray-300'}`}
                           >
                              <Heart size={28} fill={isFavorited ? "currentColor" : "none"} />
                           </button>
                       )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500">
                       <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-coral" /> {job.city}, {job.county}
                       </div>
                       <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black">
                          <Clock size={16} className="text-gray-400" /> Posted {new Date(job.created_at).toLocaleDateString()}
                       </div>
                    </div>
                 </div>
                 
                 {(isOwner || isAssigned) && job.status !== 'completed' && job.status !== 'cancelled' && job.status !== 'disputed' && (
                    <button onClick={() => setShowDisputeModal(true)} className="btn-secondary h-12 text-xs !border-red-100 !text-coral bg-red-50/30 hover:bg-red-50">
                       <AlertOctagon size={16}/> Report Issue
                    </button>
                 )}
              </div>

              <div className="prose max-w-none">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">Project Specification</h3>
                  <div className="text-xl text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </div>
              </div>

              {job.tp_username && (
                <div className="mt-12 pt-8 border-t border-gray-50 bg-gray-50/50 -mx-10 p-10">
                   <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Execution Partner</h3>
                   <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-vouch-blue rounded-2xl flex items-center justify-center font-black text-white text-xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                             {job.tp_profile_photo_url ? (
                                <img src={job.tp_profile_photo_url} alt={job.tp_username} className="w-full h-full object-cover" />
                             ) : (
                                job.tp_username[0].toUpperCase()
                             )}
                         </div>
                         <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Tradesman</div>
                            <Link to={`/user/${job.tp_id}`} className="text-lg font-black text-gray-900 flex items-center gap-1 hover:text-vouch-blue transition-colors">
                               {job.tp_username} <ArrowRight size={16} />
                            </Link>
                         </div>
                      </div>
                      <Link to={`/messages?user=${job.tp_username}`} className="p-4 bg-gray-50 text-gray-900 rounded-2xl hover:bg-black hover:text-white transition-all">
                         <MessageSquare size={24} />
                      </Link>
                   </div>
                </div>
              )}
           </div>
        </div>

        <aside className="lg:col-span-4 space-y-6 sticky top-24">
           <div className="bento-card p-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Max Project Budget</p>
              <div className="text-5xl font-black text-vouch-blue tracking-tighter mb-0 lg:mb-8">
                 <span className="text-2xl mr-1">{job.currency === 'USD' ? '$' : 'L$'}</span>
                 {job.budget_max_lrd.toLocaleString()}
              </div>

              <div className="space-y-3 fixed lg:static bottom-[calc(56px+env(safe-area-inset-bottom))] lg:bottom-auto left-0 right-0 p-4 lg:p-0 bg-white lg:bg-transparent border-t lg:border-none border-gray-100 z-50 lg:pb-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-none">
                 {canBid && !job.has_bid && (
                    <button onClick={() => setShowBidModal(true)} className="w-full btn-primary h-14 !rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-blue-900/20 lg:shadow-none">
                       Apply Now <ArrowRight size={20} />
                    </button>
                 )}
                 
                 {canBid && job.has_bid && (
                    <div className="p-4 bg-blue-50 text-vouch-blue rounded-2xl text-center font-black text-xs uppercase tracking-widest border border-blue-100">
                       Application Submitted
                    </div>
                 )}

                 {isAssigned && job.status === 'in_progress' && (
                    <button onClick={() => actionJob('start-work', 'Work mode activated. Global status updated.')} className="w-full btn-primary h-14 !rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-blue-900/20 lg:shadow-none">
                       Record Work Started
                    </button>
                 )}

                 {isAssigned && (job.status === 'work_started' || job.status === 'in_progress') && (
                    <button onClick={() => actionJob('request-completion', 'Completion requested. Verification notification sent.')} className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black hover:scale-[1.02] transition-all shadow-xl shadow-indigo-900/20 lg:shadow-none">
                       Submit for Review
                    </button>
                 )}

                 {isOwner && (job.status === 'work_started' || job.status === 'in_progress') && (
                    <button onClick={() => actionJob('confirm-completion', 'Work verified as complete by employer.')} className="w-full btn-secondary h-14 !rounded-2xl border-success/30 text-success bg-white hover:bg-success/5 hover:scale-[1.02] transition-transform shadow-xl shadow-gray-200 lg:shadow-none">
                       Confirm Work Completed <CheckCircle size={20} />
                    </button>
                 )}

                 {isOwner && job.status === 'awaiting_completion' && (
                    <button onClick={() => actionJob('confirm-completion', 'Execution verified. Moving to payment phase.')} className="w-full btn-primary h-14 !rounded-2xl bg-success hover:bg-gray-900 hover:scale-[1.02] transition-transform shadow-xl shadow-success/20 lg:shadow-none">
                       Verify Execution <CheckCircle size={20} />
                    </button>
                 )}

                 {isOwner && job.status === 'awaiting_payment' && (
                    <button onClick={() => setShowPaymentModal(true)} className="w-full btn-primary h-14 !rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-blue-900/20 lg:shadow-none">
                       Release Payment <DollarSign size={20} />
                    </button>
                 )}

                 {(isOwner || isAssigned) && (job.status === 'payment_pending' || job.status === 'awaiting_payment') && (
                    <div className="p-4 lg:p-5 bg-gray-50 border border-gray-100 rounded-2xl lg:rounded-3xl text-center">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 lg:mb-2">
                          {job.status === 'payment_pending' ? 'Payment Reported' : 'Awaiting Payment'}
                       </p>
                       <p className="text-sm font-bold text-gray-700">
                          {job.status === 'payment_pending' 
                             ? (isAssigned ? 'Employer reported payment. Please confirm receipt.' : 'Payment reported to tradesperson. Awaiting confirmation.')
                             : (isAssigned ? 'Awaiting employer transaction recording.' : 'Work verified. Please record payment.')
                          }
                       </p>
                       {isAssigned && job.status === 'payment_pending' && (
                          <div className="flex flex-col gap-2 mt-4">
                             <button 
                                onClick={confirmPayment}
                                className="btn-primary !h-10 text-[10px] !rounded-xl mx-auto inline-flex gap-2"
                             >
                                <CheckCircle size={14} /> Confirm Receipt
                             </button>
                             <Link to="/transactions" className="text-[10px] font-black text-vouch-blue uppercase tracking-widest hover:underline">
                                View Full Transaction History
                             </Link>
                          </div>
                       )}
                    </div>
                 )}

                 {isOwner && job.status === 'payment_confirmed' && (
                    <button onClick={() => {
                       actionJob('complete', 'Job finalized. Thank you for using Vouch.');
                       setShowReviewModal(true);
                    }} className="w-full btn-primary h-14 !rounded-2xl !bg-gray-900 shadow-xl shadow-gray-900/20 lg:shadow-none">
                       Finalize Job <Star size={20} />
                    </button>
                 )}

                 {(isOwner || isAssigned) && job.status === 'completed' && (
                    <button onClick={() => setShowReviewModal(true)} className="w-full btn-secondary h-14 !rounded-2xl border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 shadow-lg shadow-yellow-900/5 lg:shadow-none">
                       Leave Professional Review <Star size={20} className="fill-current" />
                    </button>
                 )}

                 {isOwner && job.status === 'open' && (
                    <Link to={`/jobs/${id}/bids`} className="w-full btn-secondary h-14 !rounded-2xl flex items-center justify-between px-6 bg-white shadow-xl shadow-gray-200 lg:shadow-none">
                       <span className="font-black text-xs uppercase tracking-widest">Review Bids</span>
                       <span className="bg-vouch-blue text-white px-3 py-1 rounded-full text-xs font-black">{job.bid_count}</span>
                    </Link>
                 )}
              </div>
           </div>

           <div className="bento-card p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                 <User size={16} /> Request Owner
              </h3>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 overflow-hidden border-2 border-white shadow-sm shrink-0">
                       {job.employer_profile_photo_url ? (
                          <img src={job.employer_profile_photo_url} alt={job.username} className="w-full h-full object-cover" />
                       ) : (
                          job.username[0].toUpperCase()
                       )}
                    </div>
                    <div>
                       <Link to={`/user/${job.employer_id}`} className="text-base font-black text-gray-900 hover:text-vouch-blue transition-colors">
                          {job.username}
                       </Link>
                       <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <BadgeCheck size={12} className="text-success" /> Verified Employer
                       </div>
                    </div>
                 </div>
                 <Link to={`/user/${job.employer_id}`} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-vouch-blue transition-all">
                    <ChevronRight size={20} />
                 </Link>
              </div>
           </div>

           <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-xl font-black mb-4">Secured by Escrow</h4>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed">Your professional reputation and financial security are guaranteed when working through Vouch.</p>
               </div>
               <ShieldCheck size={120} className="absolute -bottom-6 -right-6 opacity-5 rotate-12" />
           </div>
        </aside>
      </div>

      {/* Modals Transformation */}
      <AnimatePresence>
        {showBidModal && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center p-0 sm:p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowBidModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="bg-white p-6 sm:p-10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto relative z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-10 max-h-[90vh] overflow-y-auto">
               <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-8">Submit Proposal</h2>
               <form onSubmit={submitBid} className="space-y-6 sm:space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Proposed Execution Price (L$)</label>
                    <input type="number" required value={bidForm.price} onChange={e=>setBidForm({...bidForm, price:e.target.value})} className="input-field" placeholder="Enter bid amount" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Estimated Days to Complete</label>
                    <input type="number" required value={bidForm.days} onChange={e=>setBidForm({...bidForm, days:e.target.value})} className="input-field" placeholder="e.g. 5" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Cover Message / Approach</label>
                    <textarea required rows={4} value={bidForm.cover} onChange={e=>setBidForm({...bidForm, cover:e.target.value})} className="input-field h-24 sm:h-32 py-4 resize-none" placeholder="Explain why you are the best fit..." />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                    <button type="submit" disabled={bidLoading} className="flex-1 btn-primary h-14 !rounded-2xl">
                        {bidLoading ? 'Broadcasting...' : 'Publish Bid'}
                    </button>
                    <button type="button" onClick={()=>setShowBidModal(false)} className="btn-secondary h-14 !rounded-2xl">Cancel</button>
                  </div>
               </form>
             </motion.div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center p-0 sm:p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowPaymentModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="bg-white p-6 sm:p-10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto relative z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-10 max-h-[90vh] overflow-y-auto">
               <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
               <div className="flex items-center gap-3 mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                   <Zap size={20} className="text-vouch-blue animate-pulse shrink-0" />
                   <div className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-relaxed">Manual Transaction Capture Mode Enabled</div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Record Transaction</h2>
               <p className="text-sm sm:text-base text-gray-500 font-medium mb-8">Confirm the amount released to the professional for this project milestones.</p>
               <form onSubmit={recordPayment} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Amount Released (L$)</label>
                    <input type="number" required value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount:e.target.value})} className="input-field" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Payment Reference / Notes</label>
                    <textarea rows={3} placeholder="Momo reference number or cash notes..." value={paymentForm.notes} onChange={e=>setPaymentForm({...paymentForm, notes:e.target.value})} className="input-field h-24 py-4 resize-none" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                    <button type="submit" className="flex-1 btn-primary h-14 !rounded-2xl">Confirm Release</button>
                    <button type="button" onClick={()=>setShowPaymentModal(false)} className="btn-secondary h-14 !rounded-2xl">Cancel</button>
                  </div>
               </form>
             </motion.div>
          </div>
        )}

        {showDisputeModal && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center p-0 sm:p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowDisputeModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="bg-white p-6 sm:p-10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto relative z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-10 max-h-[90vh] overflow-y-auto">
               <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
               <div className="flex items-center gap-3 mb-6 bg-red-50 p-4 rounded-2xl border border-red-100">
                    <AlertOctagon size={24} className="text-coral shrink-0" />
                    <div className="text-[10px] font-black text-coral uppercase tracking-widest leading-relaxed">Resolution Intervention Request</div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Report Project Issue</h2>
               <p className="text-sm sm:text-base text-gray-500 font-medium mb-8">All active work will be paused. A Vouch dispute agent will review your case within 24 hours.</p>
               <form onSubmit={submitDispute} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Dispute Classification</label>
                    <select value={disputeForm.type} onChange={e=>setDisputeForm({...disputeForm, type:e.target.value})} className="input-field cursor-pointer">
                      <option value="payment_issue">Non-Payment / Underpayment</option>
                      <option value="quality_issue">Unsatisfactory Work Quality</option>
                      <option value="no_show">No Show / Departure</option>
                      <option value="breach_of_agreement">Breach of Project Terms</option>
                      <option value="other">Other Unspecified Issue</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fact Evidence & Details</label>
                    <textarea required rows={5} maxLength={2000} placeholder="Provide specific facts about the breach or issue. This will be visible to the other party and admin." value={disputeForm.desc} onChange={e=>setDisputeForm({...disputeForm, desc:e.target.value})} className="input-field h-32 py-4 resize-none" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                    <button type="submit" className="flex-1 btn-coral h-14 !rounded-2xl">Broadcast Dispute</button>
                    <button type="button" onClick={()=>setShowDisputeModal(false)} className="btn-secondary h-14 !rounded-2xl">Cancel</button>
                  </div>
               </form>
             </motion.div>
          </div>
        )}

        {showReviewModal && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center p-0 sm:p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowReviewModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}} className="bg-white p-6 sm:p-10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto relative z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-10 max-h-[90vh] overflow-y-auto">
               <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Service Evaluation</h2>
               <p className="text-sm sm:text-base text-gray-500 font-medium mb-8">Maintain the network's integrity by providing honest, verified feedback.</p>
               
               {reviewSuccess ? (
                 <div className="text-center py-10">
                   <div className="w-20 h-20 bg-green-50 text-success rounded-3xl flex items-center justify-center mx-auto mb-6">
                     <Star size={40} className="fill-current" />
                   </div>
                   <h3 className="text-xl sm:text-2xl font-black mb-2">Evaluation Broadcast</h3>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed mb-10">Your professional feedback has been recorded and will be live after standard verification.</p>
                   <button onClick={() => setShowReviewModal(false)} className="btn-primary w-full h-14">Back to Project</button>
                 </div>
               ) : (
                 <form onSubmit={submitReview} className="space-y-6">
                   <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 space-y-1 sm:space-y-2">
                      <StarSelector label="Market Quality" field="quality_rating" value={reviewForm.quality_rating} />
                      <StarSelector label="Professionalism" field="professionalism_rating" value={reviewForm.professionalism_rating} />
                      <StarSelector label="Timing / Deadline" field="timeliness_rating" value={reviewForm.timeliness_rating} />
                      <StarSelector label="Value for Money" field="value_rating" value={reviewForm.value_rating} />
                      <StarSelector label="Comms Reliability" field="communication_rating" value={reviewForm.communication_rating} />
                      <div className="pt-4 mt-2 border-t border-gray-100">
                         <StarSelector label="Overall Performance" field="overall_rating" value={reviewForm.overall_rating} />
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Testimonial Character Scroll</label>
                      <textarea 
                        rows={4} 
                        className="input-field h-24 sm:h-32 py-4 resize-none" 
                        placeholder="Write a professional testimonial about your experience..."
                        value={reviewForm.testimonial_text}
                        onChange={(e) => setReviewForm(prev => ({...prev, testimonial_text: e.target.value}))}
                      ></textarea>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-50">
                      <button type="submit" disabled={reviewLoading || reviewForm.overall_rating === 0} className="flex-1 btn-primary h-14 !rounded-2xl">
                         {reviewLoading ? 'Locking Feedback...' : 'Seal Evaluation'}
                      </button>
                      <button type="button" onClick={() => setShowReviewModal(false)} className="btn-secondary h-14 !rounded-2xl">Cancel</button>
                   </div>
                 </form>
               )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={modal.isOpen} 
        type={modal.type} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal({...modal, isOpen: false})} 
        onConfirm={() => {
           setModal({...modal, isOpen: false});
           if (modal.onConfirm) modal.onConfirm();
        }}
      />
    </div>
  );
};
