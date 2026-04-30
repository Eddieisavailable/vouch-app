import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ShieldCheck, LogIn, ArrowRight, Zap, CheckCircle, User, Key, X, Mail, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { SplashScreen } from '@/components/SplashScreen';

export const Login: React.FC = () => {
  const [loginMode, setLoginMode] = useState<'username' | 'loginId'>('username');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [forgotView, setForgotView] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', {
        identifier,
        password,
        isLoginId: loginMode === 'loginId'
      });
      
      login(res.data.token, res.data.user);
      setShowSplash(true);
      
      setTimeout(() => {
        if (res.data.user.user_type === 'admin') {
          navigate('/admin');
        } else if (!res.data.user.is_approved) {
          navigate('/waiting');
        } else {
          navigate('/dashboard');
        }
      }, 3000);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error?.includes('deactivated')) {
          navigate('/suspended', { state: { reason: err.response.data.suspension_reason } });
      } else {
          toast.error(err.response?.data?.error || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { username: identifier });
      toast.success("Reset token generated! (See below)");
      setResetToken(res.data.reset_token);
      setResetStep('verify');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, newPassword });
      toast.success("Security key updated! You can now login.");
      setForgotView(false);
      setResetStep('request');
      setPassword(newPassword);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      <SEO title="Login | Vouch Liberia" description="Log in to Vouch - Liberia's most trusted marketplace for verified tradespeople and skilled work." />
      
      {/* Left side: branding & illustration */}
      <div className="hidden lg:flex w-1/2 trust-gradient p-16 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white p-2 rounded-xl shadow-lg">
               <ShieldCheck className="text-vouch-blue" size={32} />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter">Vouch</span>
          </div>
          
          <h1 className="text-6xl font-black text-white leading-tight tracking-tight mb-8">
            The infrastructure <br/> of <span className="text-blue-200 underline decoration-4 underline-offset-8">trust</span> in Liberia.
          </h1>
          
          <div className="space-y-6">
             {[
               "Verified skills you can count on",
               "Secure payments tracked in real-time",
               "Community reputation that matters"
             ].map((text, i) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  key={i} 
                  className="flex items-center gap-4 text-blue-100 text-lg font-medium"
                >
                  <div className="bg-white/10 p-1 rounded-full"><CheckCircle size={20} /></div>
                  {text}
                </motion.div>
             ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <p className="text-white italic text-lg mb-4 font-medium leading-relaxed">
              "Finding quality workers used to be a challenge. With Vouch, I can verify every pro before they step onto the site. It's transformed how we work in Monrovia."
            </p>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center font-bold text-white">JB</div>
               <div>
                  <p className="text-white font-bold text-sm">Jefferson Benson</p>
                  <p className="text-blue-200 text-xs uppercase tracking-widest font-black">Contractor, Montserrado</p>
               </div>
            </div>
        </div>

        <div className="absolute top-1/2 right-10 opacity-5 rotate-12">
           <Zap size={400} />
        </div>
      </div>

      {/* Right side: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!forgotView ? (
            <motion.div 
              key="login"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/5 border border-gray-100"
            >
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                <p className="text-gray-500 font-medium tracking-tight">Access your marketplace dashboard</p>
              </div>

              <div className="flex justify-center mb-10">
                <div className="bg-gray-100 p-1.5 rounded-2xl flex space-x-1 w-full">
                   <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'username' ? 'bg-white shadow-md text-vouch-blue' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setLoginMode('username')}
                   >
                     <User size={14} /> Username
                   </button>
                   <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${loginMode === 'loginId' ? 'bg-white shadow-md text-vouch-blue' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setLoginMode('loginId')}
                   >
                     <ShieldCheck size={14} /> Login ID
                   </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                    {loginMode === 'username' ? 'Your Username' : 'Unique Login ID'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="input-field pr-12"
                      placeholder={loginMode === 'username' ? 'Enter username' : 'e.g. VH4K9M2P'}
                      value={identifier}
                      onChange={(e) => setIdentifier(loginMode === 'loginId' ? e.target.value.toUpperCase() : e.target.value)}
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                      {loginMode === 'username' ? <User size={20} /> : <ShieldCheck size={20} />}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Secret Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      className="input-field pr-12"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Key className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setForgotView(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-vouch-blue hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-gray-200 text-vouch-blue focus:ring-vouch-blue transition-all" />
                     <span className="text-sm font-bold text-gray-600 group-hover:text-vouch-blue">Remember me</span>
                  </label>
                  <Link to="/help" className="text-sm font-bold text-vouch-blue hover:underline">Support</Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary h-16 text-lg"
                >
                  {loading ? 'Verifying...' : (
                    <>
                      Enter Dashboard <LogIn size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                <p className="text-gray-500 font-medium">
                  New to the network? 
                  <Link to="/register" className="text-vouch-blue font-black ml-2 hover:underline inline-flex items-center gap-1">
                    Create Account <ArrowRight size={16} />
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
               key="forgot"
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -20, opacity: 0 }}
               className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/5 border border-gray-100"
            >
               <div className="flex justify-between items-center mb-8">
                  <button onClick={() => setForgotView(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                     <X size={20} className="text-gray-400" />
                  </button>
                  <div className="bg-vouch-blue p-2 rounded-xl text-white shadow-lg shadow-blue-900/20">
                     <ShieldAlert size={20} />
                  </div>
               </div>

               <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Secure Recovery</h2>
                  <p className="text-gray-500 font-medium tracking-tight">Retrieve access to your trust dashboard</p>
               </div>

               {resetStep === 'request' ? (
                  <form onSubmit={handleForgotRequest} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Account Username</label>
                        <div className="relative">
                           <input
                              type="text"
                              required
                              className="input-field pr-12"
                              placeholder="e.g. monrovia_expert"
                              value={identifier}
                              onChange={(e) => setIdentifier(e.target.value)}
                           />
                           <User className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary h-16 text-lg"
                     >
                        {loading ? 'Processing...' : (
                        <>
                           Request Reset <ArrowRight size={20} />
                        </>
                        )}
                     </button>
                  </form>
               ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-6">
                     <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
                        <p className="text-[10px] font-black uppercase text-vouch-blue mb-2 tracking-widest">Demo Reset Token</p>
                        <div className="flex items-center gap-2">
                           <code className="text-xs font-mono bg-white px-3 py-2 rounded-lg border border-blue-200 flex-1">{resetToken}</code>
                        </div>
                        <p className="text-[9px] text-blue-400 mt-2 font-bold uppercase tracking-tight italic">In a real application, this token would be sent to your verified email.</p>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">New Secret Key</label>
                        <div className="relative">
                           <input
                              type="password"
                              required
                              className="input-field pr-12"
                              placeholder="Minimum 8 characters"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                           />
                           <Key className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary h-16 text-lg"
                     >
                        {loading ? 'Updating...' : (
                        <>
                           Set New Password <CheckCircle size={20} />
                        </>
                        )}
                     </button>

                     <button 
                        type="button" 
                        onClick={() => setResetStep('request')}
                        className="w-full text-xs font-black uppercase tracking-widest text-gray-400 hover:text-vouch-blue transition-colors"
                     >
                        Back to Username Request
                     </button>
                  </form>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
