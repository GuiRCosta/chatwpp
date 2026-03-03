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

@Table({ tableName: "TenantWebhooks", timestamps: true })
export default class TenantWebhook extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column(DataType.STRING(500))
  url!: string

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  events!: string[]

  @Column(DataType.STRING(255))
  secret!: string | null

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
