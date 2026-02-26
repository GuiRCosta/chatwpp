import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, Trash2, Send } from "lucide-react"
import { formatDuration } from "@/lib/audio"

interface AudioPreviewProps {
  blob: Blob
  duration: number
  onSend: () => void
  onDiscard: () => void
}

export function AudioPreview({
  blob,
  duration,
  onSend,
  onDiscard
}: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime)
    })
    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      audio.pause()
      URL.revokeObjectURL(url)
    }
  }, [blob])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
      <button
        type="button"
        onClick={onDiscard}
        className="rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-50"
        title="Descartar"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={togglePlayback}
        className="rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
        title={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <div className="flex min-w-[120px] flex-1 items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-300">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="min-w-[36px] text-xs text-gray-500">
          {formatDuration(isPlaying ? currentTime : duration)}
        </span>
      </div>

      <button
        type="button"
        onClick={onSend}
        className="rounded-full bg-green-500 p-2 text-white transition-colors hover:bg-green-600"
        title="Enviar"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
