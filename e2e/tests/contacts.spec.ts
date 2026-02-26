import { test, expect } from "@playwright/test"

test.describe("Contacts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("admin@zflow.com")
    await page.getByLabel(/senha/i).fill("admin123")
    await page.getByRole("button", { name: /entrar/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Navigate to contacts
    await page.getByRole("link", { name: /contatos/i }).click()
    await expect(page).toHaveURL(/.*contacts/)
  })

  test("should display contacts page", async ({ page }) => {
    await expect(page.getByText(/contatos/i)).toBeVisible()
  })

  test("should have new contact button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /novo contato/i })).toBeVisible()
  })

  test("should have search input", async ({ page }) => {
    await expect(page.getByPlaceholder(/buscar/i)).toBeVisible()
  })
})
