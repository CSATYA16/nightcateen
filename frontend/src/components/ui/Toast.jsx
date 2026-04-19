import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

let toastId = 0;
let addToastFn = null;

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: <CheckCircle size={18} className="text-accent-green" />,
    error: <XCircle size={18} className="text-accent-red" />,
    warning: <AlertTriangle size={18} className="text-accent-yellow" />,
    info: <Info size={18} className="text-primary" />,
  };

  const borders = {
    success: 'border-accent-green/30',
    error: 'border-accent-red/30',
    warning: 'border-accent-yellow/30',
    info: 'border-primary/30',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            icon={icons[toast.type]}
            borderClass={borders[toast.type]}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, icon, borderClass, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '120%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 bg-neutral-900/95 backdrop-blur-sm border ${borderClass} rounded-xl shadow-2xl`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <p className="text-sm text-white flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-neutral-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// Global toast function — use this anywhere
export function toast(message, type = 'info', duration = 4000) {
  if (addToastFn) addToastFn(message, type, duration);
}

export default ToastProvider;
