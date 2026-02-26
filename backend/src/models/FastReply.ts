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

import Tenant from "./Tenant"
import User from "./User"

@Table({ tableName: "FastReplies", timestamps: true })
export default class FastReply extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @Column
  key!: string

  @Column(DataType.TEXT)
  message!: string

  @Column
  mediaUrl!: string

  @ForeignKey(() => User)
  @Column
  userId!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => User)
  user!: User
}
