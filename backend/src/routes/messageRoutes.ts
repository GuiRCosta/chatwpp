import { Router } from "express"

import * as MessageController from "../controllers/MessageController"

const messageRoutes = Router()

messageRoutes.get("/:ticketId", MessageController.index)
messageRoutes.post("/:ticketId", MessageController.store)
messageRoutes.put("/:ticketId/read", MessageController.markAsRead)

export { messageRoutes }
