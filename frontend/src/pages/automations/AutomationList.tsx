import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Bot, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  DataTable,
  SearchInput,
  ConfirmDialog
} from "@/components/shared"
import type { DataTableColumn } from "@/components/shared"
import { AutomationForm } from "./AutomationForm"
import { toast } from "sonner"
import api from "@/lib/api"
import type { AutomationRule, AutomationEventName, WhatsApp, ApiResponse } from "@/types"

type EventFilter = "all" | AutomationEventName

const EVENT_LABELS: Record<AutomationEventName, string> = {
  message_created: "Mensagem recebida",
  conversation_created: "Conversa criada",
  conversation_updated: "Conversa atualizada"
}

const EVENT_COLORS: Record<AutomationEventName, "default" | "secondary" | "outline"> = {
  message_created: "default",
  conversation_created: "secondary",
  conversation_updated: "outline"
}

export function AutomationList() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<EventFilter>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>()
  const [whatsapps, setWhatsapps] = useState<WhatsApp[]>([])

  useEffect(() => {
    api
      .get<ApiResponse<WhatsApp[]>>("/whatsapp")
      .then((res) => {
        if (res.data.success) setWhatsapps(res.data.data)
      })
      .catch(() => {})
  }, [])

  const whatsappMap = new Map(whatsapps.map((wa) => [wa.id, wa.name]))

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    rule: AutomationRule | null
  }>({ open: false, rule: null })

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get<ApiResponse<AutomationRule[]>>(
        "/automation-rules",
        { params: { searchParam: searchTerm } }
      )
      if (response.data.success) {
        setRules(response.data.data)
      }
    } catch {
      toast.error("Erro ao carregar automacoes")
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const filteredRules =
    filter === "all"
      ? rules
      : rules.filter((r) => r.eventName === filter)

  const openCreateForm = () => {
    setEditingRule(undefined)
    setFormOpen(true)
  }

  const openEditForm = (rule: AutomationRule) => {
    setEditingRule(rule)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteDialog.rule) return

    try {
      await api.delete(`/automation-rules/${deleteDialog.rule.id}`)
      toast.success("Automacao excluida com sucesso")
      fetchRules()
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error.response?.data?.error || "Erro ao excluir automacao")
    }
  }

  const handleToggleActive = async (rule: AutomationRule) => {
    try {
      await api.put(`/automation-rules/${rule.id}`, {
        isActive: !rule.isActive
      })
      fetchRules()
    } catch {
      toast.error("Erro ao alterar status da automacao")
    }
  }

  const columns: DataTableColumn<AutomationRule>[] = [
    {
      key: "name",
      label: "Nome",
      render: (rule) => (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-500" />
          <span className="font-medium">{rule.name}</span>
        </div>
      )
    },
    {
      key: "eventName",
      label: "Evento",
      hiddenOnMobile: true,
      render: (rule) => (
        <Badge variant={EVENT_COLORS[rule.eventName]}>
          {EVENT_LABELS[rule.eventName]}
        </Badge>
      )
    },
    {
      key: "connections",
      label: "Conexao",
      hiddenOnMobile: true,
      render: (rule) => {
        if (!rule.whatsappIds || rule.whatsappIds.length === 0) {
          return <span className="text-gray-400">Todas</span>
        }
        const names = rule.whatsappIds
          .map((id) => whatsappMap.get(id))
          .filter(Boolean)
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <Badge key={name} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
        )
      }
    },
    {
      key: "conditions",
      label: "Condicoes",
      hiddenOnMobile: true,
      render: (rule) => (
        <span className="text-gray-500">
          {rule.conditions.length === 0
            ? "Nenhuma"
            : `${rule.conditions.length} condicao${rule.conditions.length > 1 ? "es" : ""}`}
        </span>
      )
    },
    {
      key: "actionsCount",
      label: "Acoes",
      hiddenOnMobile: true,
      render: (rule) => (
        <span className="text-gray-500">{rule.actions.length}</span>
      )
    },
    {
      key: "isActive",
      label: "Ativo",
      hiddenOnMobile: true,
      render: (rule) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleActive(rule)
          }}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
            rule.isActive ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              rule.isActive ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      )
    },
    {
      key: "createdAt",
      label: "Criado em",
      hiddenOnMobile: true,
      render: (rule) => (
        <span className="text-gray-500">
          {format(new Date(rule.createdAt), "dd MMM yyyy", {
            locale: ptBR
          })}
        </span>
      )
    },
    {
      key: "tableActions",
      label: "",
      render: (rule) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            rounded="sm"
            onClick={(e) => {
              e.stopPropagation()
              openEditForm(rule)
            }}
            className="h-8 px-2 text-gray-500"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            rounded="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteDialog({ open: true, rule })
            }}
            className="h-8 px-2 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ]

  const filterTabs: { key: EventFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "message_created", label: "Mensagem" },
    { key: "conversation_created", label: "Conversa criada" },
    { key: "conversation_updated", label: "Conversa atualizada" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Automacoes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Regras automaticas disparadas por eventos
          </p>
        </div>
        <Button rounded="sm" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Automacao
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white text-[#0A0A0A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar automacoes..."
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredRules}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nenhuma automacao encontrada"
      />

      {/* Form Dialog */}
      <AutomationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        rule={editingRule}
        onSuccess={fetchRules}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, rule: open ? deleteDialog.rule : null })
        }
        title="Excluir Automacao"
        description={`Tem certeza que deseja excluir a automacao "${deleteDialog.rule?.name}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  )
}
