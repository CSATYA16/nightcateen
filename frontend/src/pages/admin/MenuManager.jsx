import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { menuAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

const CATEGORIES = ['Maggi', 'Beverages', 'Rolls', 'Snacks', 'Other'];
const EMOJIS = ['🍜', '🧀', '🍝', '🧋', '🥤', '🥭', '🌯', '🫔', '🍳', '🥚', '🥪', '🍕', '🍔', '🌮', '🍟', '☕', '🍵', '🥗', '🍱', '🫕'];

const EMPTY_FORM = { name: '', description: '', price: '', category: 'Maggi', image: '🍜', stock: 20, available: true, isSpecial: false };

export default function MenuManager() {
  const [menu, setMenu] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await menuAPI.getAll();
      setMenu(res.data.items || []);
    } catch {
      toast('Failed to load menu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, price: String(item.price), stock: String(item.stock) }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const data = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
      if (editItem) {
        const res = await menuAPI.update(editItem._id, data);
        setMenu(prev => prev.map(m => m._id === editItem._id ? res.data.item : m));
        toast(`"${data.name}" updated!`, 'success');
      } else {
        const res = await menuAPI.add(data);
        setMenu(prev => [...prev, res.data.item]);
        toast(`"${data.name}" added to menu!`, 'success');
      }
      setModal(false);
    } catch {
      toast('Failed to save item.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await menuAPI.remove(item._id);
      setMenu(prev => prev.filter(m => m._id !== item._id));
      toast(`"${item.name}" removed.`, 'info');
    } catch {
      toast('Failed to delete item.', 'error');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const res = await menuAPI.toggleAvailability(item._id);
      setMenu(prev => prev.map(m => m._id === item._id ? res.data.item : m));
    } catch {
      toast('Failed to update availability.', 'error');
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset today\'s menu to defaults? This removes all custom items.')) return;
    try {
      await menuAPI.seed();
      await fetchMenu();
      toast('Menu reset to defaults!', 'success');
    } catch {
      toast('Failed to reseed menu.', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-bold font-outfit text-white">Menu Management</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-8 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button onClick={handleReseed} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white px-3 py-2 rounded-xl text-xs font-medium border border-neutral-800 transition-colors shrink-0">
            🔄 Reset
          </button>
          <button onClick={openAdd} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">Add Item</span>
          </button>
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-neutral-400 border-b border-neutral-800 bg-neutral-950/40 sticky top-0">
              <tr>
                <th className="p-4 font-medium">Item</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><div className="skeleton h-4 w-full rounded" /></td></tr>
                ))
              ) : filteredMenu.map(item => (
                <tr key={item._id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{item.image}</span>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {item.name}
                          {item.isSpecial && <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-1 rounded">✨</span>}
                        </div>
                        <div className="text-neutral-600 text-[10px] mt-0.5 max-w-[200px] truncate">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-400">{item.category}</td>
                  <td className="p-4 text-white font-bold">₹{item.price}</td>
                  <td className="p-4">
                    <span className={`font-medium ${item.stock <= 5 ? 'text-accent-red' : item.stock <= 10 ? 'text-accent-yellow' : 'text-neutral-300'}`}>
                      {item.stock}
                      {item.stock <= 5 && item.stock > 0 && <span className="ml-1 text-[10px] text-accent-red">⚠️ Low</span>}
                      {item.stock === 0 && <span className="ml-1 text-[10px] text-accent-red">Out</span>}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        item.available
                          ? 'bg-accent-green/10 text-accent-green border-accent-green/20 hover:bg-accent-green/20'
                          : 'bg-accent-red/10 text-accent-red border-accent-red/20 hover:bg-accent-red/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-accent-green' : 'bg-accent-red'}`} />
                      {item.available ? 'Available' : 'Sold Out'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(item)} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-2 text-neutral-400 hover:text-accent-red hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredMenu.length === 0 && (
            <div className="text-center py-12 text-neutral-600 text-sm">No items found.</div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Menu Item' : 'Add New Item'}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(emoji => (
                <button key={emoji} type="button" onClick={() => setForm(f => ({ ...f, image: emoji }))}
                  className={`w-9 h-9 text-xl rounded-lg border transition-all ${form.image === emoji ? 'bg-primary/20 border-primary scale-110' : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-neutral-400 block mb-1.5">Item Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="e.g. Masala Chicken Maggi" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Price (₹) *</label>
              <input required type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="60" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Stock Qty</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.available} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-xs text-neutral-300">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isSpecial} onChange={e => setForm(f => ({ ...f, isSpecial: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-xs text-neutral-300">✨ Special</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-neutral-400 block mb-1.5">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary resize-none" placeholder="Short description..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <X size={16} /> Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Save size={16} /> {editItem ? 'Update' : 'Add Item'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
