import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/__tests__/utils/render"
import { KanbanBoard } from "../KanbanBoard"
import type { Stage, Opportunity } from "@/types"

const mockStages: Stage[] = [
  {
    id: 1,
    name: "Prospeccao",
    color: "#3B82F6",
    order: 1,
    pipelineId: 1,
    tenantId: 1,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    name: "Negociacao",
    color: "#F59E0B",
    order: 2,
    pipelineId: 1,
    tenantId: 1,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 3,
    name: "Fechamento",
    color: "#10B981",
    order: 3,
    pipelineId: 1,
    tenantId: 1,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  }
]

const mockOpportunities: Opportunity[] = [
  {
    id: 1,
    title: "Oportunidade Alpha",
    value: 5000,
    contactId: 1,
    contact: {
      id: 1,
      name: "Cliente A",
      number: "5511999999999",
      tenantId: 1,
      isGroup: false,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    },
    stageId: 1,
    tenantId: 1,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    title: "Oportunidade Beta",
    value: 10000,
    contactId: 2,
    contact: {
      id: 2,
      name: "Cliente B",
      number: "5511888888888",
      tenantId: 1,
      isGroup: false,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    },
    stageId: 2,
    tenantId: 1,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  }
]

const mockOnMoveOpportunity = vi.fn().mockResolvedValue(undefined)

describe("KanbanBoard", () => {
  it("renders stage columns when data is provided", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.getByText("Prospeccao")).toBeInTheDocument()
    expect(screen.getByText("Negociacao")).toBeInTheDocument()
    expect(screen.getByText("Fechamento")).toBeInTheDocument()
  })

  it("renders empty state when no stages are provided", () => {
    render(
      <KanbanBoard
        stages={[]}
        opportunities={[]}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.queryByText("Prospeccao")).not.toBeInTheDocument()
    expect(screen.queryByText("Negociacao")).not.toBeInTheDocument()
  })

  it("renders opportunity cards with contact names", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.getByText("Cliente A")).toBeInTheDocument()
    expect(screen.getByText("Cliente B")).toBeInTheDocument()
  })

  it("renders opportunity titles", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.getByText("Oportunidade Alpha")).toBeInTheDocument()
    expect(screen.getByText("Oportunidade Beta")).toBeInTheDocument()
  })

  it("shows empty stage message for stages without opportunities", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.getByText("Nenhuma oportunidade")).toBeInTheDocument()
  })

  it("displays formatted currency values", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    // Currency values appear both in the column header total and on each card
    const fiveThousandElements = screen.getAllByText("R$ 5.000,00")
    expect(fiveThousandElements.length).toBeGreaterThanOrEqual(1)

    const tenThousandElements = screen.getAllByText("R$ 10.000,00")
    expect(tenThousandElements.length).toBeGreaterThanOrEqual(1)
  })

  it("renders opportunity count badges per stage", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    // Stage 1 has 1 opportunity, Stage 2 has 1 opportunity, Stage 3 has 0
    // The badge shows the count
    const badges = screen.getAllByText("1")
    expect(badges.length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("sorts stages by order", () => {
    const unsortedStages: Stage[] = [
      {
        id: 3,
        name: "Fechamento",
        color: "#10B981",
        order: 3,
        pipelineId: 1,
        tenantId: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: 1,
        name: "Prospeccao",
        color: "#3B82F6",
        order: 1,
        pipelineId: 1,
        tenantId: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: 2,
        name: "Negociacao",
        color: "#F59E0B",
        order: 2,
        pipelineId: 1,
        tenantId: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      }
    ]

    render(
      <KanbanBoard
        stages={unsortedStages}
        opportunities={[]}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    const stageNames = screen.getAllByText(
      /Prospeccao|Negociacao|Fechamento/
    )
    expect(stageNames[0]).toHaveTextContent("Prospeccao")
    expect(stageNames[1]).toHaveTextContent("Negociacao")
    expect(stageNames[2]).toHaveTextContent("Fechamento")
  })

  it("shows Sem contato when opportunity has no contact", () => {
    const noContactOpportunity: Opportunity[] = [
      {
        id: 10,
        title: "Oportunidade isolada",
        value: 1000,
        contactId: 1,
        stageId: 1,
        tenantId: 1,
        createdAt: "2025-01-15T12:00:00.000Z",
        updatedAt: "2025-01-15T12:00:00.000Z"
      }
    ]

    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={noContactOpportunity}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.getByText("Sem contato")).toBeInTheDocument()
  })

  it("displays R$ 0,00 for zero-value column", () => {
    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={mockOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    // Stage 3 (Fechamento) has no opportunities, so column total is R$ 0,00
    const zeroValues = screen.getAllByText("R$ 0,00")
    expect(zeroValues.length).toBeGreaterThanOrEqual(1)
  })

  it("renders date on opportunity cards", () => {
    const datedOpportunities: Opportunity[] = [
      {
        ...mockOpportunities[0],
        createdAt: "2025-01-15T12:00:00.000Z",
        updatedAt: "2025-01-15T12:00:00.000Z"
      },
      {
        ...mockOpportunities[1],
        createdAt: "2025-01-15T12:00:00.000Z",
        updatedAt: "2025-01-15T12:00:00.000Z"
      }
    ]

    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={datedOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    // Opportunities were created on 2025-01-15 -> formatted as 15/01/2025
    const dateElements = screen.getAllByText("15/01/2025")
    expect(dateElements.length).toBeGreaterThanOrEqual(2)
  })

  it("renders tag badge when opportunity has tags", () => {
    const taggedOpportunities: Opportunity[] = [
      {
        id: 5,
        title: "Oportunidade com tag",
        value: 3000,
        contactId: 1,
        contact: {
          id: 1,
          name: "Cliente Tag",
          number: "5511777777777",
          tenantId: 1,
          isGroup: false,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z"
        },
        stageId: 1,
        tenantId: 1,
        tags: [
          {
            id: 1,
            name: "Quente",
            color: "#EF4444",
            tenantId: 1,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        ],
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      }
    ]

    render(
      <KanbanBoard
        stages={mockStages}
        opportunities={taggedOpportunities}
        onMoveOpportunity={mockOnMoveOpportunity}
      />
    )

    expect(screen.getByText("Quente")).toBeInTheDocument()
  })
})
