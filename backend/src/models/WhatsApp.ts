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
  Default,
  BeforeSave,
  AfterFind
} from "sequelize-typescript"

import Tenant from "./Tenant"
import Ticket from "./Ticket"
import UserWhatsApp from "./UserWhatsApp"
import { encrypt, decrypt, isEncrypted } from "../helpers/encryption"

@Table({ tableName: "WhatsApps", timestamps: true })
export default class WhatsApp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  name!: string

  @Default("waba")
  @Column(DataType.ENUM("waba"))
  type!: string

  @Default("disconnected")
  @Column(DataType.ENUM("connected", "disconnected", "opening"))
  status!: string

  @Column
  wabaAccountId!: string

  @Column
  wabaPhoneNumberId!: string

  @Column(DataType.TEXT)
  wabaToken!: string

  @Column
  wabaWebhookSecret!: string

  @Default(false)
  @Column
  isDefault!: boolean

  @Column
  number!: string

  @Column(DataType.TEXT)
  greetingMessage!: string

  @Column(DataType.TEXT)
  farewellMessage!: string

  @Column(DataType.DATE)
  tokenExpiresAt!: Date | null

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @HasMany(() => Ticket)
  tickets!: Ticket[]

  @HasMany(() => UserWhatsApp)
  userWhatsApps!: UserWhatsApp[]

  @BeforeSave
  static encryptToken(instance: WhatsApp): void {
    if (
      process.env.ENCRYPTION_KEY &&
      instance.wabaToken &&
      !isEncrypted(instance.wabaToken)
    ) {
      instance.wabaToken = encrypt(instance.wabaToken)
    }
  }

  @AfterFind
  static decryptTokens(
    result: WhatsApp | WhatsApp[] | null
  ): void {
    if (!result || !process.env.ENCRYPTION_KEY) return

    const instances = Array.isArray(result) ? result : [result]
    for (const instance of instances) {
      if (instance.wabaToken && isEncrypted(instance.wabaToken)) {
        instance.wabaToken = decrypt(instance.wabaToken)
      }
    }
  }
}
