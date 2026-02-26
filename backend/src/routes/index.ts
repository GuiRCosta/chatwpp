import { Router } from "express"
import { authRoutes } from "./authRoutes"
import { userRoutes } from "./userRoutes"
import { tenantRoutes } from "./tenantRoutes"
import { contactRoutes } from "./contactRoutes"
import { ticketRoutes } from "./ticketRoutes"
import { messageRoutes } from "./messageRoutes"
import { queueRoutes } from "./queueRoutes"
import { tagRoutes } from "./tagRoutes"
import { whatsappRoutes } from "./whatsappRoutes"
import { settingRoutes } from "./settingRoutes"
import { webhookRoutes } from "./webhookRoutes"
import { fastreplyRoutes } from "./fastreplyRoutes"
import { galleryRoutes } from "./galleryRoutes"
import { banlistRoutes } from "./banlistRoutes"
import { notificationRoutes } from "./notificationRoutes"
import { todolistRoutes } from "./todolistRoutes"
import { calllogRoutes } from "./calllogRoutes"
import { pipelineRoutes } from "./pipelineRoutes"
import { kanbanRoutes } from "./kanbanRoutes"
import { opportunityRoutes } from "./opportunityRoutes"
import { campaignRoutes } from "./campaignRoutes"
import { autoreplyRoutes } from "./autoreplyRoutes"
import { chatflowRoutes } from "./chatflowRoutes"
import { uploadRoutes } from "./uploadRoutes"
import { isAuth } from "../middleware/isAuth"

const appRoutes = Router()

appRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

appRoutes.use("/webhook", webhookRoutes)
appRoutes.use("/auth", authRoutes)

appRoutes.use(isAuth)

appRoutes.use("/users", userRoutes)
appRoutes.use("/tenants", tenantRoutes)
appRoutes.use("/contacts", contactRoutes)
appRoutes.use("/tickets", ticketRoutes)
appRoutes.use("/messages", messageRoutes)
appRoutes.use("/queues", queueRoutes)
appRoutes.use("/tags", tagRoutes)
appRoutes.use("/whatsapp", whatsappRoutes)
appRoutes.use("/settings", settingRoutes)
appRoutes.use("/fast-replies", fastreplyRoutes)
appRoutes.use("/galleries", galleryRoutes)
appRoutes.use("/banlists", banlistRoutes)
appRoutes.use("/notifications", notificationRoutes)
appRoutes.use("/todolists", todolistRoutes)
appRoutes.use("/calllogs", calllogRoutes)
appRoutes.use("/pipelines", pipelineRoutes)
appRoutes.use("/kanbans", kanbanRoutes)
appRoutes.use("/opportunities", opportunityRoutes)
appRoutes.use("/campaigns", campaignRoutes)
appRoutes.use("/auto-replies", autoreplyRoutes)
appRoutes.use("/chatflows", chatflowRoutes)
appRoutes.use("/upload", uploadRoutes)

export { appRoutes }
