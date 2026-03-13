import { useState } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/Button"
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
import api from "@/lib/api"
import type { Stage, ApiResponse } from "@/types"

interface StageManagerDialogProps {
  open: boolean
  onClose: () => void
  pipelineId: number
  pipelineName: string
  stages: Stage[]
  onStagesChanged: () => void
}

interface NewStageForm {
  name: string
  color: string
}

interface EditingStage {
  id: number
  name: string
  color: string
}

const STAGE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#6B7280"
]

export function StageManagerDialog({
  open,
  onClose,
  pipelineId,
  pipelineName,
  stages,
  onStagesChanged
}: StageManagerDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [editingStage, setEditingStage] = useState<EditingStage | null>(null)
  const [newStage, setNewStage] = useState<NewStageForm>({ name: "", color: "#3B82F6" })

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = newStage.name.trim()
    if (!name) return

    try {
      setIsSaving(true)
      setDeleteError("")

      const nextOrder = stages.length > 0
        ? Math.max(...stages.map((s) => s.order)) + 1
        : 0

      const response = await api.post<ApiResponse<Stage>>(
        `/pipelines/${pipelineId}/stages`,
        { name, order: nextOrder, color: newStage.color }
      )

      if (response.data.success) {
        setNewStage({ name: "", color: "#3B82F6" })
        onStagesChanged()
      }
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStage = async (stageId: number) => {
    if (!editingStage || editingStage.id !== stageId) return

    const name = editingStage.name.trim()
    if (!name) return

    try {
      setIsSaving(true)
      setDeleteError("")

      await api.put(`/pipelines/${pipelineId}/stages/${stageId}`, {
        name,
        color: editingStage.color
      })

      setEditingStage(null)
      onStagesChanged()
    } catch {
      // error handled silently
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStage = async (stageId: number) => {
    try {
      setIsSaving(true)
      setDeleteError("")

      await api.delete(`/pipelines/${pipelineId}/stages/${stageId}`)

      onStagesChanged()
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      setDeleteError(
        error.response?.data?.error ||
        "Nao foi possivel excluir a etapa."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (stage: Stage) => {
    setEditingStage({
      id: stage.id,
      name: stage.name,
      color: stage.color || "#6B7280"
    })
    setDeleteError("")
  }

  const cancelEditing = () => {
    setEditingStage(null)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Etapas</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova as etapas do pipeline <strong>{pipelineName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}

          {/* Existing stages */}
          <div className="space-y-2">
            {sortedStages.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                Nenhuma etapa cadastrada
              </p>
            ) : (
              sortedStages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />

                  {editingStage?.id === stage.id ? (
                    <>
                      <input
                        type="color"
                        value={editingStage.color}
                        onChange={(e) =>
                          setEditingStage({ ...editingStage, color: e.target.value })
                        }
                        className="h-8 w-8 shrink-0 cursor-pointer rounded border-0"
                      />
                      <Input
                        value={editingStage.name}
                        onChange={(e) =>
                          setEditingStage({ ...editingStage, name: e.target.value })
                        }
                        className="h-8 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleUpdateStage(stage.id)
                          }
                          if (e.key === "Escape") cancelEditing()
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        rounded="sm"
                        onClick={() => handleUpdateStage(stage.id)}
                        disabled={!editingStage.name.trim() || isSaving}
                        className="h-8"
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rounded="sm"
                        onClick={cancelEditing}
                        className="h-8"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: stage.color || "#6B7280" }}
                      />
                      <span
                        className="flex-1 cursor-pointer text-sm font-medium"
                        onClick={() => startEditing(stage)}
                      >
                        {stage.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rounded="sm"
                        onClick={() => startEditing(stage)}
                        className="h-8 px-2 text-gray-500"
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rounded="sm"
                        onClick={() => handleDeleteStage(stage.id)}
                        disabled={isSaving}
                        className="h-8 px-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add new stage */}
          <form onSubmit={handleAddStage} className="space-y-3">
            <Label className="text-sm font-medium">Nova etapa</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewStage({ ...newStage, color })}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newStage.color === color ? "#0A0A0A" : "transparent"
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={newStage.name}
                onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                placeholder="Nome da etapa"
                className="flex-1"
              />
              <Button
                type="submit"
                rounded="sm"
                disabled={!newStage.name.trim() || isSaving}
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            rounded="sm"
            onClick={onClose}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
