import { Request, Response } from "express"

import { verifyWebhook, processWebhook } from "../libs/waba/webhookHandler"
import { verifySignature } from "../libs/waba/webhookSignature"
import logger from "../helpers/logger"

export const verify = async (req: Request, res: Response): Promise<Response | void> => {
  const mode = req.query["hub.mode"] as string | undefined
  const token = req.query["hub.verify_token"] as string | undefined
  const challenge = req.query["hub.challenge"] as string | undefined

  const result = verifyWebhook(mode, token, challenge)

  if (result) {
    logger.info("Webhook verified successfully")
    return res.status(200).send(result)
  }

  logger.warn("Webhook verification failed")
  return res.status(403).json({ error: "Verification failed" })
}

export const receive = async (req: Request, res: Response): Promise<Response> => {
  const appSecret = process.env.META_APP_SECRET

  if (appSecret) {
    const signature = req.headers["x-hub-signature-256"] as string | undefined
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody

    if (rawBody && !verifySignature(rawBody, signature, appSecret)) {
      logger.warn("Invalid webhook signature")
      return res.status(403).json({ error: "Invalid signature" })
    }
  }

  res.status(200).json({ status: "received" })

  try {
    await processWebhook(req.body)
  } catch (error) {
    logger.error("Error processing webhook: %o", error)
  }

  return res
}
