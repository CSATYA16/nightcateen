import { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Tag, LogOut, Package, BarChart2, Moon, Menu as MenuIcon, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';

const Dashboard = lazy(() => import('./Dashboard'));
const MenuManager = lazy(() => import('./MenuManager'));
const OrdersManager = lazy(() => import('./OrdersManager'));
const DealsManager = lazy(() => import('./DealsManager'));
const StockManager = lazy(() => import('./StockManager'));
const Analytics = lazy(() => import('./Analytics'));

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
  { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
  { name: 'Stock', path: '/admin/stock', icon: Package },
  { name: 'Deals', path: '/admin/deals', icon: Tag },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const [mobileNav, setMobileNav] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const SidebarLink = ({ item }) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={() => setMobileNav(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
          active
            ? 'bg-primary text-white font-semibold shadow-lg shadow-primary/20'
            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
        }`}
      >
        <Icon size={18} />
        {item.name}
        {item.name === 'Orders' && (
          <span className="ml-auto w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-white font-inter overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-neutral-900 border-r border-neutral-800 flex-col pt-5 hidden md:flex shrink-0">
        <div className="px-5 pb-5 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Moon size={17} />
            </div>
            <div>
              <h2 className="font-outfit font-bold text-sm text-white leading-none">Night Canteen</h2>
              <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => <SidebarLink key={item.name} item={item} />)}
        </nav>

        <div className="p-3 border-t border-neutral-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full text-left text-sm">
            <LogOut size={17} />Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay Sidebar */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col pt-5 z-10">
            <div className="px-5 pb-5 border-b border-neutral-800 mb-4 flex justify-between items-center">
              <h2 className="font-outfit font-bold text-sm">Night Canteen <span className="text-primary">Admin</span></h2>
              <button onClick={() => setMobileNav(false)} className="text-neutral-400 hover:text-white"><X size={18} /></button>
            </div>
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {navItems.map(item => <SidebarLink key={item.name} item={item} />)}
            </nav>
            <div className="p-3 border-t border-neutral-800">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-red-400 rounded-xl transition-all w-full text-sm">
                <LogOut size={17} />Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center px-5 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(true)} className="md:hidden p-1.5 text-neutral-400 hover:text-white">
              <MenuIcon size={20} />
            </button>
            <span className="font-outfit font-bold text-sm md:hidden">{navItems.find(n => isActive(n.path))?.name || 'Admin'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-accent-green/10 border border-accent-green/20 px-3 py-1 rounded-full text-xs text-accent-green font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" /> Kitchen Open
            </div>
            <div className="hidden sm:block text-xs text-neutral-500">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-neutral-950 p-5">
          <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<OrdersManager />} />
              <Route path="/menu" element={<MenuManager />} />
              <Route path="/stock" element={<StockManager />} />
              <Route path="/deals" element={<DealsManager />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
