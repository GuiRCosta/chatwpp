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

import Kanban from "./Kanban"
import Pipeline from "./Pipeline"
import Opportunity from "./Opportunity"

@Table({ tableName: "Stages", timestamps: true })
export default class Stage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Kanban)
  @Column
  kanbanId!: number | null

  @ForeignKey(() => Pipeline)
  @Column
  pipelineId!: number | null

  @Column
  name!: string

  @Default("#6B7280")
  @Column
  color!: string

  @Column
  order!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Kanban)
  kanban!: Kanban

  @BelongsTo(() => Pipeline)
  pipeline!: Pipeline

  @HasMany(() => Opportunity)
  opportunities!: Opportunity[]
}
