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

import Campaign from "./Campaign"
import Contact from "./Contact"

@Table({ tableName: "CampaignContacts", timestamps: true })
export default class CampaignContact extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Campaign)
  @Column
  campaignId!: number

  @ForeignKey(() => Contact)
  @Column
  contactId!: number

  @Default("pending")
  @Column(DataType.ENUM("pending", "sent", "delivered", "read", "error"))
  status!: string

  @Column(DataType.DATE)
  sentAt!: Date

  @Column(DataType.DATE)
  deliveredAt!: Date

  @Column(DataType.DATE)
  readAt!: Date

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Campaign)
  campaign!: Campaign

  @BelongsTo(() => Contact)
  contact!: Contact
}
