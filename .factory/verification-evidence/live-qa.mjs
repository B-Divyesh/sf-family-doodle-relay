import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import { readFile } from 'node:fs/promises';

const base = 'https://family-doodle-relay.sociobot.in';
const evidence = { base, checkedAt: new Date().toISOString(), routes: {}, errors: [] };
const browser = await chromium.launch({ headless: true });

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await desktop.newPage();
const demoRequests = [];
page.on('request', request => demoRequests.push(request.url()));
page.on('console', message => { if (message.type() === 'error') evidence.errors.push(`desktop console: ${message.text()}`); });
page.on('pageerror', error => evidence.errors.push(`desktop page: ${error.message}`));
const landingResponse = await page.goto(base, { waitUntil: 'networkidle' });
evidence.firstRead = {
  status: landingResponse?.status(),
  title: await page.title(),
  h1: await page.locator('h1').allTextContents(),
  audience: await page.locator('.lede').innerText(),
  primaryAction: await page.locator('.hero-actions .primary').innerText(),
  nextStep: await page.locator('.after-action').innerText(),
};
const primary = page.locator('.hero-actions .primary');
await primary.focus();
evidence.primaryFocus = await primary.evaluate(element => {
  const style = getComputedStyle(element);
  return { outline: style.outline, outlineColor: style.outlineColor, outlineWidth: style.outlineWidth };
});
await page.keyboard.press('Enter');
await page.waitForURL(`${base}/demo`);
await page.getByText('Demo — sample data, nothing is saved').waitFor();
evidence.demoOneClick = {
  url: page.url(),
  h1: await page.locator('h1').innerText(),
  banner: await page.locator('.demo-banner').innerText(),
};
await page.getByRole('button', { name: 'Add a sample mark' }).focus();
await page.keyboard.press('Space');
await page.getByRole('button', { name: 'Finish this turn' }).focus();
await page.keyboard.press('Enter');
await page.getByRole('heading', { name: 'Your relay is finished' }).waitFor();
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download the PNG strip' }).click();
const download = await downloadPromise;
const downloadPath = '.factory/verification-evidence/live-demo-strip.png';
await download.saveAs(downloadPath);
const png = PNG.sync.read(await readFile(downloadPath));
evidence.demoDownload = { filename: download.suggestedFilename(), width: png.width, height: png.height };
evidence.demoStorage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
evidence.demoCookies = await desktop.cookies();
evidence.demoRequests = demoRequests;
evidence.demoOffOrigin = [...new Set(demoRequests.filter(url => new URL(url).origin !== base))];

for (const route of ['/', '/demo', '/play', '/privacy', '/terms', '/not-a-page']) {
  const routePage = await desktop.newPage();
  const routeErrors = [];
  routePage.on('console', message => { if (message.type() === 'error') routeErrors.push(`console: ${message.text()}`); });
  routePage.on('pageerror', error => routeErrors.push(`page: ${error.message}`));
  const response = await routePage.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page: routePage }).analyze();
  evidence.routes[route] = {
    status: response?.status(), title: await routePage.title(), lang: await routePage.locator('html').getAttribute('lang'),
    h1Count: await routePage.locator('h1').count(), mainCount: await routePage.locator('main').count(),
    missingAlt: await routePage.locator('img:not([alt])').count(),
    seriousCritical: axe.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? '')).map(item => item.id),
    errors: routeErrors,
  };
  await routePage.close();
}

await page.goto(`${base}/demo`);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
const cdp = await desktop.newCDPSession(page);
await cdp.send('Network.clearBrowserCache');
await desktop.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
evidence.offlineDemo = { h1: await page.locator('h1').innerText(), controlled: await page.evaluate(() => Boolean(navigator.serviceWorker.controller)) };
await desktop.setOffline(false);
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const mobilePage = await mobile.newPage();
mobilePage.on('console', message => { if (message.type() === 'error') evidence.errors.push(`mobile console: ${message.text()}`); });
mobilePage.on('pageerror', error => evidence.errors.push(`mobile page: ${error.message}`));
await mobilePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
await mobilePage.screenshot({ path: '.factory/verification-evidence/live-demo-mobile-390.png', fullPage: true });
const targets = await mobilePage.locator('a, button, input, canvas[tabindex]').evaluateAll(elements => elements.filter(element => {
  const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
}).map(element => { const rect = element.getBoundingClientRect(); return { text: element.getAttribute('aria-label') || element.textContent?.trim() || element.id, width: rect.width, height: rect.height }; }));
evidence.mobile = {
  overflow: await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  smallTargets: targets.filter(target => target.width < 44 || target.height < 44),
  animationDurations: await mobilePage.locator('.route-enter, .turn-rule').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationDuration)),
  scrollBehavior: await mobilePage.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior),
};
await mobilePage.evaluate(() => { document.body.style.zoom = '2'; });
evidence.mobile.zoom200Overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
await mobile.close();

