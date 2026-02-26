import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges classes correctly", () => {
    const result = cn("px-4", "py-2", "text-sm")
    expect(result).toBe("px-4 py-2 text-sm")
  })

  it("handles conflicting tailwind classes via tailwind-merge", () => {
    const result = cn("px-4", "px-8")
    expect(result).toBe("px-8")
  })

  it("handles conflicting bg classes", () => {
    const result = cn("bg-red-500", "bg-blue-500")
    expect(result).toBe("bg-blue-500")
  })

  it("handles conditional classes", () => {
    const isActive = true
    const isDisabled = false
    const result = cn("base", isActive && "active", isDisabled && "disabled")
    expect(result).toBe("base active")
  })

  it("handles empty inputs", () => {
    const result = cn()
    expect(result).toBe("")
  })

  it("handles undefined and null inputs", () => {
    const result = cn("base", undefined, null, "extra")
    expect(result).toBe("base extra")
  })

  it("handles arrays of classes", () => {
    const result = cn(["px-4", "py-2"])
    expect(result).toBe("px-4 py-2")
  })

  it("handles object syntax from clsx", () => {
    const result = cn({ "bg-red-500": true, "text-white": true, hidden: false })
    expect(result).toBe("bg-red-500 text-white")
  })
})
