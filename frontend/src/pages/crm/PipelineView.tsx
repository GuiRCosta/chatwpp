import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
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
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { KanbanBoard } from "./KanbanBoard"
import api from "@/lib/api"
import type {
  Pipeline,
  Kanban,
  Stage,
  Opportunity,
  Contact,
  ApiResponse
} from "@/types"

interface KanbanWithStages extends Kanban {
  stages: Stage[]
}

interface OpportunityFormData {
  contactId: string
  stageId: string
  title: string
  value: string
}

interface OpportunitiesResponse {
  opportunities: Opportunity[]
  count: number
  hasMore: boolean
}

export function PipelineView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("")
  const [kanban, setKanban] = useState<KanbanWithStages | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
      fetchKanbanData()
    }
  }, [selectedPipelineId])

  const fetchPipelines = async () => {
    try {
      const response = await api.get<ApiResponse<Pipeline[]>>("/pipelines")
      if (response.data.success) {
        setPipelines(response.data.data)
        if (response.data.data.length > 0 && !selectedPipelineId) {
          setSelectedPipelineId(response.data.data[0].id.toString())
        }
      }
    } catch (error) {
      console.error("Failed to fetch pipelines:", error)
    }
  }

  const fetchKanbanData = async () => {
    try {
      setIsLoading(true)

      const selectedPipeline = pipelines.find(
        (p) => p.id.toString() === selectedPipelineId
      )
      if (!selectedPipeline) return

      const kanbanResponse = await api.get<ApiResponse<KanbanWithStages[]>>(
        "/kanbans"
      )

      if (kanbanResponse.data.success && kanbanResponse.data.data.length > 0) {
        const firstKanban = kanbanResponse.data.data[0]

        const kanbanDetailResponse = await api.get<
          ApiResponse<KanbanWithStages>
        >(`/kanbans/${firstKanban.id}`)

        if (kanbanDetailResponse.data.success) {
          setKanban(kanbanDetailResponse.data.data)

          const oppResponse = await api.get<
            ApiResponse<OpportunitiesResponse>
          >("/opportunities", {
            params: {
              pipelineId: selectedPipelineId
            }
          })

          if (oppResponse.data.success) {
            setOpportunities(oppResponse.data.data.opportunities)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch kanban data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await api.get<
        ApiResponse<{ contacts: Contact[]; count: number; hasMore: boolean }>
      >("/contacts", {
        params: {
          limit: 100
        }
      })
      if (response.data.success) {
        setContacts(response.data.data.contacts)
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
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
            ? {
                ...opp,
                stageId: newStageId
              }
            : opp
        )
      )
    } catch (error) {
      console.error("Failed to move opportunity:", error)
      throw error
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

      if (response.data.success) {
        setOpportunities([...opportunities, response.data.data])
        setDialogOpen(false)
        setFormData({
          contactId: "",
          stageId: "",
          title: "",
          value: ""
        })
      }
    } catch (error) {
      console.error("Failed to create opportunity:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenDialog = () => {
    if (kanban && kanban.stages.length > 0) {
      const firstStage = kanban.stages.sort((a, b) => a.order - b.order)[0]
      setFormData({
        contactId: "",
        stageId: firstStage.id.toString(),
        title: "",
        value: ""
      })
    }
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0A0A0A]">CRM</h1>
        <div className="flex items-center gap-4">
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
          <Button onClick={handleOpenDialog} disabled={!kanban}>
            <Plus className="h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : kanban && kanban.stages ? (
        <KanbanBoard
          stages={kanban.stages}
          opportunities={opportunities}
          onMoveOpportunity={handleMoveOpportunity}
        />
      ) : (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <p className="text-gray-500">
            Selecione um pipeline para visualizar o funil
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  setFormData({
                    ...formData,
                    contactId: value
                  })
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
                  setFormData({
                    ...formData,
                    stageId: value
                  })
                }
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {kanban?.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        {stage.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value
                  })
                }
                placeholder="Digite um título (opcional)"
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
                  setFormData({
                    ...formData,
                    value: e.target.value
                  })
                }
                placeholder="0.00"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                rounded="sm"
                onClick={() => setDialogOpen(false)}
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
