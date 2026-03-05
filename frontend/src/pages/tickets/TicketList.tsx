import { useCallback, useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Inbox, Search, Smartphone } from "lucide-react"
import { useTicketStore } from "@/stores/ticketStore"
import { useIsMobile } from "@/hooks/useIsMobile"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { Input } from "@/components/ui/Input"
import { ScrollArea } from "@/components/ui/ScrollArea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select"
import ChatPanel from "./ChatPanel"
import type { Ticket, WhatsApp } from "@/types"

const statusColors = {
  open: "bg-green-500",
  pending: "bg-yellow-500",
  closed: "bg-gray-400"
}

const statusLabels = {
  open: "Aberto",
  pending: "Pendente",
  closed: "Fechado"
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function TicketCard({ ticket, isSelected, onClick }: {
  ticket: Ticket
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all hover:bg-gray-50",
        "border-b border-gray-200/60",
        isSelected && "bg-blue-50 border-l-2 border-l-blue-600"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={ticket.contact?.profilePicUrl} alt={ticket.contact?.name} />
          <AvatarFallback>
            {getInitials(ticket.contact?.name || "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-[#0A0A0A] truncate">
              {ticket.contact?.name}
            </h3>
            {ticket.lastMessageAt && (
              <span className="text-xs text-gray-500 shrink-0">
                {formatDistanceToNow(new Date(ticket.lastMessageAt), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 truncate mb-2">
            {ticket.lastMessage || "Sem mensagens"}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusColors[ticket.status])} />
              <span className="text-xs text-gray-500">
                {statusLabels[ticket.status]}
              </span>
              {ticket.whatsapp?.name && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {ticket.whatsapp.name}
                </Badge>
              )}
            </div>

            {ticket.unreadMessages > 0 && (
              <Badge variant="default" className="bg-blue-600">
                {ticket.unreadMessages}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TicketList() {
  const {
    tickets,
    selectedTicket,
    isLoading,
    filter,
    whatsappId,
    fetchTickets,
    selectTicket,
    setFilter,
    setSearchParam,
    setWhatsappId
  } = useTicketStore()

  const isMobile = useIsMobile()
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")
  const [localSearch, setLocalSearch] = useState("")
  const [connections, setConnections] = useState<WhatsApp[]>([])

  const fetchConnections = useCallback(async () => {
    try {
      const response = await api.get<{ data: WhatsApp[] }>("/whatsapp")
      const list = Array.isArray(response.data.data) ? response.data.data : []
      setConnections(list)
    } catch {
      setConnections([])
    }
  }, [])

  useEffect(() => {
    fetchTickets()
    fetchConnections()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParam(localSearch)
      fetchTickets()
    }, 500)

    return () => clearTimeout(timer)
  }, [localSearch, setSearchParam, fetchTickets])

  const handleTicketClick = (ticket: Ticket) => {
    selectTicket(ticket)
    if (isMobile) {
      setMobileView("chat")
    }
  }

  const handleBackToList = () => {
    setMobileView("list")
  }

  const handleInboxChange = (value: string) => {
    setWhatsappId(value === "all" ? null : Number(value))
  }

  const filterTabs = [
    { key: "open" as const, label: "Abertos" },
    { key: "pending" as const, label: "Pendentes" },
    { key: "closed" as const, label: "Fechados" },
    { key: "all" as const, label: "Todos" }
  ]

  const showList = !isMobile || mobileView === "list"
  const showChat = !isMobile || mobileView === "chat"

  return (
    <div className="flex h-full bg-gray-50">
      {/* LEFT PANEL - Ticket List */}
      {showList && (
        <div className={cn(
          "bg-white border-r border-gray-200/60 flex flex-col",
          isMobile ? "w-full" : "w-96 md:w-80 lg:w-96"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200/60">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold tracking-tight text-[#0A0A0A]">Tickets</h1>
            </div>

            {/* Inbox Selector */}
            {connections.length > 1 && (
              <div className="mb-4">
                <Select
                  value={whatsappId ? String(whatsappId) : "all"}
                  onValueChange={handleInboxChange}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Todas as caixas" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as caixas</SelectItem>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={String(conn.id)}>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                          <span>{conn.name}</span>
                          {conn.number && (
                            <span className="text-xs text-gray-400">
                              {conn.number}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "px-3 py-1.5 text-[0.7rem] font-medium rounded-full transition-colors whitespace-nowrap",
                    filter === tab.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tickets..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Ticket List */}
          <ScrollArea className="flex-1">
            {isLoading && tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Carregando tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum ticket encontrado
              </div>
            ) : (
              <div>
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    isSelected={selectedTicket?.id === ticket.id}
                    onClick={() => handleTicketClick(ticket)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* RIGHT PANEL - Chat */}
      {showChat && (
        <div className={cn("flex-1 flex flex-col", isMobile && "w-full")}>
          {isMobile && selectedTicket && (
            <div className="h-12 border-b border-gray-200/60 bg-white flex items-center px-3 gap-3">
              <button
                onClick={handleBackToList}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Voltar para lista"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-[#0A0A0A] truncate">
                {selectedTicket.contact?.name}
              </span>
            </div>
          )}
          {selectedTicket ? (
            <ChatPanel ticket={selectedTicket} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="mb-4 text-6xl">💬</div>
                <h3 className="text-xl font-semibold text-[#0A0A0A] mb-2">
                  Selecione um ticket
                </h3>
                <p className="text-sm">
                  Escolha um ticket na lista para começar a conversa
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
