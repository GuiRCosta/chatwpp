import { useState } from "react"
import { ListOrdered, Plus, Trash2, Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/Dialog"
import type { Queue } from "@/types"
import { DEFAULT_NEW_QUEUE, type NewQueueForm } from "./types"

interface QueuesTabProps {
  queues: Queue[]
  isLoading: boolean
  onCreateQueue: (form: NewQueueForm) => void
  onDeleteQueue: (id: number) => void
}

export function QueuesTab({
  queues,
  isLoading,
  onCreateQueue,
  onDeleteQueue
}: QueuesTabProps) {
  const [newQueue, setNewQueue] = useState<NewQueueForm>({
    ...DEFAULT_NEW_QUEUE
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const handleCreate = () => {
    if (!newQueue.name.trim()) return
    onCreateQueue(newQueue)
    setNewQueue({ ...DEFAULT_NEW_QUEUE })
    setDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget !== null) {
      onDeleteQueue(deleteTarget)
      setDeleteTarget(null)
    }
  }

  return (
    <Card className="rounded-2xl bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListOrdered className="h-5 w-5 text-blue-600" />
              Filas de Atendimento
            </CardTitle>
            <CardDescription>
              Gerencie as filas de atendimento do sistema
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" rounded="lg">
                <Plus className="h-4 w-4" />
                Nova Fila
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Fila</DialogTitle>
                <DialogDescription>
                  Adicione uma nova fila de atendimento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="queueName">Nome da Fila</Label>
                  <Input
                    id="queueName"
                    value={newQueue.name}
                    onChange={(e) =>
                      setNewQueue({ ...newQueue, name: e.target.value })
                    }
                    placeholder="Ex: Suporte, Vendas..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="queueColor">Cor</Label>
                  <div className="flex items-center gap-3">
                    <input
                      id="queueColor"
                      type="color"
                      value={newQueue.color}
                      onChange={(e) =>
                        setNewQueue({ ...newQueue, color: e.target.value })
                      }
                      className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200"
                    />
                    <span className="text-sm text-gray-500">
                      {newQueue.color}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  rounded="lg"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  rounded="lg"
                  onClick={handleCreate}
                  disabled={!newQueue.name.trim()}
                >
                  Criar Fila
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
        ) : queues.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Nenhuma fila cadastrada
          </p>
        ) : (
          <div className="space-y-2">
            {queues.map((queue) => (
              <div
                key={queue.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: queue.color }}
                  />
                  <span className="font-medium text-gray-900">
                    {queue.name}
                  </span>
                </div>
                <Dialog
                  open={deleteTarget === queue.id}
                  onOpenChange={(open) =>
                    setDeleteTarget(open ? queue.id : null)
                  }
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" rounded="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Exclusao</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja excluir a fila &quot;{queue.name}
                        &quot;? Esta acao nao pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        rounded="lg"
                        onClick={() => setDeleteTarget(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        rounded="lg"
                        onClick={handleConfirmDelete}
                      >
                        Excluir
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
