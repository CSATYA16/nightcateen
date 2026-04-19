import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Minus } from 'lucide-react';
import { menuAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';

export default function StockManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    menuAPI.getAll()
      .then(res => setItems(res.data.items || []))
      .catch(() => toast('Failed to load stock.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const updateStock = async (item, delta) => {
    const newStock = Math.max(0, item.stock + delta);
    setUpdating(item._id);
    try {
      const res = await menuAPI.updateStock(item._id, newStock);
      setItems(prev => prev.map(m => m._id === item._id ? res.data.item : m));
      if (newStock === 0) toast(`"${item.name}" is now Sold Out!`, 'warning');
      else if (newStock <= 5) toast(`"${item.name}" stock is critically low (${newStock})!`, 'warning');
    } catch {
      toast('Failed to update stock.', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const setExact = async (item, value) => {
    const newStock = Math.max(0, parseInt(value) || 0);
    try {
      const res = await menuAPI.updateStock(item._id, newStock);
      setItems(prev => prev.map(m => m._id === item._id ? res.data.item : m));
    } catch {
      toast('Failed to update stock.', 'error');
    }
  };

  const lowStock = items.filter(i => i.stock > 0 && i.stock <= 5);
  const soldOut = items.filter(i => i.stock === 0 || !i.available);
  const healthy = items.filter(i => i.stock > 10);

  const getStockColor = (item) => {
    if (!item.available || item.stock === 0) return 'text-accent-red';
    if (item.stock <= 5) return 'text-accent-red';
    if (item.stock <= 10) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  const getStockBg = (item) => {
    if (!item.available || item.stock === 0) return 'bg-accent-red/5 border-accent-red/20';
    if (item.stock <= 5) return 'bg-accent-red/5 border-accent-red/20';
    if (item.stock <= 10) return 'bg-accent-yellow/5 border-accent-yellow/20';
    return 'border-neutral-800';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-white">Stock Management</h1>
          <p className="text-neutral-500 text-xs">{items.length} items · {soldOut.length} sold out · {lowStock.length} low stock</p>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || soldOut.length > 0) && (
        <div className="mb-6 space-y-3">
          {soldOut.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-accent-red/8 border border-accent-red/20 rounded-xl">
              <AlertTriangle size={18} className="text-accent-red shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-accent-red mb-1">🚫 {soldOut.length} item(s) Sold Out</p>
                <p className="text-xs text-neutral-400">{soldOut.map(i => i.name).join(' · ')}</p>
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-accent-yellow/8 border border-accent-yellow/20 rounded-xl">
              <AlertTriangle size={18} className="text-accent-yellow shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-accent-yellow mb-1">⚠️ {lowStock.length} item(s) Running Low (≤5)</p>
                <p className="text-xs text-neutral-400">{lowStock.map(i => `${i.name} (${i.stock})`).join(' · ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Healthy Stock', value: healthy.length, icon: <Package size={18} />, color: 'text-accent-green', bg: 'bg-accent-green/10 border-accent-green/20' },
          { label: 'Low Stock', value: lowStock.length, icon: <AlertTriangle size={18} />, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/20' },
          { label: 'Sold Out', value: soldOut.length, icon: <AlertTriangle size={18} />, color: 'text-accent-red', bg: 'bg-accent-red/10 border-accent-red/20' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border text-center ${s.bg}`}>
            <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <div className={`text-2xl font-bold font-outfit ${s.color}`}>{s.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stock Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-400 border-b border-neutral-800 bg-neutral-950/40">
              <tr>
                <th className="p-4 text-left font-medium">Item</th>
                <th className="p-4 text-left font-medium">Category</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Current Stock</th>
                <th className="p-4 text-left font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {items.map(item => (
                <tr key={item._id} className={`hover:bg-neutral-800/30 transition-colors ${getStockBg(item)}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.image}</span>
                      <span className="font-medium text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-400 text-xs">{item.category}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                      !item.available || item.stock === 0 ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
                      : item.stock <= 5 ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
                      : item.stock <= 10 ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20'
                      : 'bg-accent-green/10 text-accent-green border-accent-green/20'
                    }`}>
                      {!item.available || item.stock === 0 ? 'Sold Out' : item.stock <= 5 ? 'Critical' : item.stock <= 10 ? 'Low' : 'Good'}
                    </span>
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min="0"
                      value={item.stock}
                      onChange={e => setExact(item, e.target.value)}
                      className={`w-20 bg-neutral-950 border rounded-lg py-1.5 px-2 text-center font-bold text-sm focus:outline-none focus:border-primary transition-all ${getStockColor(item)} border-neutral-700`}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateStock(item, -1)}
                        disabled={updating === item._id || item.stock <= 0}
                        className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        onClick={() => updateStock(item, +10)}
                        disabled={updating === item._id}
                        className="px-3 h-8 rounded-lg bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/20 text-xs font-bold transition-colors disabled:opacity-40"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => updateStock(item, +1)}
                        disabled={updating === item._id}
                        className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
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
