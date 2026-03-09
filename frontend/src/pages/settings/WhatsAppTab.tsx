import { useCallback, useEffect, useRef, useState } from "react"
import {
  Smartphone,
  Plus,
  Wifi,
  WifiOff,
  Loader2,
  Pencil,
  Trash2,
  Users as UsersIcon
} from "lucide-react"
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
  DialogTitle,
  DialogTrigger
} from "@/components/ui/Dialog"
import type { WhatsApp, User } from "@/types"
import { formatWhatsAppStatus, isWhatsAppOnline } from "./types"
import {
  loadFacebookSDK,
  launchWhatsAppSignup,
  type EmbeddedSignupResult
} from "@/lib/facebook"

const META_APP_ID = import.meta.env.VITE_META_APP_ID || ""
const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID || ""

interface OnboardData {
  code: string
  wabaId: string
  phoneNumberId: string
  name: string
  userIds?: number[]
}

interface WhatsAppTabProps {
  connections: WhatsApp[]
  maxConnections: number
  connectionCount: number
  users: User[]
  isLoading: boolean
  onOnboard: (data: OnboardData) => Promise<void>
  onUpdateWhatsApp: (id: number, data: { name?: string; userIds?: number[] }) => Promise<void>
  onDeleteWhatsApp: (id: number) => Promise<void>
}

function UserCheckboxList({
  users,
  selectedIds,
  onToggle,
  disabled
}: {
  users: User[]
  selectedIds: Set<number>
  onToggle: (userId: number) => void
  disabled?: boolean
}) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum usuario disponivel</p>
    )
  }

  return (
    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
      {users.map((user) => (
        <label
          key={user.id}
          className="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={selectedIds.has(user.id)}
            onChange={() => onToggle(user.id)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-900">{user.name}</span>
          <span className="text-xs text-gray-400">{user.email}</span>
        </label>
      ))}
    </div>
  )
}

export function WhatsAppTab({
  connections,
  maxConnections,
  connectionCount,
  users,
  isLoading,
  onOnboard,
  onUpdateWhatsApp,
  onDeleteWhatsApp
}: WhatsAppTabProps) {
  const isAtLimit = connectionCount >= maxConnections
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const sdkLoadAttempted = useRef(false)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<WhatsApp | null>(null)
  const [editName, setEditName] = useState("")
  const [editUserIds, setEditUserIds] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingConnection, setDeletingConnection] = useState<WhatsApp | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!META_APP_ID || sdkLoadAttempted.current) return
    sdkLoadAttempted.current = true

    loadFacebookSDK(META_APP_ID)
      .then(() => setSdkReady(true))
      .catch((err) => {
        setError(
          `Erro ao carregar Facebook SDK: ${err instanceof Error ? err.message : String(err)}`
        )
      })
  }, [])

  const handleToggleUser = useCallback((userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }, [])

  const handleToggleEditUser = useCallback((userId: number) => {
    setEditUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }, [])

  const handleConnectWithFacebook = useCallback(async () => {
    if (!newName.trim()) return

    setIsConnecting(true)
    setError(null)

    try {
      const result: EmbeddedSignupResult =
        await launchWhatsAppSignup(META_CONFIG_ID)

      await onOnboard({
        code: result.code,
        wabaId: result.wabaId,
        phoneNumberId: result.phoneNumberId,
        name: newName.trim(),
        userIds: Array.from(selectedUserIds)
      })

      setNewName("")
      setSelectedUserIds(new Set())
      setDialogOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao conectar WhatsApp"
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [newName, selectedUserIds, onOnboard])

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setNewName("")
      setSelectedUserIds(new Set())
      setError(null)
    }
  }, [])

  const handleOpenEdit = useCallback((conn: WhatsApp) => {
    setEditingConnection(conn)
    setEditName(conn.name)
    const currentUserIds = new Set(
      (conn.userWhatsApps ?? []).map((uw) => uw.userId)
    )
    setEditUserIds(currentUserIds)
    setEditDialogOpen(true)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingConnection) return

    setIsSaving(true)
    try {
      await onUpdateWhatsApp(editingConnection.id, {
        name: editName.trim() || undefined,
        userIds: Array.from(editUserIds)
      })
      setEditDialogOpen(false)
      setEditingConnection(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar conexao"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }, [editingConnection, editName, editUserIds, onUpdateWhatsApp])

  const handleOpenDelete = useCallback((conn: WhatsApp) => {
    setDeletingConnection(conn)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingConnection) return

    setIsDeleting(true)
    try {
      await onDeleteWhatsApp(deletingConnection.id)
      setDeleteDialogOpen(false)
      setDeletingConnection(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao excluir conexao"
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingConnection, onDeleteWhatsApp])

  return (
    <Card className="rounded-2xl bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
              Conexoes WhatsApp
            </CardTitle>
            <CardDescription>
              Conecte numeros do WhatsApp via Facebook Business Login
            </CardDescription>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">
                {connectionCount}/{maxConnections} conexoes
              </span>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAtLimit
                      ? "bg-red-500"
                      : connectionCount >= maxConnections * 0.8
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min((connectionCount / Math.max(maxConnections, 1)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                rounded="lg"
                disabled={isAtLimit}
                title={isAtLimit ? "Limite de conexoes atingido" : undefined}
              >
                <Plus className="h-4 w-4" />
                Conectar WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar WhatsApp</DialogTitle>
                <DialogDescription>
                  Conecte seu numero do WhatsApp Business via Facebook
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappName">Nome da Conexao</Label>
                  <Input
                    id="whatsappName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: WhatsApp Principal"
                    disabled={isConnecting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <UsersIcon className="h-4 w-4" />
                    Atendentes Responsaveis
                  </Label>
                  <UserCheckboxList
                    users={users}
                    selectedIds={selectedUserIds}
                    onToggle={handleToggleUser}
                    disabled={isConnecting}
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  rounded="lg"
                  onClick={() => handleDialogChange(false)}
                  disabled={isConnecting}
                >
                  Cancelar
                </Button>
                <Button
                  rounded="lg"
                  onClick={handleConnectWithFacebook}
                  disabled={!newName.trim() || isConnecting || !sdkReady}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    "Conectar com Facebook"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : connections.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Nenhuma conexao cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => {
              const assignedUsers = (conn.userWhatsApps ?? [])
                .map((uw) => uw.user)
                .filter(Boolean)

              return (
                <div
                  key={conn.id}
                  className="rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          isWhatsAppOnline(conn.status)
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{conn.name}</p>
                        <p className="text-sm text-gray-500">
                          {conn.number || "Sem numero"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isWhatsAppOnline(conn.status) ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                      <Badge
                        variant={
                          isWhatsAppOnline(conn.status) ? "success" : "destructive"
                        }
                      >
                        {formatWhatsAppStatus(conn.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(conn)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      {!conn.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(conn)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {assignedUsers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 pl-6">
                      {assignedUsers.map((u) => (
                        <Badge
                          key={u!.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {u!.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conexao</DialogTitle>
            <DialogDescription>
              Altere o nome e os atendentes responsaveis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome da Conexao</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" />
                Atendentes Responsaveis
              </Label>
              <UserCheckboxList
                users={users}
                selectedIds={editUserIds}
                onToggle={handleToggleEditUser}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              rounded="lg"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              rounded="lg"
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Conexao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conexao &quot;{deletingConnection?.name}&quot;? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              rounded="lg"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              rounded="lg"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
