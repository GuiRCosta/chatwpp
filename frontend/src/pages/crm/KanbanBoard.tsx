import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trash2 } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable
} from "@dnd-kit/core"
import { Badge } from "@/components/ui/Badge"
import { ConfirmDialog } from "@/components/shared"
import { cn } from "@/lib/utils"
import type { Stage, Opportunity } from "@/types"

export interface KanbanBoardProps {
  stages: Stage[]
  opportunities: Opportunity[]
  onMoveOpportunity: (
    opportunityId: number,
    newStageId: number
  ) => Promise<void>
  onDeleteOpportunity?: (opportunityId: number) => Promise<void>
}

interface OpportunityCardProps {
  opportunity: Opportunity
  isDragging?: boolean
  onDelete?: (opportunityId: number) => void
}

function OpportunityCard({ opportunity, isDragging = false, onDelete }: OpportunityCardProps) {
  const formatCurrency = (value?: number | string | null) => {
    const num = Number(value)
    if (!num || isNaN(num)) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(num)
  }

  return (
    <div
      className={cn(
        "group/card rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-[#0A0A0A]">
            {opportunity.contact?.name || "Sem contato"}
          </h4>
          {opportunity.tags && opportunity.tags.length > 0 && (
            <Badge
              variant="secondary"
              style={{ backgroundColor: opportunity.tags[0].color }}
              className="text-white"
            >
              {opportunity.tags[0].name}
            </Badge>
          )}
        </div>

        {opportunity.title && (
          <p className="text-sm text-gray-500">{opportunity.title}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-blue-600">
            {formatCurrency(opportunity.value)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {format(new Date(opportunity.createdAt), "dd/MM/yyyy", {
                locale: ptBR
              })}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(opportunity.id)
                }}
                className="rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/card:opacity-100"
                title="Excluir oportunidade"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface DraggableOpportunityProps {
  opportunity: Opportunity
  onDelete?: (opportunityId: number) => void
}

function DraggableOpportunity({ opportunity, onDelete }: DraggableOpportunityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `opp-${opportunity.id}`,
    data: { opportunity }
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <OpportunityCard opportunity={opportunity} isDragging={isDragging} onDelete={onDelete} />
    </div>
  )
}

interface KanbanColumnProps {
  stage: Stage
  opportunities: Opportunity[]
  isOver: boolean
  onDeleteOpportunity?: (opportunityId: number) => void
}

function KanbanColumn({ stage, opportunities, isOver, onDeleteOpportunity }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
    data: { stageId: stage.id }
  })

  const stageOpportunities = opportunities.filter(
    (opp) => opp.stageId === stage.id
  )

  const totalValue = stageOpportunities.reduce(
    (sum, opp) => sum + (Number(opp.value) || 0),
    0
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[320px] flex-col rounded-2xl bg-gray-50 p-4 transition-colors",
        isOver && "bg-blue-50 ring-2 ring-blue-200"
      )}
    >
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color || "#6B7280" }}
          />
          <h3 className="font-semibold text-[#0A0A0A]">{stage.name}</h3>
          <Badge variant="secondary" className="ml-auto">
            {stageOpportunities.length}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          {formatCurrency(totalValue)}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {stageOpportunities.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Nenhuma oportunidade
          </div>
        ) : (
          stageOpportunities.map((opportunity) => (
            <DraggableOpportunity
              key={opportunity.id}
              opportunity={opportunity}
              onDelete={onDeleteOpportunity}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({
  stages,
  opportunities,
  onMoveOpportunity,
  onDeleteOpportunity
}: KanbanBoardProps) {
  const [activeOpportunity, setActiveOpportunity] =
    useState<Opportunity | null>(null)
  const [overStageId, setOverStageId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const opp = event.active.data.current?.opportunity as Opportunity | undefined
    if (opp) {
      setActiveOpportunity(opp)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const stageId = event.over?.data.current?.stageId as number | undefined
    setOverStageId(stageId ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveOpportunity(null)
    setOverStageId(null)

    if (!over) return

    const opp = active.data.current?.opportunity as Opportunity | undefined
    if (!opp) return

    const newStageId = over.data.current?.stageId as number | undefined
    if (!newStageId) return

    if (opp.stageId === newStageId) return

    await onMoveOpportunity(opp.id, newStageId)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            opportunities={opportunities}
            isOver={overStageId === stage.id}
            onDeleteOpportunity={onDeleteOpportunity ? (id) => setDeleteTarget(id) : undefined}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOpportunity ? (
          <div className="rotate-3 cursor-grabbing">
            <OpportunityCard opportunity={activeOpportunity} />
          </div>
        ) : null}
      </DragOverlay>

      {onDeleteOpportunity && (
        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
          title="Excluir Oportunidade"
          description="Tem certeza que deseja excluir esta oportunidade? Esta acao nao pode ser desfeita."
          onConfirm={async () => {
            if (deleteTarget !== null) {
              await onDeleteOpportunity(deleteTarget)
              setDeleteTarget(null)
            }
          }}
          confirmLabel="Excluir"
          variant="destructive"
        />
      )}
    </DndContext>
  )
}
