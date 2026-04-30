import React, { useEffect, useState, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Upload, X, Image as ImageIcon, Camera, User, ShieldCheck, MapPin, Phone, Mail, FileText, Briefcase, Zap, Star, Globe, ShieldAlert, ArrowRight, CheckCircle } from 'lucide-react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { VerificationDocuments } from '@/components/VerificationDocuments';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { toast } from 'react-hot-toast';

const LIBERIAN_COUNTIES = [
  "Montserrado", "Margibi", "Bomi", "Grand Cape Mount", "Gbarpolu", "Lofa", 
  "Bong", "Nimba", "Grand Gedeh", "River Gee", "Sinoe", "Grand Bassa", 
  "Grand Kru", "Maryland", "River Cess"
];

const COMMON_TRADES = [
  "Electrician", "Plumber", "Carpenter", "Mason", "Painter", "Welder", 
  "Mechanic", "Construction Worker", "Roofer", "Tiler", "General Contractor"
];

export const Profile: React.FC = () => {
  const { auth, updateUser } = useAuth();
  const isProvider = auth.user?.user_type === 'tradesperson' || auth.user?.user_type === 'agency';
  const isAgency = auth.user?.user_type === 'agency';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', county: '', city: '',
    phone_number: '', email: '', bio: '', profile_photo_url: ''
  });

  const [tradesData, setTradesData] = useState({
    trades: [] as string[],
    years_experience: 0,
    service_areas: [] as string[],
    company_name: '',
    portfolio_photos: [] as any[]
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      const p = res.data;
      setFormData({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        county: p.county || '',
        city: p.city || '',
        phone_number: p.phone_number || '',
        email: p.email || '',
        bio: p.bio || '',
        profile_photo_url: p.profile_photo_url || ''
      });
      if ((isProvider) && p.tradesperson) {
        setTradesData({
          trades: p.tradesperson.trades || [],
          years_experience: p.tradesperson.years_experience || 0,
          service_areas: p.tradesperson.service_areas || [],
          company_name: p.tradesperson.company_name || '',
          portfolio_photos: p.tradesperson.portfolio_photos || []
        });
      }
    } catch (err) {
      toast.error("Failed to load identity record");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const savePromise = (async () => {
      await api.put('/users/profile', formData);
      if (isProvider) {
        await api.put('/users/profile/tradesperson', tradesData);
      }
      updateUser(formData);
    })();

    toast.promise(savePromise, {
      loading: 'Syncing profile telemetry...',
      success: 'Identity record updated successfully',
      error: 'Failed to synchronize profile data'
    });

    try {
      await savePromise;
    } catch (err) {} finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (field: 'trades' | 'service_areas', value: string) => {
    setTradesData(prev => {
      const arr = prev[field];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(x => x !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files || e.target.files.length === 0) return;
     const file = e.target.files[0];
     const fd = new FormData();
     fd.append('photo', file);
     setPhotoUploading(true);
     try {
       const res = await api.post('/upload/profile-photo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
       });
       setFormData(prev => ({...prev, profile_photo_url: res.data.url}));
       toast.success("Identity visual updated");
     } catch (err: any) {
        toast.error("Visual upload failed");
     } finally {
        setPhotoUploading(false);
     }
  };

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-32">
      <SEO title="Identity Console | Vouch" description="Manage your professional identity and operational telemetry on the Vouch platform." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-gray-900 rounded-xl text-white shadow-lg shadow-gray-900/20">
                    <User size={20} />
                 </div>
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Node Profile</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Identity Console</h1>
              <p className="text-lg text-gray-500 font-medium">Refine your professional signal and operational parameters.</p>
          </div>
          
          <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-primary h-14 px-10 !rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-900/10 group"
          >
              <Save size={20} className="group-hover:scale-110 transition-transform" /> 
              {saving ? 'Syncing...' : 'Synchronize Identity'}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Profile Card Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bento-card p-10 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="relative group/avatar mb-8">
                 <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl relative">
                    {formData.profile_photo_url ? (
                       <img src={formData.profile_photo_url} alt="You" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-vouch-blue/5 text-vouch-blue flex items-center justify-center font-black text-5xl">
                          {auth.user?.username?.charAt(0).toUpperCase()}
                       </div>
                    )}
                 </div>
                 <button 
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-4 -right-4 h-14 w-14 bg-vouch-blue text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-xl hover:scale-110 transition-all group/cam"
                 >
                    {photoUploading ? <Zap size={24} className="animate-spin" /> : <Camera size={24} className="group-hover/cam:rotate-12 transition-transform" />}
                 </button>
                 <input type="file" accept="image/*" className="hidden" ref={photoInputRef} disabled={photoUploading} onChange={handleAvatarUpload} />
              </div>

              <div className="space-y-4 relative z-10 w-full">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">@{auth.user?.username}</h3>
                    <div className="flex items-center justify-center gap-2">
                       <span className="text-[10px] font-black text-vouch-blue uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 flex items-center gap-1.5 leading-none">
                          <Zap size={10} /> {auth.user?.user_type}
                       </span>
                       {auth.user?.is_verified && (
                          <span className="text-[10px] font-black text-success uppercase tracking-widest bg-success/5 px-3 py-1 rounded-lg border border-success/10 flex items-center gap-1.5 leading-none">
                             <ShieldCheck size={10} /> Verified Node
                          </span>
                       )}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-50 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                       <MapPin size={14} /> {formData.city || 'Sector Unknown'}, {formData.county || 'Territory Pending'}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Login ID: {auth.user?.unique_login_id}</div>
                 </div>
              </div>
              
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <ShieldCheck size={150} />
              </div>
           </div>

           <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                   <h4 className="text-xl font-black tracking-tight">Trust Protocol</h4>
                   <p className="text-gray-400 text-sm font-medium leading-relaxed italic">"Verified identities increase transaction conversion by 340% within the Vouch network."</p>
                   <div className="flex items-center gap-3">
                       <ShieldAlert size={20} className="text-vouch-blue animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-vouch-blue">Security mandate in effect</span>
                   </div>
               </div>
               <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                   <Zap size={150} />
               </div>
           </div>
        </div>

        {/* Main Configuration Zone */}
        <div className="lg:col-span-8 space-y-8">
           <form onSubmit={handleSave} className="space-y-8">
              {/* Basic Info Dock */}
              <div className="bento-card p-10 space-y-8">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-vouch-blue rounded-xl"><FileText size={18} /></div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Primary Identification</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Birth Index (First Name)</label>
                       <input type="text" className="premium-input text-base h-16 rounded-2xl"
                          value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Lineage Index (Last Name)</label>
                       <input type="text" className="premium-input text-base h-16 rounded-2xl"
                          value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Territory (County)</label>
                       <select className="premium-input text-base h-16 rounded-2xl cursor-pointer"
                          value={formData.county} onChange={e => setFormData({...formData, county: e.target.value})}>
                         <option value="">Select a county</option>
                         {LIBERIAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Local Node (City / Community)</label>
                       <input type="text" className="premium-input text-base h-16 rounded-2xl"
                          value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-2 pt-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Biometric Narrative (Bio)</label>
                        <span className="text-[10px] font-black text-vouch-blue">{formData.bio.length}/500</span>
                    </div>
                    <textarea 
                       rows={4} 
                       maxLength={500} 
                       className="premium-input !py-6 text-base rounded-[2rem] resize-none"
                       value={formData.bio} 
                       onChange={e => setFormData({...formData, bio: e.target.value})}
                       placeholder="Define your professional presence..." 
                    />
                 </div>
              </div>

              {/* Contact Relay Dock */}
              <div className="bento-card p-10 space-y-8">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Mail size={18} /></div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Direct Comms Relays</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                          <Phone size={12} /> GSM Number <span className="text-gray-300 italic">(External Channel)</span>
                       </label>
                       <input type="tel" className="premium-input text-base h-16 rounded-2xl"
                          value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                          <Mail size={12} /> Email Uplink <span className="text-gray-300 italic">(System Alerts)</span>
                       </label>
                       <input type="email" className="premium-input text-base h-16 rounded-2xl"
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                 </div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic bg-gray-50 p-4 rounded-xl border border-gray-100 mb-0 leading-relaxed">External contact fields are optional. Expose these only if you want authorized nodes to communicate outside Vouch protocols.</p>
              </div>

              {/* Professional Execution Dock */}
              <AnimatePresence>
              {isProvider && (
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bento-card p-10 space-y-10"
                 >
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-8">
                        <div className="p-2 bg-success/5 text-success rounded-xl"><Briefcase size={18} /></div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Professional Telemetry</h2>
                    </div>
                    
                    {isAgency && (
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Entity Appellation (Company Name)</label>
                         <input type="text" className="premium-input text-base h-16 rounded-2xl"
                           value={tradesData.company_name} onChange={e => setTradesData({...tradesData, company_name: e.target.value})} placeholder="e.g. ABC Engineering Systems" />
                       </div>
                    )}

                    <div className="space-y-6">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary Skill Sectors (Trades)</label>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {COMMON_TRADES.map(trade => (
                            <label key={trade} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${tradesData.trades.includes(trade) ? 'border-vouch-blue bg-blue-50/20 text-vouch-blue' : 'border-gray-50 bg-gray-50/30'}`}>
                              <input type="checkbox" className="hidden"
                                checked={tradesData.trades.includes(trade)}
                                onChange={() => handleCheckboxChange('trades', trade)} />
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tradesData.trades.includes(trade) ? 'border-vouch-blue bg-vouch-blue' : 'border-gray-300'}`}>
                                 {tradesData.trades.includes(trade) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <span className="text-xs font-black uppercase tracking-tight">{trade}</span>
                            </label>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Service Tenure (Years Experience)</label>
                         <input type="number" min="0" className="premium-input text-base h-16 rounded-2xl"
                           value={tradesData.years_experience} onChange={e => setTradesData({...tradesData, years_experience: parseInt(e.target.value) || 0})} />
                       </div>
                    </div>

                    <div className="space-y-6 pt-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Territorial Operational Range (Service Areas)</label>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {LIBERIAN_COUNTIES.map(county => (
                             <label key={county} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${tradesData.service_areas.includes(county) ? 'border-success bg-success/5 text-success' : 'border-gray-50 bg-gray-50/30'}`}>
                               <input type="checkbox" className="hidden"
                                 checked={tradesData.service_areas.includes(county)}
                                 onChange={() => handleCheckboxChange('service_areas', county)} />
                               <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${tradesData.service_areas.includes(county) ? 'border-success bg-success' : 'border-gray-300'}`}>
                                  {tradesData.service_areas.includes(county) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                               </div>
                               <span className="text-xs font-black uppercase tracking-tight">{county}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                    
                    <div className="space-y-8 pt-8 border-t border-gray-50">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Visual Portfolio Index</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archive up to 20 artifacts of verified past execution.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {tradesData.portfolio_photos.map((artifact: any) => (
                          <div key={artifact.public_id} className="relative group rounded-[2rem] overflow-hidden aspect-square border-4 border-white shadow-xl bg-gray-50 flex items-center justify-center">
                            {(!artifact.file_type || artifact.file_type === 'image') ? (
                               <img src={artifact.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Portfolio Artifact" />
                            ) : (
                               <div className="flex flex-col items-center justify-center gap-2 text-vouch-blue p-4 text-center">
                                  <FileText size={48} strokeWidth={1} />
                                  <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Document Artifact</span>
                                  <a href={artifact.url} target="_blank" rel="noreferrer" className="mt-2 px-3 py-1.5 bg-vouch-blue text-white rounded-lg text-[7px] font-black uppercase hover:bg-gray-900 transition-colors">View Source</a>
                               </div>
                            )}
                            <div className="absolute inset-0 bg-coral/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <button 
                                    type="button" 
                                    className="h-12 w-12 bg-white text-coral rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                                    onClick={async () => {
                                      try {
                                        await api.delete(`/upload/portfolio/${artifact.public_id}`);
                                        setTradesData(prev => ({...prev, portfolio_photos: prev.portfolio_photos.filter(p => p.public_id !== artifact.public_id)}));
                                        toast.success("Artifact excised");
                                      } catch (e) { toast.error("Excision failed"); }
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                          </div>
                        ))}
                        
                        {tradesData.portfolio_photos.length < 20 && (
                          <label className="border-4 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-vouch-blue hover:bg-blue-50 transition-all aspect-square group">
                            <div className="p-4 bg-gray-50 text-gray-300 group-hover:bg-vouch-blue group-hover:text-white rounded-2xl transition-all mb-3"><Upload size={24} /></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-vouch-blue text-center px-4 leading-tight">Append Image<br/>or Document</span>
                            <input type="file" multiple accept="image/*, application/pdf, .doc, .docx" className="hidden" onChange={async (e) => {
                               if (!e.target.files?.length) return;
                               const fd = new FormData();
                               Array.from(e.target.files).forEach((f: File) => fd.append('photos', f));
                               const uploadPromise = api.post('/upload/portfolio', fd);
                               toast.promise(uploadPromise, {
                                  loading: 'Buffering artifacts...',
                                  success: 'Portfolio synchronized',
                                  error: 'Sync error'
                               });
                               try {
                                  const res = await uploadPromise;
                                  setTradesData(prev => ({...prev, portfolio_photos: res.data}));
                               } catch (err: any) {}
                            }} />
                          </label>
                        )}
                      </div>
                    </div>
                 </motion.div>
              )}
              </AnimatePresence>

              <div className="flex flex-col sm:flex-row gap-6 pt-10">
                 <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 btn-primary h-20 !rounded-[2.5rem] !bg-gray-900 group shadow-2xl shadow-gray-900/10"
                 >
                   <span className="flex items-center justify-center gap-4 text-sm tracking-[0.1em] font-black uppercase">
                      <Save size={24} /> {saving ? 'Verifying...' : 'Finalize Identity Updates'}
                   </span>
                 </button>
              </div>
           </form>

           {/* Security Documents Zone */}
           <div className="mt-20">
              <div className="flex items-center gap-3 mb-10 pl-2">
                 <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-900/20">
                    <ShieldCheck size={20} />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Verification Protocol</h2>
              </div>
              <div className="bento-card p-0 overflow-hidden">
                  <VerificationDocuments />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
