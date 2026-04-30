import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Star, Quote, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export const SuccessStories: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reviews/featured')
            .then(res => setReviews(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO 
                title="Success Stories | Real Experiences on Vouch" 
                description="Read how Vouch is helping Liberians find trusted tradespeople and building professional reputations through verified reviews."
            />
            
            {/* Hero Section */}
            <section className="bg-blue-600 text-white py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.h1 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
                    >
                        Success Stories
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-blue-100 max-w-2xl mx-auto font-medium"
                    >
                        Real stories from employers and tradespeople building the future of work in Liberia.
                    </motion.p>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 -mt-10">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Quote className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No success stories yet</h3>
                        <p className="text-gray-500">We're just getting started. Your story could be next!</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {reviews.map((review) => (
                            <motion.div 
                                key={review.review_id}
                                variants={item}
                                className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl transition-all group"
                            >
                                <div className="mb-6 flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={20} 
                                            className={`${i < review.overall_rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
                                        />
                                    ))}
                                </div>

                                <div className="flex-1 mb-8">
                                    <Quote className="text-blue-100 group-hover:text-blue-200 transition-colors mb-4" size={40} />
                                    <p className="text-gray-700 text-lg font-medium leading-relaxed italic">
                                        "{review.testimonial_text}"
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Link to={`/user/${review.reviewer_id}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors truncate max-w-[150px]">
                                                    {review.reviewer_username}
                                                </Link>
                                                <ChevronRight size={14} className="text-gray-300" />
                                                <Link to={`/user/${review.reviewee_id}`} className="font-bold text-blue-600 hover:text-blue-800 transition-colors truncate max-w-[150px]">
                                                    {review.reviewee_username}
                                                </Link>
                                            </div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                                                For: {review.job_title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <section className="mt-20 bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                       <Quote size={200} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Create your own success story</h2>
                        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                            Join thousands of Liberians building trust and getting work done through Vouch.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register" className="bg-blue-600 text-white font-bold px-10 py-5 rounded-3xl hover:bg-black transition-all shadow-xl shadow-blue-100 text-lg">
                                Get Started Now
                            </Link>
                            <Link to="/jobs" className="bg-gray-100 text-gray-900 font-bold px-10 py-5 rounded-3xl hover:bg-gray-200 transition-all text-lg">
                                Browse Jobs
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};
