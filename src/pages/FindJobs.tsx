import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Filter, ArrowRight, Star, Clock, DollarSign, Zap, HardHat, ShieldCheck, X, Heart } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const FindJobs: React.FC = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [favoriteJobs, setFavoriteJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    q: '',
    county: '',
    urgency_level: '',
    budget_min: 0,
    budget_max: 500000,
    sort: 'newest',
    page: 1,
    limit: 20
  });

  const [searchInput, setSearchInput] = useState('');

  const LIBERIAN_COUNTIES = [
    'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount', 
    'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland', 
    'Montserrado', 'Nimba', 'Rivercess', 'River Gee', 'Sinoe'
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, q: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
    if (auth.user) fetchFavoriteJobs();
  }, [filters, auth.user]);

  const fetchFavoriteJobs = () => {
    api.get('/favorites/jobs').then(res => {
        setFavoriteJobs(res.data);
    }).catch(() => {});
  };

  const toggleFavorite = async (jobId: string) => {
    if (!auth.user) {
        toast.error("Please log in to save jobs");
        return;
    }
    const found = favoriteJobs.find(f => f.job_id === jobId);
    try {
        if (found) {
            await api.delete(`/favorites/jobs/${found.favorite_id}`);
            setFavoriteJobs(prev => prev.filter(f => f.job_id !== jobId));
            toast.success("Removed from saved jobs");
        } else {
            const res = await api.post('/favorites/jobs', { job_id: jobId });
            setFavoriteJobs(prev => [...prev, { favorite_id: res.data.favorite_id, job_id: jobId }]);
            toast.success("Job saved to favorites");
        }
    } catch(e) {
        toast.error("Failed to update favorite");
    }
  };

  const fetchJobs = () => {
    setLoading(true);
    let qString = `?page=${filters.page}&limit=${filters.limit}&sort=${filters.sort}`;
    if (filters.q) qString += `&q=${filters.q}`;
    if (filters.county && filters.county !== 'All Counties') qString += `&county=${filters.county}`;
    if (filters.urgency_level) qString += `&urgency_level=${filters.urgency_level}`;
    if (filters.budget_min > 0) qString += `&budget_min=${filters.budget_min}`;
    if (filters.budget_max < 500000) qString += `&budget_max=${filters.budget_max}`;

    api.get(`/jobs${qString}`)
      .then(res => {
        setJobs(res.data.jobs);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const removeFilter = (key: string) => {
    if (key === 'q') setSearchInput('');
    if (key === 'budget') setFilters({...filters, budget_min: 0, budget_max: 500000, page: 1});
    else setFilters({...filters, [key]: '', page: 1});
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <SEO title="Find Jobs | Vouch Liberia" description="Browse verified trade jobs across Liberia. plumbing, electrical, construction and more." />
      
      {/* Hero Search Bento */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bento-card trust-gradient p-8 md:p-12 text-white relative overflow-hidden"
      >
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">Find your next <span className="text-blue-200">win.</span></h1>
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <input 
                  type="text" 
                  className="w-full h-16 pl-14 pr-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-gray-900 transition-all placeholder:text-blue-100 placeholder:opacity-50 text-white font-bold"
                  placeholder="Job title, keywords, or company..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-200" size={24} />
             </div>
             <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-3 border border-white/20">
                <HardHat className="text-blue-200" />
                <span className="font-black tracking-tight">{total} Jobs Online</span>
             </div>
          </div>
        </div>
        <Zap className="absolute top-10 right-10 opacity-10 rotate-12" size={300} />
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Filter Overlay */}
        <AnimatePresence>
          {showMobileFilters && (
            <div className="fixed inset-0 z-[120] flex lg:hidden">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowMobileFilters(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div 
                initial={{x: '-100%'}} 
                animate={{x: 0}} 
                exit={{x: '-100%'}} 
                transition={{type: 'spring', damping: 25, stiffness: 200}} 
                className="relative bg-gray-50 w-[85%] max-w-sm h-full shadow-2xl flex flex-col z-10 overflow-y-auto"
              >
                <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100 sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                     <div className="p-2 bg-vouch-blue/10 text-vouch-blue rounded-xl">
                       <Filter size={20} />
                     </div>
                     <h2 className="text-xl font-black tracking-tight">Filters</h2>
                  </div>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900">
                     <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-8 bg-white flex-1">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Location (County)</label>
                      <select 
                        className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl outline-none focus:border-vouch-blue focus:bg-white transition-all font-bold text-sm"
                        value={filters.county} 
                        onChange={e => setFilters({...filters, county: e.target.value, page: 1})}
                      >
                        <option value="">All Liberia</option>
                        {LIBERIAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Budget (L$)</label>
                      <span className="text-xs font-bold text-vouch-blue">Range Select</span>
                    </div>
                    <div className="px-2 mb-4">
                      <Slider 
                          range 
                          min={0} 
                          max={500000} 
                          step={100}
                          value={[filters.budget_min, filters.budget_max]} 
                          onChange={(val: any) => setFilters({...filters, budget_min: val[0], budget_max: val[1], page: 1})}
                          trackStyle={[{ backgroundColor: '#2563eb' }]}
                          handleStyle={[{ borderColor: '#2563eb', boxShadow: 'none', height: 20, width: 20, marginTop: -8 }, { borderColor: '#2563eb', boxShadow: 'none', height: 20, width: 20, marginTop: -8 }]}
                          railStyle={{ backgroundColor: '#f3f4f6', height: 4 }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase">
                       <span>L${filters.budget_min.toLocaleString()}</span>
                       <span>L${filters.budget_max.toLocaleString()}+</span>
                    </div>
                  </div>
                  <div>
                     <label className="flex items-center group cursor-pointer">
                       <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${filters.urgency_level === 'urgent' ? 'bg-coral' : 'bg-gray-200'}`}>
                          <input 
                            type="checkbox" 
                            className="opacity-0 absolute inset-0 cursor-pointer z-10"
                            checked={filters.urgency_level === 'urgent'}
                            onChange={e => setFilters({...filters, urgency_level: e.target.checked ? 'urgent' : '', page: 1})}
                          />
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${filters.urgency_level === 'urgent' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                       </div>
                       <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-vouch-blue">Urgent Projects</span>
                     </label>
                  </div>
                  <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                    <button onClick={() => setShowMobileFilters(false)} className="w-full btn-primary h-12 text-sm">
                      View Results
                    </button>
                    <button 
                      onClick={() => {setSearchInput(''); setFilters({q: '', county: '', urgency_level: '', budget_min: 0, budget_max: 500000, sort: 'newest', page: 1, limit: 20}); setShowMobileFilters(false);}} 
                      className="w-full btn-secondary h-12 text-sm"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:w-80 flex-shrink-0 space-y-6">
          <div className="bento-card p-8 sticky top-24">
            <div className="flex items-center gap-2 mb-8">
               <div className="p-2 bg-vouch-blue/10 text-vouch-blue rounded-xl">
                 <Filter size={20} />
               </div>
               <h2 className="text-xl font-black tracking-tight">Market Filters</h2>
            </div>

            <div className="space-y-8">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-4">Location (County)</label>
                  <select 
                    className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl outline-none focus:border-vouch-blue focus:bg-white transition-all font-bold text-sm"
                    value={filters.county} 
                    onChange={e => setFilters({...filters, county: e.target.value, page: 1})}
                  >
                    <option value="">All Liberia</option>
                    {LIBERIAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>

               <div>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Budget (L$)</label>
                  <span className="text-xs font-bold text-vouch-blue">Range Select</span>
                </div>
                <div className="px-2 mb-4">
                  <Slider 
                      range 
                      min={0} 
                      max={500000} 
                      step={100}
                      value={[filters.budget_min, filters.budget_max]} 
                      onChange={(val: any) => setFilters({...filters, budget_min: val[0], budget_max: val[1], page: 1})}
                      trackStyle={[{ backgroundColor: '#2563eb' }]}
                      handleStyle={[{ borderColor: '#2563eb', boxShadow: 'none', height: 20, width: 20, marginTop: -8 }, { borderColor: '#2563eb', boxShadow: 'none', height: 20, width: 20, marginTop: -8 }]}
                      railStyle={{ backgroundColor: '#f3f4f6', height: 4 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase">
                   <span>L${filters.budget_min.toLocaleString()}</span>
                   <span>L${filters.budget_max.toLocaleString()}+</span>
                </div>
              </div>

              <div>
                 <label className="flex items-center group cursor-pointer">
                   <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${filters.urgency_level === 'urgent' ? 'bg-coral' : 'bg-gray-200'}`}>
                      <input 
                        type="checkbox" 
                        className="opacity-0 absolute inset-0 cursor-pointer z-10"
                        checked={filters.urgency_level === 'urgent'}
                        onChange={e => setFilters({...filters, urgency_level: e.target.checked ? 'urgent' : '', page: 1})}
                      />
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${filters.urgency_level === 'urgent' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </div>
                   <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-vouch-blue">Urgent Projects</span>
                 </label>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <button 
                  onClick={() => {setSearchInput(''); setFilters({q: '', county: '', urgency_level: '', budget_min: 0, budget_max: 500000, sort: 'newest', page: 1, limit: 20})}} 
                  className="w-full btn-secondary h-12 text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Job Listings Area */}
        <main className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between sm:justify-start gap-4 px-2">
                <div className="flex items-center gap-1">
                   <span className="text-sm font-bold text-gray-900">{total}</span>
                   <span className="text-sm font-medium text-gray-500 tracking-tight">Opportunities Found</span>
                </div>
                
                <button 
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 p-2 px-4 bg-gray-50 rounded-xl text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  <Filter size={14} /> Filters
                </button>

                {/* Active Filter Chips */}
                <div className="hidden md:flex gap-2">
                   {filters.q && <span className="inline-flex items-center gap-1 bg-blue-50 text-vouch-blue text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-100">Search: {filters.q} <X size={12} className="cursor-pointer" onClick={()=>removeFilter('q')}/></span>}
                   {filters.county && <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-gray-200">{filters.county} <X size={12} className="cursor-pointer" onClick={()=>removeFilter('county')}/></span>}
                </div>
             </div>
             
             <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                 {['newest', 'budget_high', 'urgent'].map(opt => (
                    <button 
                      key={opt}
                      onClick={()=>setFilters({...filters, sort: opt, page: 1})}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filters.sort === opt ? 'bg-white shadow-sm text-vouch-blue' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {opt === 'newest' ? 'Newest' : opt === 'budget_high' ? 'High Budget' : 'Urgent First'}
                    </button>
                 ))}
             </div>
          </div>

          <div className={jobs.length > 0 && !loading ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className="bento-card p-6 animate-pulse flex flex-col min-h-[300px]">
                       <div className="h-4 w-1/4 bg-gray-100 rounded-full mb-4"></div>
                       <div className="h-6 w-3/4 bg-gray-50 rounded-full mb-6 relative"></div>
                       <div className="h-4 w-full bg-gray-50 rounded-full mb-2"></div>
                       <div className="h-4 w-2/3 bg-gray-50 rounded-full mb-6"></div>
                       <div className="mt-auto flex flex-col gap-4 border-t border-gray-100 pt-4">
                          <div className="h-8 w-24 bg-gray-100 rounded-full"></div>
                       </div>
                    </div>
                 ))}
               </div>
            ) : jobs.length === 0 ? (
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bento-card p-16 text-center"
               >
                 <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Search size={48} />
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">No results matched your search</h2>
                 <p className="text-gray-500 font-medium mb-8">Try broadening your filters or location to see more opportunities.</p>
                 <button onClick={() => setSearchInput('')} className="btn-primary mx-auto">
                    Reset Market Search
                 </button>
               </motion.div>
            ) : (
               <AnimatePresence mode="popLayout">
                 {jobs.map((job, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={job.job_id}
                      className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-[0_10px_40px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 ease-out group relative overflow-hidden flex flex-col h-full cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.job_id}`)}
                    >
                      <div className="flex flex-col h-full relative z-10 w-full">
                        <div className="flex-1 flex flex-col space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                               <div className="bg-blue-50 text-vouch-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                  {job.category_name}
                               </div>
                               {job.urgency_level === 'urgent' && (
                                  <div className="bg-red-50 text-coral px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-red-100 animate-pulse">
                                     <Zap size={10} fill="currentColor" /> Urgent
                                  </div>
                               )}
                            </div>
                            {auth.user?.user_type !== 'employer' && (
                               <button 
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(job.job_id); }} 
                                  className={`p-2 rounded-full hover:bg-red-50 transition-colors z-20 relative ${favoriteJobs.some(f => f.job_id === job.job_id) ? 'text-coral' : 'text-gray-300'}`}
                               >
                                  <Heart size={20} fill={favoriteJobs.some(f => f.job_id === job.job_id) ? "currentColor" : "none"} className="transition-transform hover:scale-110" />
                               </button>
                            )}
                          </div>
                          
                          <div className="flex flex-col flex-1">
                            <Link to={`/jobs/${job.job_id}`} onClick={e => e.stopPropagation()} className="text-xl font-black text-gray-900 group-hover:text-vouch-blue transition-colors tracking-tight block leading-tight mb-2 line-clamp-2">
                              {job.title}
                            </Link>
                            <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                               <Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed text-sm mb-4">
                               {job.description}
                            </p>

                            <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-50">
                               <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                                  <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><MapPin size={14} /></div>
                                  <span className="truncate">{job.county}, {job.city}</span>
                               </div>
                               <div className="flex items-center gap-2 font-bold text-sm">
                                  <div className="p-0.5 bg-vouch-blue/5 rounded-lg text-vouch-blue w-6 h-6 flex items-center justify-center overflow-hidden border border-white">
                                     {job.profile_photo_url ? (
                                        <img src={job.profile_photo_url} alt={job.username} className="w-full h-full object-cover" />
                                     ) : (
                                        <ShieldCheck size={14} />
                                     )}
                                  </div>
                                  <span className="text-gray-500 font-medium truncate">Employer: {job.username}</span>
                               </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                           <div className="text-right bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between group-hover:bg-blue-50/50 transition-colors">
                              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase pr-2">Budget Est.</span>
                              <div className="flex items-center gap-1 text-gray-900 justify-end">
                                 <span className="text-xs font-bold text-gray-400">L$</span>
                                 <span className="text-lg font-black tracking-tight">{Number(job.budget_max_lrd).toLocaleString()}</span>
                              </div>
                           </div>
                           
                           <Link to={`/jobs/${job.job_id}`} onClick={e => e.stopPropagation()} className="w-full btn-primary h-12 flex items-center justify-center hover:scale-[1.02] group-hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-all duration-300">
                              View Project <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                           </Link>
                        </div>
                      </div>
                      
                      {/* Decorative Background Icon */}
                      <div className="absolute -bottom-6 -right-6 opacity-[0.02] rotate-12 pointer-events-none transition-transform group-hover:scale-110">
                         <Briefcase size={120} />
                      </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
