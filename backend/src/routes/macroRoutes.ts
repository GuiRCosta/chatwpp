import { Router } from "express"
import * as MacroController from "../controllers/MacroController"

const macroRoutes = Router()

macroRoutes.get("/", MacroController.index)
macroRoutes.get("/:id", MacroController.show)
macroRoutes.post("/", MacroController.store)
macroRoutes.put("/:id", MacroController.update)
macroRoutes.delete("/:id", MacroController.remove)
macroRoutes.post("/:id/execute", MacroController.execute)

export { macroRoutes }
