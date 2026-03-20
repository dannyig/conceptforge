import { test, expect } from '@playwright/test'

test('settings panel visual verification', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

  // Mock the skill manifest so the AppMenu fetch doesn't cause CORS errors in CI
  await page.route('https://dannyig.github.io/conceptforge/manifest.json', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"version":"1.0"}' })
  )

  await page.goto('/')
  await page.waitForTimeout(1000)

  // Menu button visible (SK-05: replaces standalone settings trigger)
  const menuBtn = page.locator('.cf-menu-trigger')
  await expect(menuBtn).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/settings-trigger.png' })

  // Open menu then click Settings
  await menuBtn.click()
  await page.getByRole('menuitem', { name: 'Open settings' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/settings-open.png' })

  // Shows "No key stored" by default
  await expect(page.getByText('No key stored')).toBeVisible()

  // Enter an invalid key → validation error
  await page.getByLabel('Anthropic API key').fill('short')
  await page.getByRole('button', { name: 'Save key' }).click()
  await expect(page.locator("#cf-key-error")).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/settings-error.png' })

  // Enter a valid key → saved
  await page.getByLabel('Anthropic API key').fill('sk-ant-test-key-that-is-long-enough-12345')
  await page.getByRole('button', { name: 'Save key' }).click()
  await page.waitForTimeout(200)
  await expect(page.getByText('Key saved')).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/settings-saved.png' })

  // Clear key → back to empty
  await page.getByRole('button', { name: 'Clear stored API key' }).click()
  await page.waitForTimeout(200)
  await expect(page.getByText('No key stored')).toBeVisible()

  // Close panel
  await page.getByRole('button', { name: 'Close settings' }).click()
  await page.waitForTimeout(300)

  // Canvas still rendered after closing
  await expect(page.locator('.react-flow__pane')).toBeVisible()

  // No console errors
  expect(errors).toHaveLength(0)
})
