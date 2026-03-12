import { Router } from "express"

import * as DeadLetterController from "../controllers/DeadLetterController"
import { isAdmin } from "../middleware/isAuth"

const deadLetterRoutes = Router()

deadLetterRoutes.get("/", isAdmin, DeadLetterController.index)
deadLetterRoutes.post("/:jobId/retry", isAdmin, DeadLetterController.retry)
deadLetterRoutes.delete("/:jobId", isAdmin, DeadLetterController.remove)

export { deadLetterRoutes }
