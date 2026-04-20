import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, Check, X, Phone } from 'lucide-react';
import { ordersAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

const FILTERS = ['all', 'pending', 'cooking', 'ready', 'delivered'];

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState(null); // { orderId, _id }
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const MotionDiv = motion.div;

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await ordersAPI.getAll(filter);
      setOrders(res.data.orders || []);
    } catch {
      if (!silent) toast('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const updateStatus = async (order, status) => {
    try {
      await ordersAPI.updateStatus(order._id, status);
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status } : o));
      toast(`Order ${order.orderId} marked as ${status}.`, 'success');
    } catch {
      toast('Failed to update status.', 'error');
    }
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderId}?`)) return;
    try {
      await ordersAPI.cancel(order._id);
      setOrders(prev => prev.filter(o => o._id !== order._id));
      toast(`Order ${order.orderId} cancelled.`, 'info');
    } catch {
      toast('Failed to cancel order.', 'error');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || !otpModal) return;
    setOtpLoading(true);
    try {
      await ordersAPI.verifyOTP(otpModal._id, otpInput);
      setOrders(prev => prev.map(o => o._id === otpModal._id ? { ...o, status: 'delivered', pickedUp: true } : o));
      toast(`✅ OTP verified! Order ${otpModal.orderId} delivered.`, 'success');
      setOtpModal(null);
      setOtpInput('');
    } catch (err) {
      toast(err?.response?.data?.error || 'Invalid OTP. Try again.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const getStatusBadge = (status) => ({
    pending: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
    cooking: 'bg-primary/10 text-primary border-primary/20',
    ready: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    delivered: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    cancelled: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  }[status] || 'bg-neutral-800 text-neutral-400 border-neutral-700');

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? orders.length : orders.filter(o => o.status === f).length;
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Live Orders</h1>
          <p className="text-neutral-500 text-xs">Auto-refreshes every 10 seconds</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter === f ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'}`}
            >
              {f}
              {counts[f] > 0 && <span className={`text-[10px] px-1.5 rounded-full font-bold ${filter === f ? 'bg-black/20' : 'bg-neutral-700 text-neutral-300'}`}>{counts[f]}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-6">
          {orders.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-neutral-600">
              <div className="text-4xl mb-3">👨‍🍳</div>
              <p>No orders match this filter.</p>
            </div>
          ) : orders.map((order, idx) => (
            <MotionDiv
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              key={order._id}
              className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col relative overflow-hidden ${
                order.status === 'ready'
                  ? 'border-accent-green/40 shadow-[0_0_20px_-8px_rgba(74,222,128,0.3)]'
                  : order.status === 'cancelled'
                  ? 'border-accent-red/20 opacity-60'
                  : 'border-neutral-800'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-base font-bold text-white">{order.orderId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getStatusBadge(order.status)}`}>{order.status}</span>
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 flex-wrap">
                    <Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="ml-1 text-neutral-600">· {order.studentName}</span>
                    {order.customerPhone && (
                      <a href={`tel:${order.customerPhone}`}
                        className="ml-1 flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
                        title="Call customer">
                        <Phone size={11} /> {order.customerPhone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-0.5">OTP</div>
                  <div className="font-mono text-xl font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-accent-yellow">{order.otp}</div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 bg-neutral-950/50 rounded-xl p-3 border border-white/5 mb-4">
                <ul className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-neutral-400 bg-neutral-900 w-6 h-6 flex items-center justify-center rounded font-mono shrink-0">{item.quantity}x</span>
                      <span className="text-neutral-200">{item.name}</span>
                      <span className="ml-auto text-primary font-medium">₹{item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 mt-2 border-t border-neutral-800 space-y-1">
                  {order.packingCharges > 0 && (
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>Packing charges</span>
                      <span>+₹{order.packingCharges}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Total</span>
                    <span className="font-bold text-white">₹{order.total}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order, 'cooking')} className="flex-1 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/25 py-2 rounded-xl text-xs font-semibold transition-colors flex justify-center items-center gap-1.5">
                    <ChefHat size={14} /> Start Cooking
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button onClick={() => updateStatus(order, 'ready')} className="flex-1 bg-accent-green/15 hover:bg-accent-green/25 text-accent-green border border-accent-green/25 py-2 rounded-xl text-xs font-semibold transition-colors flex justify-center items-center gap-1.5">
                    <Check size={14} /> Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => { setOtpModal(order); setOtpInput(''); }} className="flex-1 bg-white hover:bg-neutral-200 text-black py-2 rounded-xl text-xs font-bold transition-colors shadow-md">
                    Verify OTP & Deliver
                  </button>
                )}
                {order.status === 'delivered' && (
                  <div className="flex-1 text-center py-2 text-neutral-500 text-xs font-medium">✅ Delivered</div>
                )}
                {!['delivered', 'cancelled'].includes(order.status) && (
                  <button onClick={() => cancelOrder(order)} className="w-9 h-9 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 rounded-xl flex items-center justify-center transition-colors border border-transparent hover:border-red-500/20">
                    <X size={16} />
                  </button>
                )}
              </div>
            </MotionDiv>
          ))}
        </div>
      )}

      {/* OTP Verify Modal */}
      <Modal isOpen={!!otpModal} onClose={() => { setOtpModal(null); setOtpInput(''); }} title="Verify OTP & Deliver" size="sm">
        {otpModal && (
          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-2">Order: <strong className="text-white font-mono">{otpModal.orderId}</strong></p>
            <p className="text-neutral-400 text-sm mb-6">Student: <strong className="text-white">{otpModal.studentName}</strong></p>
            <input
              autoFocus
              type="text"
              maxLength={4}
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
              placeholder="_ _ _ _"
              className="w-full text-center font-mono text-4xl font-bold bg-neutral-950 border border-neutral-800 rounded-2xl py-4 text-white focus:outline-none focus:border-accent-green tracking-[0.4em] placeholder:text-neutral-700"
              onKeyDown={e => { if (e.key === 'Enter') handleVerifyOTP(); }}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={otpInput.length !== 4 || otpLoading}
              className="w-full mt-4 bg-accent-green hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {otpLoading ? <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> : <><Check size={16} /> Confirm Delivery</>}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
