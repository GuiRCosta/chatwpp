import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, userEvent, waitFor } from "@/__tests__/utils/render"
import { Login } from "@/pages/Login"
import { server } from "@/__tests__/mocks/server"
import { http, HttpResponse } from "msw"
import { useAuthStore } from "@/stores/authStore"
import { resetAllStores } from "@/__tests__/utils/storeReset"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null)
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
  mockNavigate.mockClear()
})
afterAll(() => server.close())

describe("Login", () => {
  it("renders email and password inputs", () => {
    render(<Login />)

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Senha")).toBeInTheDocument()
  })

  it("renders login button", () => {
    render(<Login />)

    expect(
      screen.getByRole("button", { name: "Entrar" })
    ).toBeInTheDocument()
  })

  it("shows error message on failed login", async () => {
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        )
      })
    )

    const user = userEvent.setup()

    render(<Login />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Senha")
    const submitButton = screen.getByRole("button", { name: "Entrar" })

    await user.type(emailInput, "wrong@example.com")
    await user.type(passwordInput, "wrongpassword")
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText("Email ou senha invalidos")
      ).toBeInTheDocument()
    })
  })

  it("shows validation error when fields are empty", async () => {
    const user = userEvent.setup()

    render(<Login />)

    const submitButton = screen.getByRole("button", { name: "Entrar" })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText("Por favor, preencha todos os campos")
      ).toBeInTheDocument()
    })
  })

  it("calls login on form submit with valid credentials", async () => {
    const loginSpy = vi.fn().mockResolvedValue(undefined)
    useAuthStore.setState({ login: loginSpy, isLoading: false })

    const user = userEvent.setup()

    render(<Login />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Senha")
    const submitButton = screen.getByRole("button", { name: "Entrar" })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith("test@example.com", "password123")
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard")
    })
  })
})
