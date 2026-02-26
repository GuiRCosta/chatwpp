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
import UserQueue from "./UserQueue"
import Ticket from "./Ticket"

@Table({ tableName: "Queues", timestamps: true })
export default class Queue extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Column
  color!: string

  @Column(DataType.TEXT)
  greetingMessage!: string

  @Column(DataType.TEXT)
  outOfHoursMessage!: string

  @Default(0)
  @Column
  orderQueue!: number

  @Default(true)
  @Column
  isActive!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => UserQueue)
  userQueues!: UserQueue[]

  @HasMany(() => Ticket)
  tickets!: Ticket[]
}
