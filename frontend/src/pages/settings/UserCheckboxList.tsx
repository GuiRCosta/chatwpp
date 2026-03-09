import type { User } from "@/types"

interface UserCheckboxListProps {
  users: User[]
  selectedIds: Set<number>
  onToggle: (userId: number) => void
  disabled?: boolean
  compact?: boolean
}

export function UserCheckboxList({
  users,
  selectedIds,
  onToggle,
  disabled,
  compact
}: UserCheckboxListProps) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum usuario disponivel</p>
    )
  }

  return (
    <div
      className={`space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 ${
        compact ? "max-h-32" : "max-h-48"
      }`}
    >
      {users.map((user) => (
        <label
          key={user.id}
          className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={selectedIds.has(user.id)}
            onChange={() => onToggle(user.id)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-900">{user.name}</span>
          {!compact && (
            <span className="text-xs text-gray-400">{user.email}</span>
          )}
        </label>
      ))}
    </div>
  )
}
