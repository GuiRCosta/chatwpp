import { Router } from "express"

import * as TodoListController from "../controllers/TodoListController"

const todolistRoutes = Router()

todolistRoutes.get("/", TodoListController.index)
todolistRoutes.get("/:id", TodoListController.show)
todolistRoutes.post("/", TodoListController.store)
todolistRoutes.put("/:id", TodoListController.update)
todolistRoutes.put("/:id/toggle", TodoListController.toggle)
todolistRoutes.delete("/:id", TodoListController.remove)

export { todolistRoutes }
