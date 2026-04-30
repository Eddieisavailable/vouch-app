import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Shield, TrendingUp, Users, DollarSign, Map, Briefcase, AlertOctagon, Link as LinkIcon, Download, Zap, PieChart, Activity, ShieldCheck, ShieldAlert, ArrowRight, MessageCircle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

export const AdminPanel: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [geo, setGeo] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/overview').then(res => setOverview(res.data)).catch(err => console.error(err)),
      api.get('/admin/analytics/growth').then(res => setGrowth(res.data.users_over_time || [])).catch(err => console.error(err)),
      api.get('/admin/analytics/geographic').then(res => setGeo(res.data.users_by_county || [])).catch(err => console.error(err)),
      api.get('/admin/analytics/trades').then(res => setTrades(res.data || [])).catch(err => console.error(err))
    ]).finally(() => setLoading(false));
  }, []);

  if (loading || !overview) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-gray-100 border-t-vouch-blue rounded-full"></div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
       <SEO title="Admin Command Center | Vouch OPS" description="Global platform oversight, analytics, and operational control for Vouch Liberia." />

       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-gray-900 rounded-xl text-white shadow-lg shadow-gray-900/20">
                    <Shield size={20} />
                 </div>
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Superuser Access</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Command Terminal</h1>
              <p className="text-lg text-gray-500 font-medium">Real-time governance and growth telemetry for the Vouch ecosystem.</p>
          </div>
          
          <div className="flex gap-4">
              <Link to="/admin/verification" className="btn-secondary h-14 px-8 !rounded-2xl flex items-center gap-2 group">
                 <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" /> Verification Queue
              </Link>
          </div>
       </div>

       {/* Top KPIs Bento */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: 'Network Pol', value: overview.total_users, sub: 'Total Users', icon: Users, color: 'text-vouch-blue', bg: 'bg-blue-50' },
            { label: 'Gatekeeper', value: overview.pending_approvals, sub: 'Pending Access', icon: ShieldAlert, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Milestones', value: overview.total_jobs, sub: 'Jobs Posted', icon: Briefcase, color: 'text-success', bg: 'bg-success/5' },
            { label: 'Settlement', value: `L$${Number(overview.total_transaction_volume || 0).toLocaleString()}`, sub: 'Transfers', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Conflicts', value: overview.active_disputes || 0, sub: 'Open Mediations', icon: AlertOctagon, color: 'text-coral', bg: 'bg-coral/5' },
          ].map((kpi, i) => (
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: i * 0.05 }}
               key={i} 
               className="bento-card p-8 flex flex-col justify-between h-44 relative overflow-hidden"
            >
               <div className="flex justify-between items-start">
                  <div className={`p-3 ${kpi.bg} ${kpi.color} rounded-2xl`}>
                     <kpi.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>
               </div>
               <div>
                  <h3 className={`text-3xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{kpi.sub}</p>
               </div>
            </motion.div>
          ))}
       </div>

       {/* Charts Row */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bento-card p-10"
          >
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   <TrendingUp size={24} className="text-vouch-blue"/> Expansion Telemetry
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Registrations</span>
             </div>
             <div className="h-64">
                <Line 
                    options={{ 
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
                    }}
                    data={{
                        labels: growth.map(g => g.date),
                        datasets: [{ 
                           label: 'New Users', 
                           data: growth.map(g => g.new_users), 
                           borderColor: '#2563EB', 
                           backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                           fill: true,
                           tension: 0.4,
                           pointRadius: 4,
                           pointBackgroundColor: '#2563EB'
                        }]
                    }}
                />
             </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bento-card p-10"
          >
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   <PieChart size={24} className="text-success"/> Sector distribution
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jobs by Trade</span>
             </div>
             <div className="h-64">
                <Bar 
                    options={{ 
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
                    }}
                    data={{
                        labels: trades.map(t => t.trade_name),
                        datasets: [{ 
                           label: 'Jobs', 
                           data: trades.map(t => t.jobs_count), 
                           backgroundColor: '#10B981', 
                           borderRadius: 12,
                           hoverBackgroundColor: '#059669'
                        }]
                    }}
                />
             </div>
          </motion.div>
       </div>

       {/* Geo & Admin links */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bento-card p-0 overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   <Map size={24} className="text-gray-400"/> Regional Density
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Counties</span>
             </div>
             <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative pb-2">
                <table className="w-full relative min-w-[350px]">
                  <thead className="bg-gray-50/90 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">Territory</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-vouch-blue transition-colors">Node Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {geo.map(g => (
                       <tr key={g.county} className="hover:bg-white even:bg-gray-50/50 odd:bg-white transition-colors group/row">
                         <td className="px-8 py-5 font-black text-gray-900 text-sm">{g.county}</td>
                         <td className="px-8 py-5 text-right font-black text-vouch-blue">{g.user_count}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
          
          <div className="lg:col-span-4 space-y-6">
             <div className="bento-card p-6 space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Operations Dock</h4>
                
                <Link to="/admin/management?tab=pending" className="flex items-center justify-between p-5 bg-gray-50 text-gray-800 rounded-2xl hover:bg-gray-900 hover:text-white transition-all border border-gray-100 group">
                    <div className="flex items-center gap-4">
                        <ShieldCheck size={20} />
                        <span className="font-black text-sm uppercase tracking-tight">Identity Approvals</span>
                    </div>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link to="/disputes" className="flex items-center justify-between p-5 bg-coral/5 text-coral rounded-2xl hover:bg-coral hover:text-white transition-all border border-coral/10 group">
                    <div className="flex items-center gap-4">
                        <AlertOctagon size={20} />
                        <span className="font-black text-sm uppercase tracking-tight">Active Disputes</span>
                    </div>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link to="/admin/feedback" className="flex items-center justify-between p-5 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 group">
                    <div className="flex items-center gap-4">
                        <MessageCircle size={20} />
                        <span className="font-black text-sm uppercase tracking-tight">User Feedback</span>
                    </div>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <button className="w-full flex items-center justify-between p-5 bg-gray-50 text-gray-800 rounded-2xl hover:bg-gray-900 hover:text-white transition-all border border-gray-100 group">
                   <div className="flex items-center gap-4">
                        <Download size={20} />
                        <span className="font-black text-sm uppercase tracking-tight">Master DB Export</span>
                   </div>
                   <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>

             <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Core 4.0</span>
                  </div>
                  <h4 className="text-xl font-black tracking-tight">Platform Integrity</h4>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Infrastructure health is currently nominal. All service endpoints are operational.</p>
               </div>
               <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                   <Zap size={150} />
               </div>
            </div>
          </div>
       </div>
    </div>
  );
};
