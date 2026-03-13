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

export function PipelineView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("")
  const [stages, setStages] = useState<Stage[]>([])
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
            ? {
                ...opp,
                stageId: newStageId
              }
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
        setDialogOpen(false)
        setFormData({
          contactId: "",
          stageId: "",
          title: "",
          value: ""
        })
      }
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenDialog = () => {
    if (stages.length > 0) {
      const sortedStages = [...stages].sort((a, b) => a.order - b.order)
      setFormData({
        contactId: "",
        stageId: sortedStages[0].id.toString(),
        title: "",
        value: ""
      })
    }
    setDialogOpen(true)
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">CRM</h1>
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
          <Button onClick={handleOpenDialog} disabled={stages.length === 0}>
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
                  setFormData({
                    ...formData,
                    title: e.target.value
                  })
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
