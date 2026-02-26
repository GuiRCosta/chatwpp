import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  onRowClick?: (item: T) => void
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-gray-200 last:border-0">
          <td className="p-4" colSpan={100}>
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  )
}

export function DataTable<T extends object>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado",
  className
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-gray-200 last:border-0 transition-colors",
                    onRowClick &&
                      "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-[#0A0A0A]">
                      {column.render
                        ? column.render(item)
                        : ((item as Record<string, unknown>)[column.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
