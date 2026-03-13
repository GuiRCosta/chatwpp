import { useState, useEffect } from "react"
import {
  Plus,
  MessageSquare,
  UserCheck,
  Tag as TagIcon,
  XCircle,
  RotateCcw,
  Globe,
  Bell,
  GitBranch,
  Paperclip,
  Clock
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/DropdownMenu"
import { ActionCard } from "./ActionCard"
import { toast } from "sonner"
import api from "@/lib/api"
import type { Macro, MacroAction, MacroActionType, ApiResponse } from "@/types"

interface MacroFormProps {
  open: boolean
  onClose: () => void
  macro?: Macro
  onSuccess: () => void
}

const ACTION_TYPES: {
  type: MacroActionType
  label: string
  icon: React.ElementType
}[] = [
  { type: "send_message", label: "Enviar mensagem", icon: MessageSquare },
  { type: "assign_agent", label: "Atribuir agente", icon: UserCheck },
  { type: "add_tag", label: "Adicionar tag", icon: TagIcon },
  { type: "remove_tag", label: "Remover tag", icon: TagIcon },
  { type: "close_ticket", label: "Fechar ticket", icon: XCircle },
  { type: "reopen_ticket", label: "Reabrir ticket", icon: RotateCcw },
  { type: "send_webhook", label: "Enviar webhook", icon: Globe },
  { type: "send_notification", label: "Notificar admins", icon: Bell },
  { type: "create_opportunity", label: "Criar oportunidade", icon: GitBranch },
  { type: "send_media", label: "Enviar midia", icon: Paperclip },
  { type: "wait", label: "Aguardar", icon: Clock }
]

export function MacroForm({ open, onClose, macro, onSuccess }: MacroFormProps) {
  const isEditing = !!macro

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"personal" | "global">(
    "personal"
  )
  const [actions, setActions] = useState<MacroAction[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && macro) {
      setName(macro.name)
      setDescription(macro.description || "")
      setVisibility(macro.visibility)
      setActions(macro.actions)
      setErrors({})
    } else if (open) {
      setName("")
      setDescription("")
      setVisibility("personal")
      setActions([])
      setErrors({})
    }
  }, [open, macro])

  const addAction = (type: MacroActionType) => {
    const newAction: MacroAction = { type, params: {} }

    if (type === "send_message") {
      newAction.params = { body: "" }
    } else if (type === "add_tag" || type === "remove_tag") {
      newAction.params = { tagIds: [] }
    } else if (type === "send_webhook") {
      newAction.params = { url: "" }
    } else if (type === "send_notification") {
      newAction.params = { title: "", message: "" }
    } else if (type === "assign_agent") {
      newAction.params = { userId: 0 }
    } else if (type === "create_opportunity") {
      newAction.params = { pipelineId: 0, stageId: 0, title: "", value: 0 }
    } else if (type === "send_media") {
      newAction.params = { mediaUrl: "", mediaType: "", originalName: "", body: "" }
    } else if (type === "wait") {
      newAction.params = { duration: 5, unit: "seconds" }
    }

    setActions([...actions, newAction])
  }

  const updateAction = (index: number, action: MacroAction) => {
    const updated = [...actions]
    updated[index] = action
    setActions(updated)
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const moveAction = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= actions.length) return

    const updated = [...actions]
    const temp = updated[targetIndex]
    updated[targetIndex] = updated[index]
    updated[index] = temp
    setActions(updated)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Nome e obrigatorio"
    }

    if (actions.length === 0) {
      newErrors.actions = "Adicione pelo menos uma acao"
    }

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      if (action.type === "send_message" && !String(action.params.body || "").trim()) {
        newErrors[`action_${i}`] = "Mensagem nao pode estar vazia"
      }
      if (action.type === "assign_agent" && !action.params.userId) {
        newErrors[`action_${i}`] = "Selecione um agente"
      }
      if (
        (action.type === "add_tag" || action.type === "remove_tag") &&
        (!Array.isArray(action.params.tagIds) ||
          (action.params.tagIds as number[]).length === 0)
      ) {
        newErrors[`action_${i}`] = "Selecione pelo menos uma tag"
      }
      if (action.type === "send_webhook" && !String(action.params.url || "").trim()) {
        newErrors[`action_${i}`] = "URL e obrigatoria"
      }
      if (action.type === "create_opportunity") {
        if (!action.params.pipelineId) {
          newErrors[`action_${i}`] = "Selecione um pipeline"
        } else if (!action.params.stageId) {
          newErrors[`action_${i}`] = "Selecione uma etapa"
        }
      }
      if (action.type === "send_media" && !String(action.params.mediaUrl || "").trim()) {
        newErrors[`action_${i}`] = "Faca upload de um arquivo"
      }
      if (action.type === "wait" && (!action.params.duration || Number(action.params.duration) <= 0)) {
        newErrors[`action_${i}`] = "Informe um tempo valido"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsSaving(true)

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
        actions
      }

      if (isEditing) {
        await api.put<ApiResponse<Macro>>(`/macros/${macro.id}`, payload)
        toast.success("Macro atualizada com sucesso")
      } else {
        await api.post<ApiResponse<Macro>>("/macros", payload)
        toast.success("Macro criada com sucesso")
      }

      onSuccess()
      onClose()
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(
        error.response?.data?.error || "Erro ao salvar macro"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Macro" : "Nova Macro"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique as acoes e configuracoes da macro."
              : "Crie uma sequencia de acoes que pode ser executada com um clique."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4 pb-4">
              {/* Name */}
              <div>
                <Label htmlFor="macro-name">Nome</Label>
                <Input
                  id="macro-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Fechar e agradecer"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="macro-description">
                  Descricao{" "}
                  <span className="text-gray-400">(opcional)</span>
                </Label>
                <textarea
                  id="macro-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que essa macro faz..."
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Visibility */}
              <div>
                <Label>Visibilidade</Label>
                <Select
                  value={visibility}
                  onValueChange={(val) =>
                    setVisibility(val as "personal" | "global")
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">
                      Pessoal (somente eu)
                    </SelectItem>
                    <SelectItem value="global">
                      Global (todos os agentes)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Acoes</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        rounded="sm"
                        disabled={actions.length >= 20}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Adicionar acao
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ACTION_TYPES.map(({ type, label, icon: ItemIcon }) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => addAction(type)}
                        >
                          <ItemIcon className="mr-2 h-4 w-4" />
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {errors.actions && (
                  <p className="mt-1 text-xs text-red-500">{errors.actions}</p>
                )}

                <div className="mt-3 space-y-2">
                  {actions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                      <p className="text-sm text-gray-500">
                        Nenhuma acao adicionada. Clique em "Adicionar acao"
                        para comecar.
                      </p>
                    </div>
                  ) : (
                    actions.map((action, i) => (
                      <div key={i}>
                        <ActionCard
                          action={action}
                          index={i}
                          totalActions={actions.length}
                          onUpdate={updateAction}
                          onRemove={removeAction}
                          onMoveUp={(idx) => moveAction(idx, "up")}
                          onMoveDown={(idx) => moveAction(idx, "down")}
                        />
                        {errors[`action_${i}`] && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors[`action_${i}`]}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              rounded="sm"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" rounded="sm" disabled={isSaving}>
              {isSaving
                ? "Salvando..."
                : isEditing
                  ? "Salvar"
                  : "Criar macro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
