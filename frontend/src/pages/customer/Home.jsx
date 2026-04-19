import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

export default function Home() {
  const MotionDiv = motion.div;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-neutral-950 to-neutral-950 -z-10" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary-hover mb-8 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                Kitchen is open! Order till 3:00 AM
              </div>
              
              <h1 className="font-outfit text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Late night cravings?
                <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                  Sorted instantly.
                </span>
              </h1>
              
              <p className="text-neutral-400 text-lg md:text-xl md:leading-relaxed max-w-2xl mx-auto mb-10">
                Freshly prepared food. Instant OTP pickup. Skip the queue and order right from your dorm room. Your midnight fuel is just a click away.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/menu"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(170,59,255,0.5)] flex items-center justify-center gap-2"
                >
                  View Menu <ChevronRight size={20} />
                </Link>
                <Link
                  to="/orders"
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2"
                >
                  Track Order
                </Link>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* Features/Highlights */}
      <section className="py-20 border-t border-white/5 bg-neutral-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp className="text-accent-yellow" size={24} />}
              title="Today's Most Ordered"
              description="See what everyone else is having tonight. Pro tip: Maggi is always a hit."
              badge="Trending"
            />
            <FeatureCard 
              icon={<Clock className="text-accent-green" size={24} />}
              title="Live Queue Tracking"
              description="Know exactly when your food will be ready. Don't waste time waiting outside."
            />
            <FeatureCard 
              icon={<Sparkles className="text-primary" size={24} />}
              title="Secure OTP Pickup"
              description="Unique 4-digit token for every order. Just show, grab, and go."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, badge }) {
  return (
    <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-colors relative group">
      {badge && (
        <span className="absolute top-6 right-6 text-xs font-bold px-2 py-1 bg-accent-yellow/10 text-accent-yellow rounded flex items-center gap-1">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-outfit mb-2 text-neutral-100">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
