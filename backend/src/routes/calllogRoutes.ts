import { Router } from "express"

import * as CallLogController from "../controllers/CallLogController"

const calllogRoutes = Router()

calllogRoutes.get("/", CallLogController.index)
calllogRoutes.get("/:id", CallLogController.show)
calllogRoutes.post("/", CallLogController.store)
calllogRoutes.delete("/:id", CallLogController.remove)

export { calllogRoutes }
