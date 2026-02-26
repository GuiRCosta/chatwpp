import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, userEvent } from "@/__tests__/utils/render"
import { AudioRecorder } from "../AudioRecorder"

// Mock the useAudioRecorder hook
const mockStartRecording = vi.fn()
const mockStopRecording = vi.fn()
const mockCancelRecording = vi.fn()
const mockResetRecording = vi.fn()

let mockState: "idle" | "recording" | "recorded" = "idle"
let mockAudioBlob: Blob | null = null

vi.mock("@/hooks/useAudioRecorder", () => ({
  useAudioRecorder: () => ({
    state: mockState,
    duration: 5,
    audioBlob: mockAudioBlob,
    mimeType: "audio/ogg;codecs=opus",
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    cancelRecording: mockCancelRecording,
    resetRecording: mockResetRecording
  })
}))

// Mock AudioPreview to simplify testing
vi.mock("../AudioPreview", () => ({
  AudioPreview: ({
    onSend,
    onDiscard
  }: {
    onSend: () => void
    onDiscard: () => void
  }) => (
    <div data-testid="audio-preview">
      <button onClick={onSend}>Send Preview</button>
      <button onClick={onDiscard}>Discard Preview</button>
    </div>
  )
}))

function createProps() {
  return {
    onSend: vi.fn(),
    onCancel: vi.fn()
  }
}

describe("AudioRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = "idle"
    mockAudioBlob = null
  })

  describe("idle state", () => {
    it("renders mic button", () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      expect(screen.getByTestId("mic-button")).toBeInTheDocument()
    })

    it("calls startRecording when mic button is clicked", async () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      const user = userEvent.setup()
      await user.click(screen.getByTestId("mic-button"))

      expect(mockStartRecording).toHaveBeenCalled()
    })

    it("calls onCancel when microphone access is denied", async () => {
      mockStartRecording.mockRejectedValueOnce(
        new Error("Microphone access denied")
      )
      const props = createProps()
      render(<AudioRecorder {...props} />)

      const user = userEvent.setup()
      await user.click(screen.getByTestId("mic-button"))

      expect(props.onCancel).toHaveBeenCalled()
    })
  })

  describe("recording state", () => {
    beforeEach(() => {
      mockState = "recording"
    })

    it("shows recording indicator and timer", () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      expect(screen.getByText("0:05")).toBeInTheDocument()
    })

    it("shows cancel button", () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      expect(screen.getByTitle("Cancelar")).toBeInTheDocument()
    })

    it("shows stop button", () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      expect(screen.getByTestId("stop-button")).toBeInTheDocument()
    })

    it("calls stopRecording when stop button is clicked", async () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      const user = userEvent.setup()
      await user.click(screen.getByTestId("stop-button"))

      expect(mockStopRecording).toHaveBeenCalled()
    })

    it("calls cancelRecording and onCancel when cancel button is clicked", async () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      const user = userEvent.setup()
      await user.click(screen.getByTitle("Cancelar"))

      expect(mockCancelRecording).toHaveBeenCalled()
      expect(props.onCancel).toHaveBeenCalled()
    })
  })

  describe("recorded state", () => {
    beforeEach(() => {
      mockState = "recorded"
      mockAudioBlob = new Blob(["audio-data"], { type: "audio/ogg" })
    })

    it("renders AudioPreview", () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      expect(screen.getByTestId("audio-preview")).toBeInTheDocument()
    })

    it("calls onSend with blob data when send is clicked in preview", async () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      const user = userEvent.setup()
      await user.click(screen.getByText("Send Preview"))

      expect(props.onSend).toHaveBeenCalledWith(
        mockAudioBlob,
        "audio/ogg;codecs=opus",
        5
      )
      expect(mockResetRecording).toHaveBeenCalled()
    })

    it("calls onCancel when discard is clicked in preview", async () => {
      const props = createProps()
      render(<AudioRecorder {...props} />)

      const user = userEvent.setup()
      await user.click(screen.getByText("Discard Preview"))

      expect(mockResetRecording).toHaveBeenCalled()
      expect(props.onCancel).toHaveBeenCalled()
    })
  })
})
