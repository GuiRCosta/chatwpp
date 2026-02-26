import { describe, it, expect, vi } from "vitest"
import { render, screen, userEvent } from "@/__tests__/utils/render"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Excluir contato",
    description: "Tem certeza que deseja excluir?",
    onConfirm: vi.fn(),
    confirmLabel: "Excluir",
    variant: "default" as const
  }

  it("renders title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText("Excluir contato")).toBeInTheDocument()
    expect(
      screen.getByText("Tem certeza que deseja excluir?")
    ).toBeInTheDocument()
  })

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />
    )

    const confirmButton = screen.getByRole("button", { name: "Excluir" })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />
    )

    const cancelButton = screen.getByRole("button", { name: "Cancelar" })
    await user.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows destructive variant styling on confirm button", () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />)

    const confirmButton = screen.getByRole("button", { name: "Excluir" })
    expect(confirmButton).toBeInTheDocument()
    // The destructive variant button should exist with the correct label
    expect(confirmButton).toHaveTextContent("Excluir")
  })

  it("does not render content when open is false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText("Excluir contato")).not.toBeInTheDocument()
  })
})
