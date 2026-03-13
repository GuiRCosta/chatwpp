import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select"
import type { AutomationCondition, ConditionOperator } from "@/types"

interface ConditionCardProps {
  condition: AutomationCondition
  index: number
  totalConditions: number
  onUpdate: (index: number, condition: AutomationCondition) => void
  onRemove: (index: number) => void
}

const ATTRIBUTE_GROUPS = [
  {
    label: "Ticket",
    options: [
      { value: "ticket.status", label: "Status" },
      { value: "ticket.channel", label: "Canal" },
      { value: "ticket.isGroup", label: "E grupo" }
    ]
  },
  {
    label: "Contato",
    options: [
      { value: "contact.name", label: "Nome" },
      { value: "contact.number", label: "Numero" },
      { value: "contact.isGroup", label: "E grupo" }
    ]
  },
  {
    label: "Mensagem",
    options: [
      { value: "message.body", label: "Corpo" },
      { value: "message.fromMe", label: "Enviada por mim" },
      { value: "message.mediaType", label: "Tipo de midia" }
    ]
  }
]

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equal_to", label: "Igual a" },
  { value: "not_equal_to", label: "Diferente de" },
  { value: "contains", label: "Contem" },
  { value: "does_not_contain", label: "Nao contem" },
  { value: "is_present", label: "Esta presente" },
  { value: "is_not_present", label: "Nao esta presente" }
]

const BOOLEAN_ATTRIBUTES = [
  "ticket.isGroup",
  "contact.isGroup",
  "message.fromMe"
]

function isBooleanAttribute(attribute: string): boolean {
  return BOOLEAN_ATTRIBUTES.includes(attribute)
}

function isPresenceOperator(operator: string): boolean {
  return operator === "is_present" || operator === "is_not_present"
}

export function ConditionCard({
  condition,
  index,
  onUpdate,
  onRemove
}: ConditionCardProps) {
  const showValue = !isPresenceOperator(condition.operator)
  const showBooleanSelect = showValue && isBooleanAttribute(condition.attribute)
  const showTextInput = showValue && !isBooleanAttribute(condition.attribute)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start gap-2">
        {/* Query operator badge (AND/OR) — only after first condition */}
        {index > 0 && (
          <button
            type="button"
            onClick={() =>
              onUpdate(index, {
                ...condition,
                queryOperator: condition.queryOperator === "AND" ? "OR" : "AND"
              })
            }
            className="mt-1 shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {condition.queryOperator}
          </button>
        )}

        <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Attribute */}
          <Select
            value={condition.attribute}
            onValueChange={(val) =>
              onUpdate(index, { ...condition, attribute: val, value: "" })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Atributo" />
            </SelectTrigger>
            <SelectContent>
              {ATTRIBUTE_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                    {group.label}
                  </div>
                  {group.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {group.label}: {opt.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>

          {/* Operator */}
          <Select
            value={condition.operator}
            onValueChange={(val) =>
              onUpdate(index, {
                ...condition,
                operator: val as ConditionOperator
              })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Operador" />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Value */}
          {showBooleanSelect && (
            <Select
              value={String(condition.value ?? "")}
              onValueChange={(val) =>
                onUpdate(index, { ...condition, value: val })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Valor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Nao</SelectItem>
              </SelectContent>
            </Select>
          )}

          {showTextInput && (
            <Input
              value={String(condition.value ?? "")}
              onChange={(e) =>
                onUpdate(index, { ...condition, value: e.target.value })
              }
              placeholder="Valor"
              className="h-9"
            />
          )}

          {!showValue && (
            <div className="h-9" />
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-red-500 hover:text-red-700"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
