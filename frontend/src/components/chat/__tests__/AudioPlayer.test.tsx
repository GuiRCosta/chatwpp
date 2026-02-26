import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, userEvent } from "@/__tests__/utils/render"
import { AudioPlayer } from "../AudioPlayer"

const mockPlay = vi.fn()
const mockPause = vi.fn()
let mockEventListeners: Record<string, (() => void)[]> = {}

describe("AudioPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlay.mockImplementation(() => {})
    mockPause.mockImplementation(() => {})
    mockEventListeners = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).Audio = vi.fn().mockImplementation(() => ({
      play: mockPlay,
      pause: mockPause,
      currentTime: 0,
      duration: 10,
      playbackRate: 1,
      addEventListener: (event: string, handler: () => void) => {
        if (!mockEventListeners[event]) mockEventListeners[event] = []
        mockEventListeners[event].push(handler)
      },
      removeEventListener: vi.fn()
    }))
  })

  it("renders play button", () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    expect(screen.getByTitle("Reproduzir")).toBeInTheDocument()
  })

  it("renders speed control showing 1x by default", () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    expect(screen.getByTestId("speed-button")).toHaveTextContent("1x")
  })

  it("calls audio.play() when play button is clicked", async () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Reproduzir"))

    expect(mockPlay).toHaveBeenCalled()
  })

  it("shows pause button after play is clicked", async () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Reproduzir"))

    expect(screen.getByTitle("Pausar")).toBeInTheDocument()
  })

  it("calls audio.pause() when pause button is clicked", async () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Reproduzir"))
    await user.click(screen.getByTitle("Pausar"))

    expect(mockPause).toHaveBeenCalled()
  })

  it("cycles speed through 1x, 1.5x, 2x on click", async () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    const user = userEvent.setup()
    const speedButton = screen.getByTestId("speed-button")

    expect(speedButton).toHaveTextContent("1x")

    await user.click(speedButton)
    expect(speedButton).toHaveTextContent("1.5x")

    await user.click(speedButton)
    expect(speedButton).toHaveTextContent("2x")

    await user.click(speedButton)
    expect(speedButton).toHaveTextContent("1x")
  })

  it("shows progress bar", () => {
    render(<AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />)

    expect(screen.getByTestId("audio-progress")).toBeInTheDocument()
  })

  it("applies correct styles for fromMe messages", () => {
    const { container } = render(
      <AudioPlayer src="/public/1/audio.ogg" isFromMe={true} />
    )

    const progressTrack = container.querySelector(".bg-blue-400")
    expect(progressTrack).toBeInTheDocument()
  })

  it("applies correct styles for received messages", () => {
    const { container } = render(
      <AudioPlayer src="/public/1/audio.ogg" isFromMe={false} />
    )

    const progressTrack = container.querySelector(".bg-gray-200")
    expect(progressTrack).toBeInTheDocument()
  })
})
