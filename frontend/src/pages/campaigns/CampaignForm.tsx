import { useCallback, useEffect, useRef, useState } from "react"
import {
  Save,
  Search,
  Users,
  Loader2,
  RefreshCw,
  FileText,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/Dialog"
import api from "@/lib/api"
import type {
  ApiResponse,
  Campaign,
  Contact,
  MessageTemplate,
  MessageTemplateComponent,
  PaginatedResponse,
  WhatsApp
} from "@/types"

interface CampaignFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign
  onSuccess: () => void
}

interface FormData {
  name: string
  whatsappId: string
  templateName: string
  templateLanguage: string
  scheduledAt: string
}

interface FormErrors {
  name?: string
  whatsappId?: string
  template?: string
  contacts?: string
}

const INITIAL_FORM: FormData = {
  name: "",
  whatsappId: "",
  templateName: "",
  templateLanguage: "pt_BR",
  scheduledAt: ""
}

const DEBOUNCE_DELAY = 300

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utilidade",
  AUTHENTICATION: "Autenticacao"
}

function extractBodyText(components: MessageTemplateComponent[]): string {
  const body = components.find(c => c.type === "BODY")
  return body?.text || ""
}

function countVariables(text: string): number {
  const matches = text.match(/\{\{\d+\}\}/g)
  return matches ? matches.length : 0
}

