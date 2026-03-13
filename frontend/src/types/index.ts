// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

// User & Auth
export interface User {
  id: number
  name: string
  email: string
  profile: string
  role?: string
  avatar?: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: number
  name: string
  domain?: string
  settings?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// Contacts & Tickets
export interface Contact {
  id: number
  name: string
  number: string
  email?: string
  profilePicUrl?: string
  tenantId: number
  isGroup: boolean
  tags?: Tag[]
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: number
  status: "open" | "pending" | "closed"
  lastMessage?: string
  lastMessageAt?: string
  contactId: number
  contact?: Contact
  userId?: number
  user?: User
  queueId?: number
  queue?: Queue
  whatsappId?: number
  whatsapp?: WhatsApp
  tenantId: number
  tags?: Tag[]
  unreadMessages: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: number
  body: string
  fromMe: boolean
  read: boolean
  mediaUrl?: string
  mediaType?: string
  ticketId: number
  ticket?: Ticket
  contactId: number
  contact?: Contact
  userId?: number
  user?: User
  quotedMsgId?: string
  ack: number
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface Queue {
  id: number
  name: string
  color: string
  greetingMessage?: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: number
  name: string
  color: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface UserWhatsApp {
  id: number
  userId: number
  whatsappId: number
  user?: Pick<User, "id" | "name" | "email">
  createdAt: string
  updatedAt: string
}

export interface WhatsApp {
  id: number
  name: string
  number: string
  status: "connected" | "disconnected" | "opening"
  wabaAccountId?: string
  wabaPhoneNumberId?: string
  tenantId: number
  isDefault: boolean
  userWhatsApps?: UserWhatsApp[]
  createdAt: string
  updatedAt: string
}

export interface Setting {
  id: number
  key: string
  value: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

// CRM - Pipeline & Kanban
export interface Pipeline {
  id: number
  name: string
  description?: string
  tenantId: number
  stages?: Stage[]
  createdAt: string
  updatedAt: string
}

export interface Stage {
  id: number
  name: string
  color: string
  order: number
  kanbanId?: number
  pipelineId?: number
  pipeline?: Pipeline
  opportunities?: Opportunity[]
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: number
  title?: string
  description?: string
  value?: number
  contactId: number
  contact?: Contact
  pipelineId: number
  pipeline?: Pipeline
  stageId: number
  stage?: Stage
  status: "open" | "won" | "lost"
  tenantId: number
  tags?: Tag[]
  createdAt: string
  updatedAt: string
}

export interface Kanban {
  id: number
  name: string
  description?: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

// Campaigns
export interface Campaign {
  id: number
  name: string
  message?: string
  templateName?: string
  templateLanguage?: string
  templateComponents?: Record<string, unknown>[]
  status: "pending" | "scheduled" | "queued" | "processing" | "running" | "completed" | "cancelled"
  scheduledAt?: string
  whatsappId: number
  whatsapp?: WhatsApp
  tenantId: number
  contacts?: CampaignContact[]
  campaignContacts?: CampaignContact[]
  contactCounts?: {
    pending: number
    sent: number
    delivered: number
    read: number
    error: number
  }
  createdAt: string
  updatedAt: string
}

export interface CampaignContact {
  id: number
  campaignId: number
  campaign?: Campaign
  contactId: number
  contact?: Contact
  status: "pending" | "sent" | "delivered" | "read" | "error"
  sentAt?: string
  error?: string
  createdAt: string
  updatedAt: string
}

// Message Templates
export interface MessageTemplate {
  id: number
  name: string
  language: string
  status: string
  category: string
  components: MessageTemplateComponent[]
  whatsappId: number
  whatsapp?: Pick<WhatsApp, "id" | "name">
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface MessageTemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
  text?: string
  example?: {
    header_text?: string[]
    body_text?: string[][]
    header_handle?: string[]
  }
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"
    text: string
    url?: string
    phone_number?: string
    example?: string[]
  }>
}

// Chat Automation
export interface ChatFlow {
  id: number
  name: string
  description?: string
  isActive: boolean
  trigger?: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface AutoReply {
  id: number
  name: string
  isActive: boolean
  trigger: string
  queueId?: number
  queue?: Queue
  tenantId: number
  steps?: AutoReplyStep[]
  createdAt: string
  updatedAt: string
}

export interface AutoReplyStep {
  id: number
  order: number
  message: string
  autoReplyId: number
  autoReply?: AutoReply
  createdAt: string
  updatedAt: string
}

export interface FastReply {
  id: number
  key: string
  message: string
  userId: number
  user?: User
  tenantId: number
  createdAt: string
  updatedAt: string
}

// Media & Files
export interface Gallery {
  id: number
  name: string
  url: string
  mimeType: string
  size: number
  tenantId: number
  userId: number
  user?: User
  createdAt: string
  updatedAt: string
}

// Notifications
export interface Notification {
  id: number
  title: string
  message: string
  isRead: boolean
  userId: number
  user?: User
  tenantId: number
  createdAt: string
  updatedAt: string
}

// BanList & Security
export interface BanList {
  id: number
  number: string
  reason?: string
  tenantId: number
  createdAt: string
  updatedAt: string
}

// Call Logs
export interface CallLog {
  id: number
  direction: "inbound" | "outbound"
  duration: number
  contactId: number
  contact?: Contact
  userId?: number
  user?: User
  whatsappId: number
  whatsapp?: WhatsApp
  tenantId: number
  createdAt: string
  updatedAt: string
}

// Webhooks
export interface TenantWebhook {
  id: number
  url: string
  events: string[]
  secret: string | null
  isActive: boolean
  tenantId: number
  createdAt: string
  updatedAt: string
}

// Macros
export type MacroActionType =
  | "send_message"
  | "assign_agent"
  | "add_tag"
  | "remove_tag"
  | "close_ticket"
  | "reopen_ticket"
  | "send_webhook"
  | "send_notification"
  | "create_opportunity"
  | "send_media"

export interface MacroAction {
  type: MacroActionType
  params: Record<string, unknown>
}

export interface Macro {
  id: number
  name: string
  description?: string | null
  actions: MacroAction[]
  visibility: "personal" | "global"
  createdById: number
  createdBy?: Pick<User, "id" | "name">
  isActive: boolean
  tenantId: number
  createdAt: string
  updatedAt: string
}

export interface MacroExecutionResult {
  ticketId: number
  result: {
    totalActions: number
    succeeded: number
    failed: number
    results: Array<{
      type: MacroActionType
      success: boolean
      error?: string
    }>
  }
}

// Todo Lists
export interface TodoList {
  id: number
  title: string
  description?: string
  isCompleted: boolean
  priority: "low" | "medium" | "high"
  dueDate?: string
  userId: number
  user?: User
  ticketId?: number
  ticket?: Ticket
  tenantId: number
  createdAt: string
  updatedAt: string
}
