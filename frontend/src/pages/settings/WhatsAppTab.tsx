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
import type { WhatsApp, User } from "@/types"
import { formatWhatsAppStatus, isWhatsAppOnline } from "./types"
import { loadFacebookSDK, launchFBLoginOnly } from "@/lib/facebook"
import { UserCheckboxList } from "./UserCheckboxList"
import api from "@/lib/api"

const META_APP_ID = import.meta.env.VITE_META_APP_ID || ""
const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID || ""

interface WhatsAppTabProps {
  connections: WhatsApp[]
  maxConnections: number
  connectionCount: number
  users: User[]
  isLoading: boolean
  onUpdateWhatsApp: (id: number, data: { name?: string; userIds?: number[] }) => Promise<void>
  onDeleteWhatsApp: (id: number) => Promise<void>
}

export function WhatsAppTab({
  connections,
  maxConnections,
  connectionCount,
  users,
  isLoading,
  onUpdateWhatsApp,
  onDeleteWhatsApp
}: WhatsAppTabProps) {
  const isAtLimit = connectionCount >= maxConnections
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const sdkLoadAttempted = useRef(false)

  // FB Login → Onboard dialog state
  const [authCode, setAuthCode] = useState<string | null>(null)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [newConnectionName, setNewConnectionName] = useState("")
  const [newWabaId, setNewWabaId] = useState("")
  const [newPhoneNumberId, setNewPhoneNumberId] = useState("")
  const [newConnectionUserIds, setNewConnectionUserIds] = useState<Set<number>>(new Set())
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<WhatsApp | null>(null)
  const [editName, setEditName] = useState("")
  const [editUserIds, setEditUserIds] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog state
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

  // --- FB Login flow: get auth code → show onboard form → POST /onboard ---

  const handleConnectClick = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const code = await launchFBLoginOnly(META_CONFIG_ID)

      setAuthCode(code)
      setNewConnectionName("")
      setNewWabaId("")
      setNewPhoneNumberId("")
      setNewConnectionUserIds(new Set())
      setNameDialogOpen(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao conectar WhatsApp"
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const isOnboardFormValid =
    !!authCode &&
    newConnectionName.trim().length >= 2 &&
    /^\d+$/.test(newWabaId.trim()) &&
    /^\d+$/.test(newPhoneNumberId.trim())

  const handleConfirmOnboard = useCallback(async () => {
    if (!authCode || !newConnectionName.trim() || !newWabaId.trim() || !newPhoneNumberId.trim()) return

    setIsOnboarding(true)
    setError(null)

    try {
      await api.post("/whatsapp/onboard", {
        code: authCode,
        wabaId: newWabaId.trim(),
        phoneNumberId: newPhoneNumberId.trim(),
        name: newConnectionName.trim(),
        userIds: Array.from(newConnectionUserIds)
      })

      toast.success("WhatsApp conectado com sucesso")
      setNameDialogOpen(false)
      setAuthCode(null)
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      const message =
        axiosErr.response?.data?.error ||
        (err instanceof Error ? err.message : "Erro ao registrar conexao")
      setError(message)
      toast.error(message)
    } finally {
      setIsOnboarding(false)
    }
  }, [authCode, newConnectionName, newWabaId, newPhoneNumberId, newConnectionUserIds])

  const handleCloseNameDialog = useCallback(() => {
    setNameDialogOpen(false)
    setAuthCode(null)
  }, [])

  const handleToggleNewUser = useCallback((userId: number) => {
    setNewConnectionUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }, [])

  // --- Edit / Delete handlers ---

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
          <Button
            size="sm"
            rounded="lg"
            disabled={isAtLimit || isConnecting || !sdkReady}
            title={isAtLimit ? "Limite de conexoes atingido" : undefined}
            onClick={handleConnectClick}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autorizando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Conectar WhatsApp
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {error && (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

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

      {/* Onboard Dialog (after FB Login) */}
      <Dialog open={nameDialogOpen} onOpenChange={(v) => !v && handleCloseNameDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Conexao WhatsApp</DialogTitle>
            <DialogDescription>
              Autorizacao concluida. Informe os dados da sua conta WhatsApp Business.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newConnName">Nome da Conexao</Label>
              <Input
                id="newConnName"
                value={newConnectionName}
                onChange={(e) => setNewConnectionName(e.target.value)}
                placeholder="Ex: WhatsApp Vendas"
                disabled={isOnboarding}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newWabaId">WABA ID (WhatsApp Business Account)</Label>
              <Input
                id="newWabaId"
                value={newWabaId}
                onChange={(e) => setNewWabaId(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 123456789012345"
                disabled={isOnboarding}
              />
              <p className="text-xs text-gray-500">
                Encontre em{" "}
                <a
                  href="https://business.facebook.com/settings/whatsapp-business-accounts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Meta Business Suite
                </a>
                {" "}&gt; Contas do WhatsApp Business
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPhoneNumberId">Phone Number ID</Label>
              <Input
                id="newPhoneNumberId"
                value={newPhoneNumberId}
                onChange={(e) => setNewPhoneNumberId(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 987654321098765"
                disabled={isOnboarding}
              />
              <p className="text-xs text-gray-500">
                Encontre em{" "}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Meta Developers
                </a>
                {" "}&gt; Seu App &gt; WhatsApp &gt; Configuracao da API
              </p>
            </div>

            {users.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <UsersIcon className="h-4 w-4" />
                  Atendentes Responsaveis
                </Label>
                <UserCheckboxList
                  users={users}
                  selectedIds={newConnectionUserIds}
                  onToggle={handleToggleNewUser}
                  disabled={isOnboarding}
                  compact
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              rounded="lg"
              onClick={handleCloseNameDialog}
              disabled={isOnboarding}
            >
              Cancelar
            </Button>
            <Button
              rounded="lg"
              onClick={handleConfirmOnboard}
              disabled={!isOnboardFormValid || isOnboarding}
            >
              {isOnboarding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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

      {/* Delete Dialog */}
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
