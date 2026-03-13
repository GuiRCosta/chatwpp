import { useEffect, useState } from "react"
import {
  MessageSquare,
  UserCheck,
  Tag as TagIcon,
  XCircle,
  RotateCcw,
  Globe,
  Bell,
  Trash2,
  ChevronUp,
  ChevronDown,
  GitBranch,
  Paperclip,
  Upload,
  X
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select"
import api from "@/lib/api"
import type { MacroAction, MacroActionType, ApiResponse } from "@/types"

interface ActionCardProps {
  action: MacroAction
  index: number
  totalActions: number
  onUpdate: (index: number, action: MacroAction) => void
  onRemove: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

interface SimpleUser {
  id: number
  name: string
}

interface SimpleTag {
  id: number
  name: string
  color: string
}

interface SimplePipeline {
  id: number
  name: string
}

interface SimpleStage {
  id: number
  name: string
  color: string
  order: number
}

const ACTION_LABELS: Record<MacroActionType, string> = {
  send_message: "Enviar mensagem",
  assign_agent: "Atribuir agente",
  add_tag: "Adicionar tag",
  remove_tag: "Remover tag",
  close_ticket: "Fechar ticket",
  reopen_ticket: "Reabrir ticket",
  send_webhook: "Enviar webhook",
  send_notification: "Notificar admins",
  create_opportunity: "Criar oportunidade",
  send_media: "Enviar midia"
}

const ACTION_ICONS: Record<MacroActionType, React.ElementType> = {
  send_message: MessageSquare,
  assign_agent: UserCheck,
  add_tag: TagIcon,
  remove_tag: TagIcon,
  close_ticket: XCircle,
  reopen_ticket: RotateCcw,
  send_webhook: Globe,
  send_notification: Bell,
  create_opportunity: GitBranch,
  send_media: Paperclip
}

const WABA_ACCEPT =
  "image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/ogg,audio/aac,application/pdf"

export function ActionCard({
  action,
  index,
  totalActions,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown
}: ActionCardProps) {
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [tags, setTags] = useState<SimpleTag[]>([])
  const [pipelines, setPipelines] = useState<SimplePipeline[]>([])
  const [stages, setStages] = useState<SimpleStage[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const Icon = ACTION_ICONS[action.type] || MessageSquare
  const label = ACTION_LABELS[action.type] || action.type

  const needsUsers = action.type === "assign_agent"
  const needsTags = action.type === "add_tag" || action.type === "remove_tag"
  const needsPipelines = action.type === "create_opportunity"

  useEffect(() => {
    if (needsUsers && users.length === 0) {
      api
        .get<ApiResponse<SimpleUser[]>>("/users")
        .then((res) => {
          if (res.data.success) setUsers(res.data.data)
        })
        .catch(() => {})
    }
  }, [needsUsers, users.length])

  useEffect(() => {
    if (needsTags && tags.length === 0) {
      api
        .get<ApiResponse<SimpleTag[]>>("/tags")
        .then((res) => {
          if (res.data.success) setTags(res.data.data)
        })
        .catch(() => {})
    }
  }, [needsTags, tags.length])

  useEffect(() => {
    if (needsPipelines && pipelines.length === 0) {
      api
        .get<ApiResponse<SimplePipeline[]>>("/pipelines")
        .then((res) => {
          if (res.data.success) setPipelines(res.data.data)
        })
        .catch(() => {})
    }
  }, [needsPipelines, pipelines.length])

  useEffect(() => {
    const selectedPipelineId = Number(action.params.pipelineId)
    if (needsPipelines && selectedPipelineId) {
      api
        .get<
          ApiResponse<{ id: number; name: string; stages?: SimpleStage[] }>
        >(`/pipelines/${selectedPipelineId}`)
        .then((res) => {
          if (res.data.success && res.data.data.stages) {
            const sorted = [...res.data.data.stages].sort(
              (a, b) => a.order - b.order
            )
            setStages(sorted)
          }
        })
        .catch(() => setStages([]))
    } else if (needsPipelines) {
      setStages([])
    }
  }, [needsPipelines, action.params.pipelineId])

  const updateParam = (key: string, value: unknown) => {
    onUpdate(index, {
      ...action,
      params: { ...action.params, [key]: value }
    })
  }

  const toggleTagId = (tagId: number) => {
    const currentIds = (action.params.tagIds as number[]) || []
    const newIds = currentIds.includes(tagId)
      ? currentIds.filter((id) => id !== tagId)
      : [...currentIds, tagId]
    updateParam("tagIds", newIds)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("media", file)

    try {
      setIsUploading(true)
      const res = await api.post<
        ApiResponse<{
          mediaUrl: string
          mediaType: string
          originalName: string
        }>
      >("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      if (res.data.success) {
        const { mediaUrl, mediaType, originalName } = res.data.data
        onUpdate(index, {
          ...action,
          params: { ...action.params, mediaUrl, mediaType, originalName }
        })
      }
    } catch {
      // upload failed - user can try again
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    onUpdate(index, {
      ...action,
      params: { ...action.params, mediaUrl: "", mediaType: "", originalName: "" }
    })
  }

  const renderParams = () => {
    switch (action.type) {
      case "send_message":
        return (
          <div>
            <Label className="text-xs text-gray-500">Mensagem</Label>
            <textarea
              value={String(action.params.body || "")}
              onChange={(e) => updateParam("body", e.target.value)}
              placeholder="Digite a mensagem..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )

      case "assign_agent":
        return (
          <div>
            <Label className="text-xs text-gray-500">Agente</Label>
            <Select
              value={String(action.params.userId || "")}
              onValueChange={(val) => updateParam("userId", Number(val))}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "add_tag":
      case "remove_tag": {
        const selectedIds = (action.params.tagIds as number[]) || []
        return (
          <div>
            <Label className="text-xs text-gray-500">Tags</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTagId(tag.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-blue-100 text-blue-800 ring-1 ring-blue-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                )
              })}
              {tags.length === 0 && (
                <span className="text-xs text-gray-400">
                  Nenhuma tag encontrada
                </span>
              )}
            </div>
          </div>
        )
      }

      case "close_ticket":
      case "reopen_ticket":
        return null

      case "send_webhook":
        return (
          <div>
            <Label className="text-xs text-gray-500">URL do webhook</Label>
            <Input
              value={String(action.params.url || "")}
              onChange={(e) => updateParam("url", e.target.value)}
              placeholder="https://example.com/webhook"
              className="mt-1 h-9"
            />
          </div>
        )

      case "send_notification":
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-gray-500">Titulo</Label>
              <Input
                value={String(action.params.title || "")}
                onChange={(e) => updateParam("title", e.target.value)}
                placeholder="Titulo da notificacao"
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Mensagem</Label>
              <textarea
                value={String(action.params.message || "")}
                onChange={(e) => updateParam("message", e.target.value)}
                placeholder="Mensagem da notificacao..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        )

      case "create_opportunity":
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-gray-500">Pipeline</Label>
              <Select
                value={String(action.params.pipelineId || "")}
                onValueChange={(val) => {
                  onUpdate(index, {
                    ...action,
                    params: {
                      ...action.params,
                      pipelineId: Number(val),
                      stageId: 0
                    }
                  })
                }}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Selecione um pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {Number(action.params.pipelineId) > 0 && (
              <div>
                <Label className="text-xs text-gray-500">Etapa</Label>
                <Select
                  value={String(action.params.stageId || "")}
                  onValueChange={(val) => updateParam("stageId", Number(val))}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-500">
                Titulo{" "}
                <span className="text-gray-400">(opcional)</span>
              </Label>
              <Input
                value={String(action.params.title || "")}
                onChange={(e) => updateParam("title", e.target.value)}
                placeholder="Titulo da oportunidade"
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">
                Valor{" "}
                <span className="text-gray-400">(opcional)</span>
              </Label>
              <Input
                type="number"
                value={String(action.params.value || "")}
                onChange={(e) => updateParam("value", Number(e.target.value))}
                placeholder="0.00"
                className="mt-1 h-9"
              />
            </div>
          </div>
        )

      case "send_media": {
        const hasFile = !!action.params.mediaUrl
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-gray-500">Arquivo</Label>
              {hasFile ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate text-sm text-gray-700">
                    {String(
                      action.params.originalName || "Arquivo selecionado"
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Upload className="h-4 w-4" />
                  {isUploading
                    ? "Enviando..."
                    : "Clique para selecionar arquivo"}
                  <input
                    type="file"
                    className="hidden"
                    accept={WABA_ACCEPT}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Formatos: JPG, PNG, WebP, MP4, MP3, OGG, AAC, PDF
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">
                Legenda{" "}
                <span className="text-gray-400">(opcional)</span>
              </Label>
              <textarea
                value={String(action.params.body || "")}
                onChange={(e) => updateParam("body", e.target.value)}
                placeholder="Legenda da midia..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
            {index + 1}
          </span>
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMoveDown(index)}
            disabled={index === totalActions - 1}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-700"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {renderParams() && <div className="mt-3">{renderParams()}</div>}
    </div>
  )
}
