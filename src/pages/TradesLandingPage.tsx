import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { Search, MapPin, Star, ShieldCheck, Briefcase, TrendingUp, ChevronRight, Zap, Droplet, Hammer, BrickWall, PaintRoller, Flame, Wrench, HardHat, Home, Pipette } from 'lucide-react';
import { motion } from 'framer-motion';

const ICON_MAP: Record<string, any> = {
    zap: Zap, droplet: Droplet, hammer: Hammer, 'brick-wall': BrickWall,
    'paint-roller': PaintRoller, flame: Flame, wrench: Wrench, 'hard-hat': HardHat,
    home: Home, pipette: Pipette, briefcase: Briefcase
};

export const TradesLandingPage: React.FC = () => {
    const { tradeId } = useParams();
    const [category, setCategory] = useState<any>(null);
    const [topPros, setTopPros] = useState<any[]>([]);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tradeId) {
            fetchData();
        }
    }, [tradeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const catRes = await api.get('/jobs/trade-categories');
            const foundCat = catRes.data.find((c: any) => c.category_id === tradeId || c.name.toLowerCase() === tradeId?.toLowerCase());
            setCategory(foundCat);

            if (foundCat) {
                const prosRes = await api.get(`/tradespeople?trade_category_id=${foundCat.category_id}&limit=6&sort=trust_score`);
                setTopPros(prosRes.data.users || []);

                const jobsRes = await api.get(`/jobs?trade_category_id=${foundCat.category_id}&limit=10&status=open`);
                setRecentJobs(jobsRes.data.jobs || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 text-center">Loading {tradeId} services...</div>;
    if (!category) return <div className="py-20 text-center">Trade category not found.</div>;

    const Icon = ICON_MAP[category.icon_class] || Briefcase;

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 py-24 px-4 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-100 text-xs font-black uppercase tracking-widest mb-6 border border-white/10">
                            Professional {category.name} Services
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
                            Find Verified <span className="text-amber-400">{category.name}s</span> in Liberia
                        </h1>
                        <p className="text-xl text-blue-100 mb-8 max-w-xl leading-relaxed">
                            Vouch connects you with the most reliable {category.name.toLowerCase()} professionals. 
                            Every pro is background-checked and rated by the community.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link to="/jobs/new" className="bg-white text-blue-900 font-bold py-4 px-10 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-blue-950/20">
                                Post a {category.name} Job
                            </Link>
                            <Link to={`/tradespeople?trade_category_id=${category.category_id}`} className="bg-blue-600/30 text-white border border-white/20 font-bold py-4 px-10 rounded-2xl hover:bg-white/10 transition-all">
                                Browse {category.name}s
                            </Link>
                        </div>
                    </div>
                    <div className="hidden lg:block flex-1">
                        <div className="relative">
                            <div className="w-80 h-80 bg-blue-500/20 rounded-[4rem] rotate-12 absolute -inset-4 blur-2xl"></div>
                            <div className="relative bg-white/10 backdrop-blur-md rounded-[5rem] p-12 border border-white/20">
                                <Icon size={200} className="text-white opacity-80" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative background patterns */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            </div>

            {/* Quick Stats */}
            <div className="max-w-7xl mx-auto px-4 -mt-10 mb-20 relative z-20">
                <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Verified Pros', val: topPros.length * 3 + 12 + '+', icon: ShieldCheck },
                        { label: 'Avg Rating', val: '4.8/5', icon: Star },
                        { label: 'Jobs Done', val: '250+', icon: Briefcase },
                        { label: 'Response Time', val: '< 2h', icon: Zap }
                    ].map((s, i) => (
                        <div key={i} className="text-center group">
                            <div className="flex justify-center mb-2">
                                <s.icon className="text-blue-600 group-hover:scale-110 transition-transform" size={24} />
                            </div>
                            <div className="text-3xl font-black text-gray-900 tracking-tight">{s.val}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 space-y-32 mb-32">
                {/* Top Professionals */}
                <section>
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Top {category.name}s</h2>
                            <p className="text-gray-500">The highest ranked professionals in this category.</p>
                        </div>
                        <Link to="/leaderboard" className="hidden sm:flex items-center gap-2 text-blue-600 font-bold hover:underline">
                            View Rankings <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {topPros.map((pro, idx) => (
                            <motion.div 
                                key={pro.user_id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-50 rounded-[2.5rem] p-8 border border-transparent hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-gray-100">
                                        {pro.profile_photo_url ? (
                                            <img src={pro.profile_photo_url} alt={pro.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400 font-bold text-xl uppercase">
                                                {pro.username[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{pro.username}</h3>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-sm font-black">{Number(pro.overall_rating_avg || 0).toFixed(1)}</span>
                                            <span className="text-xs text-gray-400 font-bold ml-1">{pro.total_reviews_count || 0} reviews</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                                    <MapPin size={14} /> {pro.county || 'Liberia'}
                                </div>
                                <Link to={`/user/${pro.user_id}`} className="block text-center py-4 bg-white rounded-2xl font-bold text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                                    View Profile & Hire
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Recent Jobs */}
                <section className="bg-gray-900 rounded-[4rem] p-8 md:p-16 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-4xl font-black tracking-tight mb-2">Available Jobs</h2>
                                <p className="text-gray-400">Find new opportunities specifically for {category.name.toLowerCase()}s.</p>
                            </div>
                            <Link to="/jobs" className="text-blue-400 font-bold hover:underline">View All Jobs</Link>
                        </div>

                        <div className="space-y-4">
                            {recentJobs.length === 0 ? (
                                <p className="text-center py-12 text-gray-500">No open jobs in this category right now.</p>
                            ) : (
                                recentJobs.map(job => (
                                    <Link key={job.job_id} to={`/jobs/${job.job_id}`} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{job.title}</h3>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                                                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full">{job.county}</span>
                                                <span>{formatDate(job.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-0 flex items-center gap-2 font-black text-amber-400">
                                            {job.budget_lrd?.toLocaleString()} LRD <ChevronRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
                </section>
            </div>
        </div>
    );
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
