import { useState, useEffect } from 'react';
import { Plus, Tag, Clock, Edit2, Trash2, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { dealsAPI } from '../../lib/api';
import { toast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

const EMPTY_FORM = { title: '', description: '', originalPrice: '', dealPrice: '', validFrom: '10:00 PM', validTo: '3:00 AM', active: true, items: [] };

export default function DealsManager() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dealsAPI.getAll().then(res => setDeals(res.data.deals || [])).catch(() => toast('Failed to load deals.', 'error')).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditDeal(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (deal) => { setEditDeal(deal); setForm({ ...deal, originalPrice: String(deal.originalPrice), dealPrice: String(deal.dealPrice) }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, originalPrice: parseFloat(form.originalPrice), dealPrice: parseFloat(form.dealPrice) };
      data.discountPercent = Math.round((1 - data.dealPrice / data.originalPrice) * 100);
      if (editDeal) {
        const res = await dealsAPI.update(editDeal._id, data);
        setDeals(prev => prev.map(d => d._id === editDeal._id ? res.data.deal : d));
        toast('Deal updated!', 'success');
      } else {
        const res = await dealsAPI.create(data);
        setDeals(prev => [...prev, res.data.deal]);
        toast('Deal created!', 'success');
      }
      setModal(false);
    } catch { toast('Failed to save deal.', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (deal) => {
    try {
      const res = await dealsAPI.toggle(deal._id);
      setDeals(prev => prev.map(d => d._id === deal._id ? res.data.deal : d));
      toast(`Deal ${res.data.deal.active ? 'enabled' : 'disabled'}.`, 'info');
    } catch { toast('Failed to toggle deal.', 'error'); }
  };

  const handleDelete = async (deal) => {
    if (!window.confirm(`Delete deal "${deal.title}"?`)) return;
    try {
      await dealsAPI.remove(deal._id);
      setDeals(prev => prev.filter(d => d._id !== deal._id));
      toast('Deal deleted.', 'info');
    } catch { toast('Failed to delete deal.', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold font-outfit text-white">Deals & Combos</h1>
        <button onClick={openAdd} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <Plus size={16} /> Add Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto pb-6">
        {deals.map(deal => {
          const savings = deal.originalPrice - deal.dealPrice;
          const pct = Math.round((savings / deal.originalPrice) * 100);
          return (
            <div key={deal._id} className={`bg-neutral-900 border rounded-2xl p-5 relative overflow-hidden transition-all ${deal.active ? 'border-neutral-800' : 'border-neutral-800 opacity-60'}`}>
              <div className={`absolute top-0 right-0 text-[10px] font-bold px-2.5 py-1 rounded-bl-xl border-b border-l ${deal.active ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                {deal.active ? '● Active' : 'Inactive'}
              </div>

              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${deal.active ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-neutral-800 text-neutral-500 border border-neutral-700'}`}>
                <Tag size={22} />
              </div>

              <h3 className="text-base font-bold text-white mb-1">{deal.title}</h3>
              {pct > 0 && <span className="text-xs bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20 px-2 py-0.5 rounded font-bold">{pct}% OFF</span>}
              <p className="text-neutral-400 text-xs mt-2 mb-4 leading-relaxed">{deal.description}</p>

              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <Clock size={13} className="text-primary shrink-0" />
                Valid: {deal.validFrom} – {deal.validTo}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                <div>
                  <span className="font-bold text-lg text-white">₹{deal.dealPrice}</span>
                  <span className="text-xs font-normal text-neutral-500 line-through ml-2">₹{deal.originalPrice}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleToggle(deal)} className={`p-1.5 rounded-lg transition-colors ${deal.active ? 'text-accent-green hover:bg-accent-green/10' : 'text-neutral-500 hover:bg-neutral-800'}`} title={deal.active ? 'Disable' : 'Enable'}>
                    {deal.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => openEdit(deal)} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(deal)} className="p-1.5 text-neutral-400 hover:text-accent-red hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {deals.length === 0 && (
          <div className="col-span-3 text-center py-16 text-neutral-600">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p>No deals yet. Create your first deal!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editDeal ? 'Edit Deal' : 'Create New Deal'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Deal Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="e.g. Midnight Combo" />
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary resize-none" placeholder="e.g. 2x Maggi + 2x Coffee" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Original Price (₹) *</label>
              <input required type="number" min="1" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="250" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Deal Price (₹) *</label>
              <input required type="number" min="1" value={form.dealPrice} onChange={e => setForm(f => ({ ...f, dealPrice: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="199" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Valid From</label>
              <input value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="10:00 PM" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Valid To</label>
              <input value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary" placeholder="3:00 AM" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-neutral-300">Enable immediately</span>
          </label>

          {form.originalPrice && form.dealPrice && Number(form.dealPrice) < Number(form.originalPrice) && (
            <div className="bg-accent-green/8 border border-accent-green/20 rounded-xl p-3 text-xs text-accent-green">
              💰 Discount: ₹{form.originalPrice - form.dealPrice} off ({Math.round((1 - form.dealPrice / form.originalPrice) * 100)}% savings)
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <X size={15} /> Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <><Save size={15} /> {editDeal ? 'Update' : 'Create Deal'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
