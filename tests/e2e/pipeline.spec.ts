import { expect, test, type Page } from '@playwright/test';
import { SUBPATH } from '../../playwright.config';

const SUB = `http://localhost:4174${SUBPATH}`;

test.describe('served under a subpath (GitHub Pages layout)', () => {
  test('boots, starts a run and has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(SUB);
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('data-scene', 'Menu');
    await canvas.click();
    await expect(canvas).toHaveAttribute('data-scene', 'Play');
    await expect.poll(async () => Number(await canvas.getAttribute('data-tick')), { timeout: 20_000 }).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  for (const missing of ['assets/does-not-exist.js', 'assets/does-not-exist.json']) {
    test(`missing ${missing} is a 404, not an index.html fallback`, async ({ request }) => {
      const res = await request.get(`${SUB}${missing}`);
      expect(res.status()).toBe(404);
      expect(res.headers()['content-type'] ?? '').not.toContain('text/html');
    });
  }
});

// Scale FIT: the canvas keeps 16:9, fits inside the viewport and is centred, at the itch embed size,
// smaller embeds and a phone, and refits when the viewport grows (what the itch fullscreen button does).
async function canvasFits(page: Page): Promise<string> {
  const box = await page.locator('canvas').boundingBox();
  const vp = page.viewportSize();
  if (!box || !vp) return 'no canvas';
  const problems: string[] = [];
  if (Math.abs(box.width / box.height - 16 / 9) > 2 / box.height) problems.push(`aspect ${box.width}x${box.height}`);
  if (box.width > vp.width + 1 || box.height > vp.height + 1) problems.push('overflows');
  if (Math.abs(box.width - vp.width) > 1 && Math.abs(box.height - vp.height) > 1) problems.push('not touching either edge');
  if (Math.abs(box.x - (vp.width - box.width) / 2) > 1 || Math.abs(box.y - (vp.height - box.height) / 2) > 1) problems.push('not centred');
  return problems.join(', ') || 'ok';
}

for (const [w, h] of [[960, 540], [640, 360], [390, 844], [844, 390]] as const) {
  test(`Scale FIT at ${w}x${h}, then refit at 1920x1080`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('./');
    await expect(page.locator('canvas')).toHaveAttribute('data-scene', 'Menu');
    await expect.poll(() => canvasFits(page)).toBe('ok');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect.poll(() => canvasFits(page)).toBe('ok');
    await expect.poll(async () => (await page.locator('canvas').boundingBox())?.width).toBeCloseTo(1920, 0);
  });
}

test('no audio code loads before the first input, and it loads after one', async ({ page }) => {
  test.setTimeout(120_000); // the whole ~27 s demo plays first, and headless software GL is slow
  const zzfx: string[] = [];
  page.on('request', (r) => /zzfx/i.test(r.url()) && zzfx.push(r.url()));
  await page.goto('./?demo=map-seed5&speed=4');
  const canvas = page.locator('canvas');
  // The whole demo plays with no user input: no AudioContext and no audio chunk.
  await expect(canvas).toHaveAttribute('data-scene', 'GameOver', { timeout: 100_000 });
  expect(zzfx, 'audio chunk requested before input').toEqual([]);
  await canvas.click();
  await expect.poll(() => zzfx.length, { message: 'audio chunk loads on first input', timeout: 10_000 }).toBeGreaterThan(0);
});
