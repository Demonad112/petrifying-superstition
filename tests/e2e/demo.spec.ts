import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { checkReplay, type ReplayFile } from '../../src/sim';

// Demo fixtures are bundled from tests/replays/demo-*.json. Each must replay through the live clock and
// step path to its stored hash, at any frame rate, speed, FX mode and with pauses (DECISIONS #18).
const DIR = new URL('../replays/', import.meta.url);
const DEMOS = readdirSync(DIR)
  .filter((f) => /^demo-[a-z0-9-]+\.json$/i.test(f))
  .map((f) => ({ name: f.slice('demo-'.length, -'.json'.length), file: JSON.parse(readFileSync(new URL(f, DIR), 'utf8')) as ReplayFile }));

// A slow headless frame rate stretches a 30 s demo, so the budget is generous and every wait is a poll.
test.setTimeout(120_000);

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function exportReplay(page: Page): Promise<ReplayFile> {
  const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('F8')]);
  let text = '';
  for await (const chunk of await download.createReadStream()) text += String(chunk);
  return JSON.parse(text) as ReplayFile;
}

async function finish(page: Page): Promise<string | null> {
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-scene', 'GameOver', { timeout: 100_000 });
  return canvas.getAttribute('data-hash');
}

test.skip(DEMOS.length === 0, 'no demo fixtures in tests/replays');

for (const { name, file } of DEMOS) {
  test.describe(`demo ${name}`, () => {
    test('plays to the end and matches the fixture hash; F8 re-exports the fixture', async ({ page }) => {
      expect(checkReplay(file).ok, 'fixture is self-consistent').toBe(true);
      const errors = watchErrors(page);
      const json: string[] = [];
      page.on('response', (r) => r.url().includes(`demo-${name}`) && json.push(`${r.status()} ${r.headers()['content-type'] ?? ''}`));

      await page.goto(`./?demo=${name}&perf=1`);
      const canvas = page.locator('canvas');
      await expect(canvas).toHaveAttribute('data-mode', 'demo');
      expect(await finish(page)).toBe(file.hash);

      const exported = await exportReplay(page);
      expect(exported).toEqual(file);
      expect(json, 'demo fetched as a real JSON asset').toEqual([expect.stringMatching(/^200 application\/json/)]);
      expect(errors, 'console errors').toEqual([]);

      const perf = await page.evaluate(() => (window as unknown as { __perf?: unknown }).__perf);
      await test.info().attach(`perf-${name}.json`, { body: JSON.stringify(perf), contentType: 'application/json' });
    });

    // Frame rate, speed and FX mode only change wall-time scheduling, never the result.
    for (const q of ['fps=20', 'fps=120&speed=2', 'speed=4']) {
      test(`same hash at ${q}`, async ({ page }) => {
        await page.goto(`./?demo=${name}&${q}`);
        expect(await finish(page)).toBe(file.hash);
      });
    }

    test('same hash with reduced FX', async ({ page }) => {
      await page.goto('./');
      await expect(page.locator('canvas')).toHaveAttribute('data-scene', 'Menu'); // keys bind in Menu.create
      await page.keyboard.press('f');
      await expect(page.locator('canvas')).toHaveAttribute('data-fx', 'reduced');
      await page.goto(`./?demo=${name}`);
      expect(await finish(page)).toBe(file.hash);
    });

    test('auto-pauses at each moment for a screenshot, and still matches after the pauses', async ({ page }) => {
      await page.goto(`./?demo=${name}&shots=1`);
      const canvas = page.locator('canvas');
      await expect(canvas).toHaveAttribute('data-mode', 'demo');
      const shots: string[] = [];
      while ((await canvas.getAttribute('data-scene')) === 'Play') {
        // Either the next moment pauses the demo, or the demo ends.
        await expect
          .poll(async () => `${await canvas.getAttribute('data-scene')}:${await canvas.getAttribute('data-paused')}`, { timeout: 60_000 })
          .toMatch(/^(GameOver:.*|Play:true)$/);
        if ((await canvas.getAttribute('data-scene')) !== 'Play') break;
        const moment = (await canvas.getAttribute('data-moment')) ?? 'unknown';
        const path = test.info().outputPath(`M${String(shots.length + 1).padStart(2, '0')}-${moment.replace(':', '-')}.png`);
        await page.screenshot({ path });
        shots.push(moment);
        await page.keyboard.press('p');
        await expect(canvas).not.toHaveAttribute('data-paused', 'true');
      }
      expect(shots.length, 'at least one moment').toBeGreaterThan(0);
      expect(await finish(page)).toBe(file.hash);
    });
  });
}

test('an unknown demo shows an error instead of crashing', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./?demo=does-not-exist');
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-demo-error', 'does-not-exist');
  await expect(canvas).toHaveAttribute('data-scene', 'Menu');
  expect(errors).toEqual([]);
});
