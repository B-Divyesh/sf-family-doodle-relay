import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import { readFile } from 'node:fs/promises';

type CheckoutContract = {
  entry_url: string;
  entry_status: number;
  redirect_origin: string;
  redirect_path_pattern: string;
  product: {
    slug: string;
    name: string;
    description: string;
    price_minor: number;
    currency: string;
    price_type: string;
    is_recurring: boolean;
  };
  merchant: { name: string; checkout_notice: string };
};

async function recordedCheckoutContract(): Promise<CheckoutContract> {
  return JSON.parse(await readFile(new URL('./fixtures/sociobot-checkout-contract.json', import.meta.url), 'utf8'));
}

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
    expect(results.violations).toEqual([]);
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

test('phone layout has no horizontal overflow, 44 px controls, and keyboard actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Add a sample mark' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Undo last line' })).toBeEnabled();
  for (const route of ['/', '/demo', '/play', '/privacy', '/terms', '/not-a-page']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const controls = page.locator('a, button, input, canvas[tabindex="0"]');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      if (!await control.isVisible()) continue;
      const box = await control.boundingBox();
      expect(box?.width, `${route} control ${index} is too narrow`).toBeGreaterThanOrEqual(44);
      expect(box?.height, `${route} control ${index} is too short`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('an unbroken supported 80-character guess wraps on the completed 390 px relay', async ({ browser, request }) => {
  const created = await (await request.post('/api/rooms', { data: {} })).json();
  const joined = await (await request.post('/api/rooms/join', { data: { code: created.code } })).json();
  const hostContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.71' } });
  const guestContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.72' },
  });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const boundaryGuess = 'x'.repeat(80);

  await host.goto('/');
  await host.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: created });
  await guest.goto('/');
  await guest.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: joined });
  await Promise.all([host.goto(`/room/${created.code}`), guest.goto(`/room/${created.code}`)]);
  await expect(host.getByText('Both players are here')).toBeVisible();

  await host.getByRole('button', { name: 'Add a sample mark' }).click();
  await host.getByRole('button', { name: 'Finish this turn' }).click();
  await expect(guest.getByRole('heading', { name: 'Write your guess' })).toBeVisible();
  await guest.getByLabel('Your guess').fill('A tiny house on a wave');
  await guest.getByRole('button', { name: 'Send your guess' }).click();
  await expect(guest.getByRole('heading', { name: 'Add one surprising detail' })).toBeVisible();
  await guest.getByRole('button', { name: 'Add a sample mark' }).click();
  await guest.getByRole('button', { name: 'Finish this turn' }).click();
  await expect(host.getByRole('heading', { name: 'Write your guess' })).toBeVisible();
  await host.getByLabel('Your guess').fill(boundaryGuess);
  await host.getByRole('button', { name: 'Send your guess' }).click();

  await expect(guest.getByRole('heading', { name: 'Your relay is finished' })).toBeVisible();
  await expect(guest.getByText(boundaryGuess, { exact: false })).toBeVisible();
  expect(await guest.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await hostContext.close();
  await guestContext.close();
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

test('@claim:demo-sandbox sample demo leaves real browser data untouched and avoids APIs', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('relay:room:REALROOM1234', JSON.stringify({ code: 'REALROOM1234', token: 'private-room-token', role: 'host' }));
    localStorage.setItem('sb_license:family-doodle-relay', 'real-license-token');
    localStorage.setItem('sb_license_check:family-doodle-relay', JSON.stringify({ valid: true, checked: Date.now() }));
    sessionStorage.setItem('real-session-state', 'leave-this-alone');
    document.cookie = 'real-preference=paper; path=/';
  });
  const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('A house at sea')).toBeVisible();
  await page.getByRole('button', { name: 'Add a sample mark' }).click();
  await page.getByRole('button', { name: 'Finish this turn' }).click();
  await expect(page.getByRole('heading', { name: 'Your relay is finished' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('A house at sea')).toBeVisible();
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }))).toEqual(before);
  expect(await context.cookies()).toHaveLength(1);
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:8080')).toBe(true);
  expect(requests.some(url => new URL(url).pathname.startsWith('/api/'))).toBe(false);
});

test('@claim:privacy-defaults product has no account, discovery, advertising, tracking, or chat surface', async ({ page, context, request }) => {
  const requests: string[] = [];
  page.on('request', entry => requests.push(entry.url()));
  for (const route of ['/', '/demo', '/play', '/privacy', '/terms']) {
    await page.goto(route);
    const controls = await page.locator('a, button, input, textarea, select').evaluateAll(elements => elements.map(element => `${element.getAttribute('href') || ''} ${element.getAttribute('name') || ''} ${element.getAttribute('aria-label') || ''} ${element.textContent || ''}`).join('\n'));
    expect(controls).not.toMatch(/sign\s*in|log\s*in|register|profile|follower|chat|discover|advert/i);
  }
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Add a sample mark' }).click();
  await page.getByRole('button', { name: 'Finish this turn' }).click();
  for (const route of ['/api/accounts', '/api/login', '/api/profiles', '/api/rooms/public', '/api/chat', '/api/ads', '/api/analytics']) {
    expect((await request.get(route)).status(), `${route} must reject access`).toBeGreaterThanOrEqual(400);
  }
  expect(await context.cookies()).toEqual([]);
  expect(requests.every(url => new URL(url).origin === 'http://127.0.0.1:8080')).toBe(true);
});

