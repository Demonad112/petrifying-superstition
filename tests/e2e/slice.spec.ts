import { expect, test, type Page } from '@playwright/test';
import { SUBPATH } from '../../playwright.config';

// The slice page (slice.html) is a second Vite input (K-03). It must be served at the root and under the Pages subpath.
test.setTimeout(120_000);

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('slice.html returns 200 text/html at the root and under the subpath', async ({ request }) => {
  const root = await request.get('./slice.html');
  expect(root.status()).toBe(200);
  expect(root.headers()['content-type']).toContain('text/html');
  const sub = await request.get(`http://localhost:4174${SUBPATH}slice.html`);
  expect(sub.status()).toBe(200);
  expect(sub.headers()['content-type']).toContain('text/html');
});

test('slice boots to the Slice scene and a keyboard move changes data-px', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./slice.html');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-scene', 'Slice');
  const x0 = Number(await canvas.getAttribute('data-px'));
  await page.keyboard.down('d');
  await expect.poll(async () => Number(await canvas.getAttribute('data-px')), { timeout: 20_000 }).toBeGreaterThan(x0);
  await page.keyboard.up('d');
  expect(errors, 'console errors').toEqual([]);
});

test('slice ?auto=1 kills the gorgon, picks up the rune and the matching stat goes up', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./slice.html?auto=1');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-scene', 'Slice');
  await expect(canvas).toHaveAttribute('data-complete', 'true', { timeout: 30_000 });
  await expect(canvas).toHaveAttribute('data-picked', '1');
  await expect(canvas).toHaveAttribute('data-ehp', '0');
  // Default seed drops a damage rune (SLICE_SEED, batch 2 test): DMG went 1 -> 2.
  await expect(canvas).toHaveAttribute('data-mdmg', '1');
  await expect(canvas).toHaveAttribute('data-rune', 'dmg');
  expect(errors, 'console errors').toEqual([]);
});

test('slice works under the Pages subpath', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(`http://localhost:4174${SUBPATH}slice.html?auto=1`);
  await expect(page.locator('canvas')).toHaveAttribute('data-complete', 'true', { timeout: 30_000 });
  expect(errors, 'console errors').toEqual([]);
});
