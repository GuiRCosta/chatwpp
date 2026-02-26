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
import WhatsApp from "./WhatsApp"

@Table({ tableName: "BulkDispatches", timestamps: true })
export default class BulkDispatch extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @ForeignKey(() => WhatsApp)
  @Column
  whatsappId!: number

  @Default("pending")
  @Column(DataType.ENUM("pending", "processing", "completed", "cancelled"))
  status!: string

  @Default(0)
  @Column
  totalMessages!: number

  @Default(0)
  @Column
  sentMessages!: number

  @Default(0)
  @Column
  errorMessages!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => WhatsApp)
  whatsapp!: WhatsApp
}
