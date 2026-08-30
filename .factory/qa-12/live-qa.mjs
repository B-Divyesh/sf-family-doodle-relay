import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const base = 'https://family-doodle-relay.sociobot.in';
const evidenceDir = '.factory/qa-12';
await mkdir(evidenceDir, { recursive: true });

const result = {
  checkedAt: new Date().toISOString(),
  base,
  routes: {},
  browserErrors: [],
};
const browser = await chromium.launch({ headless: true });

const recordErrors = (page, label) => {
  page.on('console', message => {
    if (message.type() === 'error') result.browserErrors.push(`${label} console: ${message.text()}`);
  });
  page.on('pageerror', error => result.browserErrors.push(`${label} page: ${error.message}`));
};

// Cold landing and complete demo flow, with request and storage evidence.
const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const desktop = await desktopContext.newPage();
recordErrors(desktop, 'desktop');
const requests = [];
desktop.on('request', request => requests.push({ url: request.url(), method: request.method(), type: request.resourceType() }));
const landing = await desktop.goto(base, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: `${evidenceDir}/first-read-desktop.png`, fullPage: false });
const primary = desktop.getByRole('link', { name: 'Try it with sample data' });
await primary.focus();
const primaryFocus = await primary.evaluate(element => {
  const style = getComputedStyle(element);
  return { outline: style.outline, outlineColor: style.outlineColor, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset };
});
await desktop.evaluate(() => {
  localStorage.setItem('qa12:sentinel', 'keep-local');
  sessionStorage.setItem('qa12:sentinel', 'keep-session');
  document.cookie = 'qa12=keep-cookie; path=/';
});
const beforeDemo = await desktop.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
await desktop.keyboard.press('Enter');
await desktop.waitForURL(`${base}/?demo=1`);
await desktop.getByText('Demo — sample data, nothing is saved').waitFor();
const demo = {
  url: desktop.url(),
  banner: await desktop.locator('.demo-banner').innerText(),
  sampleHeading: await desktop.locator('h1').innerText(),
};
await desktop.getByRole('button', { name: 'Add a sample mark' }).focus();
await desktop.keyboard.press('Space');
await desktop.getByRole('button', { name: 'Finish this turn' }).focus();
await desktop.keyboard.press('Enter');
await desktop.getByRole('heading', { name: 'Your relay is finished' }).waitFor();
const downloadPromise = desktop.waitForEvent('download');
await desktop.getByRole('button', { name: 'Download the PNG strip' }).click();
const download = await downloadPromise;
const demoPngPath = `${evidenceDir}/demo-strip.png`;
await download.saveAs(demoPngPath);
const demoPng = PNG.sync.read(await readFile(demoPngPath));
await desktop.getByRole('button', { name: 'Reset demo' }).click();
await desktop.getByRole('link', { name: 'Start for real' }).click();
await desktop.waitForURL(`${base}/`);
const afterDemo = await desktop.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
result.firstRead = {
  status: landing?.status(),
  title: await desktop.title(),
  h1: 'Draw together from two places',
  audience: 'For a child and trusted adult who want a calm game between calls.',
  primaryAction: 'Try it with sample data',
  nextStep: 'A sample relay opens next. Nothing is saved.',
  primaryFocus,
};
result.demo = {
  ...demo,
  download: { filename: download.suggestedFilename(), width: demoPng.width, height: demoPng.height },
  storageUnchanged: JSON.stringify(beforeDemo) === JSON.stringify(afterDemo),
  beforeDemo,
  afterDemo,
  cookies: await desktopContext.cookies(),
  requests,
  offOriginRequests: requests.filter(entry => new URL(entry.url).origin !== base),
  apiRequests: requests.filter(entry => new URL(entry.url).pathname.startsWith('/api/')),
};

// Semantic/accessibility route scan.
for (const route of ['/', '/demo', '/play', '/privacy', '/terms', '/not-a-page']) {
  const page = await desktopContext.newPage();
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !(route === '/not-a-page' && message.text().includes('404'))) errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  result.routes[route] = {
    status: response?.status(),
    title: await page.title(),
    lang: await page.locator('html').getAttribute('lang'),
    h1Count: await page.locator('h1').count(),
    mainCount: await page.locator('main').count(),
    missingAlt: await page.locator('img:not([alt])').count(),
    seriousCritical: axe.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? '')).map(issue => issue.id),
    errors,
  };
  await page.close();
}

