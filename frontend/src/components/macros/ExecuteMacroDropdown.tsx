import { useEffect, useState } from "react"
import { Zap, Globe } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/DropdownMenu"
import { toast } from "sonner"
import api from "@/lib/api"
import type { Macro, MacroExecutionResult, ApiResponse } from "@/types"

interface ExecuteMacroDropdownProps {
  ticketId: number
}

export function ExecuteMacroDropdown({ ticketId }: ExecuteMacroDropdownProps) {
  const [macros, setMacros] = useState<Macro[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    const fetchMacros = async () => {
      try {
        setIsLoading(true)
        const response = await api.get<ApiResponse<Macro[]>>("/macros")
        if (response.data.success) {
          setMacros(response.data.data)
        }
      } catch {
        // silent - dropdown just won't show macros
      } finally {
        setIsLoading(false)
      }
    }
    fetchMacros()
  }, [])

  const handleExecute = async (macroId: number, macroName: string) => {
    try {
      setIsExecuting(true)
      const response = await api.post<ApiResponse<MacroExecutionResult[]>>(
        `/macros/${macroId}/execute`,
        { ticketIds: [ticketId] }
      )

      if (response.data.success) {
        const executionResult = response.data.data[0]?.result
        if (executionResult && executionResult.failed > 0) {
          toast.success(
            `"${macroName}": ${executionResult.succeeded}/${executionResult.totalActions} acoes executadas`
          )
        } else {
          toast.success(`"${macroName}" executada com sucesso`)
        }
      }
    } catch {
      toast.error("Erro ao executar macro")
    } finally {
      setIsExecuting(false)
    }
  }

  if (macros.length === 0 && !isLoading) return null

  const personalMacros = macros.filter((m) => m.visibility === "personal")
  const globalMacros = macros.filter((m) => m.visibility === "global")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isExecuting}
          className="gap-1"
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Macros</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Executar Macro</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="px-2 py-3 text-center text-sm text-gray-500">
            Carregando...
          </div>
        ) : (
          <>
            {personalMacros.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-gray-400">
                  Minhas Macros
                </DropdownMenuLabel>
                {personalMacros.map((macro) => (
                  <DropdownMenuItem
                    key={macro.id}
                    onClick={() => handleExecute(macro.id, macro.name)}
                    disabled={isExecuting}
                  >
                    <Zap className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    {macro.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {personalMacros.length > 0 && globalMacros.length > 0 && (
              <DropdownMenuSeparator />
            )}

            {globalMacros.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-gray-400">
                  Globais
                </DropdownMenuLabel>
                {globalMacros.map((macro) => (
                  <DropdownMenuItem
                    key={macro.id}
                    onClick={() => handleExecute(macro.id, macro.name)}
                    disabled={isExecuting}
                  >
                    <Globe className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    {macro.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {personalMacros.length === 0 && globalMacros.length === 0 && (
              <div className="px-2 py-3 text-center text-sm text-gray-500">
                Nenhuma macro disponivel
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
