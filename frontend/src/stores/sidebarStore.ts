import { create } from "zustand"

interface SidebarState {
  collapsed: boolean
  mobileOpen: boolean
  toggle: () => void
  setMobileOpen: (open: boolean) => void
  toggleMobile: () => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: localStorage.getItem("nuvio:sidebar-collapsed") === "true",
  mobileOpen: false,

  toggle: () =>
    set((state) => {
      const next = !state.collapsed
      localStorage.setItem("nuvio:sidebar-collapsed", String(next))
      return { collapsed: next }
    }),

  setMobileOpen: (open: boolean) => set({ mobileOpen: open }),

  toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
}))
