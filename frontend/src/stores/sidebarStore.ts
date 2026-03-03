import { create } from "zustand"

interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: localStorage.getItem("nuvio:sidebar-collapsed") === "true",

  toggle: () =>
    set((state) => {
      const next = !state.collapsed
      localStorage.setItem("nuvio:sidebar-collapsed", String(next))
      return { collapsed: next }
    }),
}))
