import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Kanban,
  Megaphone,
  Settings2,
  LogOut,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Separator } from "@/components/ui/Separator"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tickets", href: "/tickets", icon: MessageSquare },
  { name: "Contatos", href: "/contacts", icon: Users },
  { name: "CRM", href: "/crm", icon: Kanban },
  { name: "Campanhas", href: "/campaigns", icon: Megaphone },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#08090A] text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="flex gap-1">
            <div className="w-1.5 rounded-full bg-white h-6 transition-all duration-300 group-hover:h-8" />
            <div className="w-1.5 rounded-full bg-white h-8 transition-all duration-300 group-hover:h-10" />
            <div className="w-1.5 rounded-full bg-white h-6 transition-all duration-300 group-hover:h-8" />
          </div>
          <span className="text-xl font-bold tracking-wider">ZFLOW</span>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          Engenharia de Automacao & IA
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}

          <li>
            <Separator className="my-4 bg-white/10" />
          </li>

          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <Settings2 className="w-5 h-5" />
              <span className="text-sm font-medium">Configuracoes</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
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
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
