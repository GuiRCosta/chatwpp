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
import Contact from "./Contact"
import User from "./User"
import Queue from "./Queue"
import WhatsApp from "./WhatsApp"
import ChatFlow from "./ChatFlow"
import Message from "./Message"
import TicketNote from "./TicketNote"
import TicketLog from "./TicketLog"

@Table({ tableName: "Tickets", timestamps: true })
export default class Ticket extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @ForeignKey(() => Contact)
  @Column
  contactId!: number

  @ForeignKey(() => User)
  @Column
  userId!: number

  @ForeignKey(() => Queue)
  @Column
  queueId!: number

  @ForeignKey(() => WhatsApp)
  @Column
  whatsappId!: number

  @Default("pending")
  @Column(DataType.ENUM("open", "pending", "closed"))
  status!: string

  @Column
  channel!: string

  @Column(DataType.TEXT)
  lastMessage!: string

  @Column(DataType.DATE)
  lastMessageAt!: Date

  @Default(false)
  @Column
  isGroup!: boolean

  @Default(0)
  @Column
  unreadMessages!: number

  @ForeignKey(() => ChatFlow)
  @Column
  chatFlowId!: number

  @Column
  protocol!: string

  @Default(false)
  @Column
  isFarewellMessage!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => Contact)
  contact!: Contact

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Queue)
  queue!: Queue

  @BelongsTo(() => WhatsApp)
  whatsapp!: WhatsApp

  @BelongsTo(() => ChatFlow)
  chatFlow!: ChatFlow

  @HasMany(() => Message)
  messages!: Message[]

  @HasMany(() => TicketNote)
  ticketNotes!: TicketNote[]

  @HasMany(() => TicketLog)
  ticketLogs!: TicketLog[]
}
