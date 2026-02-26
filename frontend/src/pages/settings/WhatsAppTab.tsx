import { useCallback, useEffect, useRef, useState } from "react"
import { Smartphone, Plus, Wifi, WifiOff, Loader2 } from "lucide-react"
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
import type { WhatsApp } from "@/types"
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
}

interface WhatsAppTabProps {
  connections: WhatsApp[]
  isLoading: boolean
  onOnboard: (data: OnboardData) => Promise<void>
}

export function WhatsAppTab({
  connections,
  isLoading,
  onOnboard
}: WhatsAppTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const sdkLoadAttempted = useRef(false)

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
        name: newName.trim()
      })

      setNewName("")
      setDialogOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao conectar WhatsApp"
      setError(message)
    } finally {
      setIsConnecting(false)
    }
  }, [newName, onOnboard])

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setNewName("")
      setError(null)
    }
  }, [])

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
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" rounded="lg">
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
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
