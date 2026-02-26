import { Router } from "express"

import * as UserController from "../controllers/UserController"
import { isAdmin } from "../middleware/isAuth"

const userRoutes = Router()

userRoutes.get("/", UserController.index)
userRoutes.post("/", isAdmin, UserController.store)
userRoutes.get("/:id", UserController.show)
userRoutes.put("/:id", isAdmin, UserController.update)
userRoutes.delete("/:id", isAdmin, UserController.remove)

export { userRoutes }
