import nodemailer from "nodemailer"
import { logger } from "./logger"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

const createTransporter = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration missing: SMTP_HOST, SMTP_USER, and SMTP_PASS are required")
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || '"Nuvio CRM" <noreply@nuvio.com>'

  try {
    await transporter.sendMail({ from, to, subject, html })
  } catch (error) {
    logger.error("Email send failed: %s to=%s subject=%s", error instanceof Error ? error.message : "Unknown error", to, subject)
    throw new Error("Failed to send email")
  }
}

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  userName: string
): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:7564"
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #08090A; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: 4px; margin: 0;">NUVIO</h1>
        <p style="color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin: 8px 0 0;">CRM & Atendimento inteligente</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #0A0A0A; font-size: 20px; margin: 0 0 16px;">Redefinir senha</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
          Ola, <strong>${userName}</strong>.
        </p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para criar uma nova senha:
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="${resetUrl}" style="display: inline-block; background: #1A1A1A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
            Redefinir senha
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0 0 8px;">
          Este link expira em <strong>1 hora</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
          Se voce nao solicitou a redefinicao de senha, ignore este email.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">Nuvio CRM - Todos os direitos reservados</p>
      </div>
    </div>
  `

  await sendEmail({
    to: email,
    subject: "Redefinir sua senha - Nuvio CRM",
    html
  })
}
