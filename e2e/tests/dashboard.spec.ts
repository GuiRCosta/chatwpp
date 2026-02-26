import { test, expect } from "@playwright/test"

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("admin@zflow.com")
    await page.getByLabel(/senha/i).fill("admin123")
    await page.getByRole("button", { name: /entrar/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("should display greeting", async ({ page }) => {
    // Check for greeting (Bom dia, Boa tarde, or Boa noite)
    await expect(page.getByText(/bom dia|boa tarde|boa noite/i)).toBeVisible()
  })

  test("should display stat cards", async ({ page }) => {
    await expect(page.getByText(/tickets/i)).toBeVisible()
    await expect(page.getByText(/contatos/i)).toBeVisible()
  })
})
