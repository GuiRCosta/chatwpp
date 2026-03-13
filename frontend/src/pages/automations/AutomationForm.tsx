import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
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
import {
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
import { ActionCard } from "../macros/ActionCard"
import { ConditionCard } from "./ConditionCard"
import { toast } from "sonner"
import api from "@/lib/api"
import type {
  AutomationRule,
  AutomationCondition,
  AutomationEventName,
  MacroAction,
  MacroActionType,
  ApiResponse
} from "@/types"

interface AutomationFormProps {
  open: boolean
  onClose: () => void
  rule?: AutomationRule
  onSuccess: () => void
}

const EVENT_OPTIONS: { value: AutomationEventName; label: string }[] = [
  { value: "message_created", label: "Mensagem recebida" },
  { value: "conversation_created", label: "Conversa criada" },
  { value: "conversation_updated", label: "Conversa atualizada" }
]

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

function createDefaultAction(type: MacroActionType): MacroAction {
  const params: Record<string, unknown> = {}

  if (type === "send_message") {
    params.body = ""
  } else if (type === "add_tag" || type === "remove_tag") {
    params.tagIds = []
  } else if (type === "send_webhook") {
    params.url = ""
  } else if (type === "send_notification") {
    params.title = ""
    params.message = ""
  } else if (type === "assign_agent") {
    params.userId = 0
  } else if (type === "create_opportunity") {
    params.pipelineId = 0
    params.stageId = 0
    params.title = ""
    params.value = 0
  } else if (type === "send_media") {
    params.mediaUrl = ""
    params.mediaType = ""
    params.originalName = ""
    params.body = ""
  } else if (type === "wait") {
    params.duration = 5
    params.unit = "seconds"
  }

  return { type, params }
}

export function AutomationForm({ open, onClose, rule, onSuccess }: AutomationFormProps) {
  const isEditing = !!rule

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [eventName, setEventName] = useState<AutomationEventName>("message_created")
  const [conditions, setConditions] = useState<AutomationCondition[]>([])
  const [actions, setActions] = useState<MacroAction[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && rule) {
      setName(rule.name)
      setDescription(rule.description || "")
      setEventName(rule.eventName)
      setConditions(rule.conditions)
      setActions(rule.actions)
      setErrors({})
    } else if (open) {
      setName("")
      setDescription("")
      setEventName("message_created")
      setConditions([])
      setActions([])
      setErrors({})
    }
  }, [open, rule])

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        attribute: "message.body",
        operator: "contains",
        value: "",
        queryOperator: "AND"
      }
    ])
  }

  const updateCondition = (index: number, condition: AutomationCondition) => {
    const updated = [...conditions]
    updated[index] = condition
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const addAction = (type: MacroActionType) => {
    setActions([...actions, createDefaultAction(type)])
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
        eventName,
        conditions,
        actions
      }

      if (isEditing) {
        await api.put<ApiResponse<AutomationRule>>(
          `/automation-rules/${rule.id}`,
          payload
        )
        toast.success("Automacao atualizada com sucesso")
      } else {
        await api.post<ApiResponse<AutomationRule>>(
          "/automation-rules",
          payload
        )
        toast.success("Automacao criada com sucesso")
      }

      onSuccess()
      onClose()
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } }
      toast.error(
        error.response?.data?.error || "Erro ao salvar automacao"
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
            {isEditing ? "Editar Automacao" : "Nova Automacao"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifique as condicoes e acoes da automacao."
              : "Crie uma regra que sera executada automaticamente quando o evento ocorrer."}
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
                <Label htmlFor="automation-name">Nome</Label>
                <Input
                  id="automation-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Responder sobre preco"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="automation-description">
                  Descricao{" "}
                  <span className="text-gray-400">(opcional)</span>
                </Label>
                <textarea
                  id="automation-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que essa automacao faz..."
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Event */}
              <div>
                <Label>Evento</Label>
                <Select
                  value={eventName}
                  onValueChange={(val) =>
                    setEventName(val as AutomationEventName)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>
                    Condicoes{" "}
                    <span className="text-gray-400">(opcional)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rounded="sm"
                    onClick={addCondition}
                    disabled={conditions.length >= 10}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Condicao
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {conditions.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Sem condicoes — a automacao sera executada para todos os
                      eventos do tipo selecionado.
                    </p>
                  ) : (
                    conditions.map((condition, i) => (
                      <ConditionCard
                        key={i}
                        condition={condition}
                        index={i}
                        totalConditions={conditions.length}
                        onUpdate={updateCondition}
                        onRemove={removeCondition}
                      />
                    ))
                  )}
                </div>
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
                  : "Criar automacao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
