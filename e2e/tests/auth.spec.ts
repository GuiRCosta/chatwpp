import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /zflow/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
  })

  test("should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/.*login/)
  })

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("admin@zflow.com")
    await page.getByLabel(/senha/i).fill("admin123")
    await page.getByRole("button", { name: /entrar/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("wrong@email.com")
    await page.getByLabel(/senha/i).fill("wrongpassword")
    await page.getByRole("button", { name: /entrar/i }).click()

    // Should show error message
    await expect(page.getByText(/invalido|incorreto|error/i)).toBeVisible()
  })
})
