import { useCallback, useEffect, useRef, useState } from "react"
import { getRecordingMimeType } from "@/lib/audio"

export type RecorderState = "idle" | "recording" | "recorded"

interface UseAudioRecorderReturn {
  state: RecorderState
  duration: number
  audioBlob: Blob | null
  mimeType: string
  startRecording: () => Promise<void>
  stopRecording: () => void
  cancelRecording: () => void
  resetRecording: () => void
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle")
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [mimeType, setMimeType] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mime = getRecordingMimeType()
      setMimeType(mime)

      const recorder = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current = [...chunksRef.current, e.data]
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        setAudioBlob(blob)
        setState("recorded")

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      recorder.start(100)
      startTimeRef.current = Date.now()
      setDuration(0)
      setState("recording")

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)
      }, 200)
    } catch {
      cleanup()
      throw new Error("Microphone access denied")
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    cleanup()
    setAudioBlob(null)
    setDuration(0)
    setState("idle")
  }, [cleanup])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setState("idle")
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    duration,
    audioBlob,
    mimeType,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording
  }
}
