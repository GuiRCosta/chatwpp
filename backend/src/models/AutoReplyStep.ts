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

import AutoReply from "./AutoReply"

@Table({ tableName: "AutoReplySteps", timestamps: true })
export default class AutoReplyStep extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => AutoReply)
  @Column
  autoReplyId!: number

  @Column(DataType.INTEGER)
  stepOrder!: number

  @Column(DataType.TEXT)
  message!: string

  @Column
  mediaUrl!: string

  @Column(DataType.JSONB)
  action!: object

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => AutoReply)
  autoReply!: AutoReply
}
