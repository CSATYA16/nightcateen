import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Home, Mail, Save, Edit3, CheckCircle, ShoppingBag, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { userAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', room: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setForm({ name: user.name || '', phone: user.phone || '', room: user.room || '' });
    // Sync latest profile from backend
    userAPI.getProfile().then(res => {
      const u = res.data.user;
      setForm({ name: u.name || '', phone: u.phone || '', room: u.room || '' });
      updateProfile({ name: u.name, phone: u.phone, room: u.room });
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast('Name and phone are required', 'warning');
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateProfile(res.data.user);
      setForm({ name: res.data.user.name, phone: res.data.user.phone, room: res.data.user.room });
      setEditing(false);
      toast('Profile updated!', 'success');
    } catch (err) {
      toast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Header card */}
        <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-3xl p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-3">
            <User size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          <p className="text-neutral-400 text-sm mt-1">{user.email}</p>
          {user.room && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1 bg-neutral-800 rounded-full text-neutral-300">
              <Home size={12} /> Room {user.room}
            </span>
          )}
        </div>

        {/* Profile Form */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Personal Details</h2>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                <Edit3 size={15} /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <User size={16} />
                </div>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  disabled={!editing}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>

            {/* Email — readonly */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Mail size={16} />
                </div>
                <input type="email" value={user.email} disabled
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-neutral-500 cursor-not-allowed" />
              </div>
              <p className="text-xs text-neutral-600 mt-1 ml-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                Phone Number <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Phone size={16} />
                </div>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  disabled={!editing} placeholder="e.g. 9876543210"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
              <p className="text-xs text-neutral-600 mt-1 ml-1">Used by canteen to contact you for pickup</p>
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">Room / Hostel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                  <Home size={16} />
                </div>
                <input type="text" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                  disabled={!editing} placeholder="e.g. D-215"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
            </div>

            {editing && (
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 py-3 border border-neutral-700 text-neutral-400 rounded-xl hover:border-neutral-500 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-2">
          <button onClick={() => navigate('/menu')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">
            <ShoppingBag size={18} className="text-primary" /> Go to Menu
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}
