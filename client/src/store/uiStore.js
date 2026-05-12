import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeModal: null,
  modalData: null,
  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  drawerOpen: false,
  drawerData: null,
  openDrawer: (data = null) => set({ drawerOpen: true, drawerData: data }),
  closeDrawer: () => set({ drawerOpen: false, drawerData: null }),
}));

export default useUIStore;
