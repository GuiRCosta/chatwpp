import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { ForgotPassword } from "@/pages/ForgotPassword"
import { server } from "@/__tests__/mocks/server"

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("ForgotPassword", () => {
  it("renders the form with email input", () => {
    render(<ForgotPassword />)

    expect(screen.getByText("Recuperar senha")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByText("Enviar link")).toBeInTheDocument()
  })

  it("renders NUVIO branding", () => {
    render(<ForgotPassword />)

    expect(screen.getByText("NUVIO")).toBeInTheDocument()
  })

  it("shows error when submitting empty email", async () => {
    render(<ForgotPassword />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Enviar link"))

    expect(
      screen.getByText("Por favor, informe seu email")
    ).toBeInTheDocument()
  })

  it("shows success message after submitting valid email", async () => {
    render(<ForgotPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Email"), "user@test.com")
    await user.click(screen.getByText("Enviar link"))

    await waitFor(() => {
      expect(
        screen.getByText(/Se este email estiver cadastrado/)
      ).toBeInTheDocument()
    })

    expect(screen.getByText("Voltar ao login")).toBeInTheDocument()
  })

  it("shows error message when API fails", async () => {
    server.use(
      http.post("/api/auth/forgot-password", () => {
        return HttpResponse.json(
          { success: false, error: "Server error" },
          { status: 500 }
        )
      })
    )

    render(<ForgotPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Email"), "user@test.com")
    await user.click(screen.getByText("Enviar link"))

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao enviar email. Tente novamente.")
      ).toBeInTheDocument()
    })
  })

  it("has link back to login", () => {
    render(<ForgotPassword />)

    const link = screen.getByText("Voltar ao login")
    expect(link).toBeInTheDocument()
    expect(link.closest("a")).toHaveAttribute("href", "/login")
  })

  it("disables button while loading", async () => {
    let resolveRequest: () => void
    const pendingPromise = new Promise<void>((resolve) => {
      resolveRequest = resolve
    })

    server.use(
      http.post("/api/auth/forgot-password", async () => {
        await pendingPromise
        return HttpResponse.json({
          success: true,
          data: { message: "ok" }
        })
      })
    )

    render(<ForgotPassword />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Email"), "user@test.com")
    await user.click(screen.getByText("Enviar link"))

    await waitFor(() => {
      expect(screen.getByText("Enviando...")).toBeInTheDocument()
    })

    expect(screen.getByRole("button")).toBeDisabled()

    resolveRequest!()
  })
})
