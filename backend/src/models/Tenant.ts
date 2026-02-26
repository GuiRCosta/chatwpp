import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  DataType,
  HasMany,
  Default
} from "sequelize-typescript"

import User from "./User"
import Contact from "./Contact"
import Ticket from "./Ticket"
import Queue from "./Queue"
import WhatsApp from "./WhatsApp"
import Tag from "./Tag"
import Setting from "./Setting"
import ChatFlow from "./ChatFlow"
import AutoReply from "./AutoReply"
import FastReply from "./FastReply"
import Campaign from "./Campaign"
import Kanban from "./Kanban"
import Pipeline from "./Pipeline"
import Opportunity from "./Opportunity"
import Notification from "./Notification"
import Gallery from "./Gallery"
import TodoList from "./TodoList"
import ApiConfig from "./ApiConfig"
import BanList from "./BanList"
import CallLog from "./CallLog"
import BulkDispatch from "./BulkDispatch"

@Table({ tableName: "Tenants", timestamps: true })
export default class Tenant extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @Column
  name!: string

  @Default("active")
  @Column(DataType.ENUM("active", "inactive", "trial"))
  status!: string

  @Default(99)
  @Column
  maxUsers!: number

  @Default(99)
  @Column
  maxConnections!: number

  @Column(DataType.JSONB)
  businessHours!: object

  @Column(DataType.JSONB)
  settings!: object

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @HasMany(() => User)
  users!: User[]

  @HasMany(() => Contact)
  contacts!: Contact[]

  @HasMany(() => Ticket)
  tickets!: Ticket[]

  @HasMany(() => Queue)
  queues!: Queue[]

  @HasMany(() => WhatsApp)
  whatsapps!: WhatsApp[]

  @HasMany(() => Tag)
  tags!: Tag[]

  @HasMany(() => Setting)
  settingsList!: Setting[]

  @HasMany(() => ChatFlow)
  chatFlows!: ChatFlow[]

  @HasMany(() => AutoReply)
  autoReplies!: AutoReply[]

  @HasMany(() => FastReply)
  fastReplies!: FastReply[]

  @HasMany(() => Campaign)
  campaigns!: Campaign[]

  @HasMany(() => Kanban)
  kanbans!: Kanban[]

  @HasMany(() => Pipeline)
  pipelines!: Pipeline[]

  @HasMany(() => Opportunity)
  opportunities!: Opportunity[]

  @HasMany(() => Notification)
  notifications!: Notification[]

  @HasMany(() => Gallery)
  galleries!: Gallery[]

  @HasMany(() => TodoList)
  todoLists!: TodoList[]

  @HasMany(() => ApiConfig)
  apiConfigs!: ApiConfig[]

  @HasMany(() => BanList)
  banLists!: BanList[]

  @HasMany(() => CallLog)
  callLogs!: CallLog[]

  @HasMany(() => BulkDispatch)
  bulkDispatches!: BulkDispatch[]
}
