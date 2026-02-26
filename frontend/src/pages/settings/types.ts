import type { WhatsApp } from "@/types"

export interface GeneralSettings {
  companyName: string
  businessHoursOpen: string
  businessHoursClose: string
  autoCloseTimeout: string
}

export interface NewQueueForm {
  name: string
  color: string
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  companyName: "",
  businessHoursOpen: "08:00",
  businessHoursClose: "18:00",
  autoCloseTimeout: "24"
}

export const DEFAULT_NEW_QUEUE: NewQueueForm = { name: "", color: "#3B82F6" }

export const SETTINGS_KEY_MAP: Record<keyof GeneralSettings, string> = {
  companyName: "companyName",
  businessHoursOpen: "businessHoursOpen",
  businessHoursClose: "businessHoursClose",
  autoCloseTimeout: "autoCloseTimeout"
}

export function formatWhatsAppStatus(status: WhatsApp["status"]): string {
  const statusLabels: Record<WhatsApp["status"], string> = {
    connected: "Conectado",
    disconnected: "Desconectado",
    opening: "Iniciando"
  }

  return statusLabels[status]
}

export function isWhatsAppOnline(status: WhatsApp["status"]): boolean {
  return status === "connected"
}

export function isAdminRole(profile: string): boolean {
  return profile === "admin" || profile === "superadmin"
}

export function getRoleBadgeVariant(
  profile: string
): "default" | "secondary" | "success" {
  if (profile === "superadmin") return "default"
  if (profile === "admin") return "success"
  return "secondary"
}
