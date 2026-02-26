import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  debounceMs = 300,
  className
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(internalValue)
    }, debounceMs)

    return () => {
      clearTimeout(handler)
    }
  }, [internalValue, debounceMs, onChange])

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}
