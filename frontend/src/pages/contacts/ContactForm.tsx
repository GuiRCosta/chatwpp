import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import api from "@/lib/api"
import type { Contact, ApiResponse } from "@/types"

interface ContactFormData {
  name: string
  number: string
  email: string
}

export function ContactForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    number: "",
    email: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})

  useEffect(() => {
    if (isEditing) {
      fetchContact()
    }
  }, [id])

  const fetchContact = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const response = await api.get<ApiResponse<Contact>>(`/contacts/${id}`)

      if (response.data.success) {
        const contact = response.data.data
        setFormData({
          name: contact.name,
          number: contact.number,
          email: contact.email || ""
        })
      }
    } catch (error) {
      console.error("Failed to fetch contact:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (!formData.number.trim()) {
      newErrors.number = "Número é obrigatório"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        name: formData.name.trim(),
        number: formData.number.trim(),
        email: formData.email.trim() || undefined
      }

      if (isEditing) {
        await api.put(`/contacts/${id}`, payload)
      } else {
        await api.post("/contacts", payload)
      }

      navigate("/contacts")
    } catch (error) {
      console.error("Failed to save contact:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    })

    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          rounded="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-[#0A0A0A]">
          {isEditing ? "Editar Contato" : "Novo Contato"}
        </h1>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Digite o nome do contato"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">
                Número <span className="text-red-500">*</span>
              </Label>
              <Input
                id="number"
                type="text"
                value={formData.number}
                onChange={(e) => handleChange("number", e.target.value)}
                placeholder="Digite o número do contato"
                className={errors.number ? "border-red-500" : ""}
              />
              {errors.number && (
                <p className="text-sm text-red-500">{errors.number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Digite o email do contato (opcional)"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                rounded="sm"
                onClick={() => navigate("/contacts")}
              >
                Cancelar
              </Button>
              <Button type="submit" rounded="sm" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
