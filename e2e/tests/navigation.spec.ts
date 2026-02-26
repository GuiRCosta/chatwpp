import { test, expect } from "@playwright/test"

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("admin@zflow.com")
    await page.getByLabel(/senha/i).fill("admin123")
    await page.getByRole("button", { name: /entrar/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("should navigate via sidebar links", async ({ page }) => {
    // Navigate to tickets
    await page.getByRole("link", { name: /tickets/i }).click()
    await expect(page).toHaveURL(/.*tickets/)

    // Navigate to contacts
    await page.getByRole("link", { name: /contatos/i }).click()
    await expect(page).toHaveURL(/.*contacts/)

    // Navigate to CRM
    await page.getByRole("link", { name: /crm/i }).click()
    await expect(page).toHaveURL(/.*crm/)

    // Navigate back to dashboard
    await page.getByRole("link", { name: /dashboard/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("should redirect unknown routes to home", async ({ page }) => {
    await page.goto("/nonexistent-page")
    await expect(page).toHaveURL(/.*dashboard/)
  })
})
