import { useCallback, useEffect, useState } from "react"
import {
  Settings as SettingsIcon,
  Smartphone,
  Users,
  ListOrdered,
  Loader2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/authStore"
import type { Setting, Queue, WhatsApp, User } from "@/types"
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
  const [connections, setConnections] = useState<WhatsApp[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isLoadingQueues, setIsLoadingQueues] = useState(true)
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true)
      const response = await api.get<{ data: Setting[] }>("/settings")
      const parsed = parseSettingsFromApi(response.data.data)
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
      setQueues(response.data.data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar filas"
      setError(message)
    } finally {
      setIsLoadingQueues(false)
    }
  }, [])

  const fetchConnections = useCallback(async () => {
    try {
      setIsLoadingWhatsApp(true)
      const response = await api.get<{ data: WhatsApp[] }>("/whatsapp")
      setConnections(response.data.data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar conexoes"
      setError(message)
    } finally {
      setIsLoadingWhatsApp(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    if (!canViewUsers) return

    try {
      setIsLoadingUsers(true)
      const response = await api.get<{ data: User[] }>("/users")
      setUsers(response.data.data)
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar configuracoes"
      setError(message)
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar fila"
        setError(message)
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao excluir fila"
        setError(message)
      }
    },
    [fetchQueues]
  )

  const handleOnboard = useCallback(
    async (data: {
      code: string
      wabaId: string
      phoneNumberId: string
      name: string
    }) => {
      try {
        setError(null)
        await api.post("/whatsapp/onboard", data)
        await fetchConnections()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao conectar WhatsApp"
        setError(message)
        throw err
      }
    },
    [fetchConnections]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A0A0A]">Configuracoes</h1>
        <p className="mt-1 text-gray-500">
          Gerencie as configuracoes do sistema
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
            isLoading={isLoadingWhatsApp}
            onOnboard={handleOnboard}
          />
        </TabsContent>

        {canViewUsers && (
          <TabsContent value="users" className="mt-6">
            <UsersTab users={users} isLoading={isLoadingUsers} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
