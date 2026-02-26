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

import Ticket from "./Ticket"
import Contact from "./Contact"

@Table({ tableName: "Messages", timestamps: true })
export default class Message extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Ticket)
  @Column
  ticketId!: number

  @ForeignKey(() => Contact)
  @Column
  contactId!: number

  @Column(DataType.TEXT)
  body!: string

  @Column
  mediaUrl!: string

  @Column
  mediaType!: string

  @Default(false)
  @Column
  fromMe!: boolean

  @Default(false)
  @Column
  isRead!: boolean

  @Default(false)
  @Column
  isDeleted!: boolean

  @Column
  quotedMsgId!: string

  @Column
  remoteJid!: string

  @Column(DataType.JSONB)
  dataJson!: object

  @Column(DataType.INTEGER)
  timestamp!: number

  @Column
  status!: string

  @Column(DataType.DATE)
  scheduleDate!: Date

  @Column
  sendType!: string

  @Default(0)
  @Column(DataType.INTEGER)
  ack!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Ticket)
  ticket!: Ticket

  @BelongsTo(() => Contact)
  contact!: Contact
}
