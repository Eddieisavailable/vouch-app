import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Send, User, ChevronRight, Filter, Search, Zap, ShieldCheck, Mail, ArrowRight, Trash2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

export const AdminFeedbackDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [response, setResponse] = useState('');

    useEffect(() => {
        fetchFeedback();
    }, [statusFilter, categoryFilter]);

    const fetchFeedback = async () => {
        try {
            let url = '/admin/feedback';
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (categoryFilter) params.append('category', categoryFilter);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await api.get(url);
            setFeedback(res.data);
        } catch (e) {
            toast.error("Failed to fetch feedback");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, status: string) => {
        try {
            await api.put(`/admin/feedback/${id}`, { status, admin_response: response });
            setFeedback(prev => prev.map(f => f.feedback_id === id ? { ...f, status, admin_response: response } : f));
            setSelectedItem(prev => prev?.feedback_id === id ? { ...prev, status, admin_response: response } : prev);
            toast.success("Feedback updated");
            if (status === 'resolved') setResponse('');
        } catch (e) {
            toast.error("Update failed");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-vouch-blue border-blue-100';
            case 'reviewing': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
            case 'resolved': return 'bg-green-50 text-success border-success/20';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    };

    const getCategoryLabel = (cat: string) => {
        return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            <SEO title="Feedback Terminal | Vouch Admin" description="Monitor and respond to community feedback, bug reports, and feature requests." />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-vouch-blue transition-colors group mb-2"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-900/20">
                                <MessageSquare size={20} />
                            </div>
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest pl-1">Community Insights</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Feedback Registry</h1>
                        <p className="text-lg text-gray-500 font-medium">Review and resolve reports from the Vouch ecosystem pods.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="bg-gray-100 p-1 rounded-2xl flex">
                        <select 
                            value={categoryFilter} 
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            <option value="bug_report">Bugs</option>
                            <option value="feature_request">Features</option>
                            <option value="general_feedback">General</option>
                            <option value="complaint">Complaints</option>
                        </select>
                        <div className="w-[1px] h-4 bg-gray-200 self-center"></div>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="new">New</option>
                            <option value="reviewing">In Review</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* List Side */}
                <div className="lg:col-span-4 space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full animate-spin mx-auto"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing Records...</p>
                        </div>
                    ) : feedback.length === 0 ? (
                        <div className="p-20 text-center space-y-4 bento-card">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mx-auto">
                                <Zap size={32} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching reports</p>
                        </div>
                    ) : (
                        feedback.map((item, idx) => (
                            <motion.div 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                key={item.feedback_id}
                                onClick={() => { setSelectedItem(item); setResponse(item.admin_response || ''); }}
                                className={`bento-card !p-6 group cursor-pointer transition-all border-2 relative overflow-hidden ${
                                    selectedItem?.feedback_id === item.feedback_id 
                                        ? 'border-vouch-blue bg-blue-50/20 shadow-xl shadow-blue-900/5' 
                                        : 'border-transparent hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border ${getStatusStyle(item.status)}`}>
                                        {item.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        {format(new Date(item.created_at), 'MMM d')}
                                    </span>
                                </div>
                                <h3 className={`font-black tracking-tight text-lg mb-1 relative z-10 transition-colors ${selectedItem?.feedback_id === item.feedback_id ? 'text-vouch-blue' : 'text-gray-900'}`}>
                                    {getCategoryLabel(item.category)}
                                </h3>
                                <p className={`text-xs font-medium line-clamp-2 mb-4 relative z-10 ${selectedItem?.feedback_id === item.feedback_id ? 'text-gray-700' : 'text-gray-500'}`}>
                                    {item.message}
                                </p>
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 relative z-10">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[10px] font-black text-vouch-blue shadow-sm">
                                        {item.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">@{item.username}</span>
                                </div>

                                {selectedItem?.feedback_id === item.feedback_id && (
                                     <div className="absolute top-0 right-0 p-1 bg-vouch-blue rounded-bl-xl">
                                         <ShieldCheck size={12} className="text-white" />
                                     </div>
                                )}
                            </motion.div>
                        ))
                    )}
                    </AnimatePresence>
                </div>

                {/* Detail Side */}
                <div className="lg:col-span-8 h-full">
                    <AnimatePresence mode="wait">
                    {selectedItem ? (
                        <motion.div 
                            key={selectedItem.feedback_id}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="bento-card !p-10 space-y-10"
                        >
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-gray-50">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">{getCategoryLabel(selectedItem.category)}</h2>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-vouch-blue"><User size={16} /></div>
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">@{selectedItem.username}</span>
                                        </div>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <Clock size={14} /> {format(new Date(selectedItem.created_at), 'MMMM do, yyyy @ p')}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border ${getStatusStyle(selectedItem.status)} shadow-sm`}>
                                    {selectedItem.status}
                                </div>
                            </div>

                            <div className="space-y-10">
                                <section className="relative">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Community Voice</span>
                                    <div className="bg-gray-50 p-8 rounded-[2.5rem] text-xl font-medium text-gray-900 leading-relaxed italic border border-gray-100 shadow-inner">
                                        "{selectedItem.message}"
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section className="bento-card p-6 !bg-gray-50/50 border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14} /> Origin Metadata</h4>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Referrer Module</p>
                                                <p className="text-xs font-bold text-vouch-blue truncate">{selectedItem.page_url || 'Unknown Internal'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Environment String</p>
                                                <p className="text-[10px] font-bold text-gray-500 line-clamp-1">{selectedItem.user_agent}</p>
                                            </div>
                                        </div>
                                    </section>
                                    <section className="bento-card p-6 !bg-gray-50/50 border-gray-100 flex flex-col justify-center">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={14} /> Lifecycle Log</h4>
                                        <div className="text-xs font-bold text-gray-500 space-y-2">
                                            {selectedItem.status === 'resolved' ? (
                                                <p className="flex items-center gap-2 text-success">
                                                    <CheckCircle size={14} /> Resolved by Ops on {format(new Date(selectedItem.responded_at), 'MMM d')}
                                                </p>
                                            ) : (
                                                <p className="flex items-center gap-2 text-yellow-600 animate-pulse">
                                                    <AlertCircle size={14} /> Awaiting Administrative Verdict
                                                </p>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <section className="pt-10 border-t border-gray-50">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-gray-900 border border-white/20 text-white rounded-xl"><Mail size={18} /></div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Transmission Response</h4>
                                    </div>
                                    <textarea
                                        value={response}
                                        onChange={e => setResponse(e.target.value)}
                                        placeholder="Direct message to be archived as resolution..."
                                        className="w-full h-44 p-8 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] resize-none focus:border-vouch-blue focus:bg-white transition-all text-base font-medium mb-6 shadow-inner outline-none"
                                    />
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {selectedItem.status === 'new' && (
                                            <button 
                                                onClick={() => handleUpdate(selectedItem.feedback_id, 'reviewing')}
                                                className="flex-1 btn-secondary h-16 !rounded-2xl flex items-center justify-center gap-3"
                                            >
                                                <Clock size={20} /> Mark as Reviewed
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleUpdate(selectedItem.feedback_id, 'resolved')}
                                            disabled={!response.trim()}
                                            className="flex-[2] btn-primary h-16 !rounded-2xl !bg-success flex items-center justify-center gap-3 hover:!bg-gray-900 transition-all disabled:opacity-50 shadow-xl shadow-success/10"
                                        >
                                            <ShieldCheck size={20} /> Resolve & Archive
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bento-card border-2 border-dashed border-gray-200 h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center bg-gray-50/50">
                            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-gray-200 mb-6">
                                <MessageSquare size={48} />
                            </div>
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Select a signal from the registry</h3>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mt-2">Historical and incoming community data will appear here for audit.</p>
                        </div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
