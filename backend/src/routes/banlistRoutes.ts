import { Router } from "express"

import * as BanListController from "../controllers/BanListController"

const banlistRoutes = Router()

banlistRoutes.get("/", BanListController.index)
banlistRoutes.post("/", BanListController.store)
banlistRoutes.delete("/:id", BanListController.remove)

export { banlistRoutes }
