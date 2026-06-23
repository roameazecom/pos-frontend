import { create } from 'zustand';

export const useUiStore = create((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  // Waiter UI active states
  activeLocationTab: 1,
  setActiveLocationTab: (id) => set({ activeLocationTab: id }),
  
  activeCategoryTab: 1,
  setActiveCategoryTab: (id) => set({ activeCategoryTab: id })
}));
