import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Briefcase, Building, CheckCircle, ArrowRight, Copy, LogIn, Key, PenTool, Zap } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('tradesperson');
  const [loading, setLoading] = useState(false);
  const [successId, setSuccessId] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username, password, userType
      });
      setSuccessId(res.data.unique_login_id);
      toast.success('Account created successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(successId);
    toast.success('Login ID copied to clipboard');
  };

  const userRoles = [
    { id: 'tradesperson', label: 'Tradesperson', desc: 'Individual skilled professional', icon: PenTool },
    { id: 'agency', label: 'Company / Agency', desc: 'Team of skilled professionals', icon: Building },
    { id: 'employer', label: 'Employer', desc: 'I want to hire verified talent', icon: Briefcase }
  ];

  if (successId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 sm:p-12 font-sans">
        <SEO title="Registration Success | Vouch" description="Your account has been created. Please save your unique Login ID." />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl border border-green-100 text-center"
        >
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Registration Successful!</h2>
          <p className="text-gray-500 font-medium mb-8">Take a screenshot now. This ID is your key to the network.</p>
          
          <div className="bg-gray-50 p-8 rounded-3xl border-2 border-dashed border-gray-100 mb-8 group relative overflow-hidden">
             <div className="text-xs text-gray-400 font-black uppercase tracking-widest mb-3">Your Unique Login ID</div>
             <div className="text-4xl font-mono font-bold text-vouch-blue tracking-tighter select-all">
                {successId}
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <ShieldCheck size={100} />
             </div>
          </div>
          
          <div className="text-left bg-blue-50/50 p-5 rounded-2xl mb-8 border border-blue-100 flex gap-4">
             <div className="bg-vouch-blue/10 p-2 rounded-xl h-fit">
                <Zap size={20} className="text-vouch-blue" />
             </div>
             <p className="text-sm text-blue-900/70 font-medium leading-relaxed">
               You'll need this ID to log in. We don't use emails for your privacy and security. Write it down in a safe place.
             </p>
          </div>
          
          <div className="flex flex-col gap-4">
             <button onClick={copyId} className="w-full btn-secondary h-16">
               <Copy size={20} /> Copy ID to Clipboard
             </button>
             <button onClick={() => navigate('/login')} className="w-full btn-primary h-16">
               Go to Dashboard <LogIn size={20} />
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <SEO title="Create Account | Vouch Liberia" description="Join the infrastructure of trust. Register today as a tradesperson or employer." />
      
      {/* Scrollable Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50 overflow-y-auto">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/5 border border-gray-100 my-10"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-vouch-blue p-1.5 rounded-lg">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <span className="font-black tracking-tight text-gray-900">VOUCH NETWORK</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create Account</h2>
            <p className="text-gray-500 font-medium">No email required. Simple, secure registration.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Preferred name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
               </div>
               <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    placeholder="Create secret key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Confirm Secret Key</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1 block mb-3">Join the network as:</label>
              <div className="flex flex-col gap-3">
                 {userRoles.map(role => (
                   <button
                    key={role.id}
                    type="button"
                    onClick={() => setUserType(role.id)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                      userType === role.id 
                        ? 'border-vouch-blue bg-blue-50 shadow-md ring-4 ring-blue-50' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                   >
                     <div className={`p-3 rounded-xl transition-colors ${userType === role.id ? 'bg-vouch-blue text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'}`}>
                        <role.icon size={22} />
                     </div>
                     <div>
                        <div className={`font-black text-sm tracking-tight ${userType === role.id ? 'text-vouch-blue' : 'text-gray-900'}`}>{role.label}</div>
                        <div className="text-xs font-medium text-gray-400">{role.desc}</div>
                     </div>
                     {userType === role.id && (
                       <div className="ml-auto text-vouch-blue">
                          <CheckCircle size={20} fill="currentColor" className="text-white" />
                       </div>
                     )}
                   </button>
                 ))}
              </div>
            </div>

            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 flex gap-3">
                <ShieldCheck size={20} className="text-yellow-600 shrink-0" />
                <p className="text-[10px] text-yellow-800 font-bold leading-relaxed">
                   By registering, you agree to the Vouch Trust Guidelines. Your username will be public, and you will be issued a unique ID for secure access.
                </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-16 text-lg"
            >
              {loading ? 'Issuing Credentials...' : (
                <>
                  Register & Get ID <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 font-medium">
              Already have an account? 
              <Link to="/login" className="text-vouch-blue font-black ml-2 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side for desktop: branding illustration */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 p-16 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <div className="absolute inset-0 bg-gradient-to-tr from-vouch-blue to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-md mx-auto">
           <div className="mb-12">
              <h1 className="text-5xl font-black text-white leading-tight mb-6">Empowering <br/><span className="text-vouch-blue">Liberian</span> professionals.</h1>
              <p className="text-xl text-gray-400 font-medium">Join thousands of verified plumbers, electricians, and construction experts building the future.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                 <div className="text-2xl font-black text-white mb-1">5,000+</div>
                 <div className="text-xs font-black uppercase tracking-widest text-gray-500">Verified Pros</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                 <div className="text-2xl font-black text-white mb-1">L$2M+</div>
                 <div className="text-xs font-black uppercase tracking-widest text-gray-500">Jobs Paid</div>
              </div>
           </div>
        </div>

        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-vouch-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 left-10 opacity-5 rotate-45">
           <Building size={300} className="text-white" />
        </div>
      </div>
    </div>
  );
};
