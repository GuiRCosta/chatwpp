import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAudioRecorder } from "../useAudioRecorder"

vi.mock("@/lib/audio", () => ({
  getRecordingMimeType: () => "audio/ogg;codecs=opus"
}))

// --- MediaRecorder mock ---
type DataHandler = (e: { data: Blob }) => void
type StopHandler = () => void

let mockOnDataAvailable: DataHandler | null = null
let mockOnStop: StopHandler | null = null
let mockRecorderState = "inactive"

const mockStart = vi.fn()
const mockStop = vi.fn()
const mockTrackStop = vi.fn()
const mockGetUserMedia = vi.fn()

function MockMediaRecorder() {
  return {
    start: mockStart,
    stop: mockStop,
    get state() {
      return mockRecorderState
    },
    set ondataavailable(handler: DataHandler) {
      mockOnDataAvailable = handler
    },
    set onstop(handler: StopHandler) {
      mockOnStop = handler
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  mockRecorderState = "inactive"
  mockOnDataAvailable = null
  mockOnStop = null

  mockStart.mockImplementation(() => {
    mockRecorderState = "recording"
  })
  mockStop.mockImplementation(() => {
    mockRecorderState = "inactive"
    if (mockOnDataAvailable) {
      mockOnDataAvailable({
        data: new Blob(["audio-data"], { type: "audio/ogg" })
      })
    }
    if (mockOnStop) {
      mockOnStop()
    }
  })
  mockTrackStop.mockImplementation(() => {})
  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: mockTrackStop }]
  })

  vi.stubGlobal("MediaRecorder", MockMediaRecorder)
  vi.stubGlobal("navigator", {
    mediaDevices: { getUserMedia: mockGetUserMedia }
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe("useAudioRecorder", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useAudioRecorder())

    expect(result.current.state).toBe("idle")
    expect(result.current.duration).toBe(0)
    expect(result.current.audioBlob).toBeNull()
  })

  it("transitions to recording state on startRecording", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.state).toBe("recording")
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(mockStart).toHaveBeenCalledWith(100)
  })

  it("updates duration while recording", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.duration).toBeGreaterThan(0)
  })

  it("transitions to recorded state on stopRecording", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    await act(async () => {
      result.current.stopRecording()
    })

    expect(result.current.state).toBe("recorded")
    expect(result.current.audioBlob).toBeInstanceOf(Blob)
  })

  it("returns to idle on cancelRecording", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.cancelRecording()
    })

    expect(result.current.state).toBe("idle")
    expect(result.current.audioBlob).toBeNull()
    expect(result.current.duration).toBe(0)
  })

  it("returns to idle on resetRecording after recorded", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    await act(async () => {
      result.current.stopRecording()
    })

    expect(result.current.state).toBe("recorded")

    act(() => {
      result.current.resetRecording()
    })

    expect(result.current.state).toBe("idle")
    expect(result.current.audioBlob).toBeNull()
  })

  it("stops media tracks on cancel", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    act(() => {
      result.current.cancelRecording()
    })

    expect(mockTrackStop).toHaveBeenCalled()
  })

  it("throws when microphone access is denied", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("Permission denied"))

    const { result } = renderHook(() => useAudioRecorder())

    await expect(
      act(async () => {
        await result.current.startRecording()
      })
    ).rejects.toThrow("Microphone access denied")

    expect(result.current.state).toBe("idle")
  })

  it("provides mimeType after recording starts", async () => {
    const { result } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.mimeType).toBe("audio/ogg;codecs=opus")
  })

  it("cleans up on unmount", async () => {
    const { result, unmount } = renderHook(() => useAudioRecorder())

    await act(async () => {
      await result.current.startRecording()
    })

    unmount()

    expect(mockTrackStop).toHaveBeenCalled()
  })
})
