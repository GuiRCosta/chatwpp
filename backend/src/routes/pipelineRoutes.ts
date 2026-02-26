import { Router } from "express"

import * as PipelineController from "../controllers/PipelineController"

const pipelineRoutes = Router()

pipelineRoutes.get("/", PipelineController.index)
pipelineRoutes.get("/:id", PipelineController.show)
pipelineRoutes.post("/", PipelineController.store)
pipelineRoutes.put("/:id", PipelineController.update)
pipelineRoutes.delete("/:id", PipelineController.remove)

export { pipelineRoutes }
