import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';

test('real routes expose complete metadata and meet the page baseline', async ({ page }) => {
  const routes = [
    ['/', 'Family Doodle Relay — Draw together remotely', 200],
    ['/?demo=1', 'Demo — Family Doodle Relay', 200],
    ['/demo', 'Demo — Family Doodle Relay', 200],
    ['/play', 'Start a relay — Family Doodle Relay', 200],
    ['/privacy', 'Privacy — Family Doodle Relay', 200],
    ['/terms', 'Terms — Family Doodle Relay', 200],
    ['/not-a-page', 'Page not found — Family Doodle Relay', 404],
  ] as const;
  for (const [route, title, status] of routes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(status);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/family-doodle-relay\.sociobot\.in\//);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''))).toEqual([]);
  }
});

test('route changes update focus, history, legal links, and the designed 404', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL('/privacy');
  await expect(page).toHaveTitle('Privacy — Family Doodle Relay');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('contentinfo').getByRole('link', { name: 'Terms' }).click();
  await expect(page).toHaveURL('/terms');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.evaluate(() => {
    history.pushState({}, '', '/missing-client-route');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeFocused();
  await expect(page).toHaveTitle('Page not found — Family Doodle Relay');
  await expect(page.getByRole('link', { name: 'Return to the front page' })).toHaveAttribute('href', '/');
});

test('first-screen sample action opens an isolated resettable query demo in one click', async ({ page }) => {
  await page.goto('/');
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(action).toHaveAttribute('href', '/?demo=1');
  await action.click();
  await expect(page).toHaveURL('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Add a sample mark' }).click();
  await page.getByRole('button', { name: 'Clear drawing' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('A house at sea')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start for real' })).toHaveAttribute('href', '/');
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), cookies: document.cookie }))).toEqual({ local: [], session: [], cookies: '' });
});

test('phone layout has no horizontal overflow and keyboard actions work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Add a sample mark' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Undo last line' })).toBeEnabled();
  const demoLink = await page.getByRole('navigation').getByRole('link', { name: 'Demo' }).boundingBox();
  expect(demoLink?.width).toBeGreaterThanOrEqual(44);
  expect(demoLink?.height).toBeGreaterThanOrEqual(44);
  for (const name of ['Privacy', 'Terms', 'Built by Param Factory external link']) {
    const box = await page.getByRole('contentinfo').getByRole('link', { name }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/not-a-page');
  for (const link of await page.getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('offline demo reload includes the precached built shell', async ({ page, context }) => {
  await context.setExtraHTTPHeaders({ 'X-Forwarded-For': '198.51.100.96' });
  await page.goto('/?demo=1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.clearBrowserCache');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Add one surprising detail' })).toBeVisible();
  await context.setOffline(false);
});

test('@claim:demo-sandbox @claim:privacy-defaults sample demo stays isolated and same-origin', async ({ page, context }) => {
  const offOrigin: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== 'http://127.0.0.1:8080') offOrigin.push(request.url()); });
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('A house at sea')).toBeVisible();
  await page.getByRole('button', { name: 'Add a sample mark' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('demo:')))).toEqual([]);
  expect(offOrigin).toEqual([]);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('A house at sea')).toBeVisible();
  await context.setOffline(false);
  await page.goto('/');
  await expect(page.getByText('Public rooms or strangers')).toBeVisible();
  await expect(page.getByText('Ads or behaviour tracking')).toBeVisible();
  expect(await context.cookies()).toEqual([]);
});

test('@claim:browser-storage room credentials stay in this browser storage', async ({ page, context }) => {
  await page.goto('/play');
  await page.getByRole('button', { name: 'Make a private room' }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]{12}$/);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('relay:room:')));
  expect(keys).toHaveLength(1);
  const credentials = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), keys[0]);
  expect(credentials).toMatchObject({ role: 'host', code: expect.any(String), token: expect.any(String) });
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('@claim:health-build health reports the running build identity', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok', build_sha: expect.any(String) });
});

test('@claim:png-export finished relay downloads a PNG with every shown relay entry', async ({ page }, testInfo) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Finish this turn' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download the PNG strip' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('family-doodle-relay.png');
  const downloadPath = testInfo.outputPath('family-doodle-relay.png');
  await download.saveAs(downloadPath);
  const png = PNG.sync.read(await (await import('node:fs/promises')).readFile(downloadPath));
  expect([png.width, png.height]).toEqual([1200, 728]);
  const darkPixels = (left: number, top: number, right: number, bottom: number) => {
    let count = 0;
    for (let y = top; y < bottom; y += 1) for (let x = left; x < right; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (png.data[offset] < 80 && png.data[offset + 1] < 80 && png.data[offset + 2] < 80) count += 1;
    }
    return count;
  };
  // Both panels and both distinct quote rows must contain ink in the downloaded PNG.
  expect(darkPixels(80, 175, 540, 495)).toBeGreaterThan(100);
  expect(darkPixels(630, 175, 1090, 495)).toBeGreaterThan(100);
  expect(darkPixels(60, 535, 1140, 565)).toBeGreaterThan(40);
  expect(darkPixels(60, 575, 1140, 605)).toBeGreaterThan(40);
  await expect(page.getByText('Turn 1 guess: “A house at sea”')).toBeVisible();
  await expect(page.getByText('Turn 2 guess: “A whale carrying a tiny village”')).toBeVisible();
  expect(await page.locator('.result-canvas').count()).toBe(2);
});

