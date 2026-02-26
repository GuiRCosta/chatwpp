import { useCallback } from "react"
import { Mic, Square, X } from "lucide-react"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { formatDuration } from "@/lib/audio"
import { AudioPreview } from "./AudioPreview"

interface AudioRecorderProps {
  onSend: (blob: Blob, mimeType: string, duration: number) => void
  onCancel: () => void
}

export function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const {
    state,
    duration,
    audioBlob,
    mimeType,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording
  } = useAudioRecorder()

  const handleMicClick = useCallback(async () => {
    try {
      await startRecording()
    } catch {
      // Microphone access denied - silently cancel
      onCancel()
    }
  }, [startRecording, onCancel])

  const handleSend = useCallback(() => {
    if (audioBlob) {
      onSend(audioBlob, mimeType, duration)
      resetRecording()
    }
  }, [audioBlob, mimeType, duration, onSend, resetRecording])

  const handleDiscard = useCallback(() => {
    resetRecording()
    onCancel()
  }, [resetRecording, onCancel])

  const handleCancel = useCallback(() => {
    cancelRecording()
    onCancel()
  }, [cancelRecording, onCancel])

  // Idle: show mic button to start
  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={handleMicClick}
        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
        title="Gravar audio"
        data-testid="mic-button"
      >
        <Mic className="h-5 w-5" />
      </button>
    )
  }

  // Recording: show recording bar with timer and stop/cancel
  if (state === "recording") {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-full bg-red-50 px-3 py-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-200"
          title="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-600">
            {formatDuration(duration)}
          </span>

          {/* Animated waveform bars */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-red-400"
                style={{
                  height: `${8 + Math.sin(Date.now() / 200 + i) * 6}px`,
                  animation: `pulse 0.5s ease-in-out ${i * 0.05}s infinite alternate`
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={stopRecording}
          className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
          title="Parar gravacao"
          data-testid="stop-button"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Recorded: show preview with play, discard, send
  if (audioBlob) {
    return (
      <div className="flex-1">
        <AudioPreview
          blob={audioBlob}
          duration={duration}
          onSend={handleSend}
          onDiscard={handleDiscard}
        />
      </div>
    )
  }

  return null
}
