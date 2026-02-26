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
  BelongsTo
} from "sequelize-typescript"

import Ticket from "./Ticket"
import User from "./User"

@Table({ tableName: "TicketNotes", timestamps: true })
export default class TicketNote extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Ticket)
  @Column
  ticketId!: number

  @ForeignKey(() => User)
  @Column
  userId!: number

  @Column(DataType.TEXT)
  body!: string

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Ticket)
  ticket!: Ticket

  @BelongsTo(() => User)
  user!: User
}
