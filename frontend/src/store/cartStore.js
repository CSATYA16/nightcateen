import { create } from 'zustand';
import { ordersAPI } from '../lib/api';

const useCartStore = create((set, get) => ({
  items: [],
  lastOrder: null, // Stores the order after placement { orderId, otp, estimatedMins, ... }

  addItem: (item) => set((state) => {
    const existingItem = state.items.find((i) => i.id === item.id || i._id === item._id);
    const itemId = item.id || item._id;
    if (existingItem) {
      return {
        items: state.items.map((i) =>
          (i.id === itemId || i._id === itemId) ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }
    return { items: [...state.items, { ...item, id: itemId, quantity: 1 }] };
  }),

  removeItem: (itemId) => set((state) => ({
    items: state.items.filter((i) => i.id !== itemId && i._id !== itemId),
  })),

  updateQuantity: (itemId, quantity) => set((state) => ({
    items: state.items.map((i) =>
      (i.id === itemId || i._id === itemId) ? { ...i, quantity: Math.max(1, quantity) } : i
    )
  })),

  clearCart: () => set({ items: [] }),

  getCartTotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),

  getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),

  placeOrder: async (studentName, rollNumber, customerEmail, customerPhone, packingCharges) => {
    const { items } = get();
    if (!items.length) throw new Error('Cart is empty');

    const orderItems = items.map(item => ({
      menuItemId: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '🍽️',
    }));

    const response = await ordersAPI.place({
      studentName,
      rollNumber,
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      packingCharges: packingCharges || 0,
      items: orderItems,
    });

    const order = response.data.order;

    // Save roll number to localStorage for order tracking
    localStorage.setItem('nc_rollNumber', rollNumber);
    localStorage.setItem('nc_lastOrderId', order._id || order.orderId);

    set({ lastOrder: order, items: [] });
    return order;
  },

  clearLastOrder: () => set({ lastOrder: null }),
}));

export default useCartStore;
