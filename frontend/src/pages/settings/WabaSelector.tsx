import { useCallback, useState } from "react"
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Phone,
  Smartphone
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/Badge"
import { ScrollArea } from "@/components/ui/ScrollArea"
import type { User } from "@/types"

interface DiscoverPhone {
  id: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: string
  alreadyConnected: boolean
}

interface DiscoverWaba {
  id: string
  name: string
  phones: DiscoverPhone[]
}

interface WabaSelectorProps {
  open: boolean
  wabas: DiscoverWaba[]
  sessionToken: string
  users: User[]
  isRegistering: boolean
  onRegister: (data: {
    sessionToken: string
    wabaId: string
    phoneNumberId: string
    name: string
    userIds: number[]
  }) => Promise<void>
  onClose: () => void
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
    <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
      {users.map((user) => (
        <label
          key={user.id}
          className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={selectedIds.has(user.id)}
            onChange={() => onToggle(user.id)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-900">{user.name}</span>
        </label>
      ))}
    </div>
  )
}

export function WabaSelector({
  open,
  wabas,
  sessionToken,
  users,
  isRegistering,
  onRegister,
  onClose
}: WabaSelectorProps) {
  const [expandedWabas, setExpandedWabas] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    if (wabas.length === 1) ids.add(wabas[0].id)
    return ids
  })
  const [selectedPhone, setSelectedPhone] = useState<{
    wabaId: string
    phoneId: string
    displayNumber: string
    verifiedName: string
  } | null>(null)
  const [connectionName, setConnectionName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())

  const toggleWaba = useCallback((wabaId: string) => {
    setExpandedWabas((prev) => {
      const next = new Set(prev)
      if (next.has(wabaId)) {
        next.delete(wabaId)
      } else {
        next.add(wabaId)
      }
      return next
    })
  }, [])

  const handleSelectPhone = useCallback(
    (wabaId: string, phone: DiscoverPhone) => {
      if (phone.alreadyConnected) return

      setSelectedPhone({
        wabaId,
        phoneId: phone.id,
        displayNumber: phone.displayPhoneNumber,
        verifiedName: phone.verifiedName
      })
      setConnectionName(
        phone.verifiedName || `WhatsApp ${phone.displayPhoneNumber}`
      )
    },
    []
  )

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

  const handleRegister = useCallback(async () => {
    if (!selectedPhone || !connectionName.trim()) return

    await onRegister({
      sessionToken,
      wabaId: selectedPhone.wabaId,
      phoneNumberId: selectedPhone.phoneId,
      name: connectionName.trim(),
      userIds: Array.from(selectedUserIds)
    })
  }, [selectedPhone, connectionName, selectedUserIds, sessionToken, onRegister])

  const totalPhones = wabas.reduce((sum, w) => sum + w.phones.length, 0)
  const connectedPhones = wabas.reduce(
    (sum, w) => sum + w.phones.filter((p) => p.alreadyConnected).length,
    0
  )

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Selecionar WABA e Numero
          </DialogTitle>
          <DialogDescription>
            {wabas.length} WABA{wabas.length !== 1 ? "s" : ""} encontrada
            {wabas.length !== 1 ? "s" : ""} com {totalPhones} numero
            {totalPhones !== 1 ? "s" : ""}
            {connectedPhones > 0 && (
              <span className="text-green-600">
                {" "}({connectedPhones} ja conectado{connectedPhones !== 1 ? "s" : ""})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-64">
          <div className="space-y-1 pr-3">
            {wabas.map((waba) => {
              const isExpanded = expandedWabas.has(waba.id)
              const availableCount = waba.phones.filter(
                (p) => !p.alreadyConnected
              ).length

              return (
                <div key={waba.id} className="rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleWaba(waba.id)}
                    className="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-gray-50"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                      {waba.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {availableCount}/{waba.phones.length}
                    </Badge>
                  </button>

                  {isExpanded && waba.phones.length > 0 && (
                    <div className="border-t border-gray-100 p-2 space-y-1">
                      {waba.phones.map((phone) => {
                        const isSelected =
                          selectedPhone?.phoneId === phone.id &&
                          selectedPhone?.wabaId === waba.id

                        return (
                          <button
                            type="button"
                            key={phone.id}
                            onClick={() => handleSelectPhone(waba.id, phone)}
                            disabled={phone.alreadyConnected}
                            className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors ${
                              phone.alreadyConnected
                                ? "cursor-not-allowed opacity-50"
                                : isSelected
                                  ? "bg-blue-50 ring-1 ring-blue-300"
                                  : "hover:bg-gray-50"
                            }`}
                          >
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900">
                                {phone.displayPhoneNumber}
                              </span>
                              {phone.verifiedName && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {phone.verifiedName}
                                </span>
                              )}
                            </div>
                            {phone.alreadyConnected ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] text-green-700 bg-green-50"
                              >
                                <Check className="mr-0.5 h-3 w-3" />
                                Conectado
                              </Badge>
                            ) : isSelected ? (
                              <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                          </button>
                        )
                      })}
                      {waba.phones.length === 0 && (
                        <p className="px-2 py-3 text-center text-xs text-gray-400">
                          Nenhum numero registrado nesta WABA
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {selectedPhone && (
          <div className="space-y-3 border-t border-gray-200 pt-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Selecionado:</span>{" "}
                {selectedPhone.displayNumber}
                {selectedPhone.verifiedName && (
                  <span className="text-blue-700">
                    {" "}({selectedPhone.verifiedName})
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wabaConnName">Nome da Conexao</Label>
              <Input
                id="wabaConnName"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="Ex: WhatsApp Vendas"
                disabled={isRegistering}
              />
            </div>

            {users.length > 0 && (
              <div className="space-y-2">
                <Label>Atendentes Responsaveis</Label>
                <UserCheckboxList
                  users={users}
                  selectedIds={selectedUserIds}
                  onToggle={handleToggleUser}
                  disabled={isRegistering}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            rounded="lg"
            onClick={onClose}
            disabled={isRegistering}
          >
            Cancelar
          </Button>
          <Button
            rounded="lg"
            onClick={handleRegister}
            disabled={!selectedPhone || !connectionName.trim() || isRegistering}
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Conectar Numero"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
