import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Heart, MessageSquare, ExternalLink, Trash2, Edit3, Save, X, Bookmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const FavoritesPage: React.FC = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [favoriteJobs, setFavoriteJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [activeTab, setActiveTab] = useState<'pros' | 'jobs'>(auth.user?.user_type === 'employer' ? 'pros' : 'jobs');

    useEffect(() => {
        fetchFavorites();
        fetchFavoriteJobs();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await api.get('/favorites');
            setFavorites(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchFavoriteJobs = async () => {
        try {
            const res = await api.get('/favorites/jobs');
            setFavoriteJobs(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const removeFavoriteJob = async (id: string) => {
        try {
            await api.delete(`/favorites/jobs/${id}`);
            setFavoriteJobs(prev => prev.filter(f => f.favorite_id !== id));
            toast.success("Removed from saved jobs");
        } catch (e) {
            toast.error("Failed to remove saved job");
        }
    };

    const removeFavorite = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this tradesperson from your favorites?")) return;
        try {
            await api.delete(`/favorites/${id}`);
            setFavorites(prev => prev.filter(f => f.favorite_id !== id));
            toast.success("Removed from favorites");
        } catch (e) {
            toast.error("Failed to remove favorite");
        }
    };

    const startEditingNote = (fav: any) => {
        setEditingNote(fav.favorite_id);
        setNoteText(fav.notes || '');
    };

    const saveNote = async (id: string) => {
        try {
            await api.put(`/favorites/${id}/notes`, { notes: noteText });
            setFavorites(prev => prev.map(f => f.favorite_id === id ? { ...f, notes: noteText } : f));
            setEditingNote(null);
            toast.success("Note saved");
        } catch (e) {
            toast.error("Failed to save note");
        }
    };

    const handleHireAgain = (fav: any) => {
        // Pre-fill job posting with this tradesperson
        navigate('/jobs/new', { state: { prefilledTradesperson: fav.favorited_user_id, trade: fav.trades?.[0] } });
    };

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <Heart size={24} fill="currentColor" />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Favorites</h1>
                    <p className="text-gray-500">Your curated list of saved professionals and opportunities.</p>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('pros')}
                    className={`pb-4 px-2 font-bold text-sm tracking-wide transition-colors ${activeTab === 'pros' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Saved Pros ({favorites.length})
                </button>
                <button 
                    onClick={() => setActiveTab('jobs')}
                    className={`pb-4 px-2 font-bold text-sm tracking-wide transition-colors ${activeTab === 'jobs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Saved Jobs ({favoriteJobs.length})
                </button>
            </div>

            {activeTab === 'pros' ? (
                <>
                {favorites.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h2>
                        <p className="text-gray-500 mb-6">Start browsing tradespeople and click the heart icon to save them here.</p>
                        <Link to="/trades" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                            Explore Pros
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {favorites.map((fav, idx) => (
                            <motion.div
                                key={fav.favorite_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                {fav.profile_photo_url ? (
                                                    <img src={fav.profile_photo_url} alt={fav.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400 font-bold text-xl uppercase">
                                                        {fav.username[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{fav.username}</h3>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Star size={14} fill="currentColor" />
                                                    <span className="text-xs font-bold">{Number(fav.overall_rating_avg || 0).toFixed(1)}</span>
                                                    <span className="text-[10px] text-gray-400 font-normal ml-1">Trust: {fav.trust_score}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeFavorite(fav.favorite_id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1">
                                            {fav.trades?.slice(0, 3).map((t: string) => (
                                                <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 relative mb-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Notes</span>
                                            {editingNote !== fav.favorite_id && (
                                                <button onClick={() => startEditingNote(fav)} className="text-gray-400 hover:text-blue-600">
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {editingNote === fav.favorite_id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    autoFocus
                                                    value={noteText}
                                                    onChange={e => setNoteText(e.target.value)}
                                                    className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingNote(null)} className="p-1 px-2 text-[10px] font-bold text-gray-500 hover:bg-gray-200 rounded-md">Cancel</button>
                                                    <button onClick={() => saveNote(fav.favorite_id)} className="p-1 px-2 text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-md">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-600 italic">
                                                {fav.notes || "No notes added yet..."}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 flex gap-2">
                                    <Link 
                                        to={`/user/${fav.favorited_user_id}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                                    >
                                        <ExternalLink size={14} /> View Profile
                                    </Link>
                                    <button 
                                        onClick={() => handleHireAgain(fav)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                                    >
                                        Hire Again
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                )}
                </>
            ) : (
                <>
                {favoriteJobs.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No saved jobs yet</h2>
                        <p className="text-gray-500 mb-6">Browse available opportunities and click the heart icon to save them here.</p>
                        <Link to="/jobs" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                            Find Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {favoriteJobs.map((fav, idx) => (
                                <motion.div
                                    key={fav.favorite_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group"
                                >
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{fav.category_name}</div>
                                            </div>
                                            <button 
                                                onClick={() => removeFavoriteJob(fav.favorite_id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <Link to={`/jobs/${fav.job_id}`} className="text-xl font-black text-gray-900 group-hover:text-blue-600 leading-tight mb-2 block">
                                            {fav.title}
                                        </Link>
                                        <p className="text-xs text-gray-500 font-medium mb-4 line-clamp-2">
                                            {fav.description}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="text-sm font-bold text-gray-700">L${fav.budget_max_lrd.toLocaleString()}</div>
                                            <div className="text-[10px] font-bold text-gray-400">Employer: {fav.username}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                                         <Link 
                                            to={`/jobs/${fav.job_id}`}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
                                         >
                                            <ExternalLink size={14} /> View Description
                                         </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                </>
            )}
        </div>
    );
};
