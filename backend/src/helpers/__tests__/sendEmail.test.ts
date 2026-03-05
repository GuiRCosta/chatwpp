import { describe, it, expect, vi, beforeEach } from "vitest"

const mockSendMail = vi.fn()

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail
    }))
  }
}))

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules()
    mockSendMail.mockReset()
    process.env.SMTP_HOST = "smtp.test.com"
    process.env.SMTP_PORT = "587"
    process.env.SMTP_USER = "user@test.com"
    process.env.SMTP_PASS = "secret"
    process.env.SMTP_FROM = '"Nuvio CRM" <noreply@nuvio.com>'
  })

  it("sends email with correct parameters", async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: "abc-123" })

    const { sendEmail } = await import("../sendEmail")

    await sendEmail({
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>"
    })

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Nuvio CRM" <noreply@nuvio.com>',
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>"
    })
  })

  it("uses default from when SMTP_FROM is not set", async () => {
    delete process.env.SMTP_FROM
    mockSendMail.mockResolvedValueOnce({ messageId: "abc-456" })

    const { sendEmail } = await import("../sendEmail")

    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>"
    })

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Nuvio CRM" <noreply@nuvio.com>'
      })
    )
  })

  it("throws when sendMail fails", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP connection failed"))

    const { sendEmail } = await import("../sendEmail")

    await expect(
      sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>"
      })
    ).rejects.toThrow("Failed to send email")
  })

  it("sends password reset email with correct template", async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: "reset-123" })

    const { sendPasswordResetEmail } = await import("../sendEmail")

    await sendPasswordResetEmail("user@example.com", "abc123token", "João")

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Redefinir sua senha - Nuvio CRM"
      })
    )

    const callArg = mockSendMail.mock.calls[0][0]
    expect(callArg.html).toContain("abc123token")
    expect(callArg.html).toContain("João")
  })
})
