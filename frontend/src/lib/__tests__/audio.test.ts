import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  supportsOggOpus,
  getRecordingMimeType,
  getExtensionFromMime,
  formatDuration
} from "../audio"

describe("audio utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("supportsOggOpus", () => {
    it("returns true when MediaRecorder supports ogg/opus", () => {
      vi.stubGlobal("MediaRecorder", {
        isTypeSupported: (mime: string) => mime === "audio/ogg;codecs=opus"
      })

      expect(supportsOggOpus()).toBe(true)
    })

    it("returns false when MediaRecorder does not support ogg/opus", () => {
      vi.stubGlobal("MediaRecorder", {
        isTypeSupported: () => false
      })

      expect(supportsOggOpus()).toBe(false)
    })

    it("returns false when MediaRecorder is not available", () => {
      vi.stubGlobal("MediaRecorder", undefined)

      expect(supportsOggOpus()).toBe(false)
    })
  })

  describe("getRecordingMimeType", () => {
    it("returns ogg/opus when supported", () => {
      vi.stubGlobal("MediaRecorder", {
        isTypeSupported: (mime: string) => mime === "audio/ogg;codecs=opus"
      })

      expect(getRecordingMimeType()).toBe("audio/ogg;codecs=opus")
    })

    it("returns webm/opus when ogg not supported but webm is", () => {
      vi.stubGlobal("MediaRecorder", {
        isTypeSupported: (mime: string) => mime === "audio/webm;codecs=opus"
      })

      expect(getRecordingMimeType()).toBe("audio/webm;codecs=opus")
    })

    it("returns audio/webm as fallback", () => {
      vi.stubGlobal("MediaRecorder", {
        isTypeSupported: () => false
      })

      expect(getRecordingMimeType()).toBe("audio/webm")
    })
  })

  describe("getExtensionFromMime", () => {
    it("returns ogg for ogg mime types", () => {
      expect(getExtensionFromMime("audio/ogg;codecs=opus")).toBe("ogg")
      expect(getExtensionFromMime("audio/ogg")).toBe("ogg")
    })

    it("returns webm for webm mime types", () => {
      expect(getExtensionFromMime("audio/webm;codecs=opus")).toBe("webm")
      expect(getExtensionFromMime("audio/webm")).toBe("webm")
    })

    it("returns wav for wav mime types", () => {
      expect(getExtensionFromMime("audio/wav")).toBe("wav")
    })

    it("returns mp3 for mpeg mime types", () => {
      expect(getExtensionFromMime("audio/mpeg")).toBe("mp3")
      expect(getExtensionFromMime("audio/mp3")).toBe("mp3")
    })

    it("returns audio for unknown mime types", () => {
      expect(getExtensionFromMime("audio/unknown")).toBe("audio")
    })
  })

  describe("formatDuration", () => {
    it("formats 0 seconds as 0:00", () => {
      expect(formatDuration(0)).toBe("0:00")
    })

    it("formats seconds with zero-padded seconds", () => {
      expect(formatDuration(5)).toBe("0:05")
    })

    it("formats minutes and seconds", () => {
      expect(formatDuration(65)).toBe("1:05")
    })

    it("formats exact minutes", () => {
      expect(formatDuration(120)).toBe("2:00")
    })

    it("floors decimal seconds", () => {
      expect(formatDuration(5.7)).toBe("0:05")
    })

    it("handles large durations", () => {
      expect(formatDuration(3661)).toBe("61:01")
    })
  })
})
