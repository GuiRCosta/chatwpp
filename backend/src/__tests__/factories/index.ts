import { vi } from "vitest"

function withModelMethods(data: Record<string, unknown>) {
  return {
    ...data,
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    toJSON: vi.fn().mockReturnValue(data)
  }
}

export function buildUser(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test User",
    email: "test@example.com",
    passwordHash: "$2a$10$hashedpassword",
    profile: "admin",
    isOnline: false,
    tokenVersion: 0,
    status: "active",
    lastLogin: null,
    lastLogout: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildTenant(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    name: "Test Tenant",
    domain: "test.zflow.com",
    status: "active",
    maxUsers: 10,
    maxConnections: 5,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildContact(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Contact",
    number: "5511999999999",
    email: "contact@example.com",
    profilePicUrl: "",
    isGroup: false,
    pushname: "Test",
    presenceLastSeen: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildTicket(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    contactId: 1,
    userId: 1,
    queueId: null,
    whatsappId: 1,
    status: "open",
    lastMessage: "Hello",
    lastMessageAt: new Date("2025-01-01"),
    unreadMessages: 0,
    channel: "whatsapp",
    isGroup: false,
    protocol: "20250101-0001",
    closedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildMessage(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    ticketId: 1,
    contactId: 1,
    userId: null,
    body: "Test message",
    fromMe: false,
    read: false,
    mediaUrl: null,
    mediaType: null,
    ack: 0,
    isDeleted: false,
    isEdited: false,
    remoteJid: "5511999999999@s.whatsapp.net",
    dataJson: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildWhatsApp(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test WhatsApp",
    number: "5511999999999",
    status: "CONNECTED",
    qrcode: null,
    isDefault: true,
    greetingMessage: "",
    farewellMessage: "",
    maxUseBotQueues: 3,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildQueue(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Queue",
    color: "#3498db",
    greetingMessage: "Welcome to the queue",
    orderQueue: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildTag(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Tag",
    color: "#e74c3c",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildCampaign(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Campaign",
    message: "Campaign message content",
    status: "pending",
    scheduledAt: null,
    whatsappId: 1,
    contactListId: null,
    sentAt: null,
    cancelledAt: null,
    totalMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildPipeline(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Pipeline",
    description: "A test pipeline",
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildStage(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    pipelineId: 1,
    name: "Test Stage",
    color: "#2ecc71",
    order: 1,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildOpportunity(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    title: "Test Opportunity",
    description: "A test opportunity",
    value: 1000.0,
    contactId: 1,
    stageId: 1,
    userId: 1,
    status: "open",
    closedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildNotification(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    userId: 1,
    title: "Test Notification",
    message: "You have a new notification",
    isRead: false,
    type: "info",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}

export function buildSetting(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    key: "testSetting",
    value: "testValue",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return withModelMethods(data)
}
