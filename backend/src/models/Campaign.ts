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
import WhatsApp from "./WhatsApp"
import CampaignContact from "./CampaignContact"

@Table({ tableName: "Campaigns", timestamps: true })
export default class Campaign extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Default("pending")
  @Column(DataType.ENUM("pending", "scheduled", "queued", "processing", "completed", "cancelled"))
  status!: string

  @Column(DataType.TEXT)
  message!: string

  @Column
  mediaUrl!: string

  @ForeignKey(() => WhatsApp)
  @Column
  whatsappId!: number

  @Column(DataType.DATE)
  scheduledAt!: Date

  @Column(DataType.DATE)
  completedAt!: Date

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => WhatsApp)
  whatsapp!: WhatsApp

  @HasMany(() => CampaignContact)
  campaignContacts!: CampaignContact[]
}