test('@claim:browser-storage room credentials and a restored license stay in local storage only', async ({ page, context }) => {
  await page.route('https://api.sociobot.in/api/v1/products/family-doodle-relay/verify**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true }),
  }));
  await page.goto('/play');
  await page.getByRole('button', { name: 'Make a private room' }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]{12}$/);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('relay:room:')));
  expect(keys).toHaveLength(1);
  const credentials = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), keys[0]);
  expect(credentials).toMatchObject({ role: 'host', code: expect.any(String), token: expect.any(String) });
  await page.goto('/');
  await page.getByLabel('Paste your license').fill('fixture-valid-family-edition-license');
  await page.getByRole('button', { name: 'Restore the family edition' }).click();
  await expect(page.getByText('Family edition is ready on this device.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:family-doodle-relay'))).toBe('fixture-valid-family-edition-license');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sb_license_check:family-doodle-relay') || 'null'))).toMatchObject({ valid: true, checked: expect.any(Number) });
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

test('@claim:one-time-price recorded checkout is a one-time USD 6 purchase reached through Sociobot', async ({ page }) => {
  const contract = await recordedCheckoutContract();
  expect(contract.product).toMatchObject({
    slug: 'family-doodle-relay',
    price_minor: 600,
    currency: 'USD',
    price_type: 'one_time_price',
    is_recurring: false,
  });
  expect(contract.entry_status).toBe(303);
  expect(contract.redirect_origin).toBe('https://checkout.dodopayments.com');
  expect(contract.redirect_path_pattern).toBe('/session/cks_*');
  expect(contract.product.description).toContain('One-time');
  await page.goto('/');
  await expect(page.getByText('$6 once', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$6 once, no subscription')).toBeVisible();
  const buy = page.getByRole('link', { name: 'Buy the family edition' });
  await expect(buy).toHaveAttribute('href', contract.entry_url);
  await expect(page.getByText('One-time purchase. Payment opens on Sociobot.')).toBeVisible();
});

test('@claim:family-edition only a recorded valid license enables eight turns', async ({ request }) => {
  const created = await (await request.post('/api/rooms', { data: { paid: true } })).json();
  const room = await (await request.get(`/api/rooms/${created.code}?token=${created.token}`)).json();
  expect(room.total_turns).toBe(4);
  const verified = await (await request.post('/api/rooms', { data: { license: 'fixture-valid-family-edition-license' } })).json();
  const familyRoom = await (await request.get(`/api/rooms/${verified.code}?token=${verified.token}`)).json();
  expect(familyRoom.total_turns).toBe(8);
});

test('regression V9-02: a family-edition verifier outage starts a free room and lets the player remove the saved license', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '198.51.100.102' });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb_license:family-doodle-relay', 'fixture-verifier-unavailable-license');
    localStorage.setItem('sb_license_check:family-doodle-relay', JSON.stringify({ valid: true, checked: Date.now() }));
  });
  await page.goto('/play');
  await expect(page.getByText('A family edition license is saved on this device.')).toBeVisible();
  const roomRequest = page.waitForResponse(response => response.url().endsWith('/api/rooms') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Make a private room' }).click();
  const response = await roomRequest;
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toMatchObject({ license_check_unavailable: true });
  await expect(page.getByText('We could not check the family edition. This room has four free turns.')).toBeVisible();
  await expect(page.getByText('Turn 1 of 4')).toBeVisible();

  await page.goto('/play');
  await page.getByRole('button', { name: 'Remove saved license' }).click();
  await expect(page.getByText('Saved license removed. This device will make free four-turn rooms.')).toBeVisible();
  expect(await page.evaluate(() => [
    localStorage.getItem('sb_license:family-doodle-relay'),
    localStorage.getItem('sb_license_check:family-doodle-relay'),
  ])).toEqual([null, null]);
});

test('@claim:purchase-provider recorded checkout names its merchant and return handler', async ({ page }) => {
  const contract = await recordedCheckoutContract();
  await page.goto('/terms');
  await expect(page.getByText('Dodo Payments is the merchant of record.')).toBeVisible();
  await expect(page.getByText('Its checkout handles order questions and returns.')).toBeVisible();
  expect(contract.merchant.name).toBe('Dodo Payments');
  expect(contract.merchant.checkout_notice).toContain('Merchant of Record, dodopayments.com');
  expect(contract.merchant.checkout_notice).toContain('order-related inquiries and returns');
});

