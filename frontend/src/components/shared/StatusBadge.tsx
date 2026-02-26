import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps {
  status: string
  type?: "ticket" | "campaign" | "opportunity"
}

const getStatusConfig = (
  status: string,
  type: "ticket" | "campaign" | "opportunity" = "ticket"
): { label: string; className: string } => {
  const lowerStatus = status.toLowerCase()

  if (type === "ticket") {
    switch (lowerStatus) {
      case "open":
        return {
          label: "Aberto",
          className: "bg-blue-100 text-blue-700 border-blue-200"
        }
      case "pending":
        return {
          label: "Pendente",
          className: "bg-yellow-100 text-yellow-700 border-yellow-200"
        }
      case "closed":
        return {
          label: "Fechado",
          className: "bg-gray-100 text-gray-700 border-gray-200"
        }
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700 border-gray-200"
        }
    }
  }

  if (type === "campaign") {
    switch (lowerStatus) {
      case "pending":
        return {
          label: "Pendente",
          className: "bg-gray-100 text-gray-700 border-gray-200"
        }
      case "scheduled":
        return {
          label: "Agendada",
          className: "bg-blue-100 text-blue-700 border-blue-200"
        }
      case "processing":
        return {
          label: "Em Andamento",
          className: "bg-yellow-100 text-yellow-700 border-yellow-200"
        }
      case "completed":
        return {
          label: "Concluída",
          className: "bg-green-100 text-green-700 border-green-200"
        }
      case "cancelled":
        return {
          label: "Cancelada",
          className: "bg-red-100 text-red-700 border-red-200"
        }
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700 border-gray-200"
        }
    }
  }

  if (type === "opportunity") {
    switch (lowerStatus) {
      case "open":
        return {
          label: "Aberta",
          className: "bg-blue-100 text-blue-700 border-blue-200"
        }
      case "won":
        return {
          label: "Ganha",
          className: "bg-green-100 text-green-700 border-green-200"
        }
      case "lost":
        return {
          label: "Perdida",
          className: "bg-red-100 text-red-700 border-red-200"
        }
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-700 border-gray-200"
        }
    }
  }

  return {
    label: status,
    className: "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export function StatusBadge({ status, type = "ticket" }: StatusBadgeProps) {
  const config = getStatusConfig(status, type)

  return (
    <Badge className={cn("border", config.className)} variant="outline">
      {config.label}
    </Badge>
  )
}
