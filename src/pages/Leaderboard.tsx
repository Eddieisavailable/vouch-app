import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Trophy, Medal, Star, ShieldCheck, MapPin, Search, ChevronRight, Share2, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export const LeaderboardPage: React.FC = () => {
    const [tradespeople, setTradespeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all_time' | 'this_month'>('all_time');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        api.get('/jobs/trade-categories').then(res => setCategories(res.data));
        fetchLeaderboard();
    }, [tab, categoryFilter]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // We'll reuse profile routes but with specific sorting/filtering
            // Ideally we'd have a specific /api/analytics/leaderboard endpoint
            const qString = `?user_type=tradesperson&sort=trust_score&limit=10${categoryFilter ? `&trade_category_id=${categoryFilter}` : ''}`;
            const res = await api.get(`/tradespeople${qString}`);
            setTradespeople(res.data.users || []);
        } catch (e) {
            toast.error("Failed to load rankings");
        } finally {
            setLoading(false);
        }
    };

    const shareRankings = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest mb-4">
                    <Trophy size={14} /> Official Rankings
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">
                    Top Professionals in Liberia
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    The most trusted, highly-rated, and reliable tradespeople on Vouch. 
                    Calculated by performance, reviews, and verification.
                </p>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                <div className="flex p-1 bg-gray-100 rounded-2xl">
                    <button 
                        onClick={() => setTab('all_time')}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                            tab === 'all_time' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Trophy size={18} /> All-Time Best
                    </button>
                    <button 
                         onClick={() => setTab('this_month')}
                         className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                             tab === 'this_month' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-900'
                         }`}
                    >
                        <TrendingUp size={18} /> Top This Month
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <select 
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-3 font-bold text-gray-700 outline-none focus:border-blue-600 transition-all flex-1 md:flex-none"
                    >
                        <option value="">All Trades</option>
                        {categories.map(c => (
                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={shareRankings}
                        className="p-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all"
                    >
                        <Share2 size={24} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {tradespeople.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                             <Users size={48} className="mx-auto text-gray-300 mb-4" />
                             <p className="text-gray-500 font-bold">No professionals ranked in this category yet.</p>
                        </div>
                    ) : (
                        tradespeople.map((tp, idx) => (
                             <motion.div
                                key={tp.user_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative group bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6 ${
                                    idx === 0 ? 'ring-2 ring-amber-400 ring-offset-4' : ''
                                }`}
                             >
                                {/* Rank */}
                                <div className="flex-shrink-0 flex items-center justify-center">
                                    {idx === 0 ? <Medal size={48} className="text-amber-400" /> : 
                                     idx === 1 ? <Medal size={40} className="text-gray-400" /> :
                                     idx === 2 ? <Medal size={36} className="text-amber-700 opacity-60" /> :
                                     <span className="text-3xl font-black text-gray-200 italic">#{idx + 1}</span>}
                                </div>

                                {/* Profile Photo */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100">
                                        {tp.profile_photo_url ? (
                                            <img src={tp.profile_photo_url} alt={tp.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 text-blue-400 flex items-center justify-center font-black text-2xl uppercase">
                                                {tp.username[0]}
                                            </div>
                                        )}
                                    </div>
                                    {tp.verification_level !== 'Basic' && (
                                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl shadow-lg ring-2 ring-white">
                                            <ShieldCheck size={16} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <Link to={`/user/${tp.user_id}`} className="text-2xl font-black text-gray-900 hover:text-blue-600 transition-colors tracking-tight">
                                        {tp.username}
                                    </Link>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2 text-sm">
                                        <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                            <Star size={14} fill="currentColor" /> {tp.overall_rating_avg?.toFixed(1) || '0.0'}
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                            <ShieldCheck size={14} /> {tp.trust_score}% Trust
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            <MapPin size={14} /> {tp.county || 'Liberia'}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-gray-50 rounded-2xl">
                                    <div className="text-center">
                                        <div className="text-xl font-black text-gray-900">{tp.total_reviews_count || 0}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reviews</div>
                                    </div>
                                    <div className="text-center border-l border-gray-200">
                                        <div className="text-xl font-black text-gray-900">{tp.completed_jobs_count || 0}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jobs</div>
                                    </div>
                                </div>

                                {/* Action */}
                                <Link 
                                    to={`/user/${tp.user_id}`}
                                    className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-blue-200"
                                >
                                    <ChevronRight size={24} />
                                </Link>
                             </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
