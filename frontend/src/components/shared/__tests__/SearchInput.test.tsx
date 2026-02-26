import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/__tests__/utils/render"
import { SearchInput } from "@/components/shared/SearchInput"
import { act } from "@testing-library/react"

describe("SearchInput", () => {
  it("renders with placeholder text", () => {
    const onChange = vi.fn()
    render(
      <SearchInput
        value=""
        onChange={onChange}
        placeholder="Buscar contatos..."
      />
    )

    expect(
      screen.getByPlaceholderText("Buscar contatos...")
    ).toBeInTheDocument()
  })

  it("renders with default placeholder when none provided", () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} />)

    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument()
  })

  it("debounces onChange callback", async () => {
    vi.useFakeTimers()

    const onChange = vi.fn()

    render(
      <SearchInput value="" onChange={onChange} debounceMs={300} />
    )

    const input = screen.getByPlaceholderText("Buscar...")

    // Simulate typing by firing change events directly
    // (userEvent.type + fake timers can conflict)
    await act(async () => {
      // Fire input change
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set

      nativeInputValueSetter?.call(input, "test")
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })

    // Advance past the debounce period
    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    // After the debounce timer, onChange should have been called with the final value
    expect(onChange).toHaveBeenCalledWith("test")

    vi.useRealTimers()
  })

  it("syncs internal state with value prop changes", () => {
    const onChange = vi.fn()

    const { rerender } = render(
      <SearchInput value="initial" onChange={onChange} />
    )

    const input = screen.getByDisplayValue("initial")
    expect(input).toBeInTheDocument()

    rerender(
      <SearchInput value="updated" onChange={onChange} />
    )

    expect(screen.getByDisplayValue("updated")).toBeInTheDocument()
  })
})
