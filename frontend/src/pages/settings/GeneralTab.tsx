import { Settings as SettingsIcon, Save, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import type { GeneralSettings } from "./types"

interface GeneralTabProps {
  settings: GeneralSettings
  isSaving: boolean
  onSettingsChange: (field: keyof GeneralSettings, value: string) => void
  onSave: () => void
}

export function GeneralTab({
  settings,
  isSaving,
  onSettingsChange,
  onSave
}: GeneralTabProps) {
  return (
    <Card className="rounded-2xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <SettingsIcon className="h-5 w-5 text-blue-600" />
          Configuracoes Gerais
        </CardTitle>
        <CardDescription>
          Gerencie as configuracoes basicas do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nome da Empresa</Label>
          <Input
            id="companyName"
            value={settings.companyName}
            onChange={(e) => onSettingsChange("companyName", e.target.value)}
            placeholder="Nome da sua empresa"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessHoursOpen">Horario de Abertura</Label>
            <Input
              id="businessHoursOpen"
              type="time"
              value={settings.businessHoursOpen}
              onChange={(e) =>
                onSettingsChange("businessHoursOpen", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessHoursClose">Horario de Fechamento</Label>
            <Input
              id="businessHoursClose"
              type="time"
              value={settings.businessHoursClose}
              onChange={(e) =>
                onSettingsChange("businessHoursClose", e.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="autoCloseTimeout">
            Timeout para fechar ticket automaticamente (horas)
          </Label>
          <Input
            id="autoCloseTimeout"
            type="number"
            min={1}
            max={720}
            value={settings.autoCloseTimeout}
            onChange={(e) =>
              onSettingsChange("autoCloseTimeout", e.target.value)
            }
            placeholder="24"
          />
        </div>

        <Button onClick={onSave} disabled={isSaving} rounded="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? "Salvando..." : "Salvar Configuracoes"}
        </Button>
      </CardContent>
    </Card>
  )
}