test('@claim:download-local downloading a PNG strip sends no data to another service', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Finish this turn' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download the PNG strip' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('family-doodle-relay.png');
  expect(requests.length).toBeGreaterThan(2);
  expect([...new Set(requests.map(url => new URL(url).origin))]).toEqual(['http://127.0.0.1:8080']);
});

test('@claim:two-person-limit a third player cannot enter', async ({ request }) => {
  const created = await request.post('/api/rooms', { data: { paid: false } });
  expect(created.status()).toBe(201);
  const room = await created.json();
  expect((await request.post('/api/rooms/join', { data: { code: room.code } })).status()).toBe(200);
  const third = await request.post('/api/rooms/join', { data: { code: room.code } });
  expect(third.status()).toBe(409);
  expect(await third.json()).toMatchObject({ error: expect.stringMatching(/already has two players/) });
});

test('@claim:room-expiry new rooms expire within four hours', async ({ request }) => {
  const before = Math.floor(Date.now() / 1000);
  const response = await request.post('/api/rooms', { data: { paid: false } });
  const room = await response.json();
  expect(room.expires_at).toBeGreaterThan(before + 14_300);
  expect(room.expires_at).toBeLessThanOrEqual(before + 14_401);
});

test('@claim:one-time-price page states the one-time price and uses Sociobot checkout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('$6 once', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$6 once, no subscription')).toBeVisible();
  const buy = page.getByRole('link', { name: 'Buy the family edition' });
  await expect(buy).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/family-doodle-relay/checkout');
  await expect(page.getByText('One-time purchase. Sociobot is the merchant of record.')).toBeVisible();
});

test('@claim:family-edition only a recorded valid license enables eight turns', async ({ request }) => {
  const created = await (await request.post('/api/rooms', { data: { paid: true } })).json();
  const room = await (await request.get(`/api/rooms/${created.code}?token=${created.token}`)).json();
  expect(room.total_turns).toBe(4);
  const verified = await (await request.post('/api/rooms', { data: { license: 'fixture-valid-family-edition-license' } })).json();
  const familyRoom = await (await request.get(`/api/rooms/${verified.code}?token=${verified.token}`)).json();
  expect(familyRoom.total_turns).toBe(8);
});

test('@claim:live-relay two players complete four synced turns', async ({ browser, request }) => {
  const created = await (await request.post('/api/rooms', { data: { paid: false } })).json();
  const joined = await (await request.post('/api/rooms/join', { data: { code: created.code } })).json();
  const hostContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.11' } });
  const guestContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.12' } });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  await host.goto('/');
  await host.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: created });
  await guest.goto('/');
  await guest.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: joined });
  await Promise.all([host.goto(`/room/${created.code}`), guest.goto(`/room/${created.code}`)]);
  await expect(host.getByText('Both players are here')).toBeVisible();
  await expect(host.locator('#timer')).toHaveText(/00:4[0-5]/);
  await host.getByRole('button', { name: 'Add a sample mark' }).click();
  await host.getByRole('button', { name: 'Finish this turn' }).click();
  await expect(guest.getByRole('heading', { name: 'Write your guess' })).toBeVisible();
  await guest.getByLabel('Your guess').fill('A little mountain home');
  await guest.waitForTimeout(750);
  await expect(guest.getByLabel('Your guess')).toHaveValue('A little mountain home');
  await expect(guest.getByLabel('Your guess')).toBeFocused();
  await guest.getByRole('button', { name: 'Send your guess' }).click();
  await expect(guest.getByRole('heading', { name: 'Add one surprising detail' })).toBeVisible();
  await guest.getByRole('button', { name: 'Add a sample mark' }).click();
  await guest.getByRole('button', { name: 'Finish this turn' }).click();
  await expect(host.getByRole('heading', { name: 'Write your guess' })).toBeVisible();
  await host.getByLabel('Your guess').fill('A home riding a wave');
  await host.waitForTimeout(750);
  await expect(host.getByLabel('Your guess')).toHaveValue('A home riding a wave');
  await expect(host.getByLabel('Your guess')).toBeFocused();
  await host.getByRole('button', { name: 'Send your guess' }).click();
  await expect(host.getByRole('heading', { name: 'Your relay is finished' })).toBeVisible();
  await expect(guest.getByText('A home riding a wave')).toBeVisible();
  await hostContext.close();
  await guestContext.close();
});

test('@claim:rate-limit rate limiter returns 429 with Retry-After per trusted ingress client for API and pages', async ({ playwright }) => {
  const client = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8080' });
  const responses = await Promise.all(Array.from({ length: 55 }, (_, index) => client.get('/api/rooms/NOT-A-ROOM?token=none', { headers: { 'X-Forwarded-For': `203.0.113.${index}, 198.51.100.44` } })));
  const limited = responses.filter(response => response.status() === 429);
  expect(responses.filter(response => response.status() !== 429)).toHaveLength(20);
  expect(limited).toHaveLength(35);
  expect(limited[0].headers()['retry-after']).toBe('1');
  const pages = await Promise.all(Array.from({ length: 55 }, (_, index) => client.get('/privacy', { headers: { 'X-Forwarded-For': `203.0.113.${index}, 198.51.100.45` } })));
  const limitedPages = pages.filter(response => response.status() === 429);
  expect(pages.filter(response => response.status() !== 429)).toHaveLength(20);
  expect(limitedPages).toHaveLength(35);
  expect(limitedPages[0].headers()['retry-after']).toBe('1');
  await client.dispose();
});
