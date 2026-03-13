import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Zap, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  DataTable,
  SearchInput,
  ConfirmDialog
} from "@/components/shared"
import type { DataTableColumn } from "@/components/shared"
import { MacroForm } from "./MacroForm"
import { toast } from "sonner"
import api from "@/lib/api"
import type { Macro, WhatsApp, ApiResponse } from "@/types"

type VisibilityFilter = "all" | "personal" | "global"

export function MacroList() {
  const [macros, setMacros] = useState<Macro[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<VisibilityFilter>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editingMacro, setEditingMacro] = useState<Macro | undefined>()

  const [whatsapps, setWhatsapps] = useState<WhatsApp[]>([])

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    macro: Macro | null
  }>({ open: false, macro: null })

  useEffect(() => {
    api
      .get<ApiResponse<WhatsApp[]>>("/whatsapp")
      .then((res) => {
        if (res.data.success) setWhatsapps(res.data.data)
      })
      .catch(() => {})
  }, [])

  const whatsappMap = new Map(whatsapps.map((wa) => [wa.id, wa.name]))

  const fetchMacros = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get<ApiResponse<Macro[]>>("/macros", {
        params: { searchParam: searchTerm }
      })
      if (response.data.success) {
        setMacros(response.data.data)
      }
    } catch {
      toast.error("Erro ao carregar macros")
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchMacros()
  }, [fetchMacros])

  const filteredMacros =
    filter === "all"
      ? macros
      : macros.filter((m) => m.visibility === filter)

  const openCreateForm = () => {
    setEditingMacro(undefined)
    setFormOpen(true)
  }

  const openEditForm = (macro: Macro) => {
    setEditingMacro(macro)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteDialog.macro) return

    try {
      await api.delete(`/macros/${deleteDialog.macro.id}`)
      toast.success("Macro excluida com sucesso")
      fetchMacros()
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(error.response?.data?.error || "Erro ao excluir macro")
    }
  }

  const columns: DataTableColumn<Macro>[] = [
    {
      key: "name",
      label: "Nome",
      render: (macro) => (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{macro.name}</span>
        </div>
      )
    },
    {
      key: "visibility",
      label: "Visibilidade",
      hiddenOnMobile: true,
      render: (macro) => (
        <Badge
          variant={macro.visibility === "global" ? "default" : "secondary"}
        >
          {macro.visibility === "global" ? "Global" : "Pessoal"}
        </Badge>
      )
    },
    {
      key: "connections",
      label: "Conexao",
      hiddenOnMobile: true,
      render: (macro) => {
        if (!macro.whatsappIds || macro.whatsappIds.length === 0) {
          return <span className="text-gray-400">Todas</span>
        }
        const names = macro.whatsappIds
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
      key: "actionsCount",
      label: "Acoes",
      hiddenOnMobile: true,
      render: (macro) => (
        <span className="text-gray-500">{macro.actions.length}</span>
      )
    },
    {
      key: "createdBy",
      label: "Criado por",
      hiddenOnMobile: true,
      render: (macro) => (
        <span className="text-gray-500">
          {macro.createdBy?.name || "-"}
        </span>
      )
    },
    {
      key: "createdAt",
      label: "Criado em",
      hiddenOnMobile: true,
      render: (macro) => (
        <span className="text-gray-500">
          {format(new Date(macro.createdAt), "dd MMM yyyy", {
            locale: ptBR
          })}
        </span>
      )
    },
    {
      key: "tableActions",
      label: "",
      render: (macro) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            rounded="sm"
            onClick={(e) => {
              e.stopPropagation()
              openEditForm(macro)
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
              setDeleteDialog({ open: true, macro })
            }}
            className="h-8 px-2 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ]

  const filterTabs: { key: VisibilityFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "personal", label: "Minhas" },
    { key: "global", label: "Globais" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Macros</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sequencias de acoes executadas com um clique
          </p>
        </div>
        <Button rounded="sm" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Macro
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
          placeholder="Buscar macros..."
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredMacros}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nenhuma macro encontrada"
      />

      {/* Form Dialog */}
      <MacroForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        macro={editingMacro}
        onSuccess={fetchMacros}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, macro: open ? deleteDialog.macro : null })
        }
        title="Excluir Macro"
        description={`Tem certeza que deseja excluir a macro "${deleteDialog.macro?.name}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  )
}
