import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Shield, Lock, Mail, Hash, ArrowRight, UserPlus, LogIn, KeyRound } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { toast } from '../components/ui/Toast';
import API_BASE from '../config/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'admin'
  const [isSignup, setIsSignup] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);

  // Extract redirect url (e.g. ?redirect=/cart)
  const redirectParams = new URLSearchParams(location.search);
  const redirectUrl = redirectParams.get('redirect') || '/menu';

  // User State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const [otp, setOtp] = useState('');

  // Admin State
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // ---------- User Flow ----------
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast('Please enter your email address', 'warning');
    if (isSignup && (!name || !room)) return toast('Please fill all fields', 'warning');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if(data.success) {
         setOtpSent(true);
         toast(`OTP Sent! Please check your email inbox.`, 'success');
      } else {
         toast(data.error || 'Failed to send OTP', 'error');
      }
    } catch(err) {
      toast('Network error, could not send OTP. Make sure backend is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast('Please enter the OTP', 'warning');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, isSignup, name, room })
      });
      const data = await res.json();
      if(data.token) {
        login({ name: data.name, email: data.email, phone: data.email, room: data.room, role: 'customer' });
        toast('Logged in successfully!', 'success');
        navigate(redirectUrl);
      } else {
        toast(data.error || 'Invalid OTP', 'error');
      }
    } catch(err) {
      toast('Network error during verification', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Admin Flow ----------
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (!adminUser || !adminPass) return;
    
    if (adminUser === 'admin' && adminPass === 'admin123') {
      login({ name: 'Admin', role: 'admin' });
      navigate('/admin');
    } else {
      toast('Invalid admin credentials. Use admin / admin123', 'error');
    }
  };

  // Switch between signup and login seamlessly
  const toggleSignup = () => {
     setIsSignup(!isSignup);
     setOtpSent(false); // Reset flow if they toggle
  };

  return (
    <div className="min-h-[85vh] bg-transparent flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10 my-8"
      >
        <div className="p-8">
          <div className="text-center mb-8">
             <h1 className="text-3xl font-outfit font-bold text-white mb-2">
                {activeTab === 'admin' ? 'Admin Portal' : (isSignup ? 'Create Account' : 'Welcome Back')}
             </h1>
             <p className="text-neutral-400">
                {activeTab === 'admin' ? 'Access the management dashboard' : (isSignup ? 'Join the Night Canteen' : 'Sign in to order your late-night feast')}
             </p>
          </div>

          <div className="flex bg-neutral-950/50 p-1 rounded-2xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => { setActiveTab('user'); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === 'user' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-500 hover:text-white'}`}
            >
              <User size={18} /> Student
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${activeTab === 'admin' ? 'bg-primary/20 text-primary shadow-md' : 'text-neutral-500 hover:text-white'}`}
            >
              <Shield size={18} /> Admin
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {activeTab === 'user' ? (
              <motion.div 
                key="user-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {!otpSent ? (
                   <form onSubmit={handleSendOtp} className="space-y-4">
                     <AnimatePresence>
                       {isSignup && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="space-y-4 overflow-hidden"
                         >
                           <div>
                             <label className="block text-sm font-medium text-neutral-400 mb-1 ml-1">Full Name</label>
                             <div className="relative">
                               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                                 <User size={18} />
                               </div>
                               <input 
                                 required={isSignup}
                                 type="text" 
                                 value={name}
                                 onChange={(e)=>setName(e.target.value)}
                                 placeholder="e.g. John Doe"
                                 className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                               />
                             </div>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>

                     <div>
                       <label className="block text-sm font-medium text-neutral-400 mb-1 ml-1">Email Address</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                           <Mail size={18} />
                         </div>
                         <input 
                           required
                           type="email" 
                           value={email}
                           onChange={(e)=>setEmail(e.target.value)}
                           placeholder="e.g. yourname@gmail.com"
                           className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                         />
                       </div>
                     </div>

                     <AnimatePresence>
                       {isSignup && (
                         <motion.div
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           exit={{ opacity: 0, height: 0 }}
                           className="space-y-4 pt-1 overflow-hidden"
                         >
                           <div>
                             <label className="block text-sm font-medium text-neutral-400 mb-1 ml-1">Room Number</label>
                             <div className="relative">
                               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                                 <Hash size={18} />
                               </div>
                               <input 
                                 required={isSignup}
                                 type="text" 
                                 value={room}
                                 onChange={(e)=>setRoom(e.target.value)}
                                 placeholder="e.g. D-215"
                                 className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                               />
                             </div>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>

                     <button disabled={loading} type="submit" className="w-full bg-white text-black hover:bg-neutral-200 mt-6 font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 group disabled:opacity-75">
                       {loading ? <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"/> : (
                           <>{isSignup ? <><UserPlus size={18} /> Send OTP</> : <><LogIn size={18} /> Request OTP</>} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                       )}
                     </button>

                     <div className="text-center mt-6 pt-4 border-t border-neutral-800">
                        <p className="text-sm text-neutral-400">
                           {isSignup ? 'Already have an account?' : "Don't have an account?"}
                           <button 
                              type="button"
                              onClick={toggleSignup} 
                              className="ml-2 text-white font-semibold hover:text-primary transition-colors hover:underline"
                           >
                              {isSignup ? 'Log in' : 'Create one'}
                           </button>
                        </p>
                     </div>
                   </form>
                ) : (
                   <form onSubmit={handleVerifyOtp} className="space-y-4">
                     <p className="text-sm text-neutral-400 text-center mb-6">
                        We sent a secure code to <strong className="text-white">{email}</strong>. Enter it below.
                     </p>
                     <div>
                       <label className="block text-sm font-medium text-neutral-400 mb-1 ml-1">Verification Code</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                           <KeyRound size={18} />
                         </div>
                         <input 
                           required
                           type="text" 
                           maxLength={4}
                           value={otp}
                           onChange={(e)=>setOtp(e.target.value)}
                           placeholder="4-digit OTP"
                           className="w-full font-mono text-center tracking-widest text-lg bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-11 text-white focus:outline-none focus:border-primary transition-colors"
                         />
                       </div>
                     </div>

                     <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-primary-hover text-white mt-6 font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 group disabled:opacity-75">
                       {loading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"/> : (
                         <><KeyRound size={18} /> Verify & Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                       )}
                     </button>

                     <div className="text-center mt-4">
                        <button 
                           type="button"
                           onClick={() => setOtpSent(false)} 
                           className="text-sm text-neutral-500 hover:text-white transition-colors hover:underline"
                        >
                           Edit Email Address
                        </button>
                     </div>
                   </form>
                )}
              </motion.div>
            ) : (
              <motion.form 
                key="admin-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleAdminLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1 ml-1">Admin Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <Shield size={18} />
                    </div>
                    <input 
                      required
                      type="text" 
                      value={adminUser}
                      onChange={(e)=>setAdminUser(e.target.value)}
                      placeholder="Enter admin ID"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1 ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                      <Lock size={18} />
                    </div>
                    <input 
                      required
                      type="password" 
                      value={adminPass}
                      onChange={(e)=>setAdminPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="text-xs text-neutral-400 bg-primary/10 border border-primary/20 p-3 rounded-xl mt-2 mb-4">
                  💡 <strong>Demo Mode:</strong> Use <code className="text-primary font-mono bg-neutral-900 px-1 py-0.5 rounded">admin</code> and <code className="text-primary font-mono bg-neutral-900 px-1 py-0.5 rounded">admin123</code>.
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white mt-4 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(170,59,255,0.4)] flex justify-center items-center gap-2 group">
                  Access Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
