import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/audio"

interface AudioPlayerProps {
  src: string
  isFromMe: boolean
}

const SPEED_OPTIONS = [1, 1.5, 2] as const

export function AudioPlayer({ src, isFromMe }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1)

  useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.pause()
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
    }
  }, [src])

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

  const cycleSpeed = useCallback(() => {
    const currentIndex = SPEED_OPTIONS.indexOf(speed)
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length
    const nextSpeed = SPEED_OPTIONS[nextIndex]
    setSpeed(nextSpeed)

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }, [speed])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-2 py-1">
      <button
        type="button"
        onClick={togglePlayback}
        className={cn(
          "shrink-0 rounded-full p-1.5 transition-colors",
          isFromMe
            ? "text-white hover:bg-blue-500"
            : "text-gray-600 hover:bg-gray-100"
        )}
        title={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </button>

      <div className="flex min-w-[140px] flex-1 items-center gap-2">
        <div
          className={cn(
            "h-1 flex-1 overflow-hidden rounded-full",
            isFromMe ? "bg-blue-400" : "bg-gray-200"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isFromMe ? "bg-white" : "bg-blue-600"
            )}
            style={{ width: `${progress}%` }}
            data-testid="audio-progress"
          />
        </div>

        <span
          className={cn(
            "min-w-[36px] text-xs",
            isFromMe ? "text-blue-100" : "text-gray-500"
          )}
        >
          {formatDuration(isPlaying ? currentTime : duration)}
        </span>
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        className={cn(
          "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors",
          isFromMe
            ? "text-blue-100 hover:bg-blue-500"
            : "text-gray-500 hover:bg-gray-100"
        )}
        title="Velocidade"
        data-testid="speed-button"
      >
        {speed}x
      </button>
    </div>
  )
}
