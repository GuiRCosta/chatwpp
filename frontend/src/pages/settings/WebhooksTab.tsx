import { useCallback, useEffect, useState } from "react"
import {
  Link2,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Copy,
  Check
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog"
import api from "@/lib/api"
import type { TenantWebhook } from "@/types"

const EVENT_LABELS: Record<string, string> = {
  message_created: "Mensagem criada",
  conversation_created: "Conversa criada",
  conversation_status_changed: "Status alterado",
  contact_created: "Contato criado",
  "*": "Todos os eventos"
}

const AVAILABLE_EVENTS = [
  "message_created",
  "conversation_created",
  "conversation_status_changed",
  "contact_created"
]

interface WebhookForm {
  url: string
  events: string[]
  secret: string
  isActive: boolean
}

const DEFAULT_FORM: WebhookForm = {
  url: "",
  events: [],
  secret: "",
  isActive: true
}

function generateSecret(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from(
    { length: 32 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("")
}

export function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<TenantWebhook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<WebhookForm>({ ...DEFAULT_FORM })
  const [isSaving, setIsSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<TenantWebhook | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const fetchWebhooks = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get<{ data: TenantWebhook[] }>(
        "/webhook-configs"
      )
      setWebhooks(
        Array.isArray(response.data.data) ? response.data.data : []
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar webhooks"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, secret: generateSecret() })
    setDialogOpen(true)
  }

  const handleOpenEdit = (webhook: TenantWebhook) => {
    setEditingId(webhook.id)
    setForm({
      url: webhook.url,
      events: [...webhook.events],
      secret: webhook.secret || "",
      isActive: webhook.isActive
    })
    setDialogOpen(true)
  }

  const handleToggleEvent = (event: string) => {
    setForm((prev) => {
      const events = prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event]
      return { ...prev, events }
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const payload = {
        url: form.url,
        events: form.events,
        secret: form.secret || undefined,
        isActive: form.isActive
      }

      if (editingId) {
        await api.put(`/webhook-configs/${editingId}`, payload)
        toast.success("Webhook atualizado com sucesso")
      } else {
        await api.post("/webhook-configs", payload)
        toast.success("Webhook criado com sucesso")
      }

      setDialogOpen(false)
      await fetchWebhooks()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar webhook"
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setError(null)
      await api.delete(`/webhook-configs/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchWebhooks()
      toast.success("Webhook excluido com sucesso")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir webhook"
      setError(message)
      toast.error(message)
    }
  }

  const handleToggleActive = async (webhook: TenantWebhook) => {
    try {
      setError(null)
      await api.put(`/webhook-configs/${webhook.id}`, {
        isActive: !webhook.isActive
      })
      await fetchWebhooks()
      toast.success(webhook.isActive ? "Webhook desativado" : "Webhook ativado")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar webhook"
      setError(message)
      toast.error(message)
    }
  }

  const handleCopySecret = async () => {
    if (form.secret) {
      await navigator.clipboard.writeText(form.secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const isFormValid = form.url.trim() && form.events.length > 0

  return (
    <>
      <Card className="rounded-2xl bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5 text-blue-600" />
                Webhooks de Integracao
              </CardTitle>
              <CardDescription>
                Configure webhooks para notificar sistemas externos sobre
                eventos
              </CardDescription>
            </div>
            <Button size="sm" rounded="lg" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Novo Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : webhooks.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhum webhook configurado
            </p>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate text-sm">
                        {webhook.url}
                      </span>
                      <Badge
                        variant={
                          webhook.isActive ? "default" : "secondary"
                        }
                        className="text-[10px] shrink-0"
                      >
                        {webhook.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {EVENT_LABELS[event] || event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      rounded="sm"
                      onClick={() => handleToggleActive(webhook)}
                      title={
                        webhook.isActive ? "Desativar" : "Ativar"
                      }
                    >
                      <div
                        className={`w-8 h-4 rounded-full transition-colors ${
                          webhook.isActive
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mt-[1px] ${
                            webhook.isActive
                              ? "translate-x-[18px]"
                              : "translate-x-[1px]"
                          }`}
                        />
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      rounded="sm"
                      onClick={() => handleOpenEdit(webhook)}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      rounded="sm"
                      onClick={() => setDeleteTarget(webhook)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Webhook" : "Novo Webhook"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize a configuracao do webhook"
                : "Configure um novo webhook para receber eventos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL do Webhook</Label>
              <Input
                id="webhookUrl"
                value={form.url}
                onChange={(e) =>
                  setForm({ ...form, url: e.target.value })
                }
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="space-y-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.events.includes(event)}
                      onChange={() => handleToggleEvent(event)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {EVENT_LABELS[event]}
                      </span>
                      <p className="text-xs text-gray-500">{event}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">
                Secret (HMAC-SHA256)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="webhookSecret"
                  value={form.secret}
                  onChange={(e) =>
                    setForm({ ...form, secret: e.target.value })
                  }
                  placeholder="Opcional"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  rounded="lg"
                  onClick={handleCopySecret}
                  title="Copiar secret"
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                O secret sera usado para assinar os payloads via header
                X-Nuvio-Signature
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              rounded="lg"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              rounded="lg"
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                "Salvar"
              ) : (
                "Criar Webhook"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o webhook para{" "}
              <strong>{deleteTarget?.url}</strong>? Esta acao nao pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              rounded="lg"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              rounded="lg"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
