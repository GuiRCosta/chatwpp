import { useMemo, useState } from "react"
import { Users, Search, Loader2, Plus, Save, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/Dialog"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import api from "@/lib/api"
import type { User } from "@/types"
import { getRoleBadgeVariant } from "./types"

interface UsersTabProps {
  users: User[]
  isLoading: boolean
  onRefresh: () => void
}

interface UserFormData {
  name: string
  email: string
  password: string
  profile: string
}

const INITIAL_FORM: UserFormData = {
  name: "",
  email: "",
  password: "",
  profile: "user"
}

const PROFILE_OPTIONS = [
  { value: "user", label: "Usuario" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" }
]

function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  onSuccess
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUser?: User
  onSuccess: () => void
}) {
  const isEditing = Boolean(editingUser)
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setErrors({})
    setSubmitError("")
    setIsSubmitting(false)
  }

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        password: "",
        profile: editingUser.profile
      })
    }
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  const handleFieldChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formErrors: Partial<Record<keyof UserFormData, string>> = {}

    if (!formData.name.trim()) formErrors.name = "Nome e obrigatorio"
    if (!formData.email.trim()) formErrors.email = "Email e obrigatorio"
    if (!isEditing && !formData.password) formErrors.password = "Senha e obrigatoria"
    if (formData.password && formData.password.length < 6) {
      formErrors.password = "Senha deve ter no minimo 6 caracteres"
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError("")

      const payload: Record<string, string> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        profile: formData.profile
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (isEditing && editingUser) {
        await api.put(`/users/${editingUser.id}`, payload)
        toast.success("Usuario atualizado com sucesso")
      } else {
        await api.post("/users", payload)
        toast.success("Usuario criado com sucesso")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const fallback = isEditing
        ? "Falha ao atualizar usuario. Tente novamente."
        : "Falha ao criar usuario. Tente novamente."
      const message = error instanceof Error ? (error.message || fallback) : fallback
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md font-[Inter]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Novo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informacoes do usuario."
              : "Preencha os dados para criar um novo usuario."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user-name"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Nome completo"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="email@exemplo.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              Senha {!isEditing && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={formData.password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              placeholder={isEditing ? "Deixe vazio para manter" : "Minimo 6 caracteres"}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-profile">Perfil</Label>
            <div className="relative">
              <select
                id="user-profile"
                value={formData.profile}
                onChange={(e) => handleFieldChange("profile", e.target.value)}
                className="flex w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {PROFILE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
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
                  {isEditing ? "Atualizar" : "Criar Usuario"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UsersTab({ users, isLoading, onRefresh }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users

    const query = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const handleCreateClick = () => {
    setEditingUser(undefined)
    setFormOpen(true)
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      await api.delete(`/users/${userToDelete.id}`)
      onRefresh()
      toast.success("Usuario excluido com sucesso")
    } catch {
      toast.error("Erro ao excluir usuario")
    }
  }

  return (
    <Card className="rounded-2xl bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Usuarios
            </CardTitle>
            <CardDescription>
              Gerencie os usuarios cadastrados no sistema
            </CardDescription>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4" />
            Novo Usuario
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {searchQuery
              ? "Nenhum usuario encontrado"
              : "Nenhum usuario cadastrado"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Nome
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Email
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Perfil
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                    Criado em
                  </th>
                  <th className="pb-3 text-sm font-medium text-gray-500">
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                  >
                    <td className="py-3 font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="py-3">
                      <Badge variant={getRoleBadgeVariant(user.profile)}>
                        {user.profile}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingUser={editingUser}
        onSuccess={onRefresh}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir usuario"
        description={`Tem certeza que deseja excluir o usuario "${userToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </Card>
  )
}
