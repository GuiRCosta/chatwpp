import { useCallback, useEffect, useState } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import {
  Megaphone,
  Plus,
  Play,
  XCircle,
  Pencil,
  Trash2,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/Button"
import { DataTable, DataTableColumn } from "@/components/shared/DataTable"
import { SearchInput } from "@/components/shared/SearchInput"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { CampaignForm } from "./CampaignForm"
import api from "@/lib/api"
import type { Campaign, PaginatedResponse } from "@/types"

type CampaignStatus = Campaign["status"]

type StatusFilter = "all" | CampaignStatus

interface StatusTab {
  readonly label: string
  readonly value: StatusFilter
}

const STATUS_TABS: readonly StatusTab[] = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Em Andamento", value: "running" },
  { label: "Concluidas", value: "completed" },
  { label: "Canceladas", value: "cancelled" }
] as const

const canStart = (status: CampaignStatus): boolean =>
  status === "pending"

const canCancel = (status: CampaignStatus): boolean =>
  status === "pending" || status === "running"

const ITEMS_PER_PAGE = 20

export function CampaignList() {
  const params = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [campaignToCancel, setCampaignToCancel] = useState<Campaign | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | undefined>(undefined)
  const [routeHandled, setRouteHandled] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true)
      const queryParams: Record<string, unknown> = {
        searchParam: searchTerm,
        pageNumber: page,
        limit: ITEMS_PER_PAGE
      }

      if (statusFilter !== "all") {
        queryParams.status = statusFilter
      }

      const response = await api.get<PaginatedResponse<Campaign>>(
        "/campaigns",
        { params: queryParams }
      )

      if (response.data.success) {
        setCampaigns(Array.isArray(response.data.data) ? response.data.data : [])
        setTotal(response.data.meta?.total ?? 0)
        setHasMore(response.data.meta?.hasMore ?? false)
      }
    } catch {
      setCampaigns([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, page, statusFilter])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Handle route-based actions: /campaigns/new, /campaigns/:id/edit
  useEffect(() => {
    if (routeHandled) return

    const isNewRoute = location.pathname === "/campaigns/new"
    const isEditRoute = location.pathname.endsWith("/edit") && params.id

    if (isNewRoute) {
      setCampaignToEdit(undefined)
      setFormOpen(true)
      setRouteHandled(true)
    } else if (isEditRoute && campaigns.length > 0) {
      const campaign = campaigns.find((c) => c.id === Number(params.id))
      if (campaign) {
        setCampaignToEdit(campaign)
        setFormOpen(true)
        setRouteHandled(true)
      }
    }
  }, [location.pathname, params.id, campaigns, routeHandled])

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    setPage(1)
  }, [])

  const handleStatusFilter = useCallback((status: StatusFilter) => {
    setStatusFilter(status)
    setPage(1)
  }, [])

  const handleStartCampaign = async (
    campaign: Campaign,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    try {
      await api.post(`/campaigns/${campaign.id}/start`)
      fetchCampaigns()
      toast.success("Campanha iniciada")
    } catch {
      toast.error("Erro ao iniciar campanha")
    }
  }

  const handleCancelClick = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation()
    setCampaignToCancel(campaign)
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!campaignToCancel) return

    try {
      await api.post(`/campaigns/${campaignToCancel.id}/cancel`)
      fetchCampaigns()
      toast.success("Campanha cancelada")
    } catch {
      toast.error("Erro ao cancelar campanha")
    }
  }

  const handleDeleteClick = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation()
    setCampaignToDelete(campaign)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return

    try {
      await api.delete(`/campaigns/${campaignToDelete.id}`)
      fetchCampaigns()
      toast.success("Campanha excluida com sucesso")
    } catch {
      toast.error("Erro ao excluir campanha")
    }
  }

  const handleRowClick = (campaign: Campaign) => {
    navigate(`/campaigns/${campaign.id}`)
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1)
    }
  }

  const formatDate = (dateString: string): string =>
    format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })

  const getContactsCount = (campaign: Campaign): number =>
    campaign.contacts?.length ?? 0

  const columns: DataTableColumn<Campaign>[] = [
    {
      key: "name",
      label: "Nome",
      render: (campaign) => (
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-[#0A0A0A]">{campaign.name}</span>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (campaign) => (
        <StatusBadge status={campaign.status} type="campaign" />
      )
    },
    {
      key: "scheduledAt",
      label: "Início",
      hiddenOnMobile: true,
      render: (campaign) => (
        <span className="text-gray-500">
          {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : "-"}
        </span>
      )
    },
    {
      key: "contacts",
      label: "Contatos",
      hiddenOnMobile: true,
      render: (campaign) => (
        <span className="text-gray-500">{getContactsCount(campaign)}</span>
      )
    },
    {
      key: "createdAt",
      label: "Criado em",
      hiddenOnMobile: true,
      render: (campaign) => (
        <span className="text-gray-500">{formatDate(campaign.createdAt)}</span>
      )
    },
    {
      key: "actions",
      label: "",
      render: (campaign) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/campaigns/${campaign.id}`)
            }}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setCampaignToEdit(campaign)
              setFormOpen(true)
            }}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {canStart(campaign.status) && (
            <button
              onClick={(e) => handleStartCampaign(campaign, e)}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-green-50 hover:text-green-600"
              title="Iniciar"
            >
              <Play className="h-4 w-4" />
            </button>
          )}

          {canCancel(campaign.status) && (
            <button
              onClick={(e) => handleCancelClick(campaign, e)}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-yellow-50 hover:text-yellow-600"
              title="Cancelar campanha"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={(e) => handleDeleteClick(campaign, e)}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4 p-4 font-[Inter] md:space-y-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-[#0A0A0A] md:text-2xl">Campanhas</h1>
        <Button onClick={() => { setCampaignToEdit(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Campanha</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Buscar campanhas..."
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusFilter(tab.value)}
              className={`rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-16 text-center shadow-sm">
          <Megaphone className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700">
            Nenhuma campanha encontrada
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Tente alterar os filtros ou o termo de busca."
              : "Crie sua primeira campanha para enviar mensagens em massa."}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={() => { setCampaignToEdit(undefined); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Nova Campanha
            </Button>
          )}
        </div>
      ) : (
        <>
          <DataTable
            data={campaigns}
            columns={columns}
            onRowClick={handleRowClick}
            isLoading={isLoading}
            emptyMessage="Nenhuma campanha encontrada"
          />

          {campaigns.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a{" "}
                {Math.min(page * ITEMS_PER_PAGE, total)} de {total} campanhas
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  rounded="sm"
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  rounded="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir campanha"
        description={`Tem certeza que deseja excluir a campanha "${campaignToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Excluir"
        variant="destructive"
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar campanha"
        description={`Tem certeza que deseja cancelar a campanha "${campaignToCancel?.name}"? As mensagens ainda não enviadas não serão processadas.`}
        onConfirm={handleCancelConfirm}
        confirmLabel="Cancelar campanha"
        variant="destructive"
      />

      <CampaignForm
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={campaignToEdit}
        onSuccess={fetchCampaigns}
      />
    </div>
  )
}
