import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  tableId: null,

  setTableId: (id) => set({ tableId: id }),

  addItem: (item) => {
    const { items } = get();
    const existing = items.find(i => i.menuItemId === item.menuItemId && i.size === item.size);
    if (existing) {
      set({ items: items.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (menuItemId, size) => {
    set({ items: get().items.filter(i => !(i.menuItemId === menuItemId && i.size === size)) });
  },

  updateQuantity: (menuItemId, size, quantity) => {
    if (quantity <= 0) return get().removeItem(menuItemId, size);
    set({
      items: get().items.map(i =>
        i.menuItemId === menuItemId && i.size === size ? { ...i, quantity } : i
      ),
    });
  },

  updateNote: (menuItemId, size, kitchenNote) => {
    set({
      items: get().items.map(i =>
        i.menuItemId === menuItemId && i.size === size ? { ...i, kitchenNote } : i
      ),
    });
  },

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  clearCart: () => set({ items: [] }),
}));

export default useCartStore;
