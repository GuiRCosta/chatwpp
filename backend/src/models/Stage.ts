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
  HasMany
} from "sequelize-typescript"

import Kanban from "./Kanban"
import Opportunity from "./Opportunity"

@Table({ tableName: "Stages", timestamps: true })
export default class Stage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Kanban)
  @Column
  kanbanId!: number

  @Column
  name!: string

  @Column
  order!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Kanban)
  kanban!: Kanban

  @HasMany(() => Opportunity)
  opportunities!: Opportunity[]
}
