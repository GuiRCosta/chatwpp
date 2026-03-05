import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { ResetPassword } from "@/pages/ResetPassword"
import { server } from "@/__tests__/mocks/server"

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams("token=test-reset-token")]
  }
})

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("ResetPassword", () => {
  it("renders the form with password fields", () => {
    render(<ResetPassword />)

    expect(screen.getByRole("heading", { name: "Nova senha" })).toBeInTheDocument()
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument()
    expect(screen.getByText("Redefinir senha")).toBeInTheDocument()
  })

  it("renders NUVIO branding", () => {
    render(<ResetPassword />)

    expect(screen.getByText("NUVIO")).toBeInTheDocument()
  })

  it("shows error when fields are empty", async () => {
    render(<ResetPassword />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Redefinir senha"))

    expect(
      screen.getByText("Por favor, preencha todos os campos")
    ).toBeInTheDocument()
  })

  it("shows error when password is too short", async () => {
    render(<ResetPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Nova senha"), "short")
    await user.type(screen.getByLabelText("Confirmar senha"), "short")
    await user.click(screen.getByText("Redefinir senha"))

    expect(
      screen.getByText("A senha deve ter no minimo 8 caracteres")
    ).toBeInTheDocument()
  })

  it("shows error when passwords do not match", async () => {
    render(<ResetPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Nova senha"), "password123")
    await user.type(screen.getByLabelText("Confirmar senha"), "different123")
    await user.click(screen.getByText("Redefinir senha"))

    expect(screen.getByText("As senhas nao coincidem")).toBeInTheDocument()
  })

  it("shows success message on valid reset", async () => {
    render(<ResetPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Nova senha"), "newpassword123")
    await user.type(screen.getByLabelText("Confirmar senha"), "newpassword123")
    await user.click(screen.getByText("Redefinir senha"))

    await waitFor(() => {
      expect(
        screen.getByText("Senha redefinida com sucesso!")
      ).toBeInTheDocument()
    })

    expect(screen.getByText("Ir para o login")).toBeInTheDocument()
  })

  it("shows error when API fails (expired token)", async () => {
    server.use(
      http.post("/api/auth/reset-password", () => {
        return HttpResponse.json(
          { success: false, error: "Invalid token" },
          { status: 400 }
        )
      })
    )

    render(<ResetPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Nova senha"), "newpassword123")
    await user.type(screen.getByLabelText("Confirmar senha"), "newpassword123")
    await user.click(screen.getByText("Redefinir senha"))

    await waitFor(() => {
      expect(
        screen.getByText("Token invalido ou expirado. Solicite um novo link.")
      ).toBeInTheDocument()
    })
  })

  it("has link back to login", () => {
    render(<ResetPassword />)

    const link = screen.getByText("Voltar ao login")
    expect(link).toBeInTheDocument()
    expect(link.closest("a")).toHaveAttribute("href", "/login")
  })
})
