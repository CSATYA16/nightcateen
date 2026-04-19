import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, DollarSign, ShoppingBag, Clock, TrendingUp, Trash2, Sparkles, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI, ordersAPI, menuAPI } from '../../lib/api';
import { SkeletonStat } from '../../components/ui/Skeleton';
import { toast } from '../../components/ui/Toast';

export default function Dashboard() {
  const MotionDiv = motion.div;
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [dailyRes, weeklyRes, ordersRes, insightsRes] = await Promise.all([
        analyticsAPI.getDaily(),
        analyticsAPI.getWeekly(),
        ordersAPI.getAll(''),
        analyticsAPI.getAIInsights(),
      ]);
      setStats(dailyRes.data);
      setWeeklyData(weeklyRes.data.weekly || []);
      setRecentOrders((ordersRes.data.orders || []).slice(0, 6));
      setInsights(insightsRes.data.insights || []);
    } catch (err) {
      if (!silent) toast('Could not fetch dashboard data.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('WARNING: Clear ALL orders and analytics data? This cannot be undone.')) {
      toast('Demo mode: Data cleared. (No actual DB changes)', 'info');
    }
  };

  const statCards = stats ? [
    { label: 'Total Orders', value: stats.totalOrders, change: '+Today', icon: ShoppingBag, color: 'text-primary' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, change: 'Today', icon: DollarSign, color: 'text-accent-green' },
    { label: 'Pending / Cooking', value: `${stats.statusBreakdown.pending + stats.statusBreakdown.cooking}`, change: 'Active', icon: Clock, color: 'text-accent-yellow' },
    { label: 'Top Item', value: stats.mostOrdered?.name || 'N/A', desc: stats.mostOrdered ? `${stats.mostOrdered.count} orders` : '', icon: TrendingUp, color: 'text-purple-400' },
  ] : [];

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
      cooking: 'bg-primary/10 text-primary border-primary/20',
      ready: 'bg-accent-green/10 text-accent-green border-accent-green/20',
      delivered: 'bg-neutral-800 text-neutral-400 border-neutral-700',
      cancelled: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    };
    return styles[status] || styles.delivered;
  };

  const insightColors = {
    trending: 'border-accent-yellow/20 bg-accent-yellow/5',
    peak: 'border-blue-500/20 bg-blue-500/5',
    stock: 'border-accent-red/20 bg-accent-red/5',
    revenue: 'border-primary/20 bg-primary/5',
    slow: 'border-neutral-700 bg-neutral-800/30',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Overview</h1>
          <p className="text-neutral-500 text-sm">Night Canteen · Live Dashboard</p>
        </div>
        <button onClick={handleClearData} className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition-all font-medium text-sm border border-red-500/20">
          <Trash2 size={14} /> Clear All Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          statCards.map((stat, idx) => (
            <MotionDiv
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              key={stat.label}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-neutral-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-neutral-950 border border-neutral-800 ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                {stat.change && <span className="text-xs font-medium px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">{stat.change}</span>}
              </div>
              <p className="text-neutral-400 text-xs mb-1 uppercase tracking-wide">{stat.label}</p>
              <h3 className="text-2xl font-bold font-outfit text-white flex items-end gap-2 truncate">
                {stat.value}
                {stat.desc && <span className="text-xs font-normal text-neutral-500 mb-0.5">{stat.desc}</span>}
              </h3>
            </MotionDiv>
          ))
        )}
      </div>

      {/* Status Quick Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Pending', value: stats.statusBreakdown.pending, color: 'text-accent-yellow' },
            { label: 'Cooking', value: stats.statusBreakdown.cooking, color: 'text-primary' },
            { label: 'Ready', value: stats.statusBreakdown.ready, color: 'text-accent-green' },
            { label: 'Delivered', value: stats.statusBreakdown.delivered, color: 'text-neutral-400' },
          ].map(s => (
            <div key={s.label} className="bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-xl text-center">
              <div className={`text-2xl font-bold font-outfit ${s.color}`}>{s.value}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
          <h2 className="text-base font-bold font-outfit mb-6">Revenue Trend (Last 7 Days)</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#aa3bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#404040" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#404040" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#444', strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke="#aa3bff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col">
          <h2 className="text-base font-bold font-outfit mb-4">Quick Actions</h2>
          <div className="space-y-3 flex-1">
            <QuickAction label="Add Menu Item" color="primary" onClick={() => navigate('/admin/menu')} />
            <QuickAction label="Setup Flash Deal" color="green" onClick={() => navigate('/admin/deals')} />
            <QuickAction label="View Live Orders" color="yellow" onClick={() => navigate('/admin/orders')} />
            <QuickAction label="Stock Overview" color="blue" onClick={() => navigate('/admin/stock')} />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-base font-bold font-outfit">AI Insights</h2>
            <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded font-medium">Beta</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div key={i} className={`p-4 rounded-xl border ${insightColors[insight.type] || 'border-neutral-800 bg-neutral-950/50'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{insight.icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm mb-0.5">{insight.title}</p>
                    <p className="text-neutral-400 text-xs leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Queue */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-bold font-outfit">Kitchen Queue</h2>
          <button onClick={() => navigate('/admin/orders')} className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Items</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">OTP</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-neutral-600">No orders yet today.</td></tr>
              ) : recentOrders.map(order => (
                <tr key={order._id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 font-mono font-medium text-white">{order.orderId}</td>
                  <td className="py-3 text-neutral-400 truncate max-w-[100px]">{order.studentName}</td>
                  <td className="py-3 text-neutral-300 truncate max-w-[160px]">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                  <td className="py-3 font-medium text-white">₹{order.total}</td>
                  <td className="py-3 font-mono font-bold text-accent-yellow">{order.otp}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full border capitalize ${getStatusBadge(order.status)}`}>
                      {order.status === 'cooking' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, color, onClick }) {
  const colors = {
    primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white',
    green: 'bg-accent-green/10 text-accent-green border-accent-green/20 hover:bg-accent-green hover:text-black',
    yellow: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20 hover:bg-accent-yellow hover:text-black',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white',
  };
  return (
    <button onClick={onClick} className={`w-full border py-2.5 px-4 rounded-xl flex items-center justify-between transition-all group text-sm font-semibold ${colors[color]}`}>
      <span>{label}</span>
      <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
