import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  DataType,
  ForeignKey,
  BelongsTo,
  Default
} from "sequelize-typescript"

import Tenant from "./Tenant"

export interface AutomationCondition {
  attribute: string
  operator: "equal_to" | "not_equal_to" | "contains" | "does_not_contain" | "is_present" | "is_not_present"
  value: unknown
  queryOperator: "AND" | "OR"
}

export interface AutomationAction {
  type: string
  params: Record<string, unknown>
}

@Table({ tableName: "AutomationRules", timestamps: true })
export default class AutomationRule extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Column(DataType.TEXT)
  description!: string | null

  @Column(DataType.STRING(100))
  eventName!: string

  @Default([])
  @Column(DataType.JSONB)
  conditions!: AutomationCondition[]

  @Default([])
  @Column(DataType.JSONB)
  actions!: AutomationAction[]

  @Default(true)
  @Column
  isActive!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant
}
