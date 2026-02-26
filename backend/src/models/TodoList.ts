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

@Table({ tableName: "TodoLists", timestamps: true })
export default class TodoList extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @ForeignKey(() => User)
  @Column
  userId!: number

  @Column
  title!: string

  @Column(DataType.TEXT)
  description!: string

  @Default(false)
  @Column
  done!: boolean

  @Column(DataType.DATE)
  dueDate!: Date

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => User)
  user!: User
}
