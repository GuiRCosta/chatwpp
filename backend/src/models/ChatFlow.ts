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
  HasMany,
  Default
} from "sequelize-typescript"

import Tenant from "./Tenant"
import Ticket from "./Ticket"

@Table({ tableName: "ChatFlows", timestamps: true })
export default class ChatFlow extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Column(DataType.JSONB)
  flow!: object

  @Default(true)
  @Column
  isActive!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => Ticket)
  tickets!: Ticket[]
}
