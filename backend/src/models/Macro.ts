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
import User from "./User"

export interface MacroAction {
  type: string
  params: Record<string, unknown>
}

@Table({ tableName: "Macros", timestamps: true })
export default class Macro extends Model {
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

  @Column(DataType.JSONB)
  actions!: MacroAction[]

  @Default("personal")
  @Column(DataType.ENUM("personal", "global"))
  visibility!: "personal" | "global"

  @ForeignKey(() => User)
  @Column
  createdById!: number

  @Column(DataType.ARRAY(DataType.INTEGER))
  whatsappIds!: number[] | null

  @Default(true)
  @Column
  isActive!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => User)
  createdBy!: User
}
