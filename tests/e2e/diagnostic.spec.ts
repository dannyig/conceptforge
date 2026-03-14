import { test } from '@playwright/test'

test('diagnostic — capture console errors', async ({ page }) => {
  const errors: string[] = []
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
    else logs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`))

  await page.goto('/')
  await page.waitForTimeout(5000)

  console.log('=== ERRORS ===')
  errors.forEach(e => console.log(e))
  console.log('=== LOGS ===')
  logs.slice(0, 20).forEach(l => console.log(l))

  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? 'MISSING')
  console.log('Root innerHTML length:', rootHtml.length)
  console.log('Root snippet:', rootHtml.slice(0, 300))

  await page.screenshot({ path: 'tests/e2e/screenshots/diagnostic.png', fullPage: true })
})
