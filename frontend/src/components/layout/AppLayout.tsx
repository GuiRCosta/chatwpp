import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useSocket } from "@/hooks/useSocket"
import { useSidebarStore } from "@/stores/sidebarStore"
import { cn } from "@/lib/utils"

export function AppLayout() {
  // Maintain socket connection while app is mounted
  useSocket()

  const collapsed = useSidebarStore((s) => s.collapsed)

  return (
    <div className="flex h-screen bg-[#F3F3F1]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          collapsed ? "ml-[72px]" : "ml-64"
        )}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