// Live two-person relay, including blank-input recovery and human-paced focus preservation.
const api = await browser.newContext({ baseURL: base });
const createdResponse = await api.request.post('/api/rooms', { data: { paid: false } });
const created = await createdResponse.json();
const joinedResponse = await api.request.post('/api/rooms/join', { data: { code: created.code } });
const joined = await joinedResponse.json();
const thirdResponse = await api.request.post('/api/rooms/join', { data: { code: created.code } });
const hostContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const host = await hostContext.newPage();
const guest = await guestContext.newPage();
for (const [relayPage, credentials] of [[host, created], [guest, joined]]) {
  await relayPage.goto(base);
  await relayPage.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: credentials });
}
await Promise.all([host.goto(`${base}/room/${created.code}`), guest.goto(`${base}/room/${created.code}`)]);
await Promise.all([host.getByText('Both players are here').waitFor(), guest.getByText('Both players are here').waitFor()]);
const timerAtStart = await host.locator('#timer').innerText();
await host.getByRole('button', { name: 'Add a sample mark' }).click();
await host.getByRole('button', { name: 'Finish this turn' }).click();
await guest.getByRole('heading', { name: 'Write your guess' }).waitFor();
await guest.getByRole('button', { name: 'Send your guess' }).click();
await guest.getByText('Write a guess before sending it.').waitFor();
const blankFocused = await guest.getByLabel('Your guess').evaluate(element => element === document.activeElement);
const eighty = 'A'.repeat(80);
await guest.getByLabel('Your guess').fill(eighty);
await guest.waitForTimeout(850);
const guestPreserved = { valueLength: (await guest.getByLabel('Your guess').inputValue()).length, focused: await guest.getByLabel('Your guess').evaluate(element => element === document.activeElement) };
await guest.getByRole('button', { name: 'Send your guess' }).click();
await guest.getByRole('heading', { name: 'Add one surprising detail' }).waitFor();
await guest.getByRole('button', { name: 'Add a sample mark' }).click();
await guest.getByRole('button', { name: 'Finish this turn' }).click();
await host.getByRole('heading', { name: 'Write your guess' }).waitFor();
await host.getByLabel('Your guess').fill('A home riding a wave');
await host.waitForTimeout(850);
const hostPreserved = { value: await host.getByLabel('Your guess').inputValue(), focused: await host.getByLabel('Your guess').evaluate(element => element === document.activeElement) };
await host.getByRole('button', { name: 'Send your guess' }).click();
await Promise.all([host.getByRole('heading', { name: 'Your relay is finished' }).waitFor(), guest.getByText('A home riding a wave').waitFor()]);
const liveDownloadPromise = host.waitForEvent('download');
await host.getByRole('button', { name: 'Download the PNG strip' }).click();
const liveDownload = await liveDownloadPromise;
const livePath = '.factory/verification-evidence/live-two-person-strip.png';
await liveDownload.saveAs(livePath);
const livePng = PNG.sync.read(await readFile(livePath));
evidence.liveRelay = {
  createStatus: createdResponse.status(), joinStatus: joinedResponse.status(), thirdStatus: thirdResponse.status(),
  thirdBody: await thirdResponse.json(), timerAtStart, blankFocused, guestPreserved, hostPreserved,
  finishedHeading: await host.locator('h1').innerText(), snapshots: await host.locator('.result-canvas').count(),
  guesses: await host.locator('.result-quote').allTextContents(), download: { width: livePng.width, height: livePng.height },
};
await hostContext.close();
await guestContext.close();

// Input and authorization boundaries through the deployed API.
const malformed = await api.request.post('/api/rooms/join', { data: '{broken', headers: { 'content-type': 'application/json' } });
const shortCode = await api.request.post('/api/rooms/join', { data: { code: 'x' } });
const forged = await api.request.post('/api/rooms', { data: { paid: true } });
const forgedCredentials = await forged.json();
const forgedView = await api.request.get(`/api/rooms/${forgedCredentials.code}?token=${forgedCredentials.token}`);
evidence.boundaries = {
  malformed: { status: malformed.status(), body: await malformed.text() },
  unknownShortCode: { status: shortCode.status(), body: await shortCode.text() },
  forgedPaid: { createStatus: forged.status(), totalTurns: (await forgedView.json()).total_turns },
  roomLifetimeSeconds: created.expires_at - Math.floor(Date.now() / 1000),
};

// Several concurrent reads must all see the same persisted room.
const persisted = await api.request.post('/api/rooms', { data: {} });
const persistedRoom = await persisted.json();
const concurrentReads = await Promise.all(Array.from({ length: 8 }, () => api.request.get(`/api/rooms/${persistedRoom.code}?token=${persistedRoom.token}`)));
evidence.concurrentReads = concurrentReads.map(response => response.status());
await api.close();
await browser.close();

console.log(JSON.stringify(evidence, null, 2));
