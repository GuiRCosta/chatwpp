import { useEffect, useState } from "react"
import { MessageSquare, Users, Megaphone, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface DashboardStats {
  openTickets: number
  contacts: number
  activeCampaigns: number
  openOpportunities: number
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  accentColor: string
  isLoading: boolean
}

function StatCard({
  icon,
  label,
  value,
  accentColor,
  isLoading
}: StatCardProps) {
  return (
    <Card className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isLoading ? (
              <>
                <div className="mb-2 h-10 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              </>
            ) : (
              <>
                <p className="mb-1 text-4xl font-bold text-[#0A0A0A]">
                  {value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">{label}</p>
              </>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              accentColor
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Bom dia"
  }

  if (hour < 18) {
    return "Boa tarde"
  }

  return "Boa noite"
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    contacts: 0,
    activeCampaigns: 0,
    openOpportunities: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("Usuário")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)

        const [ticketsRes, contactsRes, campaignsRes, opportunitiesRes] =
          await Promise.all([
            api.get("/tickets", { params: { status: "open" } }),
            api.get("/contacts"),
            api.get("/campaigns", { params: { status: "processing" } }),
            api.get("/opportunities", { params: { status: "open" } })
          ])

        const newStats = {
          openTickets: ticketsRes.data.data?.length || 0,
          contacts: contactsRes.data.data?.length || 0,
          activeCampaigns: campaignsRes.data.data?.length || 0,
          openOpportunities: opportunitiesRes.data.data?.length || 0
        }

        setStats(newStats)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        throw new Error(`Failed to fetch dashboard stats: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    }

    const loadUserName = () => {
      const userStr = localStorage.getItem("zflow:user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          setUserName(user.name || user.email || "Usuário")
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error"
          throw new Error(`Failed to parse user data: ${errorMessage}`)
        }
      }
    }

    loadUserName()
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[#0A0A0A]">
          {getGreeting()}, {userName}
        </h1>
        <p className="mt-2 text-gray-500">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
          label="Tickets Abertos"
          value={stats.openTickets}
          accentColor="bg-blue-50"
          isLoading={isLoading}
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-green-600" />}
          label="Contatos"
          value={stats.contacts}
          accentColor="bg-green-50"
          isLoading={isLoading}
        />
        <StatCard
          icon={<Megaphone className="h-6 w-6 text-purple-600" />}
          label="Campanhas Ativas"
          value={stats.activeCampaigns}
          accentColor="bg-purple-50"
          isLoading={isLoading}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
          label="Oportunidades"
          value={stats.openOpportunities}
          accentColor="bg-orange-50"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
