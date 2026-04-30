import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { WaitingPage } from './pages/WaitingPage';
import { SuspendedPage } from './pages/SuspendedPage';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { AdminManagement } from './pages/AdminManagement';
import { SettingsPage } from './pages/SettingsPage';
import { AdminVerificationQueue } from './pages/AdminVerificationQueue';
import { Profile } from './pages/Profile';
import { PostJob } from './pages/PostJob';
import { MyJobs } from './pages/MyJobs';
import { FindJobs } from './pages/FindJobs';
import { JobDetail } from './pages/JobDetail';
import { MyBids } from './pages/MyBids';
import { JobBids } from './pages/JobBids';
import { Messages } from './pages/Messages';
import { UserProfileView } from './pages/UserProfileView';
import { NotificationsPage } from './pages/NotificationsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { DisputesPage } from './pages/DisputesPage';
import { DisputeDetailPage } from './pages/DisputeDetailPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HelpCenter } from './pages/HelpCenter';
import { LeaderboardPage } from './pages/Leaderboard';
import { TradesLandingPage } from './pages/TradesLandingPage';
import { AdminFeedbackDashboard } from './pages/AdminFeedbackDashboard';
import { SuccessStories } from './pages/SuccessStories';
import { AboutPage } from './pages/AboutPage';
import { TermsPage, PrivacyPage } from './pages/LegalPages';
import { OnboardingTour } from './components/OnboardingTour';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence, motion } from 'framer-motion';

import { Home, Briefcase, MessageSquare, User, X } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

function LayoutWrapper({ children, hideSidebar = false }: { children: React.ReactNode, hideSidebar?: boolean }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { auth } = useAuth();

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const bottomNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Jobs', path: auth.user?.user_type === 'tradesperson' ? '/jobs' : '/my-jobs', icon: Briefcase },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-[env(safe-area-inset-bottom)]">
      {!hideSidebar && <TopHeader onToggleSidebar={toggleSidebar} />}
      
      <div className={`flex flex-1 ${!hideSidebar ? 'pt-14 lg:pt-20' : ''}`}>
        {/* Desktop Sidebar */}
        {!hideSidebar && (
          <div className="hidden lg:block">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          </div>
        )}
        
        {/* Mobile Slide-in Drawer */}
        {!hideSidebar && (
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[120] lg:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 right-0 w-[85%] sm:w-[320px] bg-white z-[130] shadow-2xl lg:hidden flex flex-col"
                >
                  <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <span className="text-sm font-black uppercase tracking-widest text-vouch-blue">Menu</span>
                    <button title="Close Menu" onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto w-full relative">
                     {/* We can reuse Sidebar or render mobile links. Let's reuse Sidebar but force it to take full width and handle internal classes */}
                     <div className="w-full relative [&>aside]:static [&>aside]:w-full [&>aside]:h-auto [&>aside]:lg:flex [&>aside]:flex [&>aside]:border-none [&>aside]:shadow-none [&>aside]:min-h-full">
                       <Sidebar isCollapsed={false} onToggle={() => setIsMobileMenuOpen(false)} isMobileView />
                     </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}

<main className={`flex-1 px-4 py-6 md:p-8 xl:p-10 overflow-y-auto max-w-[2560px] mx-auto w-full transition-all duration-300 ${!hideSidebar ? (isSidebarCollapsed ? 'lg:pl-[72px] xl:pl-[72px] pb-[76px] lg:pb-8' : 'lg:pl-[72px] xl:pl-[240px] pb-[76px] lg:pb-8') : ''}`}>
   {children}
</main>
      </div>

      {/* Mobile Bottom Navigation */}
      {!hideSidebar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-[64px] px-2">
            {bottomNavItems.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive ? 'bg-vouch-blue text-white border-t-4 border-vouch-blue' : 'text-gray-500 hover:bg-blue-50/50 hover:text-vouch-blue border-t-4 border-transparent'}`}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-vouch-blue transition-colors'} />
                  <span className={`text-[10px] ${isActive ? 'font-black uppercase tracking-widest' : 'font-bold'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { auth } = useAuth();

  return (
    <>
      <AnimatePresence>
        {auth.isLoading && <SplashScreen />}
      </AnimatePresence>
      <Toaster position="top-right" />
      <OnboardingTour />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - No Sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/suspended" element={<LayoutWrapper hideSidebar><SuspendedPage /></LayoutWrapper>} />
          <Route path="/waiting" element={<ProtectedRoute><LayoutWrapper hideSidebar><WaitingPage /></LayoutWrapper></ProtectedRoute>} />
          
          {/* Protected Routes - With Sidebar */}
          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin={true}>
              <LayoutWrapper>
                <Routes>
                  <Route path="/" element={<AdminPanel />} />
                  <Route path="/management" element={<AdminManagement />} />
                  <Route path="/verification" element={<AdminVerificationQueue />} />
                  <Route path="/feedback" element={<AdminFeedbackDashboard />} />
                </Routes>
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={<ProtectedRoute><LayoutWrapper><Dashboard /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><LayoutWrapper><Profile /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><LayoutWrapper><SettingsPage /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><LayoutWrapper><NotificationsPage /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><LayoutWrapper><TransactionsPage /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><LayoutWrapper><Messages /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><LayoutWrapper><FavoritesPage /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute><LayoutWrapper><PostJob /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/my-jobs" element={<ProtectedRoute><LayoutWrapper><MyJobs /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><LayoutWrapper><FindJobs /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><LayoutWrapper><JobDetail /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/jobs/:jobId/bids" element={<ProtectedRoute><LayoutWrapper><JobBids /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/my-bids" element={<ProtectedRoute><LayoutWrapper><MyBids /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/user/:id" element={<ProtectedRoute><LayoutWrapper><UserProfileView /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/disputes" element={<ProtectedRoute><LayoutWrapper><DisputesPage /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/disputes/:id" element={<ProtectedRoute><LayoutWrapper><DisputeDetailPage /></LayoutWrapper></ProtectedRoute>} />
          <Route path="/leaderboard" element={<LayoutWrapper><LeaderboardPage /></LayoutWrapper>} />
          <Route path="/help/:slug?" element={<LayoutWrapper><HelpCenter /></LayoutWrapper>} />
          <Route path="/trades/:tradeId" element={<LayoutWrapper><TradesLandingPage /></LayoutWrapper>} />
          <Route path="/success-stories" element={<LayoutWrapper><SuccessStories /></LayoutWrapper>} />
          <Route path="/about" element={<LayoutWrapper><AboutPage /></LayoutWrapper>} />
          <Route path="/terms" element={<LayoutWrapper><TermsPage /></LayoutWrapper>} />
          <Route path="/privacy" element={<LayoutWrapper><PrivacyPage /></LayoutWrapper>} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
