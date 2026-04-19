import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, ShoppingBag, RefreshCw, CheckCircle } from 'lucide-react';
import { ordersAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';

const STATUS_STEPS = ['pending', 'cooking', 'ready', 'delivered'];

const STATUS_INFO = {
  pending: {
    label: 'Order Received',
    detail: 'Waiting for kitchen to start...',
    color: 'text-accent-yellow',
    bg: 'bg-accent-yellow/10',
    border: 'border-accent-yellow/30',
    step: 0,
  },
  cooking: {
    label: '👨‍🍳 Cooking',
    detail: 'Your food is being prepared!',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    step: 1,
  },
  ready: {
    label: '✅ Ready for Pickup!',
    detail: 'Head to the counter with your OTP.',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/30',
    step: 2,
  },
  delivered: {
    label: '🎉 Delivered',
    detail: 'Order collected successfully!',
    color: 'text-neutral-400',
    bg: 'bg-neutral-800/50',
    border: 'border-neutral-700',
    step: 3,
  },
};

export default function Orders() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevStatusRef = useRef(null);

  const rollNumber = localStorage.getItem('nc_rollNumber');

  const fetchOrder = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      if (!rollNumber) {
        setOrder(null);
        return;
      }
      const res = await ordersAPI.getActive(rollNumber);
      const newOrder = res.data.order;

      // Notify on status change
      if (newOrder && prevStatusRef.current && newOrder.status !== prevStatusRef.current) {
        if (newOrder.status === 'ready') {
          toast('🎉 Your food is READY for pickup! Show your OTP.', 'success', 8000);
        } else if (newOrder.status === 'cooking') {
          toast('👨‍🍳 Kitchen started preparing your order!', 'info', 4000);
        }
      }
      prevStatusRef.current = newOrder?.status;
      setOrder(newOrder);
    } catch {
      toast('Could not fetch order status.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 15 seconds
    const interval = setInterval(() => fetchOrder(true), 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-800">
          <ShoppingBag className="text-neutral-600" size={36} />
        </div>
        <h2 className="text-2xl font-bold font-outfit mb-2 text-white">No Active Orders</h2>
        <p className="text-neutral-400 mb-8 text-sm">
          {rollNumber ? 'No pending orders found for your account.' : 'Log in to track your order.'}
        </p>
        <Link to="/menu" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors text-sm">
          Browse Menu →
        </Link>
      </div>
    );
  }

  const info = STATUS_INFO[order.status] || STATUS_INFO.pending;
  const currentStep = info.step;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-outfit text-white">Active Order</h1>
        <button
          onClick={() => fetchOrder(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-neutral-900/50 border rounded-3xl overflow-hidden shadow-2xl ${
          order.status === 'ready' ? 'border-accent-green/40 glow-border-green' : 'border-neutral-800'
        }`}
      >
        {/* Status Banner */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${info.bg} ${info.border}`}>
          <div className={`font-semibold ${info.color}`}>{info.detail}</div>
          {order.status === 'cooking' && <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
          {order.status === 'ready' && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green" />
            </span>
          )}
          {order.status === 'delivered' && <CheckCircle size={20} className="text-neutral-400" />}
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.slice(0, 4).map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${done ? (active ? 'border-primary bg-primary text-white scale-110' : 'border-accent-green bg-accent-green/20 text-accent-green') : 'border-neutral-700 text-neutral-600'}`}>
                    {done && !active ? '✓' : i + 1}
                  </div>
                  {i < 3 && <div className={`flex-1 h-0.5 mx-1 transition-all ${i < currentStep ? 'bg-accent-green' : 'bg-neutral-800'}`} />}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-neutral-500 font-medium">
            <span>Received</span><span>Cooking</span><span>Ready</span><span>Done</span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {/* OTP Star */}
          <div className="text-center mb-10 pb-10 border-b border-neutral-800/50">
            <p className="text-neutral-500 text-xs mb-3 font-bold uppercase tracking-widest">Pickup Code</p>
            <div className={`font-mono-styled text-7xl font-bold tracking-[0.3em] inline-block py-4 px-6 rounded-2xl border border-white/8 shadow-inner my-2 ${order.status === 'ready' ? 'text-accent-green glow-green bg-accent-green/5' : 'text-white glow-text bg-neutral-950'}`}>
              {order.otp}
            </div>
            <p className="text-neutral-500 text-xs mt-3 max-w-xs mx-auto leading-relaxed">
              Show this 4-digit code at the counter to collect your food. Valid for 45 minutes after ordering.
            </p>
          </div>

          {/* Order Info */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Order #</p>
              <p className="font-mono text-white font-medium">{order.orderId}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Student</p>
              <p className="text-white font-medium text-sm">{order.studentName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Est. Time</p>
              {order.status === 'ready' ? (
                <span className="text-accent-green font-bold flex items-center gap-1">
                  <CheckCircle size={16} /> Ready!
                </span>
              ) : (
                <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium text-white text-sm">{order.estimatedMins} min</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-3">Items Ordered</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-neutral-950/50 rounded-xl p-3 border border-white/5">
                  <span className="text-neutral-500 font-bold bg-neutral-900 w-8 h-8 flex justify-center items-center rounded-lg text-xs shrink-0">{item.quantity}x</span>
                  <span className="text-neutral-200 text-sm">{item.name}</span>
                  <span className="ml-auto text-primary font-medium text-sm">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between">
              <span className="text-neutral-400 text-sm">Total</span>
              <span className="font-bold text-primary">₹{order.total}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live update indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-600">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
        Auto-refreshes every 15 seconds
      </div>
    </div>
  );
}
