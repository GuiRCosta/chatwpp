import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

export function NavigationProgress() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return
    prevPathRef.current = location.pathname

    // Start progress
    setVisible(true)
    setProgress(30)

    timeoutRef.current = setTimeout(() => {
      setProgress(70)
    }, 100)

    const completeTimeout = setTimeout(() => {
      setProgress(100)
    }, 200)

    const hideTimeout = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 500)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      clearTimeout(completeTimeout)
      clearTimeout(hideTimeout)
    }
  }, [location.pathname])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-0.5">
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
