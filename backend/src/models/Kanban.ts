import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default
} from "sequelize-typescript"

import Tenant from "./Tenant"
import Stage from "./Stage"

@Table({ tableName: "Kanbans", timestamps: true })
export default class Kanban extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Default(true)
  @Column
  isActive!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => Stage)
  stages!: Stage[]
}
