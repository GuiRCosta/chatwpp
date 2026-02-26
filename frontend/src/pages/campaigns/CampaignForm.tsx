import { useCallback, useEffect, useRef, useState } from "react"
import { Save, Search, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/Dialog"
import api from "@/lib/api"
import type { Campaign, Contact, PaginatedResponse } from "@/types"

interface CampaignFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign
  onSuccess: () => void
}

interface FormData { name: string; message: string; scheduledAt: string }
interface FormErrors { name?: string; message?: string; contacts?: string }

const INITIAL_FORM: FormData = { name: "", message: "", scheduledAt: "" }

const DEBOUNCE_DELAY = 300

const STATUS_MAP: Record<Campaign["status"], { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  running: { label: "Em execucao", color: "bg-blue-100 text-blue-800" },
  paused: { label: "Pausada", color: "bg-gray-100 text-gray-800" },
  completed: { label: "Concluida", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-800" },
}

function buildFormData(campaign: Campaign): FormData {
  return {
    name: campaign.name,
    message: campaign.message,
    scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : "",
  }
}

function buildSelectedIds(campaign: Campaign): ReadonlySet<number> {
  return new Set((campaign.contacts ?? []).map((cc) => cc.contactId))
}

function validate(data: FormData, ids: ReadonlySet<number>): FormErrors {
  const errors: FormErrors = {}
  if (!data.name.trim()) errors.name = "Nome da campanha e obrigatorio"
  if (!data.message.trim()) errors.message = "Mensagem e obrigatoria"
  if (ids.size === 0) errors.contacts = "Selecione pelo menos um contato"
  return errors
}

export function CampaignForm({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CampaignFormProps) {
  const isEditing = Boolean(campaign)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [contacts, setContacts] = useState<readonly Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedContactIds, setSelectedContactIds] = useState<ReadonlySet<number>>(
    new Set()
  )

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM)
    setErrors({})
    setSubmitError("")
    setSearchQuery("")
    setContacts([])
    setSelectedContactIds(new Set())
    setIsSubmitting(false)
    setIsSearching(false)
  }, [])

  useEffect(() => {
    if (open && campaign) {
      setFormData(buildFormData(campaign))
      setSelectedContactIds(buildSelectedIds(campaign))
    }
    if (!open) {
      resetForm()
    }
  }, [open, campaign, resetForm])

  const searchContacts = useCallback(async (query: string) => {
    try {
      setIsSearching(true)
      const response = await api.get<PaginatedResponse<Contact>>("/contacts", {
        params: { search: query, limit: 50 },
      })
      if (response.data.success) {
        setContacts(response.data.data)
      }
    } catch {
      setContacts([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      searchContacts(searchQuery)
    }, DEBOUNCE_DELAY)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, open, searchContacts])

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleContactToggle = (contactId: number) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) {
        next.delete(contactId)
      } else {
        next.add(contactId)
      }
      return next
    })
    if (errors.contacts) {
      setErrors((prev) => ({ ...prev, contacts: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formErrors = validate(formData, selectedContactIds)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    try {
      setIsSubmitting(true)
      setSubmitError("")
      const payload = {
        name: formData.name.trim(),
        message: formData.message.trim(),
        scheduledAt: formData.scheduledAt || undefined,
        contactIds: Array.from(selectedContactIds),
      }
      if (isEditing && campaign) {
        await api.put(`/campaigns/${campaign.id}`, payload)
      } else {
        await api.post("/campaigns", payload)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const fallback = isEditing
        ? "Falha ao atualizar a campanha. Tente novamente."
        : "Falha ao criar a campanha. Tente novamente."
      setSubmitError(error instanceof Error ? (error.message || fallback) : fallback)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-[Inter]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Campanha" : "Nova Campanha"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informacoes da campanha."
              : "Preencha os dados para criar uma nova campanha."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isEditing && campaign && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_MAP[campaign.status].color}`}
              >
                {STATUS_MAP[campaign.status].label}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="campaign-name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="campaign-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Nome da campanha"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-message">
              Mensagem <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="campaign-message"
              value={formData.message}
              onChange={(e) => handleFieldChange("message", e.target.value)}
              placeholder="Digite a mensagem da campanha"
              rows={4}
              className={`flex w-full rounded-xl border bg-white px-4 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                errors.message ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-scheduled">Agendar envio</Label>
            <Input
              id="campaign-scheduled"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => handleFieldChange("scheduledAt", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Contatos <span className="text-red-500">*</span>
              </Label>
              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                {selectedContactIds.size} selecionado(s)
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contatos por nome ou numero..."
                className="pl-9"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white">
              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
              {!isSearching && contacts.length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-gray-500">
                  Nenhum contato encontrado.
                </div>
              )}
              {!isSearching &&
                contacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(contact.id)}
                      onChange={() => handleContactToggle(contact.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {contact.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {contact.number}
                      </p>
                    </div>
                  </label>
                ))}
            </div>
            {errors.contacts && (
              <p className="text-sm text-red-500">{errors.contacts}</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              rounded="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" rounded="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Atualizar" : "Criar Campanha"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
