import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Settings, LogOut, User, Zap, ChevronDown, Search, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export const TopHeader: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const fetchNotifs = async () => {
    if (auth.isAuthenticated) {
      try {
        const res = await api.get('/notifications/all');
        setNotifications(res.data.slice(0, 5));
      } catch (err) {}
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [auth.isAuthenticated]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markRead = async (id: string, url: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? {...n, is_read: true} : n));
      navigate(url);
      setShowNotifDropdown(false);
    } catch {}
  };

  const copyNodeId = () => {
    if (auth.user?.unique_login_id) {
      navigator.clipboard.writeText(auth.user.unique_login_id);
      toast.success('Node ID copied!');
    }
  };

  return (
    <header className="h-14 lg:h-20 bg-white border-b border-gray-100 flex items-center justify-center fixed top-0 w-full z-[110] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="w-full max-w-[1440px] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 lg:gap-8 xl:gap-12">
          {/* Sidebar Toggle - LG+ only */}
          <button 
            onClick={onToggleSidebar}
            className="hidden lg:flex w-10 h-10 items-center justify-center text-gray-500 hover:text-vouch-blue hover:bg-blue-50 rounded-xl transition-all group"
            title="Toggle Sidebar"
          >
            <ToggleRight size={26} className="group-hover:scale-110 transition-transform text-vouch-blue" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-vouch-blue rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(30,58,138,0.2)]">
              <Zap size={20} className="lg:hidden" />
              <Zap size={24} className="hidden lg:block" />
            </div>
            <span className="text-xl lg:text-2xl font-black tracking-tighter text-vouch-blue">Vouch</span>
          </Link>

          {/* Horizontal Nav - Desktop only */}
          <nav className="hidden xl:flex items-center gap-1">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-vouch-blue hover:bg-blue-50 rounded-lg transition-colors">Dashboard</Link>
            <Link to={auth.user?.user_type === 'tradesperson' ? "/jobs" : "/my-jobs"} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-vouch-blue hover:bg-blue-50 rounded-lg transition-colors">Jobs</Link>
            <Link to="/messages" className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-vouch-blue hover:bg-blue-50 rounded-lg transition-colors">Messages</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Search Bar - Responsive Implementation */}
          <div className="relative group">
            <div className={`flex items-center bg-gray-50 border transition-all duration-300 rounded-2xl overflow-hidden ${isSearchExpanded ? 'w-64 border-vouch-blue/30 bg-white shadow-sm' : 'w-10 xl:w-80 border-transparent xl:bg-gray-50 xl:border-gray-100'} h-10`}>
              <button 
                onClick={() => setIsSearchExpanded(true)} 
                className={`w-10 flex items-center justify-center shrink-0 ${isSearchExpanded || searchQuery ? 'text-vouch-blue' : 'text-gray-400'}`}
              >
                <Search size={18} />
              </button>
              <input 
                type="text" 
                placeholder="Find jobs, talent, or nodes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                className={`bg-transparent outline-none text-sm placeholder-gray-400 h-full w-full pr-4 ${!isSearchExpanded ? 'hidden xl:block' : 'block'}`}
              />
            </div>
          </div>

          <div className="w-[1px] h-6 bg-gray-200 mx-1 hidden lg:block"></div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-vouch-blue hover:bg-blue-50 rounded-full transition-all relative group"
            >
              <Bell size={20} className="group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowNotifDropdown(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-14 w-[340px] bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-[100]"
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-900">Notifications</span>
                      <Link to="/notifications" onClick={() => setShowNotifDropdown(false)} className="text-xs font-bold text-vouch-blue hover:underline">View All</Link>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <button 
                            key={n.notification_id}
                            onClick={() => markRead(n.notification_id, n.link_url)}
                            className={`w-full p-4 flex items-start gap-4 hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-0 text-left ${!n.is_read ? 'bg-blue-50/20' : ''}`}
                          >
                            <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-vouch-blue' : 'bg-transparent'}`}></div>
                            <div>
                              <p className={`text-sm mb-1 ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

          {/* User Profile Area */}
          <div className="relative">
            {/* Desktop dropdown trigger */}
            <button 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="hidden lg:flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-50 rounded-full transition-all group border border-transparent hover:border-gray-100"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                 {auth.user?.profile_photo_url ? (
                    <img key={auth.user.profile_photo_url} src={auth.user.profile_photo_url} alt={auth.user.username} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-vouch-blue/5 text-vouch-blue font-black text-xs">
                      {auth.user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                    </div>
                 )}
              </div>
              <div className="hidden lg:block text-left mr-1">
                <p className="text-sm font-bold text-gray-900 leading-none">@{auth.user?.username}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Mobile Sidebar trigger */}
            <button 
              onClick={onToggleSidebar}
              className="lg:hidden flex items-center justify-center rounded-3xl transition-all border border-transparent active:scale-95"
            >
              <div className="w-9 h-9 rounded-2xl overflow-hidden bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                 {auth.user?.profile_photo_url ? (
                    <img key={auth.user.profile_photo_url} src={auth.user.profile_photo_url} alt={auth.user.username} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-vouch-blue/5 text-vouch-blue font-black text-sm">
                      {auth.user?.username?.charAt(0).toUpperCase() || <User size={16} />}
                    </div>
                 )}
              </div>
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowUserDropdown(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-14 w-60 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-[100]"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">@{auth.user?.username}</p>
                      <button onClick={copyNodeId} className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 hover:text-vouch-blue group/id transition-colors group">
                        <span className="truncate">ID: {auth.user?.unique_login_id}</span>
                        <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link 
                        to="/profile" 
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-vouch-blue transition-all"
                      >
                        <User size={18} />
                        Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-vouch-blue transition-all"
                      >
                        <Settings size={18} />
                        Settings
                      </Link>
                      <div className="h-[1px] bg-gray-100 mx-2 my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
