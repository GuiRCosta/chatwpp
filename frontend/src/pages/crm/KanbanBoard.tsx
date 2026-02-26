import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import type { Stage, Opportunity } from "@/types"

export interface KanbanBoardProps {
  stages: Stage[]
  opportunities: Opportunity[]
  onMoveOpportunity: (
    opportunityId: number,
    newStageId: number
  ) => Promise<void>
}

interface OpportunityCardProps {
  opportunity: Opportunity
  isDragging?: boolean
}

function OpportunityCard({ opportunity, isDragging = false }: OpportunityCardProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
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
          <span className="text-xs text-gray-500">
            {format(new Date(opportunity.createdAt), "dd/MM/yyyy", {
              locale: ptBR
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

interface SortableOpportunityProps {
  opportunity: Opportunity
}

function SortableOpportunity({ opportunity }: SortableOpportunityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <OpportunityCard opportunity={opportunity} isDragging={isDragging} />
    </div>
  )
}

interface KanbanColumnProps {
  stage: Stage
  opportunities: Opportunity[]
}

function KanbanColumn({ stage, opportunities }: KanbanColumnProps) {
  const stageOpportunities = opportunities.filter(
    (opp) => opp.stageId === stage.id
  )

  const totalValue = stageOpportunities.reduce(
    (sum, opp) => sum + (opp.value || 0),
    0
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  return (
    <div className="flex min-w-[320px] flex-col rounded-2xl bg-gray-50 p-4">
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color }}
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

      <SortableContext
        items={stageOpportunities.map((opp) => opp.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 overflow-y-auto">
          {stageOpportunities.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Nenhuma oportunidade
            </div>
          ) : (
            stageOpportunities.map((opportunity) => (
              <SortableOpportunity
                key={opportunity.id}
                opportunity={opportunity}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard({
  stages,
  opportunities,
  onMoveOpportunity
}: KanbanBoardProps) {
  const [activeOpportunity, setActiveOpportunity] =
    useState<Opportunity | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const opportunity = opportunities.find((opp) => opp.id === event.active.id)
    if (opportunity) {
      setActiveOpportunity(opportunity)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveOpportunity(null)

    if (!over) return

    const opportunityId = active.id as number
    const newStageId = over.id as number

    const opportunity = opportunities.find((opp) => opp.id === opportunityId)
    if (!opportunity) return

    if (opportunity.stageId === newStageId) return

    try {
      await onMoveOpportunity(opportunityId, newStageId)
    } catch (error) {
      console.error("Failed to move opportunity:", error)
    }
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedStages.map((stage) => (
          <SortableContext
            key={stage.id}
            items={[stage.id]}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn stage={stage} opportunities={opportunities} />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeOpportunity ? (
          <div className="rotate-3 cursor-grabbing">
            <OpportunityCard opportunity={activeOpportunity} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
