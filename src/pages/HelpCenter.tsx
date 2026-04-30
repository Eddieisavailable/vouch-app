import React, { useState, useEffect } from 'react';
import { Search, HelpCircle, Book, Shield, MessageSquare, ChevronRight, ArrowLeft, ThumbsUp, ThumbsDown, Zap, ShieldCheck, Mail, ArrowRight, ShieldAlert, FileText, Info } from 'lucide-react';
import api from '@/services/api';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

export const HelpCenter: React.FC = () => {
   const { slug } = useParams();
   const [articles, setArticles] = useState<any[]>([]);
   const [activeArticle, setActiveArticle] = useState<any | null>(null);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');

   const categories = [
      { id: 'getting_started', name: 'Getting Started', icon: Zap, color: 'text-vouch-blue', bg: 'bg-blue-50' },
      { id: 'for_trades', name: 'For Tradespeople', icon: FileText, color: 'text-success', bg: 'bg-success/5' },
      { id: 'for_employers', name: 'For Employers', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 'safety', name: 'Safety & Trust', icon: ShieldAlert, color: 'text-coral', bg: 'bg-coral/5' },
      { id: 'payments', name: 'Financial Integrity', icon: Info, color: 'text-indigo-700', bg: 'bg-indigo-50' }
   ];

   useEffect(() => {
      fetchArticles();
   }, []);

   useEffect(() => {
      if (slug) {
         fetchArticle(slug);
      } else {
         setActiveArticle(null);
      }
   }, [slug]);

   const fetchArticles = async () => {
      try {
         const res = await api.get('/help');
         setArticles(res.data);
      } catch(e) { } finally { setLoading(false); }
   };

   const fetchArticle = async (s: string) => {
      setLoading(true);
      try {
         const res = await api.get(`/help/${s}`);
         setActiveArticle(res.data);
      } catch(e) { } finally { setLoading(false); }
   };

   const filteredArticles = articles.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (slug && activeArticle) {
      return (
         <div className="max-w-4xl mx-auto px-6 py-12 lg:py-20">
            <SEO title={`${activeArticle.title} | Vouch Help`} description={activeArticle.title} />
            
            <Link to="/help" className="inline-flex items-center gap-2 text-vouch-blue text-[10px] font-black uppercase tracking-widest mb-10 group">
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Knowledge Base
            </Link>
            
            <motion.article 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-blue-900/5 border border-gray-100"
            >
               <span className="text-[10px] font-black text-vouch-blue uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-xl mb-6 inline-block border border-blue-100">
                  {categories.find(c => c.id === activeArticle.category)?.name}
               </span>
               <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-10 tracking-tighter leading-tight">{activeArticle.title}</h1>
               
               <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed space-y-8 font-medium">
                  <div dangerouslySetInnerHTML={{ __html: activeArticle.content }} />
               </div>

               <div className="mt-20 pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8">
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Global Feedback Loop: Was this article helpful?</p>
                  <div className="flex gap-4">
                     <button className="flex items-center gap-3 px-8 h-14 rounded-2xl bg-success/5 text-success font-black uppercase text-[10px] tracking-widest hover:bg-success hover:text-white transition-all border border-success/10">
                        <ThumbsUp size={18} /> Valid Signature
                     </button>
                     <button className="flex items-center gap-3 px-8 h-14 rounded-2xl bg-coral/5 text-coral font-black uppercase text-[10px] tracking-widest hover:bg-coral hover:text-white transition-all border border-coral/10">
                        <ThumbsDown size={18} /> Requires Refinement
                     </button>
                  </div>
               </div>
            </motion.article>

            <div className="mt-20 space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Correlated Signals</h3>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Related Wisdom</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.filter(a => a.category === activeArticle.category && a.article_id !== activeArticle.article_id).slice(0, 4).map(a => (
                     <Link key={a.article_id} to={`/help/${a.slug}`} className="bento-card !p-6 hover:border-blue-100 group">
                        <div className="flex justify-between items-center">
                           <span className="font-black text-gray-900 tracking-tight group-hover:text-vouch-blue transition-colors">{a.title}</span>
                           <ArrowRight size={18} className="text-gray-300 group-hover:text-vouch-blue group-hover:translate-x-1 transition-all" />
                        </div>
                     </Link>
                  ))}
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-white min-h-screen">
         <SEO title="Help Center | Vouch Support" description="Knowledge base and guidance for the Vouch ecosystem." />
         
         {/* Hero Header matching screenshot layout */}
         <div className="bg-vouch-blue pt-32 pb-40 px-6 text-center relative overflow-hidden">
            <div className="relative z-10 space-y-10">
               <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter max-w-4xl mx-auto">How can we help?</h1>
               <div className="max-w-3xl mx-auto relative group">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-vouch-blue transition-colors" size={24} />
                  <input 
                     type="text" 
                     placeholder="Search for articles, guides, or FAQs..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full bg-white rounded-[2.5rem] h-20 pl-20 pr-10 text-xl font-medium shadow-2xl focus:outline-none focus:ring-8 focus:ring-white/20 transition-all placeholder:text-gray-300"
                  />
               </div>
            </div>
            
            {/* Decors */}
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-black/5 rounded-full blur-3xl"></div>
         </div>

         <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-32">
            {searchQuery ? (
               <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="max-w-4xl mx-auto"
               >
                  <div className="flex items-center justify-between mb-10">
                     <h2 className="text-3xl font-black text-gray-900 tracking-tight">Signal Analysis: "{searchQuery}"</h2>
                     <button onClick={() => setSearchQuery('')} className="text-[10px] font-black underline uppercase tracking-widest text-gray-400 hover:text-coral">Clear Scan</button>
                  </div>
                  <div className="space-y-4">
                     {filteredArticles.length === 0 ? (
                        <div className="bento-card p-20 text-center space-y-4">
                           <Zap size={48} className="mx-auto text-gray-100" />
                           <p className="font-black text-gray-400 uppercase tracking-widest">No signals detected matching scan parameters.</p>
                        </div>
                     ) : (
                        filteredArticles.map(a => (
                           <Link key={a.article_id} to={`/help/${a.slug}`} className="block bento-card !p-8 hover:border-blue-100 hover:shadow-xl transition-all">
                              <div className="flex items-center justify-between">
                                  <div>
                                     <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{a.title}</h3>
                                     <span className="text-[9px] font-black bg-blue-50 text-vouch-blue px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100">
                                        {categories.find(c => c.id === a.category)?.name}
                                     </span>
                                  </div>
                                  <ArrowRight size={24} className="text-gray-100" />
                              </div>
                           </Link>
                        ))
                     )}
                  </div>
               </motion.div>
            ) : (
               <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-32">
                     {categories.map((cat, idx) => (
                        <motion.div 
                           initial={{ y: 20, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           transition={{ delay: idx * 0.05 }}
                           key={cat.id} 
                           className="space-y-8"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`p-4 ${cat.bg} ${cat.color} rounded-2xl shadow-sm border border-black/5`}>
                                 <cat.icon size={24} />
                              </div>
                              <h2 className="text-2xl font-black text-gray-900 tracking-tight">{cat.name}</h2>
                           </div>
                           <div className="space-y-3">
                              {articles.filter(a => a.category === cat.id).slice(0, 5).map(a => (
                                 <Link key={a.article_id} to={`/help/${a.slug}`} className="flex items-center justify-between p-5 bg-white rounded-2xl hover:bg-vouch-blue hover:text-white shadow-sm border border-gray-50 transition-all group overflow-hidden relative">
                                    <span className="text-sm font-black tracking-tight group-hover:translate-x-1 transition-transform relative z-10">{a.title}</span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-white transition-all relative z-10" />
                                    <div className="absolute inset-0 bg-vouch-blue translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                 </Link>
                              ))}
                              {articles.filter(a => a.category === cat.id).length > 5 && (
                                 <button className="text-[10px] font-black text-vouch-blue uppercase tracking-widest hover:underline pl-6 pt-2">View Full Registry</button>
                                 )}
                           </div>
                        </motion.div>
                     ))}
                  </div>

                  <motion.div 
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="bg-gray-900 rounded-[4rem] p-16 lg:p-24 text-center text-white relative overflow-hidden group shadow-2xl"
                  >
                     <div className="relative z-10 space-y-8">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 rounded-full border border-white/10">
                           <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                           <span className="text-[10px] font-black uppercase tracking-widest">Support Node Active</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter max-w-2xl mx-auto leading-tight">Can't decode your issue?</h2>
                        <p className="text-gray-400 text-lg font-medium max-w-xl mx-auto leading-relaxed">Our system moderators are on standby to resolve complex operational discrepancies. Connect with our core support team for direct resolution.</p>
                        <Link to="/contact" className="inline-flex items-center gap-3 bg-vouch-blue text-white font-black uppercase text-xs tracking-[0.2em] h-16 px-12 rounded-2xl hover:bg-white hover:text-vouch-blue transition-all shadow-2xl shadow-blue-900/40">
                           Initialize Support Uplink <Mail size={18} />
                        </Link>
                     </div>
                     <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-1000 select-none pointer-events-none">
                        <MessageSquare size={400} />
                     </div>
                  </motion.div>
               </>
            )}
         </div>
      </div>
   );
};
