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

@Table({ tableName: "WhatsApps", timestamps: true })
export default class WhatsApp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Default("waba")
  @Column(DataType.ENUM("waba"))
  type!: string

  @Default("disconnected")
  @Column(DataType.ENUM("connected", "disconnected", "opening"))
  status!: string

  @Column
  wabaAccountId!: string

  @Column
  wabaPhoneNumberId!: string

  @Column(DataType.TEXT)
  wabaToken!: string

  @Column
  wabaWebhookSecret!: string

  @Default(false)
  @Column
  isDefault!: boolean

  @Column
  number!: string

  @Column(DataType.TEXT)
  greetingMessage!: string

  @Column(DataType.TEXT)
  farewellMessage!: string

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => Ticket)
  tickets!: Ticket[]
}
