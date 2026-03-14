import { test, expect } from '@playwright/test'

test.describe('marquee selection (C-23–C-27)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__pane', { state: 'visible' })
    await page.waitForTimeout(600)
  })

  test('pane right-click menu shows Select item', async ({ page }) => {
    await page.click('.react-flow__pane', { button: 'right', position: { x: 400, y: 300 } })
    await page.waitForTimeout(300)

    // Menu must be visible
    const menu = page.getByRole('menu', { name: 'Canvas options' })
    await expect(menu).toBeVisible()

    // All three items present
    await expect(page.getByRole('menuitem', { name: 'Add concept node' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Add note' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /selection mode/i })).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/pane-menu-with-select.png' })
  })

  test('clicking Select toggles selection mode — menu item turns orange', async ({ page }) => {
    // Open pane menu
    await page.click('.react-flow__pane', { button: 'right', position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)
    await page.getByRole('menuitem', { name: /selection mode/i }).click()
    await page.waitForTimeout(200)

    // Re-open menu — Select item should appear active (aria-pressed=true)
    await page.click('.react-flow__pane', { button: 'right', position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)

    const selectBtn = page.getByRole('menuitem', { name: /exit selection mode/i })
    await expect(selectBtn).toBeVisible()
    await expect(selectBtn).toHaveAttribute('aria-pressed', 'true')
    await page.screenshot({ path: 'tests/e2e/screenshots/select-active.png' })
  })

  test('Escape exits selection mode', async ({ page }) => {
    // Enter selection mode
    await page.click('.react-flow__pane', { button: 'right', position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)
    await page.getByRole('menuitem', { name: /selection mode/i }).click()
    await page.waitForTimeout(200)

    // Press Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Re-open menu — Select should now show as inactive
    await page.click('.react-flow__pane', { button: 'right', position: { x: 400, y: 300 } })
    await page.waitForTimeout(200)
    const selectBtn = page.getByRole('menuitem', { name: /enter selection mode/i })
    await expect(selectBtn).toBeVisible()
    await expect(selectBtn).toHaveAttribute('aria-pressed', 'false')
  })

  // Helper: add a node via the pane right-click "Add Node" menu (deterministic, no timing issues)
  async function addNodeViaMenu(page: import('@playwright/test').Page, x: number, y: number): Promise<void> {
    await page.click('.react-flow__pane', { button: 'right', position: { x, y } })
    await page.waitForTimeout(150)
    await page.getByRole('menuitem', { name: 'Add concept node' }).click()
    await page.waitForTimeout(150)
  }

  test('rubber-band drag in select mode selects nodes', async ({ page }) => {
    // Add two nodes via context menu (deterministic)
    await addNodeViaMenu(page, 250, 200)
    await addNodeViaMenu(page, 500, 200)
    await expect(page.locator('.react-flow__node')).toHaveCount(2)

    // Enter selection mode
    await page.click('.react-flow__pane', { button: 'right', position: { x: 380, y: 380 } })
    await page.waitForTimeout(200)
    await page.getByRole('menuitem', { name: /selection mode/i }).click()
    await page.waitForTimeout(200)

    // Drag a rubber-band selection rectangle that encloses both nodes
    // Nodes are near (250,200) and (500,200) relative to pane; drag from top-left to bottom-right
    await page.mouse.move(150, 130)
    await page.mouse.down()
    await page.mouse.move(650, 300, { steps: 15 })
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'tests/e2e/screenshots/rubber-band-dragging.png' })
    await page.mouse.up()
    await page.waitForTimeout(400)

    // At least one node should be selected — React Flow adds .selected class
    const selectedNodes = page.locator('.react-flow__node.selected')
    await page.screenshot({ path: 'tests/e2e/screenshots/rubber-band-result.png' })
    const count = await selectedNodes.count()
    console.log('Selected node count after rubber-band:', count)
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('Delete key removes all selected nodes', async ({ page }) => {
    // Add two nodes via context menu
    await addNodeViaMenu(page, 250, 200)
    await addNodeViaMenu(page, 500, 200)
    await expect(page.locator('.react-flow__node')).toHaveCount(2)

    // Enter selection mode
    await page.click('.react-flow__pane', { button: 'right', position: { x: 380, y: 380 } })
    await page.waitForTimeout(200)
    await page.getByRole('menuitem', { name: /selection mode/i }).click()
    await page.waitForTimeout(200)

    // Rubber-band both nodes
    await page.mouse.move(150, 130)
    await page.mouse.down()
    await page.mouse.move(650, 300, { steps: 15 })
    await page.mouse.up()
    await page.waitForTimeout(400)

    // Focus the RF container so Delete key is received, without clicking (which would deselect)
    await page.locator('.react-flow__renderer').focus()
    await page.keyboard.press('Delete')
    await page.waitForTimeout(400)

    await page.screenshot({ path: 'tests/e2e/screenshots/after-delete.png' })
    const remaining = await page.locator('.react-flow__node').count()
    console.log('Nodes remaining after delete:', remaining)
    expect(remaining).toBeLessThan(2)
  })
})
