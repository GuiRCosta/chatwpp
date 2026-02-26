export interface WabaWebhookBody {
  object: "whatsapp_business_account"
  entry: WabaEntry[]
}

export interface WabaEntry {
  id: string
  changes: WabaChange[]
}

export interface WabaChange {
  value: WabaValue
  field: "messages"
}

export interface WabaValue {
  messaging_product: "whatsapp"
  metadata: WabaMetadata
  contacts?: WabaContact[]
  messages?: WabaIncomingMessage[]
  statuses?: WabaStatus[]
  errors?: WabaError[]
}

export interface WabaMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface WabaContact {
  profile: {
    name: string
  }
  wa_id: string
}

export interface WabaIncomingMessage {
  from: string
  id: string
  timestamp: string
  type: WabaMessageType
  text?: { body: string }
  image?: WabaMedia
  video?: WabaMedia
  audio?: WabaMedia
  document?: WabaMedia & { filename?: string }
  sticker?: WabaMedia
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  contacts?: WabaContactCard[]
  interactive?: WabaInteractive
  button?: { text: string; payload: string }
  context?: { from: string; id: string }
  errors?: WabaError[]
}

export type WabaMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contacts"
  | "interactive"
  | "button"
  | "reaction"
  | "order"
  | "unknown"

export interface WabaMedia {
  id: string
  mime_type: string
  sha256?: string
  caption?: string
}

export interface WabaContactCard {
  name: { formatted_name: string; first_name?: string; last_name?: string }
  phones?: Array<{ phone: string; type?: string }>
}

export interface WabaInteractive {
  type: "button_reply" | "list_reply"
  button_reply?: { id: string; title: string }
  list_reply?: { id: string; title: string; description?: string }
}

export interface WabaStatus {
  id: string
  status: "sent" | "delivered" | "read" | "failed"
  timestamp: string
  recipient_id: string
  errors?: WabaError[]
  conversation?: {
    id: string
    origin: { type: string }
    expiration_timestamp?: string
  }
  pricing?: {
    billable: boolean
    pricing_model: string
    category: string
  }
}

export interface WabaError {
  code: number
  title: string
  message?: string
  error_data?: {
    details: string
  }
}

export interface SendTextPayload {
  messaging_product: "whatsapp"
  recipient_type: "individual"
  to: string
  type: "text"
  text: {
    preview_url: boolean
    body: string
  }
}

export interface SendMediaPayload {
  messaging_product: "whatsapp"
  recipient_type: "individual"
  to: string
  type: "image" | "video" | "audio" | "document"
  image?: { link: string; caption?: string }
  video?: { link: string; caption?: string }
  audio?: { link: string }
  document?: { link: string; caption?: string; filename?: string }
}

export interface SendTemplatePayload {
  messaging_product: "whatsapp"
  to: string
  type: "template"
  template: {
    name: string
    language: { code: string }
    components?: TemplateComponent[]
  }
}

export interface TemplateComponent {
  type: "header" | "body" | "button"
  parameters?: TemplateParameter[]
  sub_type?: "quick_reply" | "url"
  index?: string
}

export interface TemplateParameter {
  type: "text" | "currency" | "date_time" | "image" | "video" | "document"
  text?: string
  image?: { link: string }
  video?: { link: string }
  document?: { link: string }
}

export interface SendMessageResponse {
  messaging_product: "whatsapp"
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface MediaUrlResponse {
  id: string
  messaging_product: "whatsapp"
  url: string
  mime_type: string
  sha256: string
  file_size: number
}

export const ACK_MAP: Record<string, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
  failed: -1
}
