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

import Tenant from "./Tenant"
import Contact from "./Contact"
import User from "./User"

@Table({ tableName: "CallLogs", timestamps: true })
export default class CallLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number

  @ForeignKey(() => Contact)
  @Column
  contactId!: number

  @ForeignKey(() => User)
  @Column
  userId!: number

  @Column(DataType.ENUM("incoming", "outgoing", "missed"))
  type!: string

  @Default(0)
  @Column
  duration!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => Contact)
  contact!: Contact

  @BelongsTo(() => User)
  user!: User
}
