import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Download, FileText, CheckCircle, Clock, XCircle, Search, Wallet, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Zap, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';

export const TransactionsPage: React.FC = () => {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { auth } = useAuth();

  useEffect(() => {
    fetchTxs();
  }, []);

  const fetchTxs = async () => {
    try {
      const res = await api.get('/transactions/my-transactions');
      setTxs(res.data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const confirmTx = async (txId: string) => {
    try {
      await api.put(`/transactions/${txId}/confirm`);
      toast.success('Payment confirmed! Job status updated.');
      fetchTxs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-600 border border-yellow-100 flex items-center gap-1.5 rounded-full"><Clock size={10}/> Pending</span>;
      case 'confirmed': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-vouch-blue border border-blue-100 flex items-center gap-1.5 rounded-full"><CheckCircle size={10}/> Confirmed</span>;
      case 'completed': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-green-50 text-success border border-success/20 flex items-center gap-1.5 rounded-full"><CheckCircle size={10}/> Completed</span>;
      case 'cancelled': return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-red-50 text-coral border border-red-100 flex items-center gap-1.5 rounded-full"><XCircle size={10}/> Cancelled</span>;
      default: return <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 rounded-full">{status}</span>;
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(txs.map(t => ({
      ID: t.transaction_id,
      Date: new Date(t.created_at).toLocaleString(),
      Role: t.payer_id === auth.user?.user_id ? 'Payer' : 'Payee',
      OtherParty: t.payer_id === auth.user?.user_id ? t.payee_username : t.payer_username,
      Job: t.job_title,
      Amount: t.amount_lrd,
      Type: t.transaction_type,
      Status: t.status,
      Notes: t.notes
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vouch_Journal_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = txs.filter(t => {
     if (filter !== 'All' && t.status !== filter.toLowerCase()) return false;
     if (search && !t.job_title?.toLowerCase().includes(search.toLowerCase())) return false;
     return true;
  });

  const totals = txs.reduce((acc, t) => {
     const isPayer = t.payer_id === auth.user?.user_id;
     if (t.status === 'completed' || t.status === 'confirmed') {
        if (isPayer) acc.out += Number(t.amount_lrd);
        else acc.in += Number(t.amount_lrd);
     }
     return acc;
  }, { in: 0, out: 0 });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <SEO title="Payment Journal | Vouch Financial" description="Monitor your project earnings and payments securely on the Vouch platform." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-vouch-blue rounded-xl text-white shadow-lg shadow-blue-900/20">
                    <Wallet size={20} />
                 </div>
                 <span className="text-xs font-black text-vouch-blue uppercase tracking-widest">Financial Terminal</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Transaction Journal</h1>
              <p className="text-lg text-gray-500 font-medium">Clear, auditable records for every project milestone you've funded or earned.</p>
          </div>
          
          <button 
           onClick={exportCSV} 
           className="btn-secondary h-14 px-8 !rounded-2xl flex items-center gap-2 group"
          >
            <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" /> 
            Export Journal (CSV)
          </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden h-44"
          >
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Career Volume</p>
             <div className="text-4xl font-black tracking-tighter">
                <span className="text-lg text-blue-400 mr-1">L$</span>
                {(totals.in + totals.out).toLocaleString()}
             </div>
             <Wallet size={120} className="absolute -bottom-8 -right-8 opacity-5 -rotate-12" />
          </motion.div>

          <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="bento-card p-8 h-44 border-success/20 bg-success/5"
          >
             <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-success/60">Verified Earnings</p>
                <div className="p-2 bg-success text-white rounded-xl"><TrendingUp size={16} /></div>
             </div>
             <div className="text-4xl font-black tracking-tighter text-success">
                <span className="text-lg mr-1 text-success/60">L$</span>
                {totals.in.toLocaleString()}
             </div>
             <p className="text-[10px] font-bold text-success/50 uppercase tracking-widest mt-2">{txs.filter(t => t.payee_id === auth.user?.user_id).length} Income Events</p>
          </motion.div>

          <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="bento-card p-8 h-44 bg-gray-50/50"
          >
             <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Disbursements</p>
                <div className="p-2 bg-gray-900 text-white rounded-xl"><TrendingDown size={16} /></div>
             </div>
             <div className="text-4xl font-black tracking-tighter text-gray-900">
                <span className="text-lg mr-1 text-gray-400">L$</span>
                {totals.out.toLocaleString()}
             </div>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{txs.filter(t => t.payer_id === auth.user?.user_id).length} Funding Events</p>
          </motion.div>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-6 justify-between items-center bg-gray-50/30">
           <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-vouch-blue transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Find specific project payments..." 
                className="w-full pl-12 pr-6 h-12 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-vouch-blue transition-all"
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
           </div>
           
           <div className="flex bg-gray-100 p-1 rounded-2xl self-end md:self-auto w-full md:w-auto">
             {['All', 'Pending', 'Confirmed', 'Completed'].map(f => (
               <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`flex-1 md:flex-none px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filter===f?'bg-white shadow-sm text-vouch-blue':'text-gray-400 hover:text-gray-900'}`}
               >
                 {f}
               </button>
             ))}
           </div>
        </div>
        
        <div className="overflow-x-auto max-h-[600px] relative rounded-2xl border border-gray-100 mb-6">
           {loading ? (
             <div className="p-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-vouch-blue rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Decrypting Ledger...</p>
             </div>
           ) : filtered.length === 0 ? (
             <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mx-auto">
                   <FileText size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-gray-900">No records in this scope</h3>
                    <p className="text-gray-500 font-medium">Your historical data will appear here as your project milestones are completed.</p>
                </div>
             </div>
           ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden xl:block">
              <table className="min-w-full relative">
                <thead className="bg-gray-50/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer hover:text-vouch-blue transition-colors">Chronicle</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer hover:text-vouch-blue transition-colors">Project Correlation</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer hover:text-vouch-blue transition-colors">Quantum (L$)</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer hover:text-vouch-blue transition-colors">Workflow Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 cursor-pointer hover:text-vouch-blue transition-colors">Execution Counterpart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filtered.map((t, idx) => {
                      const isPayer = t.payer_id === auth.user?.user_id;
                      return (
                       <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        key={t.transaction_id} 
                        className="group cursor-default hover:bg-white even:bg-gray-50/50 odd:bg-white transition-colors"
                       >
                         <td className="px-8 py-6">
                            <div className="text-sm font-black text-gray-900">{new Date(t.created_at).toLocaleDateString()}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="text-sm font-black text-gray-900 group-hover:text-vouch-blue transition-colors max-w-xs truncate">{t.job_title}</div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                               <Zap size={10} className="text-vouch-blue" />
                               {t.transaction_type.replace('_', ' ')}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className={`text-xl font-black tracking-tighter ${isPayer ? 'text-gray-900' : 'text-success'}`}>
                              {isPayer ? '-' : '+'}{Number(t.amount_lrd).toLocaleString()}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{t.payment_method.replace('_', ' ')}</div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex flex-col gap-2">
                               {getStatusBadge(t.status)}
                               {!isPayer && t.status === 'pending' && (
                                 <button 
                                   onClick={() => confirmTx(t.transaction_id)}
                                   className="px-4 py-1.5 bg-vouch-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center gap-2 w-fit shadow-lg shadow-blue-900/10"
                                 >
                                   <ThumbsUp size={12} /> Confirm Receipt
                                 </button>
                               )}
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <Link to={`/user/${isPayer ? t.payee_id : t.payer_id}`} className="inline-flex items-center gap-2 group/user">
                               <div className="text-right">
                                  <div className="text-xs font-black text-gray-900 group-hover/user:text-vouch-blue transition-colors">{isPayer ? t.payee_username : t.payer_username}</div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isPayer ? 'Incoming' : 'Recipient'}</div>
                               </div>
                               <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover/user:bg-vouch-blue group-hover/user:text-white transition-all">
                                  {(isPayer ? t.payee_username : t.payer_username)?.[0].toUpperCase()}
                               </div>
                            </Link>
                         </td>
                       </motion.tr>
                    )})}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="xl:hidden flex flex-col p-4 gap-4">
               {filtered.map((t, idx) => {
                  const isPayer = t.payer_id === auth.user?.user_id;
                  return (
                    <motion.div 
                      key={t.transaction_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden"
                    >
                       <div className="flex justify-between items-start w-full">
                          <div className="flex flex-col gap-1 w-full max-w-[70%]">
                             <div className="text-xs font-black uppercase tracking-widest text-vouch-blue">
                               {new Date(t.created_at).toLocaleDateString()}
                             </div>
                             <div className="text-base font-black text-gray-900 truncate">
                               {t.job_title}
                             </div>
                          </div>
                          <div className={`text-xl font-black tracking-tighter ${isPayer ? 'text-gray-900' : 'text-success'} shrink-0 text-right`}>
                             {isPayer ? '-' : '+'}{Number(t.amount_lrd).toLocaleString()}
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between">
                          <Link to={`/user/${isPayer ? t.payee_id : t.payer_id}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 shrink-0">
                                  {(isPayer ? t.payee_username : t.payer_username)?.[0].toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {isPayer ? 'Paid To' : 'Received From'}
                                 </span>
                                 <span className="text-sm font-black text-gray-900">
                                    {isPayer ? t.payee_username : t.payer_username}
                                 </span>
                              </div>
                          </Link>
                          <div className="flex flex-col items-end gap-2">
                             {getStatusBadge(t.status)}
                             {!isPayer && t.status === 'pending' && (
                               <button 
                                 onClick={() => confirmTx(t.transaction_id)}
                                 className="px-3 py-2 bg-vouch-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10"
                               >
                                 Confirm <ThumbsUp size={12} />
                               </button>
                             )}
                          </div>
                       </div>
                    </motion.div>
                  )
               })}
            </div>
            </>
           )}
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-vouch-blue" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] leading-relaxed">
                 All financial data is cryptographically archived for your protection.
              </p>
           </div>
           <Link to="/help" className="text-[10px] font-black text-vouch-blue uppercase tracking-widest hover:underline flex items-center gap-2">
              Payment Support <ArrowRight size={14} />
           </Link>
        </div>
      </div>
    </div>
  );
};
