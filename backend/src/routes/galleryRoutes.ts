import { Router } from "express"

import * as GalleryController from "../controllers/GalleryController"

const galleryRoutes = Router()

galleryRoutes.get("/", GalleryController.index)
galleryRoutes.post("/", GalleryController.store)
galleryRoutes.put("/:id", GalleryController.update)
galleryRoutes.delete("/:id", GalleryController.remove)

export { galleryRoutes }
