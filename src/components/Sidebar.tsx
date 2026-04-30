import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ToggleLeft, ToggleRight, LogOut, User, Copy, Bell, CheckCircle, Info, MessageSquare, AlertCircle, Settings, Heart, HelpCircle, ChevronRight, Zap, ShieldCheck, LayoutDashboard, Briefcase, DollarSign, Scale, Star, Search, ShieldAlert } from 'lucide-react';
import api from '@/services/api';
import { UserFeedbackModal } from './UserFeedbackModal';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileView?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isMobileView }) => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onToggle) onToggle();
  };

  const userType = auth.user?.user_type;
  const effectiveCollapsed = isCollapsed && !isMobileView;

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: true },
    { label: 'My Jobs', path: '/my-jobs', icon: Briefcase, show: userType === 'employer' },
    { label: 'Find Jobs', path: '/jobs', icon: Search, show: userType === 'tradesperson' },
    { label: 'My Bids', path: '/my-bids', icon: Zap, show: userType === 'tradesperson' },
    { label: 'Payments', path: '/transactions', icon: DollarSign, show: userType !== 'admin' },
    { label: 'Disputes', path: '/disputes', icon: Scale, show: userType !== 'admin' },
    { label: 'Favorites', path: '/favorites', icon: Heart, show: userType === 'employer' },
    { label: 'Messages', path: '/messages', icon: MessageSquare, show: true },
    { label: 'Success Stories', path: '/success-stories', icon: Star, show: true },
    { label: 'Help Center', path: '/help', icon: HelpCircle, show: true },
  ];

  const adminLinks = [
    { label: 'Admin Command', path: '/admin', icon: ShieldCheck, show: userType === 'admin' },
    { label: 'Verification Queue', path: '/admin/verification', icon: ShieldAlert, show: userType === 'admin' },
    { label: 'Community Feedback', path: '/admin/feedback', icon: MessageSquare, show: userType === 'admin' },
  ];

  const hiddenClass = isMobileView ? 'block' : 'hidden xl:block';
  return (
    <aside className={`${isMobileView ? 'flex flex-col w-full min-h-full pb-4' : 'fixed left-0 top-0 h-screen hidden lg:flex flex-col z-[100]'} ${effectiveCollapsed && !isMobileView ? 'w-[72px]' : isMobileView ? '' : 'w-[72px] xl:w-[240px]'} bg-white border-r border-gray-100 shadow-xl shadow-gray-200/50 transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`p-4 ${effectiveCollapsed || isMobileView ? '' : 'xl:p-8 xl:pb-10'} flex items-center justify-center ${effectiveCollapsed || isMobileView ? '' : 'xl:justify-between'}`}>
        {!isMobileView && (
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vouch-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20 shrink-0">
              <Zap size={24} />
            </div>
            {!effectiveCollapsed && <span className={`${hiddenClass} text-2xl font-black tracking-tighter text-vouch-blue`}>Vouch</span>}
          </Link>
        )}
        {!effectiveCollapsed && !isMobileView && (
          <button 
            onClick={onToggle}
            className="hidden xl:flex w-8 h-8 items-center justify-center bg-gray-50 text-gray-400 rounded-lg hover:bg-vouch-blue hover:text-white transition-all shadow-sm border border-gray-100"
          >
            <ToggleRight size={20} className="text-vouch-blue" />
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className={`flex-1 overflow-y-auto ${effectiveCollapsed ? 'px-2' : 'px-4 xl:px-6'} space-y-6 xl:space-y-10 hide-scrollbar scroll-smooth`}>
        
        {/* Core Ops Section */}
        <div className="space-y-2 xl:space-y-4">
           {!effectiveCollapsed && <span className={`${hiddenClass} text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 pl-4`}>Core Platform</span>}
           <nav className="space-y-1">
              {navLinks.filter(l => l.show).map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  title={link.label}
                  className={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')} flex items-center justify-center ${effectiveCollapsed ? '' : 'xl:justify-between'} p-3 xl:p-4 rounded-2xl transition-all duration-200 group ${location.pathname === link.path ? 'bg-vouch-blue text-white shadow-xl shadow-blue-900/20 border-l-4 border-vouch-blue' : 'text-gray-500 hover:bg-blue-50/80 hover:text-vouch-blue border-l-4 border-transparent'}`}
                >
                  <div className="flex items-center gap-4">
                    <link.icon size={20} className={location.pathname === link.path ? 'text-white' : 'text-gray-400 group-hover:text-vouch-blue transition-colors'} />
                    {!effectiveCollapsed && <span className={`${hiddenClass} text-sm font-black uppercase tracking-tight`}>{link.label}</span>}
                  </div>
                  {!effectiveCollapsed && location.pathname === link.path && (
                     <div className={`${hiddenClass} w-1.5 h-1.5 bg-white rounded-full`}></div>
                  )}
                </Link>
              ))}
           </nav>
        </div>

        {/* Governance Section */}
        {userType === 'admin' && (
           <div className="space-y-2 xl:space-y-4">
              {!effectiveCollapsed && <span className={`${hiddenClass} text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 pl-4`}>Governance</span>}
              <nav className="space-y-1">
                 {adminLinks.map((link) => (
                   <Link 
                     key={link.path} 
                     to={link.path}
                     title={link.label}
                     className={`flex items-center justify-center ${effectiveCollapsed ? '' : 'xl:justify-between'} p-3 xl:p-4 rounded-2xl transition-all duration-200 group ${location.pathname === link.path ? 'bg-vouch-blue text-white shadow-xl shadow-blue-900/20 border-l-4 border-vouch-blue' : 'text-gray-500 hover:bg-blue-50/80 hover:text-vouch-blue border-l-4 border-transparent'}`}
                   >
                     <div className="flex items-center gap-4">
                       <link.icon size={20} className={location.pathname === link.path ? 'text-white' : 'text-gray-400 group-hover:text-vouch-blue transition-colors'} />
                       {!effectiveCollapsed && <span className={`${hiddenClass} text-sm font-black uppercase tracking-tight`}>{link.label}</span>}
                     </div>
                   </Link>
                 ))}
              </nav>
           </div>
        )}

        {/* Global Docks */}
        <div className="space-y-2 xl:space-y-4">
           {!effectiveCollapsed && <span className={`${hiddenClass} text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 pl-4`}>System Docks</span>}
           <div className="space-y-2">
              <button 
                onClick={() => setShowFeedbackModal(true)}
                title="Signal Feedback"
                className={`w-full flex items-center justify-center ${effectiveCollapsed ? '' : 'xl:justify-start'} gap-4 p-3 xl:p-4 rounded-2xl text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all group border border-transparent hover:border-indigo-100`}
              >
                <MessageSquare size={20} className="text-gray-300 group-hover:text-indigo-600 shrink-0" />
                {!effectiveCollapsed && <span className={`${hiddenClass} text-sm font-black uppercase tracking-tight`}>Signal Feedback</span>}
              </button>
           </div>
        </div>
        
        {effectiveCollapsed && !isMobileView && (
          <div className="pt-4 border-t border-gray-50 px-2">
            <button 
              onClick={onToggle}
              title="Expand Sidebar"
              className="w-full flex items-center justify-center p-3 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all border border-transparent"
            >
              <ToggleLeft size={24} />
            </button>
          </div>
        )}
      </div>

      {/* User Footer Deck */}
      <div className={`p-2 ${effectiveCollapsed ? '' : 'xl:p-6'} border-t border-gray-100 bg-gray-50/30`}>
        <div className="flex flex-col gap-2">
          <Link to="/profile" title="Profile" className={`nav-profile ${effectiveCollapsed ? '' : 'xl:bento-card xl:!bg-white xl:p-4 xl:shadow-xl xl:shadow-gray-900/5'} group hover:border-vouch-blue transition-all cursor-pointer block rounded-2xl p-2 hover:bg-white`}>
             <div className={`flex items-center justify-center ${effectiveCollapsed ? '' : 'xl:justify-start'} gap-4`}>
                <div className={`h-10 w-10 ${effectiveCollapsed ? '' : 'xl:h-12 xl:w-12'} rounded-xl bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-gray-400 overflow-hidden shrink-0 border border-white group-hover:scale-105 transition-transform`}>
                   {auth.user?.profile_photo_url ? (
                      <img key={auth.user.profile_photo_url} src={auth.user.profile_photo_url} alt="You" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-vouch-blue/5 text-vouch-blue font-black text-lg">
                        {auth.user?.username?.charAt(0).toUpperCase() || <User size={20} />}
                      </div>
                   )}
                </div>
                {!effectiveCollapsed && (
                  <div className={`${hiddenClass} flex-1 min-w-0`}>
                     <p className="text-sm font-black text-gray-900 truncate tracking-tight">@{auth.user?.username}</p>
                     <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                        v2.1.0
                     </div>
                  </div>
                )}
                {!effectiveCollapsed && <ChevronRight size={16} className={`${hiddenClass} text-gray-300 group-hover:text-vouch-blue transition-colors`} />}
             </div>
          </Link>
          
          <button 
            onClick={handleLogout}
            title="Log Out"
            className={`lg:hidden flex items-center justify-center ${effectiveCollapsed ? '' : 'xl:justify-start'} gap-4 p-3 xl:p-4 rounded-2xl text-coral hover:bg-red-50 transition-all group border border-transparent`}
          >
            <LogOut size={20} className="shrink-0" />
            {!effectiveCollapsed && <span className={`${hiddenClass} text-sm font-black uppercase tracking-tight`}>Log Out</span>}
          </button>
        </div>
        
        {!effectiveCollapsed && (
          <div className={`mt-4 ${hiddenClass} flex items-center justify-center gap-2`}>
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Node Sync: Nominal</span>
          </div>
        )}
      </div>

      <UserFeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
    </aside>
  );
};
