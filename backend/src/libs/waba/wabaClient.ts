import axios, { AxiosInstance } from "axios"
import { logger } from "../../helpers/logger"
import {
  SendTextPayload,
  SendMediaPayload,
  SendTemplatePayload,
  SendMessageResponse,
  MediaUrlResponse,
  TemplateComponent,
  WabaTemplate,
  WabaTemplateListResponse
} from "./types"

const GRAPH_API_URL = "https://graph.facebook.com/v25.0"

function createClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: GRAPH_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    timeout: 30000
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const data = error.response?.data?.error || error.response?.data || {}
      logger.error(
        `WABA API error (HTTP ${error.response?.status}): [${data.code || "no_code"}] ${data.message || error.message} | ${JSON.stringify(data)}`
      )
      throw error
    }
  )

  return client
}

export async function sendTextMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  body: string
): Promise<SendMessageResponse> {
  const client = createClient(token)

  const payload: SendTextPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body
    }
  }

  const { data } = await client.post<SendMessageResponse>(
    `/${phoneNumberId}/messages`,
    payload
  )

  return data
}

export async function sendMediaMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  type: "image" | "video" | "audio" | "document",
  mediaUrl: string,
  caption?: string,
  filename?: string
): Promise<SendMessageResponse> {
  const client = createClient(token)

  const mediaContent: Record<string, unknown> = { link: mediaUrl }

  if (caption && type !== "audio") {
    mediaContent.caption = caption
  }

  if (filename && type === "document") {
    mediaContent.filename = filename
  }

  const payload: SendMediaPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type,
    [type]: mediaContent
  } as SendMediaPayload

  const { data } = await client.post<SendMessageResponse>(
    `/${phoneNumberId}/messages`,
    payload
  )

  return data
}

export async function sendTemplateMessage(
  phoneNumberId: string,
  token: string,
  to: string,
  templateName: string,
  languageCode: string,
  components?: TemplateComponent[]
): Promise<SendMessageResponse> {
  const client = createClient(token)

  const payload: SendTemplatePayload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {})
    }
  }

  const { data } = await client.post<SendMessageResponse>(
    `/${phoneNumberId}/messages`,
    payload
  )

  return data
}

export async function getMediaUrl(
  mediaId: string,
  token: string
): Promise<MediaUrlResponse> {
  const client = createClient(token)

  const { data } = await client.get<MediaUrlResponse>(`/${mediaId}`)

  return data
}

export async function downloadMedia(
  url: string,
  token: string
): Promise<Buffer> {
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "arraybuffer",
    timeout: 60000
  })

  return Buffer.from(data)
}

export async function markAsRead(
  phoneNumberId: string,
  token: string,
  messageId: string
): Promise<void> {
  const client = createClient(token)

  await client.post(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId
  })
}

// --- Facebook Business Login (Embedded Signup) ---

interface ExchangeTokenResult {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export async function exchangeCodeForToken(code: string): Promise<ExchangeTokenResult> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be configured")
  }

  try {
    const { data } = await axios.post(
      `${GRAPH_API_URL}/oauth/access_token`,
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000
      }
    )

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in
    }
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown; status?: number } }
    if (axiosErr.response) {
      logger.error(
        `Meta token exchange failed (HTTP ${axiosErr.response.status}): ${JSON.stringify(axiosErr.response.data)}`
      )
    }
    throw err
  }
}

export interface GranularScope {
  scope: string
  target_ids: string[]
}

interface DebugTokenResult {
  isValid: boolean
  appId: string
  scopes: string[]
  granularScopes: GranularScope[]
  expiresAt: number
}

export async function debugToken(inputToken: string): Promise<DebugTokenResult> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must be configured")
  }

  try {
    const { data } = await axios.get(`${GRAPH_API_URL}/debug_token`, {
      params: {
        input_token: inputToken,
        access_token: `${appId}|${appSecret}`
      },
      timeout: 30000
    })

    logger.info(`debugToken raw granular_scopes: ${JSON.stringify(data.data.granular_scopes)}`)

    return {
      isValid: data.data.is_valid,
      appId: data.data.app_id,
      scopes: data.data.scopes || [],
      granularScopes: data.data.granular_scopes || [],
      expiresAt: data.data.expires_at
    }
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown; status?: number } }
    if (axiosErr.response) {
      logger.error(
        `Meta debugToken failed (HTTP ${axiosErr.response.status}): ${JSON.stringify(axiosErr.response.data)}`
      )
    }
    throw err
  }
}

export interface PhoneNumberInfo {
  id: string
  displayPhoneNumber: string
  verifiedName: string
  qualityRating: string
}

export async function getPhoneNumbers(
  wabaId: string,
  token: string
): Promise<PhoneNumberInfo[]> {
  const client = createClient(token)

  const { data } = await client.get(`/${wabaId}/phone_numbers`)

  return (data.data || []).map((phone: Record<string, unknown>) => ({
    id: phone.id,
    displayPhoneNumber: phone.display_phone_number,
    verifiedName: phone.verified_name,
    qualityRating: phone.quality_rating
  }))
}

export async function subscribeApp(
  wabaId: string,
  token: string
): Promise<void> {
  const client = createClient(token)

  await client.post(`/${wabaId}/subscribed_apps`, {})

  logger.info(`Webhook subscription registered for WABA ${wabaId}`)
}

export async function getMessageTemplates(
  wabaId: string,
  token: string
): Promise<WabaTemplate[]> {
  const client = createClient(token)
  const templates: WabaTemplate[] = []
  let url: string | null = `/${wabaId}/message_templates?fields=name,language,status,category,components&limit=100`

  while (url) {
    const { data } = await client.get<WabaTemplateListResponse>(url)
    templates.push(...(data.data || []))

    url = data.paging?.next
      ? data.paging.next.replace(GRAPH_API_URL, "")
      : null
  }

  return templates
}