function TemplatePreview({
  components,
  parameterValues,
  onParameterChange
}: {
  components: MessageTemplateComponent[]
  parameterValues: string[]
  onParameterChange: (index: number, value: string) => void
}) {
  const header = components.find(c => c.type === "HEADER")
  const body = components.find(c => c.type === "BODY")
  const footer = components.find(c => c.type === "FOOTER")
  const buttons = components.find(c => c.type === "BUTTONS")

  const bodyText = body?.text || ""
  const variableCount = countVariables(bodyText)

  let previewBody = bodyText
  parameterValues.forEach((val, i) => {
    previewBody = previewBody.replace(`{{${i + 1}}}`, val || `{{${i + 1}}}`)
  })

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        {header?.text && (
          <p className="mb-2 font-semibold text-gray-900">{header.text}</p>
        )}
        {header?.format && header.format !== "TEXT" && (
          <div className="mb-2 flex h-32 items-center justify-center rounded-lg bg-gray-200 text-xs text-gray-500">
            [{header.format}]
          </div>
        )}
        <p className="whitespace-pre-wrap text-gray-700">{previewBody}</p>
        {footer?.text && (
          <p className="mt-2 text-xs text-gray-400">{footer.text}</p>
        )}
        {buttons?.buttons && buttons.buttons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 border-t border-gray-200 pt-2">
            {buttons.buttons.map((btn, i) => (
              <span
                key={i}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1 text-xs text-blue-600"
              >
                {btn.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {variableCount > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Variaveis do template
          </Label>
          <p className="text-xs text-gray-500">
            Preencha os valores que substituirao as variaveis no template
          </p>
          {Array.from({ length: variableCount }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="min-w-[60px] text-sm text-gray-500">{`{{${i + 1}}}`}</span>
              <Input
                value={parameterValues[i] || ""}
                onChange={(e) => onParameterChange(i, e.target.value)}
                placeholder={`Valor para {{${i + 1}}}`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
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

  const [whatsapps, setWhatsapps] = useState<WhatsApp[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [parameterValues, setParameterValues] = useState<string[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false)

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
    setSelectedTemplate(null)
    setParameterValues([])
    setIsSubmitting(false)
    setIsSearching(false)
  }, [])

  const fetchWhatsApps = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<WhatsApp[]>>("/whatsapp")
      if (response.data.success) {
        setWhatsapps(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch {
      setWhatsapps([])
    }
  }, [])

  const fetchTemplates = useCallback(async (whatsappId: string) => {
    if (!whatsappId) {
      setTemplates([])
      return
    }

    try {
      setIsLoadingTemplates(true)
      const response = await api.get<ApiResponse<MessageTemplate[]>>("/templates", {
        params: { whatsappId }
      })
      if (response.data.success) {
        setTemplates(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch {
      setTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }, [])

  const handleSyncTemplates = useCallback(async () => {
    if (!formData.whatsappId) return

    try {
      setIsSyncingTemplates(true)
      await api.post("/templates/sync", { whatsappId: Number(formData.whatsappId) })
      await fetchTemplates(formData.whatsappId)
    } catch {
      setSubmitError("Erro ao sincronizar templates")
    } finally {
      setIsSyncingTemplates(false)
    }
  }, [formData.whatsappId, fetchTemplates])

  useEffect(() => {
    if (open) {
      fetchWhatsApps()
    }
  }, [open, fetchWhatsApps])

  useEffect(() => {
    if (open && campaign) {
      setFormData({
        name: campaign.name,
        whatsappId: String(campaign.whatsappId),
        templateName: campaign.templateName || "",
        templateLanguage: campaign.templateLanguage || "pt_BR",
        scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : ""
      })
      setSelectedContactIds(
        new Set((campaign.contacts ?? []).map((cc) => cc.contactId))
      )
    }
    if (!open) {
      resetForm()
    }
  }, [open, campaign, resetForm])

  useEffect(() => {
    if (open && formData.whatsappId) {
      fetchTemplates(formData.whatsappId)
    }
  }, [open, formData.whatsappId, fetchTemplates])

  useEffect(() => {
    if (formData.templateName && templates.length > 0) {
      const tpl = templates.find(
        t => t.name === formData.templateName && t.language === formData.templateLanguage
      )
      if (tpl) {
        setSelectedTemplate(tpl)
        const bodyText = extractBodyText(tpl.components)
        const count = countVariables(bodyText)
        setParameterValues(prev =>
          prev.length === count ? prev : Array(count).fill("")
        )
      }
    }
  }, [formData.templateName, formData.templateLanguage, templates])

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

    if (field === "whatsappId") {
      setFormData((prev) => ({ ...prev, [field]: value, templateName: "", templateLanguage: "pt_BR" }))
      setSelectedTemplate(null)
      setParameterValues([])
      setTemplates([])
    }

    if (field === "templateName") {
      const tpl = templates.find(t => t.name === value)
      if (tpl) {
        setFormData((prev) => ({ ...prev, templateName: tpl.name, templateLanguage: tpl.language }))
        setSelectedTemplate(tpl)
        const bodyText = extractBodyText(tpl.components)
        setParameterValues(Array(countVariables(bodyText)).fill(""))
      } else {
        setSelectedTemplate(null)
        setParameterValues([])
      }
    }
  }

  const handleParameterChange = (index: number, value: string) => {
    setParameterValues(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
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
    const formErrors: FormErrors = {}

    if (!formData.name.trim()) formErrors.name = "Nome da campanha e obrigatorio"
    if (!formData.whatsappId) formErrors.whatsappId = "Selecione uma conexao WhatsApp"
    if (!formData.templateName) formErrors.template = "Selecione um template"
    if (selectedContactIds.size === 0) formErrors.contacts = "Selecione pelo menos um contato"

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError("")

      const bodyComponents = buildTemplateComponents()

      const payload = {
        name: formData.name.trim(),
        whatsappId: Number(formData.whatsappId),
        templateName: formData.templateName,
        templateLanguage: formData.templateLanguage,
        templateComponents: bodyComponents,
        scheduledAt: formData.scheduledAt || undefined,
        contactIds: Array.from(selectedContactIds),
      }

      if (isEditing && campaign) {
        await api.put(`/campaigns/${campaign.id}`, payload)
        toast.success("Campanha atualizada com sucesso")
      } else {
        await api.post("/campaigns", payload)
        toast.success("Campanha criada com sucesso")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const fallback = isEditing
        ? "Falha ao atualizar a campanha. Tente novamente."
        : "Falha ao criar a campanha. Tente novamente."
      const message = error instanceof Error ? (error.message || fallback) : fallback
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildTemplateComponents = () => {
    const hasParams = parameterValues.some(v => v.trim() !== "")
    if (!hasParams) return []

    return [{
      type: "body" as const,
      parameters: parameterValues
        .filter(v => v.trim() !== "")
        .map(v => ({ type: "text" as const, text: v }))
    }]
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
              : "Selecione um template aprovado e os contatos para envio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label htmlFor="campaign-whatsapp">
              Conexao WhatsApp <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="campaign-whatsapp"
                value={formData.whatsappId}
                onChange={(e) => handleFieldChange("whatsappId", e.target.value)}
                className={`flex w-full appearance-none rounded-xl border bg-white px-4 py-2 pr-10 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  errors.whatsappId ? "border-red-500" : "border-gray-200"
                }`}
              >
                <option value="">Selecione uma conexao</option>
                {whatsapps.map((wa) => (
                  <option key={wa.id} value={wa.id}>
                    {wa.name} {wa.number ? `(${wa.number})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.whatsappId && <p className="text-sm text-red-500">{errors.whatsappId}</p>}
          </div>

          {formData.whatsappId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Template <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSyncTemplates}
                  disabled={isSyncingTemplates}
                  className="text-xs"
                >
                  {isSyncingTemplates ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Sincronizar templates
                </Button>
              </div>

              {isLoadingTemplates ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-6 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    Nenhum template aprovado encontrado.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Clique em &quot;Sincronizar templates&quot; para buscar da Meta.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={formData.templateName}
                      onChange={(e) => handleFieldChange("templateName", e.target.value)}
                      className={`flex w-full appearance-none rounded-xl border bg-white px-4 py-2 pr-10 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                        errors.template ? "border-red-500" : "border-gray-200"
                      }`}
                    >
                      <option value="">Selecione um template</option>
                      {templates.map((tpl) => (
                        <option key={`${tpl.name}-${tpl.language}`} value={tpl.name}>
                          {tpl.name} ({tpl.language}) - {CATEGORY_LABELS[tpl.category] || tpl.category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.template && <p className="text-sm text-red-500">{errors.template}</p>}
                </div>
              )}

              {selectedTemplate && (
                <div className="mt-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate.language}
                    </Badge>
                  </div>
                  <TemplatePreview
                    components={selectedTemplate.components}
                    parameterValues={parameterValues}
                    onParameterChange={handleParameterChange}
                  />
                </div>
              )}
            </div>
          )}

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
