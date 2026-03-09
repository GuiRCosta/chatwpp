import { useCallback, useEffect, useState } from "react"
import {
  Settings as SettingsIcon,
  Smartphone,
  Users,
  ListOrdered,
  Link2,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import { useWhatsAppStore } from "@/stores/whatsappStore"
import type { Setting, Queue, User } from "@/types"
import {
  DEFAULT_GENERAL_SETTINGS,
  SETTINGS_KEY_MAP,
  isAdminRole,
  type GeneralSettings,
  type NewQueueForm
} from "./types"
import { GeneralTab } from "./GeneralTab"
import { QueuesTab } from "./QueuesTab"
import { WhatsAppTab } from "./WhatsAppTab"
import { UsersTab } from "./UsersTab"
import { WebhooksTab } from "./WebhooksTab"

function parseSettingsFromApi(settings: Setting[]): GeneralSettings {
  return settings.reduce<GeneralSettings>(
    (acc, setting) => {
      const key = Object.entries(SETTINGS_KEY_MAP).find(
        ([, value]) => value === setting.key
      )?.[0] as keyof GeneralSettings | undefined

      if (key) {
        return { ...acc, [key]: setting.value }
      }

      return acc
    },
    { ...DEFAULT_GENERAL_SETTINGS }
  )
}

export function Settings() {
  const { user } = useAuthStore()
  const canViewUsers = isAdminRole(user?.profile ?? "")

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    ...DEFAULT_GENERAL_SETTINGS
  })
  const [queues, setQueues] = useState<Queue[]>([])
  const connections = useWhatsAppStore((s) => s.connections)
  const maxConnections = useWhatsAppStore((s) => s.maxConnections)
  const connectionCount = useWhatsAppStore((s) => s.connectionCount)
  const isLoadingWhatsApp = useWhatsAppStore((s) => s.isLoading)
  const fetchConnections = useWhatsAppStore((s) => s.fetchConnections)
  const [users, setUsers] = useState<User[]>([])

  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isLoadingQueues, setIsLoadingQueues] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true)
      const response = await api.get<{ data: Setting[] }>("/settings")
      const settings = Array.isArray(response.data.data) ? response.data.data : []
      const parsed = parseSettingsFromApi(settings)
      setGeneralSettings(parsed)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar configuracoes"
      setError(message)
    } finally {
      setIsLoadingSettings(false)
    }
  }, [])

  const fetchQueues = useCallback(async () => {
    try {
      setIsLoadingQueues(true)
      const response = await api.get<{ data: Queue[] }>("/queues")
      setQueues(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar filas"
      setError(message)
    } finally {
      setIsLoadingQueues(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    if (!canViewUsers) return

    try {
      setIsLoadingUsers(true)
      const response = await api.get<{ data: User[] }>("/users")
      setUsers(Array.isArray(response.data.data) ? response.data.data : [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar usuarios"
      setError(message)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [canViewUsers])

  useEffect(() => {
    fetchSettings()
    fetchQueues()
    fetchConnections()
    fetchUsers()
  }, [fetchSettings, fetchQueues, fetchConnections, fetchUsers])

  const handleSettingsChange = useCallback(
    (field: keyof GeneralSettings, value: string) => {
      setGeneralSettings((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSaveSettings = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      const entries = Object.entries(SETTINGS_KEY_MAP) as Array<
        [keyof GeneralSettings, string]
      >

      await Promise.all(
        entries.map(([field, key]) =>
          api.put("/settings", { key, value: generalSettings[field] })
        )
      )
      toast.success("Configuracoes salvas com sucesso")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar configuracoes"
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [generalSettings])

  const handleCreateQueue = useCallback(
    async (form: NewQueueForm) => {
      try {
        setError(null)
        await api.post("/queues", { name: form.name, color: form.color })
        await fetchQueues()
        toast.success("Fila criada com sucesso")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar fila"
        setError(message)
        toast.error(message)
      }
    },
    [fetchQueues]
  )

  const handleDeleteQueue = useCallback(
    async (id: number) => {
      try {
        setError(null)
        await api.delete(`/queues/${id}`)
        await fetchQueues()
        toast.success("Fila excluida com sucesso")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao excluir fila"
        setError(message)
        toast.error(message)
      }
    },
    [fetchQueues]
  )

  const handleUpdateWhatsApp = useCallback(
    async (id: number, data: { name?: string; userIds?: number[] }) => {
      try {
        setError(null)
        await api.put(`/whatsapp/${id}`, data)
        await fetchConnections()
        toast.success("Conexao atualizada com sucesso")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar conexao"
        setError(message)
        toast.error(message)
      }
    },
    [fetchConnections]
  )

  const handleDeleteWhatsApp = useCallback(
    async (id: number) => {
      try {
        setError(null)
        await api.delete(`/whatsapp/${id}`)
        await fetchConnections()
        toast.success("Conexao excluida com sucesso")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao excluir conexao"
        setError(message)
        toast.error(message)
      }
    },
    [fetchConnections]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Configuracoes</h1>
        <p className="mt-1 text-gray-500">
          Gerencie as configuracoes do sistema
        </p>
      </div>

      {error && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className={`grid w-full ${canViewUsers ? "grid-cols-5" : "grid-cols-4"}`}>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="queues" className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            Filas
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Integracoes
          </TabsTrigger>
          {canViewUsers && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-6">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <GeneralTab
              settings={generalSettings}
              isSaving={isSaving}
              onSettingsChange={handleSettingsChange}
              onSave={handleSaveSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="queues" className="mt-6">
          <QueuesTab
            queues={queues}
            isLoading={isLoadingQueues}
            onCreateQueue={handleCreateQueue}
            onDeleteQueue={handleDeleteQueue}
          />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <WhatsAppTab
            connections={connections}
            maxConnections={maxConnections}
            connectionCount={connectionCount}
            users={users}
            isLoading={isLoadingWhatsApp}
            onUpdateWhatsApp={handleUpdateWhatsApp}
            onDeleteWhatsApp={handleDeleteWhatsApp}
          />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebhooksTab />
        </TabsContent>

        {canViewUsers && (
          <TabsContent value="users" className="mt-6">
            <UsersTab users={users} isLoading={isLoadingUsers} onRefresh={fetchUsers} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
