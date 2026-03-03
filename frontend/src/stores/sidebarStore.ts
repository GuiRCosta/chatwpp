import { create } from "zustand"

interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  collapsed: localStorage.getItem("zflow:sidebar-collapsed") === "true",

  toggle: () =>
    set((state) => {
      const next = !state.collapsed
      localStorage.setItem("zflow:sidebar-collapsed", String(next))
      return { collapsed: next }
    }),
}))
