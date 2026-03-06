import { useCallback, useEffect, useState } from "react"
import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useNotificationStore } from "@/stores/notificationStore"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import type { ApiResponse, Notification } from "@/types"

type FilterTab = "all" | "unread"

interface NotificationListResponse {
  notifications: Notification[]
  count: number
  hasMore: boolean
}

const FILTER_TABS: readonly { label: string; value: FilterTab }[] = [
  { label: "Todas", value: "all" },
  { label: "Nao lidas", value: "unread" }
] as const

const ITEMS_PER_PAGE = 20

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<FilterTab>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const storeMarkAsRead = useNotificationStore((s) => s.markAsRead)
  const storeMarkAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const storeDeleteNotification = useNotificationStore(
    (s) => s.deleteNotification
  )

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string | number> = {
        pageNumber: page,
        limit: ITEMS_PER_PAGE
      }

      if (filter === "unread") {
        params.isRead = "false"
      }

      const response = await api.get<ApiResponse<NotificationListResponse>>(
        "/notifications",
        { params }
      )

      if (response.data.success && response.data.data) {
        setNotifications(response.data.data.notifications || [])
        setTotal(response.data.data.count || 0)
        setHasMore(response.data.data.hasMore || false)
      }
    } catch {
      toast.error("Erro ao carregar notificacoes")
    } finally {
      setIsLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (id: number) => {
    await storeMarkAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const handleMarkAllAsRead = async () => {
    await storeMarkAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success("Todas as notificacoes marcadas como lidas")
  }

  const handleDelete = async () => {
    if (deleteTarget === null) return
    await storeDeleteNotification(deleteTarget)
    setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget))
    setTotal((prev) => prev - 1)
    setDeleteTarget(null)
    toast.success("Notificacao excluida")
  }

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter)
    setPage(1)
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const hasUnread = notifications.some((n) => !n.isRead)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Notificacoes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? "notificacao" : "notificacoes"}
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white border border-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Nenhuma notificacao
          </h3>
          <p className="text-sm text-gray-500">
            {filter === "unread"
              ? "Todas as notificacoes foram lidas"
              : "Voce ainda nao recebeu nenhuma notificacao"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                notification.isRead
                  ? "bg-white border-gray-200"
                  : "bg-blue-50/50 border-blue-100"
              )}
            >
              {/* Read indicator */}
              <div className="mt-1 shrink-0">
                {!notification.isRead ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                ) : (
                  <div className="h-2.5 w-2.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    !notification.isRead
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-700"
                  )}
                >
                  {notification.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 h-8 px-2"
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Lida
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(notification.id)}
                  className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Proximo
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Excluir notificacao"
        description="Tem certeza que deseja excluir esta notificacao? Esta acao nao pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
