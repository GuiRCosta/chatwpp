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

export interface WhatsApp {
  id: number
  name: string
  number: string
  status: "connected" | "disconnected" | "opening"
  wabaAccountId?: string
  wabaPhoneNumberId?: string
  tenantId: number
  isDefault: boolean
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
  pipelineId: number
  pipeline?: Pipeline
  tenantId: number
  opportunities?: Opportunity[]
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: number
  title: string
  description?: string
  value?: number
  contactId: number
  contact?: Contact
  stageId: number
  stage?: Stage
  userId?: number
  user?: User
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
  message: string
  status: "pending" | "running" | "paused" | "completed" | "cancelled"
  scheduledAt?: string
  whatsappId: number
  whatsapp?: WhatsApp
  tenantId: number
  contacts?: CampaignContact[]
  createdAt: string
  updatedAt: string
}

export interface CampaignContact {
  id: number
  campaignId: number
  campaign?: Campaign
  contactId: number
  contact?: Contact
  status: "pending" | "sent" | "failed"
  sentAt?: string
  error?: string
  createdAt: string
  updatedAt: string
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
