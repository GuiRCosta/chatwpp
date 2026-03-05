import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useIsMobile } from "@/hooks/useIsMobile"

describe("useIsMobile", () => {
  let changeHandler: ((e: MediaQueryListEvent) => void) | null = null

  beforeEach(() => {
    changeHandler = null

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
          changeHandler = handler
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })
  })

  it("returns false for desktop viewport (default)", () => {
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it("returns true when matchMedia matches (mobile)", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
        changeHandler = handler
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it("updates when media query changes", () => {
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current).toBe(true)
  })

  it("queries the correct breakpoint", () => {
    renderHook(() => useIsMobile())

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)")
  })

  it("cleans up event listener on unmount", () => {
    const removeEventListener = vi.fn()

    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn()
    }))

    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function))
  })
})
