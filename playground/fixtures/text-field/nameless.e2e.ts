import { expect, test } from '@playwright/test'
import { openFixture } from '../../e2e/support'

// The dev server reports it; a production build compiles dev warnings out.
test('only the fields without a name warn in dev, composites that pass one do not', async ({ page }) => {
  test.skip(Boolean(process.env.CI || process.env.E2E_PROD), 'dev-only warning; a production build compiles it out')

  const warnings: string[] = []
  page.on('console', (message) => {
    // The dev server relays its own copy of each warning as `ssr:warn`; count the client's.
    const text = message.text()
    if (message.type() === 'warning' && text.includes('has no accessible name') && !text.includes('ssr:warn')) warnings.push(text)
  })

  await openFixture(page, 'text-field/nameless')
  await expect(page.getByTestId('nameless-textarea')).toBeVisible()

  await expect.poll(() => warnings.length).toBeGreaterThanOrEqual(2)
  expect(warnings.filter(text => text.includes('[m-text-field]'))).toHaveLength(1)
  expect(warnings.filter(text => text.includes('[m-textarea]'))).toHaveLength(1)
})
