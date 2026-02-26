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
import UserQueue from "./UserQueue"
import TicketNote from "./TicketNote"
import Notification from "./Notification"
import TodoList from "./TodoList"

@Table({ tableName: "Users", timestamps: true })
export default class User extends Model {
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
  email!: string

  @Column
  passwordHash!: string

  @Default("user")
  @Column(DataType.ENUM("superadmin", "admin", "super", "user"))
  profile!: string

  @Default(false)
  @Column
  isOnline!: boolean

  @Column(DataType.DATE)
  lastLogin!: Date

  @Column(DataType.JSONB)
  configs!: object

  @Default(0)
  @Column
  tokenVersion!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => Ticket)
  tickets!: Ticket[]

  @HasMany(() => UserQueue)
  userQueues!: UserQueue[]

  @HasMany(() => TicketNote)
  ticketNotes!: TicketNote[]

  @HasMany(() => Notification)
  notifications!: Notification[]

  @HasMany(() => TodoList)
  todoLists!: TodoList[]
}
