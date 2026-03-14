import { NavLink, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Kanban,
  Megaphone,
  Zap,
  Bot,
  Settings2,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useSidebarStore } from "@/stores/sidebarStore"
import { useIsMobile } from "@/hooks/useIsMobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Separator } from "@/components/ui/Separator"
import { Sheet, SheetContent } from "@/components/ui/Sheet"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip"
import { useEffect } from "react"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: true },
  { name: "Tickets", href: "/tickets", icon: MessageSquare },
  { name: "Contatos", href: "/contacts", icon: Users },
  { name: "CRM", href: "/crm", icon: Kanban },
  { name: "Campanhas", href: "/campaigns", icon: Megaphone, adminOnly: true },
  { name: "Macros", href: "/macros", icon: Zap, adminOnly: true },
  { name: "Automacoes", href: "/automations", icon: Bot, adminOnly: true },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { collapsed } = useSidebarStore()
  const isMobile = useIsMobile()
  const isAdmin = user?.profile === "admin" || user?.profile === "superadmin"
  const isSuperAdmin = user?.profile === "superadmin"

  const isExpanded = isMobile || !collapsed

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate("/login")
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ")
    return parts
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <>
      {/* Logo Section */}
      <div className={cn("p-6", !isExpanded && "px-4")}>
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="flex gap-1 shrink-0">
            <div className="w-1.5 rounded-full bg-white h-6 transition-all duration-300 group-hover:h-8" />
            <div className="w-1.5 rounded-full bg-white h-8 transition-all duration-300 group-hover:h-10" />
            <div className="w-1.5 rounded-full bg-white h-6 transition-all duration-300 group-hover:h-8" />
          </div>
          {isExpanded && (
            <span className="text-xl font-bold tracking-wider">NUVIO</span>
          )}
        </div>
        {isExpanded && (
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-gray-400 mt-2 ml-1">
            CRM & Atendimento inteligente
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <li key={item.href}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-full transition-all duration-200",
                        !isExpanded && "justify-center px-2",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {isExpanded && (
                      <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em]">{item.name}</span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" sideOffset={8}>
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            </li>
          ))}

          {isSuperAdmin && (
            <>
              <li>
                <Separator className="my-4 bg-white/10" />
              </li>

              <li>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/settings"
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-full transition-all duration-200",
                          !isExpanded && "justify-center px-2",
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )
                      }
                    >
                      <Settings2 className="w-5 h-5 shrink-0" />
                      {isExpanded && (
                        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em]">
                          Configuracoes
                        </span>
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" sideOffset={8}>
                      Configuracoes
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        {isExpanded ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-white/10 text-white text-sm">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "Usuario"}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {user?.role || "User"}
                </Badge>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-full text-[0.7rem] uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-9 w-9 cursor-default">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-white/10 text-white text-xs">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {user?.name || "Usuario"}
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Sair
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </>
  )
}

export function Sidebar() {
  const isMobile = useIsMobile()
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarStore()
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#08090A] text-white flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <SidebarContent />

      {/* Collapse Toggle — desktop only */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-[#08090A] border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-all duration-200"
      >
        {collapsed ? (
          <ChevronsRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronsLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  )
}
