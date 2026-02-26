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
import ContactTag from "./ContactTag"
import CampaignContact from "./CampaignContact"

@Table({ tableName: "Contacts", timestamps: true })
export default class Contact extends Model {
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
  number!: string

  @Column
  email!: string

  @Column
  profilePicUrl!: string

  @Column
  telegramId!: string

  @Column
  instagramId!: string

  @Column
  facebookId!: string

  @Default(false)
  @Column
  isGroup!: boolean

  @Column(DataType.JSONB)
  customFields!: object

  @Column
  walletId!: string

  @Column(DataType.DATE)
  lgpdAcceptedAt!: Date

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => Ticket)
  tickets!: Ticket[]

  @HasMany(() => ContactTag)
  contactTags!: ContactTag[]

  @HasMany(() => CampaignContact)
  campaignContacts!: CampaignContact[]
}
