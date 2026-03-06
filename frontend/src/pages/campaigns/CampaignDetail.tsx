import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Pencil,
  Play,
  XCircle,
  Trash2,
  Users,
  Send,
  CheckCheck,
  Eye,
  AlertCircle,
  Clock,
  MessageSquare,
  Wifi
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import type { Campaign, CampaignContact, ApiResponse } from "@/types"

function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
}

const CONTACT_STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pendentes", icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  sent: { label: "Enviados", icon: Send, color: "text-blue-600 bg-blue-50 border-blue-200" },
  delivered: { label: "Entregues", icon: CheckCheck, color: "text-green-600 bg-green-50 border-green-200" },
  read: { label: "Lidos", icon: Eye, color: "text-purple-600 bg-purple-50 border-purple-200" },
  error: { label: "Erros", icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" }
}

const CONTACT_STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  read: "bg-purple-100 text-purple-700",
  error: "bg-red-100 text-red-700"
}

const CONTACT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviado",
  delivered: "Entregue",
  read: "Lido",
  error: "Erro"
}

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const fetchCampaign = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get<ApiResponse<Campaign>>(`/campaigns/${id}`)
      if (response.data.success && response.data.data) {
        setCampaign(response.data.data)
      }
    } catch {
      toast.error("Erro ao carregar campanha")
      navigate("/campaigns")
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const handleStart = async () => {
    try {
      setActionLoading(true)
      await api.post(`/campaigns/${id}/start`)
      toast.success("Campanha iniciada")
      await fetchCampaign()
    } catch {
      toast.error("Erro ao iniciar campanha")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setActionLoading(true)
      await api.post(`/campaigns/${id}/cancel`)
      toast.success("Campanha cancelada")
      setCancelDialogOpen(false)
      await fetchCampaign()
    } catch {
      toast.error("Erro ao cancelar campanha")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await api.delete(`/campaigns/${id}`)
      toast.success("Campanha excluida")
      navigate("/campaigns")
    } catch {
      toast.error("Erro ao excluir campanha")
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  const canStart = campaign?.status === "pending" || campaign?.status === "scheduled"
  const canCancel = campaign?.status === "pending" || campaign?.status === "scheduled" || campaign?.status === "running"
  const canEdit = campaign?.status === "pending" || campaign?.status === "scheduled"
  const canDelete = campaign?.status !== "running" && campaign?.status !== "processing"

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (!campaign) return null

  const counts = campaign.contactCounts ?? { pending: 0, sent: 0, delivered: 0, read: 0, error: 0 }
  const totalContacts = counts.pending + counts.sent + counts.delivered + counts.read + counts.error
  const contacts = campaign.campaignContacts ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/campaigns")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{campaign.name}</h1>
          <StatusBadge status={campaign.status} type="campaign" />
        </div>

        <div className="flex items-center gap-2">
          {canStart && (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-1 h-4 w-4" />
              Iniciar
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/campaigns/${id}/edit`)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
              disabled={actionLoading}
              className="text-orange-600 hover:bg-orange-50"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionLoading}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Template</p>
              <p className="font-medium text-gray-900">{campaign.templateName || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-50 p-2">
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conexao WhatsApp</p>
              <p className="font-medium text-gray-900">{campaign.whatsapp?.name || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-50 p-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Contatos</p>
              <p className="font-medium text-gray-900">{totalContacts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dates */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <span>Criada em: {formatDate(campaign.createdAt)}</span>
        {campaign.scheduledAt && (
          <span>Agendada para: {formatDate(campaign.scheduledAt)}</span>
        )}
      </div>

      {/* Status Counts */}
      {totalContacts > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(CONTACT_STATUS_CONFIG).map(([status, config]) => {
            const Icon = config.icon
            const count = counts[status as keyof typeof counts] ?? 0
            return (
              <Card key={status} className={`border ${config.color.split(" ").slice(1).join(" ")}`}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`h-5 w-5 ${config.color.split(" ")[0]}`} />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs">{config.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Contatos ({totalContacts})</h2>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Nenhum contato adicionado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Nome</th>
                    <th className="pb-3 font-medium">Numero</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="hidden pb-3 font-medium sm:table-cell">Enviado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contacts.map((cc: CampaignContact) => (
                    <tr key={cc.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">
                        {cc.contact?.name ?? "—"}
                      </td>
                      <td className="py-3 text-gray-600">
                        {cc.contact?.number ?? "—"}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CONTACT_STATUS_BADGE[cc.status] ?? ""}`}>
                          {CONTACT_STATUS_LABEL[cc.status] ?? cc.status}
                        </span>
                      </td>
                      <td className="hidden py-3 text-gray-500 sm:table-cell">
                        {cc.sentAt ? formatDate(cc.sentAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar campanha"
        description={`Tem certeza que deseja cancelar a campanha "${campaign.name}"?`}
        confirmLabel="Cancelar campanha"
        variant="destructive"
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir campanha"
        description={`Tem certeza que deseja excluir a campanha "${campaign.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
