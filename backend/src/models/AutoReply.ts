import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default
} from "sequelize-typescript"

import Tenant from "./Tenant"
import User from "./User"
import AutoReplyStep from "./AutoReplyStep"

@Table({ tableName: "AutoReplies", timestamps: true })
export default class AutoReply extends Model {
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
  action!: string

  @ForeignKey(() => User)
  @Column
  userId!: number

  @Default(true)
  @Column
  isActive!: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => User)
  user!: User

  @HasMany(() => AutoReplyStep)
  steps!: AutoReplyStep[]
}
