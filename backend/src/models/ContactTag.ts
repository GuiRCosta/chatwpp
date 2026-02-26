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

import Contact from "./Contact"
import Tag from "./Tag"

@Table({ tableName: "ContactTags", timestamps: true })
export default class ContactTag extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number

  @ForeignKey(() => Contact)
  @Column
  contactId!: number

  @ForeignKey(() => Tag)
  @Column
  tagId!: number

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @BelongsTo(() => Contact)
  contact!: Contact

  @BelongsTo(() => Tag)
  tag!: Tag
}
