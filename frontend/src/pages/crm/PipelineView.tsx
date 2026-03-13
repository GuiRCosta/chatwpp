import { useEffect, useState } from "react"
import { Plus, MoreVertical, Pencil, Trash2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/DropdownMenu"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { KanbanBoard } from "./KanbanBoard"
import { StageManagerDialog } from "./StageManagerDialog"
import api from "@/lib/api"
import type {
  Pipeline,
  Stage,
  Opportunity,
  Contact,
  ApiResponse,
  PaginatedResponse
} from "@/types"

interface PipelineWithStages extends Pipeline {
  stages: Stage[]
}

interface OpportunityFormData {
  contactId: string
  stageId: string
  title: string
  value: string
}

type PipelineDialog =
  | { type: "none" }
  | { type: "create-pipeline" }
  | { type: "edit-pipeline"; pipeline: Pipeline }
  | { type: "delete-pipeline"; pipeline: Pipeline }
  | { type: "manage-stages" }
  | { type: "create-opportunity" }

export function PipelineView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("")
  const [stages, setStages] = useState<Stage[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeDialog, setActiveDialog] = useState<PipelineDialog>({ type: "none" })
  const [pipelineName, setPipelineName] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [formData, setFormData] = useState<OpportunityFormData>({
    contactId: "",
    stageId: "",
    title: "",
    value: ""
  })

  useEffect(() => {
    fetchPipelines()
    fetchContacts()
  }, [])

  useEffect(() => {
    if (selectedPipelineId) {
      fetchPipelineData()
    }
  }, [selectedPipelineId])

  const fetchPipelines = async () => {
    try {
      const response = await api.get<ApiResponse<Pipeline[]>>("/pipelines")
      if (response.data.success) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : []
        setPipelines(data)
        if (data.length > 0 && !selectedPipelineId) {
          setSelectedPipelineId(data[0].id.toString())
        }
      }
    } catch {
      setPipelines([])
    }
  }

  const fetchPipelineData = async () => {
    try {
      setIsLoading(true)

      const pipelineResponse = await api.get<ApiResponse<PipelineWithStages>>(
        `/pipelines/${selectedPipelineId}`
      )

      if (pipelineResponse.data.success && pipelineResponse.data.data) {
        const pipelineStages = Array.isArray(pipelineResponse.data.data.stages)
          ? pipelineResponse.data.data.stages
          : []

        setStages(pipelineStages)

        const oppResponse = await api.get<PaginatedResponse<Opportunity>>(
          "/opportunities",
          {
            params: {
              pipelineId: selectedPipelineId,
              limit: 500
            }
          }
        )

        if (oppResponse.data.success) {
          setOpportunities(
            Array.isArray(oppResponse.data.data)
              ? oppResponse.data.data
              : []
          )
        }
      }
    } catch {
      setStages([])
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await api.get<PaginatedResponse<Contact>>(
        "/contacts",
        {
          params: {
            limit: 100
          }
        }
      )
      if (response.data.success) {
        setContacts(
          Array.isArray(response.data.data) ? response.data.data : []
        )
      }
    } catch {
      setContacts([])
    }
  }

  const handleMoveOpportunity = async (
    opportunityId: number,
    newStageId: number
  ) => {
    try {
      await api.put(`/opportunities/${opportunityId}/move`, {
        stageId: newStageId
      })

      setOpportunities(
        opportunities.map((opp) =>
          opp.id === opportunityId
            ? { ...opp, stageId: newStageId }
            : opp
        )
      )
    } catch {
      fetchPipelineData()
    }
  }

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.contactId || !formData.stageId) {
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        contactId: parseInt(formData.contactId, 10),
        pipelineId: parseInt(selectedPipelineId, 10),
        stageId: parseInt(formData.stageId, 10),
        title: formData.title.trim() || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined
      }

      const response = await api.post<ApiResponse<Opportunity>>(
        "/opportunities",
        payload
      )

      if (response.data.success && response.data.data) {
        setOpportunities([...opportunities, response.data.data])
        closeDialog()
      }
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = pipelineName.trim()
    if (!name) return

    try {
      setIsSaving(true)

      const response = await api.post<ApiResponse<Pipeline>>(
        "/pipelines",
        { name }
      )

      if (response.data.success && response.data.data) {
        const created = response.data.data
        setPipelines([...pipelines, created])
        setSelectedPipelineId(created.id.toString())
        closeDialog()
      }
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditPipeline = async (e: React.FormEvent) => {
    e.preventDefault()

    if (activeDialog.type !== "edit-pipeline") return

    const name = pipelineName.trim()
    if (!name) return

    const pipelineId = activeDialog.pipeline.id

    try {
      setIsSaving(true)

      const response = await api.put<ApiResponse<Pipeline>>(
        `/pipelines/${pipelineId}`,
        { name }
      )

      if (response.data.success && response.data.data) {
        const updated = response.data.data
        setPipelines(
          pipelines.map((p) => (p.id === pipelineId ? { ...p, name: updated.name } : p))
        )
        closeDialog()
      }
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePipeline = async () => {
    if (activeDialog.type !== "delete-pipeline") return

    const pipelineId = activeDialog.pipeline.id

    try {
      setIsSaving(true)
      setDeleteError("")

      await api.delete(`/pipelines/${pipelineId}`)

      const remaining = pipelines.filter((p) => p.id !== pipelineId)
      setPipelines(remaining)

      if (selectedPipelineId === pipelineId.toString()) {
        if (remaining.length > 0) {
          setSelectedPipelineId(remaining[0].id.toString())
        } else {
          setSelectedPipelineId("")
          setStages([])
          setOpportunities([])
        }
      }

      closeDialog()
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      setDeleteError(
        error.response?.data?.error ||
        "Nao foi possivel excluir o pipeline. Verifique se nao ha oportunidades vinculadas."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const closeDialog = () => {
    setActiveDialog({ type: "none" })
    setPipelineName("")
    setDeleteError("")
    setFormData({ contactId: "", stageId: "", title: "", value: "" })
  }

  const openCreatePipelineDialog = () => {
    setPipelineName("")
    setActiveDialog({ type: "create-pipeline" })
  }

  const openEditPipelineDialog = () => {
    const current = pipelines.find((p) => p.id.toString() === selectedPipelineId)
    if (!current) return
    setPipelineName(current.name)
    setActiveDialog({ type: "edit-pipeline", pipeline: current })
  }

  const openDeletePipelineDialog = () => {
    const current = pipelines.find((p) => p.id.toString() === selectedPipelineId)
    if (!current) return
    setDeleteError("")
    setActiveDialog({ type: "delete-pipeline", pipeline: current })
  }

  const openCreateOpportunityDialog = () => {
    if (stages.length > 0) {
      const sorted = [...stages].sort((a, b) => a.order - b.order)
      setFormData({
        contactId: "",
        stageId: sorted[0].id.toString(),
        title: "",
        value: ""
      })
    }
    setActiveDialog({ type: "create-opportunity" })
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)
  const selectedPipeline = pipelines.find(
    (p) => p.id.toString() === selectedPipelineId
  )

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">CRM</h1>
        <div className="flex items-center gap-3">
          <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione um pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPipeline && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveDialog({ type: "manage-stages" })}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Gerenciar etapas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openEditPipelineDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar pipeline
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openDeletePipelineDialog}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir pipeline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="outline" onClick={openCreatePipelineDialog}>
            <Plus className="h-4 w-4" />
            Novo Pipeline
          </Button>

          <Button onClick={openCreateOpportunityDialog} disabled={stages.length === 0}>
            <Plus className="h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : stages.length > 0 ? (
        <KanbanBoard
          stages={sortedStages}
          opportunities={opportunities}
          onMoveOpportunity={handleMoveOpportunity}
        />
      ) : (
        <div className="flex min-h-[400px] items-center justify-center rounded-[2rem] border border-gray-200 bg-white">
          <p className="text-gray-500">
            {pipelines.length === 0
              ? "Crie um pipeline para comecar"
              : "Selecione um pipeline para visualizar o funil"}
          </p>
        </div>
      )}

      {/* Create Pipeline Dialog */}
      <Dialog
        open={activeDialog.type === "create-pipeline"}
        onOpenChange={(open) => { if (!open) closeDialog() }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Pipeline</DialogTitle>
            <DialogDescription>
              Crie um novo pipeline para organizar suas oportunidades
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePipeline} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pipeline-name"
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Ex: Vendas, Onboarding, Suporte"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                rounded="sm"
                onClick={closeDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                rounded="sm"
                disabled={!pipelineName.trim() || isSaving}
              >
                {isSaving ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Pipeline Dialog */}
      <Dialog
        open={activeDialog.type === "edit-pipeline"}
        onOpenChange={(open) => { if (!open) closeDialog() }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pipeline</DialogTitle>
            <DialogDescription>
              Altere o nome do pipeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPipeline} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pipeline-name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-pipeline-name"
                type="text"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Nome do pipeline"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                rounded="sm"
                onClick={closeDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                rounded="sm"
                disabled={!pipelineName.trim() || isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Pipeline Dialog */}
      <Dialog
        open={activeDialog.type === "delete-pipeline"}
        onOpenChange={(open) => { if (!open) closeDialog() }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Pipeline</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o pipeline{" "}
              <strong>
                {activeDialog.type === "delete-pipeline"
                  ? activeDialog.pipeline.name
                  : ""}
              </strong>
              ? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              rounded="sm"
              onClick={closeDialog}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              rounded="sm"
              onClick={handleDeletePipeline}
              disabled={isSaving}
            >
              {isSaving ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Stages Dialog */}
      {selectedPipeline && (
        <StageManagerDialog
          open={activeDialog.type === "manage-stages"}
          onClose={closeDialog}
          pipelineId={selectedPipeline.id}
          pipelineName={selectedPipeline.name}
          stages={stages}
          onStagesChanged={fetchPipelineData}
        />
      )}

      {/* Create Opportunity Dialog */}
      <Dialog
        open={activeDialog.type === "create-opportunity"}
        onOpenChange={(open) => { if (!open) closeDialog() }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
            <DialogDescription>
              Crie uma nova oportunidade no pipeline selecionado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOpportunity} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact">
                Contato <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.contactId}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactId: value })
                }
              >
                <SelectTrigger id="contact">
                  <SelectValue placeholder="Selecione um contato" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">
                Etapa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.stageId}
                onValueChange={(value) =>
                  setFormData({ ...formData, stageId: value })
                }
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {sortedStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Digite um titulo (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                rounded="sm"
                onClick={closeDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                rounded="sm"
                disabled={!formData.contactId || !formData.stageId || isSaving}
              >
                {isSaving ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
