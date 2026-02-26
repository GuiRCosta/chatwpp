import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, userEvent } from "@/__tests__/utils/render"
import { AudioPreview } from "../AudioPreview"

const mockPlay = vi.fn()
const mockPause = vi.fn()

function createProps(overrides = {}) {
  return {
    blob: new Blob(["audio-data"], { type: "audio/ogg" }),
    duration: 5,
    onSend: vi.fn(),
    onDiscard: vi.fn(),
    ...overrides
  }
}

describe("AudioPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlay.mockImplementation(() => {})
    mockPause.mockImplementation(() => {})

    // Override Audio constructor on window (jsdom)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).Audio = vi.fn().mockImplementation(() => ({
      play: mockPlay,
      pause: mockPause,
      currentTime: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))

    // Ensure URL methods are available
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn()
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn()
    }
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url")
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {})
  })

  it("renders play button, discard button and send button", () => {
    const props = createProps()
    render(<AudioPreview {...props} />)

    expect(screen.getByTitle("Reproduzir")).toBeInTheDocument()
    expect(screen.getByTitle("Descartar")).toBeInTheDocument()
    expect(screen.getByTitle("Enviar")).toBeInTheDocument()
  })

  it("displays formatted duration", () => {
    const props = createProps({ duration: 65 })
    render(<AudioPreview {...props} />)

    expect(screen.getByText("1:05")).toBeInTheDocument()
  })

  it("calls onDiscard when discard button is clicked", async () => {
    const props = createProps()
    render(<AudioPreview {...props} />)

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Descartar"))

    expect(props.onDiscard).toHaveBeenCalled()
  })

  it("calls onSend when send button is clicked", async () => {
    const props = createProps()
    render(<AudioPreview {...props} />)

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Enviar"))

    expect(props.onSend).toHaveBeenCalled()
  })

  it("toggles play/pause on play button click", async () => {
    const props = createProps()
    render(<AudioPreview {...props} />)

    const user = userEvent.setup()

    await user.click(screen.getByTitle("Reproduzir"))
    expect(mockPlay).toHaveBeenCalled()

    expect(screen.getByTitle("Pausar")).toBeInTheDocument()

    await user.click(screen.getByTitle("Pausar"))
    expect(mockPause).toHaveBeenCalled()
  })

  it("shows progress bar", () => {
    const props = createProps()
    render(<AudioPreview {...props} />)

    const progressBar = document.querySelector(".bg-blue-600")
    expect(progressBar).toBeInTheDocument()
  })
})
