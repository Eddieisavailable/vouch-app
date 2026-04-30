import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, CheckCircle, Clock, AlertOctagon, TrendingUp, DollarSign, ArrowRight, Zap, Star, ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export const Dashboard: React.FC = () => {
  const { auth } = useAuth();
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    if (auth.user?.user_type !== 'admin') {
      api.get('/analytics/user-stats').then(res => setStats(res.data)).catch(console.error);
    }
  }, [auth.user?.user_type]);

  if (auth.user?.user_type === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!stats) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded-full"></div>
        </div>
    </div>
  );

  const isEmployer = auth.user?.user_type === 'employer';

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="dashboard-welcome flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-blue-900/10 border-4 border-white shrink-0 hidden md:flex items-center justify-center group hover:scale-105 transition-transform duration-500">
             {auth.user?.profile_photo_url ? (
                <img key={auth.user.profile_photo_url} src={auth.user.profile_photo_url} alt="You" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-vouch-blue/5 text-vouch-blue flex items-center justify-center font-black text-3xl">
                   {auth.user?.username?.charAt(0).toUpperCase()}
                </div>
             )}
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
                Hello, {auth.user?.username.split(' ')[0]} <span className="inline-block animate-bounce-slow">👋</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium">
                {isEmployer ? "You've got projects to manage and talent to find." : "You've got skills to showcase and work to do."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-gray-700">Platform Online</span>
            </div>
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Main CTA Card */}
        <motion.div variants={item} className="md:col-span-8 bento-card trust-gradient p-8 md:p-12 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
                <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                    Featured Opportunity
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                    {isEmployer ? "Find your next verified professional." : "Grow your business with Vouch."}
                </h2>
                <div className="flex flex-wrap gap-4">
                    <Link to={isEmployer ? "/post-job" : "/jobs"} className={`${isEmployer ? 'nav-post-job' : 'nav-find-jobs'} bg-white text-blue-600 font-black px-8 py-4 rounded-2xl hover:bg-black hover:text-white transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2`}>
                        {isEmployer ? 'Post a Project' : 'Browse All Jobs'} <ArrowRight size={18} />
                    </Link>
                    <Link to="/success-stories" className="bg-blue-500/20 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2">
                        <Star size={18} /> Success Stories
                    </Link>
                </div>
            </div>
            
            <div className="absolute top-10 right-10 opacity-10 rotate-12">
                <Zap size={300} />
            </div>
        </motion.div>

        {/* Success Rate Stats */}
        <motion.div variants={item} className="md:col-span-4 bento-card p-8 bg-gray-900 text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
                    <ShieldCheck size={32} />
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Reputation</span>
                    <div className="text-3xl font-black text-blue-400">{stats.success_rate?.toFixed(0) || 0}%</div>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2">Success Rate</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Your professional standing based on verified community feedback.</p>
            </div>
            <div className="mt-6 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.success_rate || 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-blue-500"
                ></motion.div>
            </div>
        </motion.div>

        {/* Small Stats Row */}
        <motion.div variants={item} className="md:col-span-3 bento-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={24}/></div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Total {isEmployer ? 'Postings' : 'Bids'}</p>
                <h3 className="text-3xl font-black text-gray-900">{stats.total_jobs}</h3>
            </div>
        </motion.div>

        <motion.div variants={item} className="md:col-span-3 bento-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Clock size={24}/></div>
                <div className="w-10 h-10 rounded-full border-2 border-yellow-100 flex items-center justify-center text-xs font-bold text-yellow-600">
                    {stats.active_jobs}
                </div>
            </div>
            <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Active Projects</p>
                <h3 className="text-3xl font-black text-gray-900">In Progress</h3>
            </div>
        </motion.div>

        <motion.div variants={item} className="md:col-span-6 bento-card p-6 bg-gray-900 text-white flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-1">{isEmployer ? 'Total Investment' : 'Total Earnings'}</p>
                    <h3 className="text-4xl font-black mb-2">L${isEmployer ? stats.total_spent : stats.total_earnings}</h3>
                    <div className="text-xs font-medium text-blue-400 flex items-center gap-1">
                        <TrendingUp size={14} /> Tracking in real-time
                    </div>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-sm">
                    <DollarSign size={32} className="text-blue-500" />
                </div>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-5 text-white">
                <DollarSign size={200} />
            </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div variants={item} className="md:col-span-7 bento-card p-8">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Activity Trends</h3>
                <div className="flex gap-2 text-gray-400">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Jobs count</span>
                </div>
            </div>
            <div className="h-[250px]">
                <Line 
                    data={{
                        labels: stats.jobs_over_time?.map((d: any) => d.month) || [],
                        datasets: [{ 
                            label: 'Jobs', 
                            data: stats.jobs_over_time?.map((d: any) => d.jobs_count) || [], 
                            borderColor: '#2563eb', 
                            borderWidth: 4,
                            pointBackgroundColor: '#2563eb',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            fill: true, 
                            tension: 0.4 
                        }]
                    }} 
                    options={{ 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }, 
                        scales: { 
                            y: { 
                                beginAtZero: true, 
                                grid: { display: false },
                                ticks: { font: { weight: 'bold' } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { weight: 'bold' } }
                            }
                        } 
                    }}
                />
            </div>
        </motion.div>

        <motion.div variants={item} className="md:col-span-5 bento-card p-8 flex flex-col">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-8">Financial Overview</h3>
            <div className="flex-1 min-h-[200px]">
                <Bar 
                    data={{
                        labels: stats.monthly_earnings_chart?.map((d: any) => d.month) || [],
                        datasets: [{ 
                            label: 'L$', 
                            data: stats.monthly_earnings_chart?.map((d: any) => d.amount) || [], 
                            backgroundColor: '#111827', 
                            borderRadius: 12,
                            hoverBackgroundColor: '#2563eb'
                        }]
                    }} 
                    options={{ 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }, 
                        scales: { 
                            y: { 
                                beginAtZero: true,
                                grid: { display: false },
                                ticks: { display: false }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { weight: 'bold' } }
                            }
                        } 
                    }}
                />
            </div>
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg. per month</p>
                   <p className="text-xl font-black text-gray-900">L${(stats.monthly_earnings_chart?.reduce((acc: any, curr: any) => acc + curr.amount, 0) / (stats.monthly_earnings_chart?.length || 1)).toFixed(0)}</p>
                </div>
                <Link to="/transactions" className="p-3 bg-gray-50 text-gray-900 rounded-2xl hover:bg-black hover:text-white transition-all">
                    <ArrowRight size={20} />
                </Link>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
