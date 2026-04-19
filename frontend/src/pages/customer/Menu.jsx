import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ShoppingCart, Sparkles, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import { menuAPI, dealsAPI } from '../../lib/api';
import { SkeletonMenuGrid } from '../../components/ui/Skeleton';
import { toast } from '../../components/ui/Toast';

export default function Menu() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, dealsRes] = await Promise.all([menuAPI.getToday(), dealsAPI.getAll()]);
        setMenuItems(menuRes.data.items || []);
        setDeals((dealsRes.data.deals || []).filter(d => d.active));
      } catch (err) {
        toast('Failed to load menu. Using demo data.', 'warning');
        // Fallback to demo data
        setMenuItems([
          { _id: '1', name: 'Masala Chicken Maggi', price: 60, description: 'Spicy maggi with chicken', category: 'Maggi', available: true, image: '🍜', isSpecial: true },
          { _id: '2', name: 'Cheese Maggi', price: 45, description: 'Classic maggi with extra cheese', category: 'Maggi', available: true, image: '🧀' },
          { _id: '3', name: 'Cold Coffee', price: 50, description: 'Thick creamy cold coffee', category: 'Beverages', available: true, image: '🧋' },
          { _id: '4', name: 'Oreo Shake', price: 70, description: 'Oreo blended shake', category: 'Beverages', available: true, image: '🥤' },
          { _id: '5', name: 'Egg Roll', price: 40, description: 'Crispy paratha with egg', category: 'Rolls', available: true, image: '🌯' },
          { _id: '6', name: 'Chicken Roll', price: 60, description: 'Spicy chicken wrap', category: 'Rolls', available: true, image: '🌯' },
          { _id: '7', name: 'Bread Omelette', price: 35, description: 'Fluffy omelette with toast', category: 'Snacks', available: true, image: '🍳' },
          { _id: '8', name: 'Boiled Eggs (2)', price: 20, description: 'Two boiled eggs', category: 'Snacks', available: true, image: '🥚' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const cartTotal = useCartStore(s => s.getItemCount());

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const special = menuItems.find(m => m.isSpecial);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white mb-1">Tonight's Menu</h1>
          <p className="text-neutral-400 text-sm">Fresh for the night. Closes at 3:00 AM.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="Search cravings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-56 bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          {cartTotal > 0 && (
            <Link to="/cart" className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-primary-hover shadow-[0_0_20px_-5px_rgba(170,59,255,0.5)]">
              <ShoppingCart size={16} /> Cart ({cartTotal})
            </Link>
          )}
        </div>
      </div>

      {/* Today's Special */}
      {special && !loading && (
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-purple-900/10 to-transparent border border-primary/20 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(170,59,255,0.08),transparent_60%)]" />
          <div className="text-4xl bg-neutral-900/50 w-14 h-14 flex items-center justify-center rounded-xl border border-white/5 relative z-10">
            {special.image}
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Today's Special</span>
            </div>
            <h3 className="font-bold text-white text-lg">{special.name}</h3>
            <p className="text-neutral-400 text-sm">{special.description} — <span className="font-bold text-primary">₹{special.price}</span></p>
          </div>
        </div>
      )}

      {/* Active Deals Banner */}
      {deals.length > 0 && (
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-1 min-w-max md:min-w-0 md:flex-wrap">
            {deals.map(deal => (
              <div key={deal._id} className="flex items-center gap-3 px-4 py-2 bg-accent-yellow/8 border border-accent-yellow/20 rounded-xl shrink-0">
                <Tag size={14} className="text-accent-yellow" />
                <span className="text-accent-yellow font-semibold text-sm">{deal.title}</span>
                <span className="text-neutral-400 text-xs">{deal.validFrom} – {deal.validTo}</span>
                <span className="text-white font-bold text-sm">₹{deal.dealPrice}</span>
                <span className="text-neutral-500 text-xs line-through">₹{deal.originalPrice}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-white text-black shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <SkeletonMenuGrid count={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map(item => (
            <MenuItem key={item._id || item.id} item={item} />
          ))}
        </div>
      )}

      {!loading && filteredMenu.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-neutral-500">No items found. Try a different search or category.</p>
        </div>
      )}
    </div>
  );
}

function MenuItem({ item }) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const itemId = item._id || item.id;
  const inCart = cartItems.find(i => i.id === itemId || i._id === itemId);
  const MotionDiv = motion.div;

  const handleAdd = () => {
    addItem({ ...item, id: itemId });
    toast(`${item.name} added to cart! 🛒`, 'success', 2000);
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl border transition-all group ${
        item.available
          ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
          : 'bg-neutral-900/20 border-neutral-900 opacity-55'
      } ${item.isSpecial ? 'ring-1 ring-primary/20' : ''}`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${item.available ? 'bg-accent-green' : 'bg-accent-red'}`} />
            <h3 className="font-bold text-base leading-tight text-neutral-100 truncate">{item.name}</h3>
            {item.isSpecial && <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-medium shrink-0">✨ Special</span>}
          </div>
          <p className="text-xs text-neutral-400 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
          <div className="font-bold text-primary text-lg">₹{item.price}</div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-3xl bg-neutral-800/60 w-14 h-14 flex items-center justify-center rounded-xl border border-white/5 group-hover:scale-105 transition-transform select-none">
            {item.image}
          </div>

          {item.available ? (
            <button
              onClick={handleAdd}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all active:scale-90 ${
                inCart
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {inCart ? (
                <><span className="bg-primary text-white px-1.5 rounded text-[10px] font-bold">{inCart.quantity}</span> Added</>
              ) : (
                <><Plus size={14} /> Add</>
              )}
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-lg font-medium text-xs bg-neutral-800 text-accent-red uppercase tracking-wide border border-accent-red/20">
              Sold Out
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  );
}