// Service-worker update and offline reload in its own context.
const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const offlinePage = await offlineContext.newPage();
recordErrors(offlinePage, 'offline');
await offlinePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
const workerStateBefore = await offlinePage.evaluate(async () => {
  const registration = await navigator.serviceWorker.ready;
  await registration.update();
  return { active: registration.active?.state ?? null, waiting: registration.waiting?.state ?? null, installing: registration.installing?.state ?? null };
});
await offlinePage.reload();
await offlinePage.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
const cdp = await offlineContext.newCDPSession(offlinePage);
await cdp.send('Network.clearBrowserCache');
await offlineContext.setOffline(true);
await offlinePage.reload({ waitUntil: 'domcontentloaded' });
result.serviceWorker = {
  before: workerStateBefore,
  controlledOffline: await offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  offlineHeading: await offlinePage.locator('h1').innerText(),
};
await offlineContext.setOffline(false);
await offlineContext.close();

// Mobile layout, motion, zoom, touch sizing, and mobile Axe scan.
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const mobile = await mobileContext.newPage();
recordErrors(mobile, 'mobile');
await mobile.goto(`${base}/demo`, { waitUntil: 'networkidle' });
await mobile.screenshot({ path: `${evidenceDir}/demo-mobile-390.png`, fullPage: true });
const targetSizes = await mobile.locator('a, button, input, canvas[tabindex]').evaluateAll(elements => elements.filter(element => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
}).map(element => {
  const rect = element.getBoundingClientRect();
  return { name: element.getAttribute('aria-label') || element.textContent?.trim() || element.id, width: rect.width, height: rect.height };
}));
const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
const mobileBeforeZoom = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
await mobile.evaluate(() => { document.body.style.zoom = '2'; });
const mobileAfterZoom = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, h1Visible: Boolean(document.querySelector('h1')?.getBoundingClientRect().height), mainVisible: Boolean(document.querySelector('main')?.getBoundingClientRect().height) }));
result.mobile = {
  beforeZoom: mobileBeforeZoom,
  afterZoom: mobileAfterZoom,
  smallTargets: targetSizes.filter(target => target.width < 44 || target.height < 44),
  animationDurations: await mobile.locator('.route-enter, .turn-rule').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationDuration)),
  scrollBehavior: await mobile.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior),
  seriousCritical: mobileAxe.violations.filter(issue => ['serious', 'critical'].includes(issue.impact ?? '')).map(issue => issue.id),
};
await mobileContext.close();

// End-to-end live room through real UI: create, invalid/recovered join, all turns, export.
const hostContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const host = await hostContext.newPage();
const guest = await guestContext.newPage();
recordErrors(host, 'host');
recordErrors(guest, 'guest');
await host.goto(`${base}/play`);
const createResponsePromise = host.waitForResponse(response => response.url().endsWith('/api/rooms') && response.request().method() === 'POST');
await host.getByRole('button', { name: 'Make a private room' }).click();
const createResponse = await createResponsePromise;
await host.waitForURL(/\/room\/[A-Z0-9]{12}$/);
const code = host.url().split('/').pop();
const hostCredentials = JSON.parse(await host.evaluate(roomCode => localStorage.getItem(`relay:room:${roomCode}`), code));

await guest.goto(base);
await guest.getByLabel('Have an invite code?').fill('abc');
await guest.getByRole('button', { name: 'Join the room' }).click();
const invalidJoin = {
  message: await guest.locator('#join-error').innerText(),
  ariaInvalid: await guest.getByLabel('Have an invite code?').getAttribute('aria-invalid'),
  focused: await guest.getByLabel('Have an invite code?').evaluate(element => element === document.activeElement),
};
const joinResponsePromise = guest.waitForResponse(response => response.url().endsWith('/api/rooms/join') && response.request().method() === 'POST');
await guest.getByLabel('Have an invite code?').fill(code);
await guest.getByRole('button', { name: 'Join the room' }).click();
const joinResponse = await joinResponsePromise;
await guest.waitForURL(`${base}/room/${code}`);
await Promise.all([host.getByText('Both players are here').waitFor(), guest.getByText('Both players are here').waitFor()]);
const timerAtStart = await host.locator('#timer').innerText();

