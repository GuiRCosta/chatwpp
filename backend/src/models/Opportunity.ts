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
import Pipeline from "./Pipeline"
import Stage from "./Stage"

@Table({ tableName: "Opportunities", timestamps: true })
export default class Opportunity extends Model {
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

  @ForeignKey(() => Pipeline)
  @Column
  pipelineId!: number

  @ForeignKey(() => Stage)
  @Column
  stageId!: number

  @Column(DataType.DECIMAL(10, 2))
  value!: number

  @Default("open")
  @Column(DataType.ENUM("open", "won", "lost"))
  status!: string

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Tenant)
  tenant!: Tenant

  @BelongsTo(() => Contact)
  contact!: Contact

  @BelongsTo(() => Pipeline)
  pipeline!: Pipeline

  @BelongsTo(() => Stage)
  stage!: Stage
}
