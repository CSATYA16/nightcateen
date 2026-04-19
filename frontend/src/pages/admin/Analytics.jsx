import { useState, useEffect } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Download, Calendar } from 'lucide-react';
import { analyticsAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';

export default function Analytics() {
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [timewise, setTimewise] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDaily(),
      analyticsAPI.getWeekly(),
      analyticsAPI.getTimewise(),
      analyticsAPI.getAIInsights(),
    ]).then(([d, w, t, i]) => {
      setDaily(d.data);
      setWeekly(w.data.weekly || []);
      setTimewise(t.data.timewise || []);
      setInsights(i.data.insights || []);
    }).catch(() => toast('Failed to load analytics.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    if (!daily) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Orders', daily.totalOrders],
      ['Total Revenue', `₹${daily.totalRevenue}`],
      ['Pending', daily.statusBreakdown.pending],
      ['Cooking', daily.statusBreakdown.cooking],
      ['Ready', daily.statusBreakdown.ready],
      ['Delivered', daily.statusBreakdown.delivered],
      ['Top Item', daily.mostOrdered?.name || 'N/A'],
    ];
    const csv = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `night-canteen-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Report exported!', 'success');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  const peakSlot = timewise.sort((a, b) => b.orders - a.orders)[0];
  const sortedTimewise = [...timewise].sort((a, b) => timewise.indexOf(a) - timewise.indexOf(b));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Analytics</h1>
          <p className="text-neutral-500 text-xs flex items-center gap-1">
            <Calendar size={12} /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 px-4 py-2 rounded-xl text-xs font-medium transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Today's Summary */}
      {daily && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Orders Today', value: daily.totalOrders, color: 'text-primary' },
            { label: 'Revenue', value: `₹${daily.totalRevenue.toLocaleString()}`, color: 'text-accent-green' },
            { label: 'Delivered', value: daily.statusBreakdown.delivered, color: 'text-accent-green' },
            { label: 'Top Seller', value: daily.mostOrdered?.name || 'N/A', sub: daily.mostOrdered ? `${daily.mostOrdered.count} orders` : '', color: 'text-accent-yellow' },
          ].map(s => (
            <div key={s.label} className="bg-neutral-900 border border-neutral-800 px-5 py-4 rounded-2xl">
              <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold font-outfit ${s.color} truncate`}>{s.value}</p>
              {s.sub && <p className="text-[10px] text-neutral-600 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Weekly Revenue */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
          <h2 className="text-sm font-bold font-outfit mb-4 text-white">Weekly Revenue</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#aa3bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '10px', fontSize: '11px' }} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#333', strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" stroke="#aa3bff" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Orders */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
          <h2 className="text-sm font-bold font-outfit mb-4 text-white">Weekly Orders</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '10px', fontSize: '11px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {weekly.map((entry, i) => (
                    <Cell key={i} fill={entry.orders === Math.max(...weekly.map(w => w.orders)) ? '#4ade80' : '#aa3bff44'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Breakdown */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold font-outfit text-white">Hourly Sales Breakdown</h2>
          {peakSlot && peakSlot.orders > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/20 px-2.5 py-1 rounded-lg">
              <TrendingUp size={12} /> Peak: {peakSlot.hour}
            </div>
          )}
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedTimewise} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="hour" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '10px', fontSize: '11px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                {sortedTimewise.map((entry, i) => (
                  <Cell key={i} fill={entry === peakSlot ? '#fcd34d' : '#aa3bff55'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
          <h2 className="text-sm font-bold font-outfit mb-4 text-white">🤖 AI Business Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div key={i} className="p-4 bg-neutral-950/50 border border-neutral-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{insight.icon}</span>
                  <div>
                    <p className="font-semibold text-white text-xs mb-1">{insight.title}</p>
                    <p className="text-neutral-400 text-xs leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
