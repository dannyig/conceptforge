import { test, expect } from '@playwright/test'

test('canvas visual verification', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1000)

  // Dark background renders
  const bg = await page.locator('.react-flow__renderer').evaluate(el =>
    window.getComputedStyle(el.parentElement!).backgroundColor
  )
  console.log('Canvas background:', bg)

  // Controls visible
  await expect(page.locator('.react-flow__controls')).toBeVisible()

  // Minimap visible
  await expect(page.locator('.react-flow__minimap')).toBeVisible()

  // Double-click pane → new node
  await page.dblclick('.react-flow__pane', { position: { x: 400, y: 300 } })
  await page.waitForTimeout(500)
  await expect(page.locator('.react-flow__node')).toHaveCount(1)

  // Double-click node → edit input appears
  await page.dblclick('.react-flow__node')
  await page.waitForTimeout(300)
  await expect(page.locator('.react-flow__node input')).toBeVisible()

  // Type label + Enter
  await page.keyboard.type('React Concepts')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  await expect(page.locator('.react-flow__node span')).toHaveText('React Concepts')

  // Screenshot for visual record
  await page.screenshot({ path: 'tests/e2e/screenshots/canvas-labeled.png', fullPage: true })

  // Select node + Delete
  await page.click('.react-flow__node')
  await page.waitForTimeout(200)
  await page.keyboard.press('Delete')
  await page.waitForTimeout(300)
  await expect(page.locator('.react-flow__node')).toHaveCount(0)

  // No console errors
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  expect(errors).toHaveLength(0)
})
