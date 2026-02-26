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

@Table({ tableName: "TicketLogs", timestamps: true })
export default class TicketLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Ticket)
  @Column
  ticketId!: number

  @Column
  type!: string

  @Column(DataType.JSONB)
  payload!: object

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Ticket)
  ticket!: Ticket
}
