import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, Moon, Activity, User, LogOut } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { user, logout } = useAuthStore();

  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login';

  if (isAdmin || isAuthPage) return null; // Admin and Login have own/no layout

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-[12px]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 text-primary">
             <Moon size={20} />
          </div>
          <span className="font-outfit font-bold text-xl tracking-tight hidden sm:block">
            Night <span className="text-primary">Canteen</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            to="/menu" 
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${location.pathname === '/menu' ? 'text-white' : 'text-neutral-400'}`}
          >
            <UtensilsCrossed size={18} />
            <span className="hidden sm:inline">Menu</span>
          </Link>
          
          <Link 
             to="/orders" 
             className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-white ${location.pathname === '/orders' ? 'text-white' : 'text-neutral-400'}`}
          >
             <Activity size={18} />
             <span className="hidden sm:inline">Orders</span>
          </Link>

          <Link to="/cart" className="relative group mr-2">
             <div className={`p-2 rounded-full transition-colors flex items-center justify-center ${location.pathname === '/cart' ? 'bg-primary text-white' : 'bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:bg-neutral-800 group-hover:text-white'}`}>
                <ShoppingCart size={20} />
             </div>
             {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-yellow text-[11px] font-bold text-black border-2 border-neutral-950 animate-in zoom-in">
                   {totalItems}
                </span>
             )}
          </Link>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-[10px] text-neutral-500">{user.room || 'Admin'}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-full transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="border-l border-white/10 pl-4 sm:pl-6">
              <Link 
                to="/login"
                className="flex items-center gap-2 text-sm font-semibold bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors shadow-lg"
              >
                <User size={16} /> <span className="hidden sm:inline">Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
