import { Router } from "express"

import * as TicketController from "../controllers/TicketController"

const ticketRoutes = Router()

ticketRoutes.get("/", TicketController.index)
ticketRoutes.post("/", TicketController.store)
ticketRoutes.get("/:id", TicketController.show)
ticketRoutes.put("/:id", TicketController.update)
ticketRoutes.delete("/:id", TicketController.remove)

export { ticketRoutes }
