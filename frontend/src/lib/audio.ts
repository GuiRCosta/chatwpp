/**
 * Audio recording utilities for browser MediaRecorder API.
 */

/** Check if browser supports OGG/Opus (Chrome, Firefox) */
export function supportsOggOpus(): boolean {
  if (typeof MediaRecorder === "undefined") return false
  return MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
}

/** Get the best recording MIME type for the current browser */
export function getRecordingMimeType(): string {
  if (supportsOggOpus()) return "audio/ogg;codecs=opus"
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus"
  }
  return "audio/webm"
}

/** Get file extension from MIME type */
export function getExtensionFromMime(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg"
  if (mimeType.includes("webm")) return "webm"
  if (mimeType.includes("wav")) return "wav"
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3"
  return "audio"
}

/** Format seconds into mm:ss display string */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
