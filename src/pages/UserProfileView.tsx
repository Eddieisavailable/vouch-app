import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Map, Star, PenTool, Image as ImageIcon, Briefcase, Calendar, Heart, MessageSquare, Zap, BadgeCheck, ArrowRight, Share2, Award, Clock, ArrowLeft } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

export const UserProfileView: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id || id === 'undefined' || id === 'null') {
       setLoading(false);
       return;
    }
    try {
      const pRes = await api.get(`/users/${id}/public`);
      setProfile(pRes.data);
      const rRes = await api.get(`/reviews/user/${id}`);
      setReviews(rRes.data);

      if (auth.isAuthenticated) {
         const favsRes = await api.get('/favorites');
         const fav = favsRes.data.find((f: any) => f.favorited_user_id === id);
         if (fav) {
            setIsFavorited(true);
            setFavoriteId(fav.favorite_id);
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
     if (!auth.isAuthenticated) return toast.error("Please login to save favorites");
     try {
        if (isFavorited && favoriteId) {
           await api.delete(`/favorites/${favoriteId}`);
           setIsFavorited(false);
           setFavoriteId(null);
           toast.success("Removed from favorites");
        } else {
           const res = await api.post('/favorites', { favorited_user_id: id });
           setIsFavorited(true);
           setFavoriteId(res.data.favorite_id);
           toast.success("Added to favorites!");
        }
     } catch(e) {
        toast.error("Action failed");
     }
  };

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-4"></div>
              <div className="h-4 w-48 bg-gray-100 rounded-full"></div>
          </div>
      </div>
  );
  
  if (!profile) return (
    <div className="max-w-7xl mx-auto py-20 text-center">
        <h2 className="text-3xl font-black text-gray-900">Profile Not Found</h2>
        <p className="text-gray-500 mt-2">The user you are looking for does not exist or has been removed.</p>
        <Link to="/dashboard" className="btn-primary mt-8 inline-flex">Return to Network</Link>
    </div>
  );

  const trustScore = profile.trust_score || 0;
  const isExcellent = trustScore >= 80;

  const portfolio = Array.isArray(profile.tradesperson?.portfolio_photos) 
    ? profile.tradesperson.portfolio_photos 
    : (typeof profile.tradesperson?.portfolio_photos === 'string' ? JSON.parse(profile.tradesperson.portfolio_photos) : []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
       <SEO title={`${profile.username} | Vouch Profile`} description={`View the professional profile of ${profile.username} on Vouch. Verified trade services in Liberia.`} />

       <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors group mb-2"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

       {/* Elite Cover & Profile Header Area */}
       <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 shadow-2xl shadow-blue-900/5">
          {/* Visual Header Accent */}
          <div className="h-48 md:h-64 trust-gradient relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 flex flex-wrap gap-10 p-10 rotate-12">
                {[...Array(6)].map((_, i) => <Zap key={i} size={150} />)}
             </div>
             <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          
          <div className="px-6 md:px-12 pb-12 -mt-16 md:-mt-24 relative z-10 flex flex-col md:flex-row items-end gap-8">
              <div className="relative group">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] bg-white p-2 shadow-2xl">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-50 border-4 border-white relative group">
                        {profile.profile_photo_url ? (
                            <img src={profile.profile_photo_url} className="w-full h-full object-cover" alt={profile.username} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-300 bg-gray-50">
                                {profile.username[0].toUpperCase()}
                            </div>
                        )}
                        {isExcellent && (
                            <div className="absolute top-4 right-4 bg-success text-white p-1.5 rounded-xl shadow-lg animate-bounce-slow">
                                <Award size={20} />
                            </div>
                        )}
                    </div>
                </div>
              </div>

              <div className="flex-1 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
                  <div className="space-y-2 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{profile.username}</h1>
                          <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-success/20">
                             <BadgeCheck size={14} /> Verified Member
                          </div>
                      </div>
                      <p className="text-xl text-gray-500 font-medium tracking-tight">
                         {profile.first_name || profile.last_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.user_type === 'tradesperson' ? 'Professional Tradesman' : 'Vouch Member'} 
                         {profile.county && <span className="text-gray-300 mx-2">•</span>} 
                         {profile.county && <span className="inline-flex items-center text-gray-400 group cursor-default"><MapPin size={16} className="mr-1 group-hover:text-coral transition-colors" /> {profile.city ? `${profile.city}, ` : ''}{profile.county}</span>}
                      </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={toggleFavorite}
                        className={`btn-secondary w-14 h-14 p-0 flex items-center justify-center !rounded-2xl transition-all ${isFavorited ? 'bg-red-50 !text-coral !border-red-100' : ''}`}
                      >
                         <Heart size={24} fill={isFavorited ? "currentColor" : "none"} />
                      </button>
                      <button className="btn-secondary w-14 h-14 p-0 flex items-center justify-center !rounded-2xl">
                         <Share2 size={24} />
                      </button>
                      <Link to={`/messages?user=${profile.username}`} className="btn-primary h-14 px-8 !rounded-2xl">
                         Send Message <MessageSquare size={20} />
                      </Link>
                  </div>
              </div>
          </div>
       </div>

       <motion.div 
         variants={container}
         initial="hidden"
         animate="show"
         className="grid grid-cols-1 lg:grid-cols-12 gap-8"
       >
          {/* Stats Bar Bento */}
          <motion.div variants={item} className="lg:col-span-4 space-y-8">
              <div className="bento-card p-8">
                  <div className="flex justify-between items-start mb-10 text-gray-400">
                    <h3 className="text-xs font-black uppercase tracking-widest">Global Status</h3>
                    <ShieldCheck size={24} className={isExcellent ? 'text-success' : 'text-blue-500'} />
                  </div>
                  
                  <div className="space-y-8">
                      <div className="flex items-end justify-between">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confidence Score</p>
                              <div className="text-5xl font-black text-gray-900 tracking-tighter">{trustScore}%</div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase border ${isExcellent ? 'bg-success/10 text-success border-success/20' : 'bg-blue-50 text-vouch-blue border-blue-100'}`}>
                             {isExcellent ? 'Excellent' : trustScore >= 60 ? 'Trusted' : 'Rising'}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                             <span>Reputation Progress</span>
                             <span>{trustScore}/100</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${trustScore}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full ${isExcellent ? 'bg-success' : 'bg-vouch-blue'}`}
                              />
                          </div>
                      </div>
                  </div>
              </div>

              {profile.user_type === 'tradesperson' && (
                  <div className="bento-card p-8 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-vouch-blue">
                           <Award size={24} />
                        </div>
                        <div>
                           <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience level</div>
                           <div className="text-xl font-black text-gray-900">{profile.tradesperson?.years_experience} Years Verified</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Primary Specialties</div>
                        <div className="flex flex-wrap gap-2">
                            {profile.tradesperson?.trades?.map((t: string) => (
                                <span key={t} className="bg-white border-2 border-gray-100 text-gray-700 px-4 py-2 rounded-2xl text-xs font-bold hover:border-vouch-blue hover:text-vouch-blue transition-all cursor-default">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="p-2 bg-gray-50 rounded-xl text-gray-400"><Map size={18} /></div>
                           <span className="text-xs font-bold text-gray-500 uppercase">Covers {profile.tradesperson?.service_areas?.length || 0} Counties</span>
                        </div>
                        <div className="flex -space-x-2">
                           {profile.tradesperson?.service_areas?.slice(0,3).map((a: string, i: number) => (
                             <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase" title={a}>
                                {a[0]}
                             </div>
                           ))}
                        </div>
                    </div>
                  </div>
              )}

              <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Member Since</p>
                    <div className="text-2xl font-black mb-6">{new Date(profile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    <Link to="/help" className="text-xs font-bold text-blue-400 flex items-center gap-1 hover:text-white transition-colors">
                        Learn about verification <ArrowRight size={14} />
                    </Link>
                  </div>
                  <Calendar size={120} className="absolute -bottom-8 -right-8 opacity-5 text-white group-hover:scale-110 transition-transform duration-500" />
              </div>
          </motion.div>

          <motion.div variants={item} className="lg:col-span-8 space-y-8">
              {/* About Section */}
              <div className="bento-card p-10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-vouch-blue rounded-full"></div>
                    The Professional Story
                  </h3>
                  <p className="text-xl text-gray-700 font-medium leading-relaxed mb-10 whitespace-pre-wrap">
                      {profile.bio || "This user prefers to let their work speak for itself. No bio provided yet, but their verified status ensures professional standards."}
                  </p>
                  
                  {profile.user_type === 'tradesperson' && portfolio.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm flex items-center gap-2">
                                <ImageIcon size={18} className="text-gray-400" />
                                Project Gallery
                            </h4>
                            <span className="text-xs font-bold text-gray-400">{portfolio.length} High-Res Shoots</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {portfolio.map((img: any, idx: number) => (
                                <motion.div 
                                  whileHover={{ scale: 1.02 }}
                                  key={idx} 
                                  onClick={() => setLightboxImg(img.url)} 
                                  className="aspect-square rounded-3xl bg-gray-50 overflow-hidden cursor-pointer group relative shadow-sm"
                                >
                                    <img src={img.url} alt="Portfolio" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <Zap size={20} className="text-white" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                      </div>
                  )}
              </div>

              {/* Reputation & Ratings */}
              <div className="bento-card p-10">
                  <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Star size={16} className="text-gray-400" />
                            Community Reputation
                        </h3>
                        <div className="flex items-center gap-6">
                            <div className="text-7xl font-black text-gray-900 tracking-tighter">
                                {Number(profile.overall_rating_avg || 0).toFixed(1)}
                            </div>
                            <div className="space-y-1">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => <Star key={i} size={20} fill={i < Math.round(profile.overall_rating_avg) ? "currentColor" : "none"} className={i < Math.round(profile.overall_rating_avg) ? "" : "text-gray-200"} />)}
                                </div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{profile.total_reviews_count || 0} Verified Reviews</p>
                            </div>
                        </div>
                      </div>

                      <div className="flex-1 max-w-sm space-y-4">
                          {[
                            ['Quality', profile.quality_rating_avg],
                            ['Prof.', profile.professionalism_rating_avg],
                            ['Value', profile.value_rating_avg],
                          ].map(([label, val]: [string, any]) => (
                            <div key={label} className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                               <span className="text-gray-500">{label}</span>
                               <div className="flex items-center gap-3">
                                  <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                                      <div className="bg-yellow-400 h-full" style={{ width: `${(Number(val) / 5) * 100}%` }}></div>
                                  </div>
                                  <span className="text-gray-900 w-6 text-right">{Number(val || 0).toFixed(1)}</span>
                               </div>
                            </div>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-6">
                      <AnimatePresence>
                      {reviews.length === 0 ? (
                        <div className="py-16 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                           <Star size={40} className="text-gray-200 mx-auto mb-4" />
                           <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No detailed reviews yet.</p>
                        </div>
                      ) : (
                        reviews.map((r, i) => (
                           <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={r.review_id} 
                            className="p-8 border border-gray-100 rounded-3xl bg-white hover:border-blue-100 hover:shadow-lg transition-all group"
                           >
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-vouch-blue overflow-hidden border-2 border-white shadow-sm shrink-0">
                                        {r.reviewer_profile_photo_url ? (
                                            <img src={r.reviewer_profile_photo_url} alt={r.reviewer_username} className="w-full h-full object-cover" />
                                        ) : (
                                            r.reviewer_username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900 tracking-tight">{r.reviewer_username}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={10} /> {new Date(r.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                 </div>
                                 <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.overall_rating ? "currentColor" : "none"} className={i < r.overall_rating ? "" : "text-gray-200"} />)}
                                 </div>
                              </div>
                              <p className="text-gray-600 font-medium leading-relaxed italic pr-12">
                                 "{r.testimonial_text}"
                              </p>
                              {r.is_featured && (
                                  <div className="mt-4 inline-flex items-center gap-1.5 bg-blue-50 text-vouch-blue py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                      <Star size={10} fill="currentColor" /> Featured Testimonial
                                  </div>
                              )}
                           </motion.div>
                        ))
                      )}
                      </AnimatePresence>
                  </div>
              </div>
          </motion.div>
       </motion.div>

       <AnimatePresence>
       {lightboxImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 backdrop-blur-md" 
            onClick={() => setLightboxImg(null)}
          >
             <motion.img 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={lightboxImg} 
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
                alt="Lightbox View" 
             />
             <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-2xl">
                <ArrowRight className="rotate-[225deg]" />
             </button>
          </motion.div>
       )}
       </AnimatePresence>
    </div>
  );
};
