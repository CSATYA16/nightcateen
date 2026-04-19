import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Lock, Phone, Hash, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { toast } from '../components/ui/Toast';

export default function Login() {
  const [activeTab, setActiveTab] = useState('user');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const MotionDiv = motion.div;
  const MotionForm = motion.form;

  const navigate = useNavigate();
  const { login, adminLogin } = useAuthStore();

  // User State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [room, setRoom] = useState('');
  const [password, setPassword] = useState('');

  // Admin State
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const handleUserAuth = (e) => {
    e.preventDefault();
    if (!phone || !password) return;
    if (isSignup && (!name || !room)) return;
    login({
      name: isSignup ? name : phone,
      phone,
      room: isSignup ? room : 'Room',
      role: 'customer'
    });
    localStorage.setItem('nc_rollNumber', phone);
    toast('Welcome to Night Canteen! 🌙', 'success');
    navigate('/menu');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminUser || !adminPass) return;
    setLoading(true);
    try {
      await adminLogin(adminUser, adminPass);
      toast('Admin access granted ✅', 'success');
      navigate('/admin');
    } catch (err) {
      toast('Invalid credentials. Try admin / admin123', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-transparent flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/8 blur-[120px]" />
      </div>

      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10 my-8"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-2xl">
              🌙
            </div>
            <h1 className="text-3xl font-outfit font-bold text-white mb-2">
              {activeTab === 'admin' ? 'Admin Portal' : (isSignup ? 'Create Account' : 'Welcome Back')}
            </h1>
            <p className="text-neutral-400 text-sm">
              {activeTab === 'admin' ? 'Access the management dashboard' : (isSignup ? 'Join the Night Canteen' : 'Sign in to order your late-night feast')}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-neutral-950/50 p-1 rounded-2xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all text-sm ${activeTab === 'user' ? 'bg-neutral-800 text-white shadow-md' : 'text-neutral-500 hover:text-white'}`}
            >
              <User size={16} /> Student
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all text-sm ${activeTab === 'admin' ? 'bg-primary/20 text-primary shadow-md' : 'text-neutral-500 hover:text-white'}`}
            >
              <Shield size={16} /> Admin
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {activeTab === 'user' ? (
              <MotionForm
                key="user-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleUserAuth}
                className="space-y-4"
              >
                <AnimatePresence>
                  {isSignup && (
                    <MotionDiv
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <InputField label="Full Name" icon={<User size={17} />} type="text" value={name} onChange={setName} placeholder="e.g. Arjun Kumar" required={isSignup} />
                    </MotionDiv>
                  )}
                </AnimatePresence>

                <InputField label="Phone / Roll Number" icon={<Phone size={17} />} type="tel" value={phone} onChange={setPhone} placeholder="e.g. 9876543210" required />
                <InputField label="Password" icon={<Lock size={17} />} type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

                <AnimatePresence>
                  {isSignup && (
                    <MotionDiv
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <InputField label="Room Number" icon={<Hash size={17} />} type="text" value={room} onChange={setRoom} placeholder="e.g. D-215" required={isSignup} />
                    </MotionDiv>
                  )}
                </AnimatePresence>

                <button type="submit" className="w-full bg-white text-black hover:bg-neutral-200 mt-6 font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 group text-sm">
                  {isSignup ? <><UserPlus size={17} /> Create Account</> : <><LogIn size={17} /> Login to Order</>}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="text-center mt-5 pt-4 border-t border-neutral-800">
                  <p className="text-sm text-neutral-400">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}
                    <button type="button" onClick={() => setIsSignup(!isSignup)} className="ml-2 text-white font-semibold hover:text-primary transition-colors">
                      {isSignup ? 'Log in' : 'Create one'}
                    </button>
                  </p>
                </div>
              </MotionForm>
            ) : (
              <MotionForm
                key="admin-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleAdminLogin}
                className="space-y-4"
              >
                <InputField label="Admin Username" icon={<Shield size={17} />} type="text" value={adminUser} onChange={setAdminUser} placeholder="Enter admin ID" required />
                <InputField label="Password" icon={<Lock size={17} />} type="password" value={adminPass} onChange={setAdminPass} placeholder="••••••••" required />

                <div className="text-xs text-neutral-400 bg-primary/8 border border-primary/20 p-3.5 rounded-xl mt-2 mb-4">
                  💡 <strong>Demo Mode:</strong> Use <code className="text-primary font-mono bg-neutral-900 px-1 py-0.5 rounded">admin</code> and <code className="text-primary font-mono bg-neutral-900 px-1 py-0.5 rounded">admin123</code>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white mt-4 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(170,59,255,0.4)] flex justify-center items-center gap-2 group disabled:opacity-60 text-sm"
                >
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Authenticating...</>
                  ) : (
                    <>Access Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </MotionForm>
            )}
          </AnimatePresence>
        </div>
      </MotionDiv>
    </div>
  );
}

function InputField({ label, icon, type, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 ml-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
          {icon}
        </div>
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-neutral-600"
        />
      </div>
    </div>
  );
}
