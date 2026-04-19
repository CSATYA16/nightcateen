import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowRight, Clock, ShoppingBag, CheckCircle, Lock } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/Toast';

export default function Cart() {
  const { items, updateQuantity, removeItem, getCartTotal, placeOrder } = useCartStore();
  const { user } = useAuthStore();
  const total = getCartTotal();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const estimatedMins = Math.max(10, items.length * 3 + 10);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      toast('Please login to place your order.', 'warning');
      navigate('/login?redirect=/cart');
      return;
    }
    if (items.length === 0) {
      toast('Your cart is empty!', 'warning');
      return;
    }
    setLoading(true);
    try {
      // Pass user email as the unique tracking ID / Roll Number
      const order = await placeOrder(user.name, user.email);
      setOrderResult(order);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to place order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Order Success Screen ─────────────────────────────────────────────────
  if (orderResult) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900/60 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-accent-green/15 to-transparent border-b border-accent-green/20 px-8 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-accent-green" size={32} />
            </div>
            <h2 className="font-outfit font-bold text-2xl text-white mb-1">Order Placed! 🎉</h2>
            <p className="text-neutral-400 text-sm">Your late-night feast is being prepared.</p>
          </div>

          <div className="p-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Your Pickup Code</p>
            <div className="font-mono-styled text-8xl font-bold tracking-[0.3em] text-white glow-text bg-neutral-950 inline-block py-5 px-6 rounded-2xl border border-white/8 shadow-inner mb-4">
              {orderResult.otp}
            </div>
            <p className="text-neutral-500 text-xs mb-8">Show this code at the counter. Valid for 45 minutes.</p>

            <div className="flex gap-6 justify-center mb-8">
              <div className="text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Order #</p>
                <p className="font-mono font-bold text-white">{orderResult.orderId}</p>
              </div>
              <div className="w-px bg-neutral-800" />
              <div className="text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Est. Time</p>
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-bold text-white">{orderResult.estimatedMins} mins</span>
                </div>
              </div>
              <div className="w-px bg-neutral-800" />
              <div className="text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total</p>
                <p className="font-bold text-primary">₹{orderResult.total}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setOrderResult(null); navigate('/orders'); }}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Track Order Status <ArrowRight size={17} />
              </button>
              <Link to="/menu" className="w-full text-center py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-sm font-medium">
                Order More 🛒
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Empty Cart ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-800">
          <ShoppingBag className="text-neutral-600" size={36} />
        </div>
        <h2 className="text-2xl font-bold font-outfit mb-2 text-white">Your cart is empty</h2>
        <p className="text-neutral-400 mb-8 text-sm">Looks like you haven't added anything to your late-night feast yet.</p>
        <Link to="/menu" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors text-sm">
          Browse Menu <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  // ── Cart View ─────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold font-outfit text-white mb-8">Review Order</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-3">
            <AnimatePresence>
              {items.map((item) => {
                const itemId = item.id || item._id;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={itemId}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800"
                  >
                    <div className="w-14 h-14 bg-neutral-800 rounded-xl flex items-center justify-center text-2xl border border-white/5 shrink-0">
                      {item.image || '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-100 text-sm truncate">{item.name}</h3>
                      <div className="text-primary font-semibold mt-0.5 text-sm">₹{item.price} × {item.quantity} = <span className="text-white">₹{item.price * item.quantity}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                        <button type="button" onClick={() => updateQuantity(itemId, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-40 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center font-medium text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(itemId, item.quantity + 1)} className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeItem(itemId)} className="p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="w-full lg:w-[320px]">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold font-outfit mb-4">Summary</h3>

              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Packaging</span>
                  <span className="text-accent-green text-xs border border-accent-green/20 bg-accent-green/10 px-1.5 py-0.5 rounded">Free</span>
                </div>
                <div className="border-t border-neutral-800 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>

              <div className="mb-5 p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex gap-2.5 text-xs text-neutral-400">
                <Clock size={16} className="text-primary shrink-0 mt-0.5" />
                <span>Est. prep time: <strong className="text-white">~{estimatedMins} mins</strong> based on current queue.</span>
              </div>

              {user ? (
                <div className="mb-5 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Ordering As</span>
                     <CheckCircle size={14} className="text-accent-green" />
                   </div>
                   <p className="text-sm font-semibold text-white">{user.name}</p>
                   <p className="text-xs text-neutral-400 mt-1">{user.email} {user.room ? `• ${user.room}` : ''}</p>
                </div>
              ) : (
                <div className="mb-5 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                  <Lock size={20} className="text-primary mx-auto mb-2" />
                  <p className="text-xs text-primary font-medium">You must be logged in to order</p>
                </div>
              )}

              {user ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-[0_0_30px_-5px_rgba(170,59,255,0.4)] flex justify-center items-center gap-2 disabled:opacity-60 text-sm"
                >
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Placing Order...</>
                  ) : (
                    <>Place Order · ₹{total}</>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/cart')}
                  className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3.5 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 text-sm"
                >
                  <Lock size={16} /> Login to Checkout
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
