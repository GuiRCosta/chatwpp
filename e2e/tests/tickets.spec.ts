import { test, expect } from "@playwright/test"

test.describe("Tickets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("admin@zflow.com")
    await page.getByLabel(/senha/i).fill("admin123")
    await page.getByRole("button", { name: /entrar/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)

    // Navigate to tickets
    await page.getByRole("link", { name: /tickets/i }).click()
    await expect(page).toHaveURL(/.*tickets/)
  })

  test("should display ticket list page", async ({ page }) => {
    await expect(page.getByText(/tickets/i)).toBeVisible()
  })

  test("should have filter options", async ({ page }) => {
    // Look for filter buttons/tabs
    await expect(page.getByText(/abertos|pendentes|fechados/i).first()).toBeVisible()
  })

  test("should have search input", async ({ page }) => {
    await expect(page.getByPlaceholder(/buscar/i)).toBeVisible()
  })
})
