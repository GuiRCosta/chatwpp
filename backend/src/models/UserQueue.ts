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
import Queue from "./Queue"

@Table({ tableName: "UserQueues", timestamps: true })
export default class UserQueue extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => User)
  @Column
  userId!: number

  @ForeignKey(() => Queue)
  @Column
  queueId!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => User)
  user!: User

  @BelongsTo(() => Queue)
  queue!: Queue
}
