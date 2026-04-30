import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { Briefcase, MapPin, DollarSign, Clock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Zap, ShieldCheck, PenTool, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{category_id: number, name: string}[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    trade_category_id: '',
    description: '',
    county: '',
    city: '',
    currency: 'LRD',
    budget_min_lrd: '',
    budget_max_lrd: '',
    urgency_level: 'normal'
  });
  
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState('');

  const LIBERIAN_COUNTIES = [
    'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount', 
    'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland', 
    'Montserrado', 'Nimba', 'Rivercess', 'River Gee', 'Sinoe'
  ];

  useEffect(() => {
    api.get('/jobs/trade-categories').then(res => setCategories(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.budget_min_lrd) >= Number(formData.budget_max_lrd)) {
      toast.error('Minimum budget must be less than maximum budget.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/jobs', {
        ...formData,
        budget_min_lrd: Number(formData.budget_min_lrd),
        budget_max_lrd: Number(formData.budget_max_lrd)
      });
      setSuccessId(res.data.job_id);
      toast.success('Job request submitted!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <SEO title="Success! | Vouch" description="Your job request has been submitted successfully." />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bento-card p-12 text-center"
        >
          <div className="w-24 h-24 bg-success/10 text-success rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Job Request Published!</h2>
          <p className="text-xl text-gray-500 font-medium max-w-lg mx-auto mb-10 leading-relaxed">
            Your request has been broadcast to our verified network of tradespeople. You'll receive notification as soon as biding starts.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-3xl inline-flex items-center gap-3 mb-10 border border-gray-100">
             <span className="text-xs font-black uppercase tracking-widest text-gray-400">Request Track ID</span>
             <span className="text-lg font-mono font-bold text-vouch-blue">{successId}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/my-jobs" className="btn-primary px-10 h-16 w-full sm:w-auto">
               Manage Postings <ArrowRight size={20} />
            </Link>
            <Link to="/dashboard" className="btn-secondary px-10 h-16 w-full sm:w-auto">
               Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <SEO title="Post a Job | Vouch Liberia" description="Hire verified tradespeople in Liberia. Post your project and get quotes today." />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors group mb-4"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-vouch-blue rounded-xl text-white">
                    <ClipboardList size={20} />
                 </div>
                 <span className="text-xs font-black text-vouch-blue uppercase tracking-widest">Employer Terminal</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Publish Job Request</h1>
              <p className="text-lg text-gray-500 font-medium">Broadcast your project to Liberia's most trusted professional network.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
            <motion.form 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onSubmit={handleSubmit} 
                className="bento-card p-10 space-y-10"
            >
                {/* Section 1: Core Detail */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold">01</div>
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Project Specification</h3>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Project Title</label>
                        <input 
                            type="text" 
                            required 
                            maxLength={100} 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="input-field" 
                            placeholder="e.g. Full House Electrical Wiring & Inspection" 
                        />
                        <div className="flex justify-end pr-2">
                            <span className="text-[10px] font-bold text-gray-300 font-mono italic">{formData.title.length}/100</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Primary Trade</label>
                            <select 
                                required 
                                value={formData.trade_category_id} 
                                onChange={e => setFormData({...formData, trade_category_id: e.target.value})} 
                                className="input-field cursor-pointer"
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Timeline Urgency</label>
                            <div 
                                onClick={() => setFormData({...formData, urgency_level: formData.urgency_level === 'urgent' ? 'normal' : 'urgent'})}
                                className={`h-14 px-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                                    formData.urgency_level === 'urgent' 
                                    ? 'border-coral bg-red-50 text-coral shadow-lg shadow-red-100' 
                                    : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                }`}
                            >
                                <span className="text-sm font-bold">{formData.urgency_level === 'urgent' ? 'Immediate / Urgent' : 'Standard Timeline'}</span>
                                <Zap size={18} fill={formData.urgency_level === 'urgent' ? 'currentColor' : 'none'} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Project Scope & Details</label>
                        <textarea 
                            required 
                            maxLength={1000} 
                            rows={6} 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            className="w-full p-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-vouch-blue focus:ring-4 focus:ring-blue-50 transition-all duration-300 placeholder:text-gray-400 font-medium resize-none" 
                            placeholder="Describe the specific work required, site conditions, and any material preferences..."
                        ></textarea>
                         <div className="flex justify-end pr-2">
                            <span className="text-[10px] font-bold text-gray-300 font-mono italic">{formData.description.length}/1000</span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Logistics */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold">02</div>
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Location & Logistics</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">County</label>
                            <select 
                                required 
                                value={formData.county} 
                                onChange={e => setFormData({...formData, county: e.target.value})} 
                                className="input-field cursor-pointer"
                            >
                                <option value="">Select County</option>
                                {LIBERIAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">City / Community</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.city} 
                                onChange={e => setFormData({...formData, city: e.target.value})} 
                                className="input-field" 
                                placeholder="Area name" 
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Financials */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold">03</div>
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Budget & Payment</h3>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 p-4 rounded-2xl mb-4">
                        <ShieldCheck size={18} className="text-vouch-blue shrink-0" />
                        <p className="text-[10px] text-blue-900/70 font-bold uppercase tracking-widest leading-relaxed">
                            Vouch Escrow ensures your funds are only released when the job is completed to your standards.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Currency</label>
                            <select 
                                value={formData.currency} 
                                onChange={e => setFormData({...formData, currency: e.target.value})} 
                                className="input-field cursor-pointer bg-gray-50"
                            >
                                <option value="LRD">LRD (Liberian Dollar)</option>
                                <option value="USD">USD (US Dollar)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Min Budget</label>
                            <input 
                                type="number" 
                                required 
                                min={0} 
                                value={formData.budget_min_lrd} 
                                onChange={e => setFormData({...formData, budget_min_lrd: e.target.value})} 
                                className="input-field" 
                                placeholder="0" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Max Budget</label>
                            <input 
                                type="number" 
                                required 
                                min={0} 
                                value={formData.budget_max_lrd} 
                                onChange={e => setFormData({...formData, budget_max_lrd: e.target.value})} 
                                className="input-field" 
                                placeholder="0" 
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row gap-4">
                   <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 btn-primary h-16 text-lg disabled:opacity-50"
                   >
                     {loading ? 'Processing Request...' : (
                        <>Publish to Network <ArrowRight size={20} /></>
                     )}
                   </button>
                   <button 
                    type="button" 
                    onClick={() => navigate(-1)} 
                    className="btn-secondary h-16 px-10"
                   >
                    Cancel
                   </button>
                </div>
            </motion.form>
        </div>

        {/* Sidebar Info */}
        <aside className="lg:col-span-4 space-y-6 sticky top-24">
            <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h4 className="text-xl font-black mb-4">Post with Confidence</h4>
                    <ul className="space-y-4">
                        {[
                            "Only verified pros can bid on your job",
                            "Review portfolios before hiring",
                            "Vouch Escrow protects your money",
                            "Dispute support included by default"
                        ].map((text, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-400 font-medium">
                                <CheckCircle size={18} className="text-vouch-blue shrink-0 mt-0.5" />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
                <ShieldCheck size={120} className="absolute -bottom-6 -right-6 opacity-5 rotate-12" />
            </div>

            <div className="bento-card p-8 bg-vouch-blue text-white group overflow-hidden">
                <h4 className="text-xl font-black mb-4 relative z-10">Need Assistance?</h4>
                <p className="text-blue-100 text-sm font-medium mb-6 relative z-10 uppercase tracking-widest">Our concierges can help you define your project scope better.</p>
                <Link to="/help" className="inline-flex items-center gap-2 text-sm font-black underline underline-offset-4 hover:text-white transition-colors relative z-10">
                    Visit Help Center <ArrowRight size={16} />
                </Link>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-20 group-hover:scale-110 transition-transform duration-700">
                    <PenTool size={180} />
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
};
