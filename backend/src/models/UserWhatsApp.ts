import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript"

import User from "./User"
import WhatsApp from "./WhatsApp"

@Table({ tableName: "UserWhatsApps", timestamps: true })
export default class UserWhatsApp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => User)
  @Column
  userId!: number

  @ForeignKey(() => WhatsApp)
  @Column
  whatsappId!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => WhatsApp)
  whatsapp!: WhatsApp
}
