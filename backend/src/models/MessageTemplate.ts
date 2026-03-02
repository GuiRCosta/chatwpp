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

@Table({ tableName: "MessageTemplates", timestamps: true })
export default class MessageTemplate extends Model {
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

  @Column
  name!: string

  @Default("pt_BR")
  @Column(DataType.STRING(10))
  language!: string

  @Default("APPROVED")
  @Column(DataType.STRING(20))
  status!: string

  @Column(DataType.STRING(30))
  category!: string

  @Column(DataType.JSONB)
  components!: Record<string, unknown>[]

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => WhatsApp)
  whatsapp!: WhatsApp
}
