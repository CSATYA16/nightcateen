import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, ShoppingBag, User, Trash2 } from 'lucide-react';
import { ordersAPI } from '../../lib/api';

const STATUS_COLOR = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cooking: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  delivered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('nc_read_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const knownOrderIds = useRef(new Set());
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(n => !readIds.has(n._id)).length;

  const fetchOrders = async (isPolling = false) => {
    try {
      const res = await ordersAPI.getAll();
      const orders = res.data.orders || [];

      if (!isPolling) {
        // First load — populate known set without showing as new
        orders.forEach(o => knownOrderIds.current.add(o._id));
        setNotifications(orders);
        setLoading(false);
        return;
      }

      const newOrders = orders.filter(o => !knownOrderIds.current.has(o._id));
      newOrders.forEach(o => knownOrderIds.current.add(o._id));

      if (newOrders.length > 0) {
        setNotifications(prev => [...newOrders, ...prev]);
        // Browser notification if permission granted
        if (Notification.permission === 'granted') {
          newOrders.forEach(o => {
            new Notification(`🛒 New Order: ${o.orderId}`, {
              body: `${o.studentName} placed an order — ₹${o.total}`,
              icon: '/favicon.ico',
            });
          });
        }
      } else {
        setNotifications(orders);
      }
    } catch (err) {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), 8000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n._id));
    setReadIds(allIds);
    localStorage.setItem('nc_read_notifs', JSON.stringify([...allIds]));
  };

  const markRead = (id) => {
    const updated = new Set([...readIds, id]);
    setReadIds(updated);
    localStorage.setItem('nc_read_notifs', JSON.stringify([...updated]));
  };

  const clearAll = () => {
    setNotifications([]);
    setReadIds(new Set());
    localStorage.removeItem('nc_read_notifs');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="text-primary" size={28} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-neutral-400">
              {unreadCount > 0 ? `${unreadCount} new order${unreadCount > 1 ? 's' : ''}` : 'All caught up!'} · Auto-refreshes every 8 seconds
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-xl hover:bg-neutral-700 transition-colors"
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-3">
          <Bell size={48} className="opacity-20" />
          <p className="text-lg">No notifications yet</p>
          <p className="text-sm">New orders will appear here instantly</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {notifications.map((order) => {
              const isUnread = !readIds.has(order._id);
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  onClick={() => markRead(order._id)}
                  className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                    isUnread
                      ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_-8px_rgba(170,59,255,0.4)]'
                      : 'bg-neutral-900/50 border-neutral-800 opacity-70'
                  }`}
                >
                  {isUnread && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{order.orderId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[order.status]}`}>
                          {order.status}
                        </span>
                        {isUnread && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-neutral-400">
                        <User size={13} />
                        <span>{order.studentName}</span>
                        {order.customerEmail && (
                          <span className="text-neutral-600">· {order.customerEmail}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                        <span className="font-semibold text-white">₹{order.total}</span>
                        <span>·</span>
                        <span>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
