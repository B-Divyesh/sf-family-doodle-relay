import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing and legal routes meet the page baseline', async ({ page }) => {
  for (const route of ['/', '/demo', '/play', '/privacy', '/terms', '/not-a-page']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Family Doodle Relay/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''))).toEqual([]);
  }
});

test('phone layout has no horizontal overflow and keyboard actions work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Add a sample mark' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Undo last line' })).toBeEnabled();
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

test('@claim:png-export finished relay downloads a PNG', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Finish this turn' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download the PNG strip' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('family-doodle-relay.png');
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

test('@claim:family-edition paid rooms contain eight turns', async ({ request }) => {
  const created = await (await request.post('/api/rooms', { data: { paid: true } })).json();
  const room = await (await request.get(`/api/rooms/${created.code}?token=${created.token}`)).json();
  expect(room.total_turns).toBe(8);
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
  await guest.getByRole('button', { name: 'Send your guess' }).click();
  await expect(guest.getByRole('heading', { name: 'Add one surprising detail' })).toBeVisible();
  await guest.getByRole('button', { name: 'Add a sample mark' }).click();
  await guest.getByRole('button', { name: 'Finish this turn' }).click();
  await expect(host.getByRole('heading', { name: 'Write your guess' })).toBeVisible();
  await host.getByLabel('Your guess').fill('A home riding a wave');
  await host.getByRole('button', { name: 'Send your guess' }).click();
  await expect(host.getByRole('heading', { name: 'Your relay is finished' })).toBeVisible();
  await expect(guest.getByText('A home riding a wave')).toBeVisible();
  await hostContext.close();
  await guestContext.close();
});

test('@claim:rate-limit rate limiter returns 429 with Retry-After', async ({ playwright }) => {
  const client = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8080', extraHTTPHeaders: { 'X-Forwarded-For': '203.0.113.77' } });
  const responses = await Promise.all(Array.from({ length: 55 }, () => client.get('/privacy')));
  const limited = responses.filter(response => response.status() === 429);
  expect(limited.length).toBeGreaterThan(0);
  expect(limited[0].headers()['retry-after']).toBe('1');
  await client.dispose();
});