const canvas = host.locator('#draw-canvas');
const box = await canvas.boundingBox();
await host.mouse.move(box.x + 80, box.y + 80);
await host.mouse.down();
await host.mouse.move(box.x + 160, box.y + 140, { steps: 6 });
await host.mouse.up();
await host.getByRole('button', { name: 'Finish this turn' }).click();
await guest.getByRole('heading', { name: 'Write your guess' }).waitFor();
await guest.getByRole('button', { name: 'Send your guess' }).click();
const blankGuess = {
  message: await guest.locator('#guess-help').innerText(),
  focused: await guest.getByLabel('Your guess').evaluate(element => element === document.activeElement),
};
await guest.getByLabel('Your guess').pressSequentially('A'.repeat(85));
const boundaryGuessLength = (await guest.getByLabel('Your guess').inputValue()).length;
await guest.waitForTimeout(850);
const guestFocusPreserved = await guest.getByLabel('Your guess').evaluate(element => element === document.activeElement);
await guest.getByRole('button', { name: 'Send your guess' }).click();
await guest.getByRole('heading', { name: 'Add one surprising detail' }).waitFor();
await guest.getByRole('button', { name: 'Add a sample mark' }).click();
await guest.getByRole('button', { name: 'Finish this turn' }).click();
await host.getByRole('heading', { name: 'Write your guess' }).waitFor();
await host.getByLabel('Your guess').fill('A home riding a wave');
await host.getByRole('button', { name: 'Send your guess' }).click();
await Promise.all([
  host.getByRole('heading', { name: 'Your relay is finished' }).waitFor(),
  guest.getByRole('heading', { name: 'Your relay is finished' }).waitFor(),
]);
const liveDownloadPromise = host.waitForEvent('download');
await host.getByRole('button', { name: 'Download the PNG strip' }).click();
const liveDownload = await liveDownloadPromise;
const livePngPath = `${evidenceDir}/live-two-person-strip.png`;
await liveDownload.saveAs(livePngPath);
const livePng = PNG.sync.read(await readFile(livePngPath));
result.liveRelay = {
  createStatus: createResponse.status(),
  joinStatus: joinResponse.status(),
  codeLength: code.length,
  hostRole: hostCredentials.role,
  invalidJoin,
  timerAtStart,
  blankGuess,
  boundaryGuessLength,
  guestFocusPreserved,
  hostHeading: await host.locator('h1').innerText(),
  guestHeading: await guest.locator('h1').innerText(),
  snapshots: await host.locator('.result-canvas').count(),
  guesses: await host.locator('.result-quote').allTextContents(),
  download: { filename: liveDownload.suggestedFilename(), width: livePng.width, height: livePng.height },
};
await hostContext.close();
await guestContext.close();

// API boundaries and concurrent persistence observations.
const api = await browser.newContext({ baseURL: base });
const malformed = await api.request.post('/api/rooms/join', { data: '{broken', headers: { 'content-type': 'application/json' } });
const missingCode = await api.request.post('/api/rooms/join', { data: { code: 'NOTAROOM0000' } });
const thirdRoomResponse = await api.request.post('/api/rooms', { data: {} });
const thirdRoom = await thirdRoomResponse.json();
const firstJoin = await api.request.post('/api/rooms/join', { data: { code: thirdRoom.code } });
const thirdJoin = await api.request.post('/api/rooms/join', { data: { code: thirdRoom.code } });
const forgedResponse = await api.request.post('/api/rooms', { data: { paid: true } });
const forged = await forgedResponse.json();
const forgedRead = await api.request.get(`/api/rooms/${forged.code}?token=${forged.token}`);
const forgedState = await forgedRead.json();
const concurrentResponse = await api.request.post('/api/rooms', { data: {} });
const concurrentRoom = await concurrentResponse.json();
const concurrentReads = await Promise.all(Array.from({ length: 8 }, () => api.request.get(`/api/rooms/${concurrentRoom.code}?token=${concurrentRoom.token}`)));
result.boundaries = {
  malformed: { status: malformed.status(), body: await malformed.text() },
  missingCode: { status: missingCode.status(), body: await missingCode.text() },
  firstJoin: firstJoin.status(),
  thirdJoin: { status: thirdJoin.status(), body: await thirdJoin.text() },
  forgedPaid: { createStatus: forgedResponse.status(), readStatus: forgedRead.status(), totalTurns: forgedState.total_turns },
  roomLifetimeSeconds: thirdRoom.expires_at - Math.floor(Date.now() / 1000),
  concurrentReads: concurrentReads.map(response => response.status()),
};
await api.close();

await desktopContext.close();
await browser.close();
await writeFile(`${evidenceDir}/live-results.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