test('@claim:license-check-data-flow restoring a license sends only its token to the documented check', async ({ page }) => {
  const observed: { url: string; method: string; body: string | null }[] = [];
  await page.route('https://api.sociobot.in/api/v1/products/family-doodle-relay/verify**', route => {
    observed.push({ url: route.request().url(), method: route.request().method(), body: route.request().postData() });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await page.goto('/privacy');
  await expect(page.locator('p').filter({ hasText: 'Restoring a license sends one check to' })).toBeVisible();
  await expect(page.getByText('api.sociobot.in', { exact: true })).toBeVisible();
  await page.goto('/');
  await page.getByLabel('Paste your license').fill('fixture-private-license-token');
  await page.getByRole('button', { name: 'Restore the family edition' }).click();
  await expect(page.getByText('Family edition is ready on this device.')).toBeVisible();
  expect(observed).toHaveLength(1);
  const requestUrl = new URL(observed[0].url);
  expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe('https://api.sociobot.in/api/v1/products/family-doodle-relay/verify');
  expect([...requestUrl.searchParams.entries()]).toEqual([['license', 'fixture-private-license-token']]);
  expect(observed[0]).toMatchObject({ method: 'GET', body: null });
  expect(observed[0].url).not.toMatch(/room|guess|stroke|name|email/i);
});

test('@claim:refunded-license a revoked fixture cannot enable eight-turn rooms', async ({ page, request }) => {
  await page.route('https://api.sociobot.in/api/v1/products/family-doodle-relay/verify**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: false, reason: 'revoked' }),
  }));
  await page.goto('/');
  await page.getByLabel('Paste your license').fill('fixture-refunded-family-edition-license');
  await page.getByRole('button', { name: 'Restore the family edition' }).click();
  await expect(page.getByText('This license is not active.')).toBeVisible();
  const created = await (await request.post('/api/rooms', { data: { license: 'fixture-refunded-family-edition-license' } })).json();
  const room = await (await request.get(`/api/rooms/${created.code}?token=${created.token}`)).json();
  expect(room.total_turns).toBe(4);
  await page.goto('/terms');
  await expect(page.getByText('A refunded license cannot enable eight-turn rooms.')).toBeVisible();
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

test('@claim:free-core four no-license turns and a PNG strip never open checkout', async ({ browser, request }) => {
  const created = await (await request.post('/api/rooms', { data: {} })).json();
  const joined = await (await request.post('/api/rooms/join', { data: { code: created.code } })).json();
  const hostContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.61' } });
  const guestContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.62' } });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const checkoutRequests: string[] = [];
  host.on('request', entry => { if (entry.url().includes('/checkout')) checkoutRequests.push(entry.url()); });
  guest.on('request', entry => { if (entry.url().includes('/checkout')) checkoutRequests.push(entry.url()); });
  await host.goto('/');
  await host.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: created });
  await guest.goto('/');
  await guest.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: joined });
  await Promise.all([host.goto(`/room/${created.code}`), guest.goto(`/room/${created.code}`)]);
  await expect(host.getByText('Both players are here')).toBeVisible();
  await expect(host.getByText('Turn 1 of 4')).toBeVisible();
  await host.getByRole('button', { name: 'Add a sample mark' }).click();
  await host.getByRole('button', { name: 'Finish this turn' }).click();
  await guest.getByLabel('Your guess').fill('A tiny mountain home');
  await guest.getByRole('button', { name: 'Send your guess' }).click();
  await guest.getByRole('button', { name: 'Add a sample mark' }).click();
  await guest.getByRole('button', { name: 'Finish this turn' }).click();
  await host.getByLabel('Your guess').fill('A home on a wave');
  await host.getByRole('button', { name: 'Send your guess' }).click();
  await expect(host.getByRole('heading', { name: 'Your relay is finished' })).toBeVisible();
  const downloadEvent = host.waitForEvent('download');
  await host.getByRole('button', { name: 'Download the PNG strip' }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('family-doodle-relay.png');
  expect(checkoutRequests).toEqual([]);
  await hostContext.close();
  await guestContext.close();
});

test('@claim:host-end-room the host can end a private room for both players at any time', async ({ browser, request }) => {
  const created = await (await request.post('/api/rooms', { data: {} })).json();
  const joined = await (await request.post('/api/rooms/join', { data: { code: created.code } })).json();
  const hostContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.81' } });
  const guestContext = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.82' } });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();

  await host.goto('/');
  await host.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: created });
  await guest.goto('/');
  await guest.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: joined });
  await Promise.all([host.goto(`/room/${created.code}`), guest.goto(`/room/${created.code}`)]);
  await expect(host.getByText('Both players are here')).toBeVisible();

  host.once('dialog', dialog => dialog.accept());
  await host.getByRole('button', { name: 'End this room' }).click();
  for (const page of [host, guest]) {
    await expect(page.getByRole('heading', { name: 'The room did not open' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('The host ended this room. Make a new room to play again.');
    await expect(page.getByRole('link', { name: 'Make a new room' })).toBeVisible();
  }
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
