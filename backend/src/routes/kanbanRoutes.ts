import { Router } from "express"

import * as KanbanController from "../controllers/KanbanController"

const kanbanRoutes = Router()

kanbanRoutes.get("/", KanbanController.index)
kanbanRoutes.get("/:id", KanbanController.show)
kanbanRoutes.post("/", KanbanController.store)
kanbanRoutes.put("/:id", KanbanController.update)
kanbanRoutes.delete("/:id", KanbanController.remove)

kanbanRoutes.post("/:kanbanId/stages", KanbanController.createStage)
kanbanRoutes.put("/:kanbanId/stages/:stageId", KanbanController.updateStage)
kanbanRoutes.delete("/:kanbanId/stages/:stageId", KanbanController.removeStage)
kanbanRoutes.put("/:kanbanId/stages/reorder", KanbanController.reorderStages)

export { kanbanRoutes }
