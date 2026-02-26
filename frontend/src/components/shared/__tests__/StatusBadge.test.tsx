import { describe, it, expect } from "vitest"
import { render, screen } from "@/__tests__/utils/render"
import { StatusBadge } from "@/components/shared/StatusBadge"

describe("StatusBadge", () => {
  it("renders ticket 'open' with correct Portuguese label", () => {
    render(<StatusBadge status="open" type="ticket" />)
    expect(screen.getByText("Aberto")).toBeInTheDocument()
  })

  it("renders ticket 'pending' status", () => {
    render(<StatusBadge status="pending" type="ticket" />)
    expect(screen.getByText("Pendente")).toBeInTheDocument()
  })

  it("renders ticket 'closed' status", () => {
    render(<StatusBadge status="closed" type="ticket" />)
    expect(screen.getByText("Fechado")).toBeInTheDocument()
  })

  it("renders campaign 'processing' status", () => {
    render(<StatusBadge status="processing" type="campaign" />)
    expect(screen.getByText("Em Andamento")).toBeInTheDocument()
  })

  it("renders campaign 'completed' status", () => {
    render(<StatusBadge status="completed" type="campaign" />)
    expect(screen.getByText("Concluída")).toBeInTheDocument()
  })

  it("renders opportunity 'open' status", () => {
    render(<StatusBadge status="open" type="opportunity" />)
    expect(screen.getByText("Aberta")).toBeInTheDocument()
  })

  it("renders opportunity 'won' status", () => {
    render(<StatusBadge status="won" type="opportunity" />)
    expect(screen.getByText("Ganha")).toBeInTheDocument()
  })

  it("renders opportunity 'lost' status", () => {
    render(<StatusBadge status="lost" type="opportunity" />)
    expect(screen.getByText("Perdida")).toBeInTheDocument()
  })

  it("handles unknown status gracefully by displaying raw status", () => {
    render(<StatusBadge status="unknown_status" type="ticket" />)
    expect(screen.getByText("unknown_status")).toBeInTheDocument()
  })

  it("defaults type to ticket when not specified", () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText("Aberto")).toBeInTheDocument()
  })
})
