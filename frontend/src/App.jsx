import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { ToastProvider } from './components/ui/Toast';

const Home = lazy(() => import('./pages/customer/Home'));
const Menu = lazy(() => import('./pages/customer/Menu'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Orders = lazy(() => import('./pages/customer/Orders'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Login = lazy(() => import('./pages/Login'));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-neutral-900 px-5 py-2.5 text-sm text-neutral-400">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading...
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30 flex flex-col font-inter">
        <Navbar />
        <main className="flex-1 w-full relative">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminLayout />} />
            </Routes>
          </Suspense>
        </main>
        <ToastProvider />
      </div>
    </Router>
  );
}

export default App;
