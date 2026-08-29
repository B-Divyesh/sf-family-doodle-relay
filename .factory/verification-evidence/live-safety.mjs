import { chromium } from 'playwright';

const base = 'https://family-doodle-relay.sociobot.in';
const browser = await chromium.launch({ headless: true });
const api = await browser.newContext({ baseURL: base });
const createdResponse = await api.request.post('/api/rooms', { data: {} });
const created = await createdResponse.json();

const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const guest = await guestContext.newPage();
const browserErrors = [];
const joinResponses = [];
guest.on('response', response => { if (response.url().includes('/api/rooms')) joinResponses.push({ url: response.url(), status: response.status() }); });
guest.on('console', message => { if (message.type() === 'error') browserErrors.push(`guest console: ${message.text()}`); });
guest.on('pageerror', error => browserErrors.push(`guest page: ${error.message}`));
await guest.goto(base);
await guest.getByLabel('Have an invite code?').fill('abc');
await guest.getByRole('button', { name: 'Join the room' }).click();
const invalid = {
  message: await guest.locator('#join-error').innerText(),
  ariaInvalid: await guest.getByLabel('Have an invite code?').getAttribute('aria-invalid'),
};
await guest.getByLabel('Have an invite code?').fill(created.code);
await guest.getByRole('button', { name: 'Join the room' }).click();
await guest.waitForTimeout(3000);
if (guest.url() !== `${base}/room/${created.code}`) {
  console.log(JSON.stringify({ createStatus: createdResponse.status(), code: created.code, invalid, joinResponses, url: guest.url(), main: await guest.locator('main').innerText(), browserErrors }, null, 2));
  await api.close(); await guestContext.close(); await browser.close(); process.exit(2);
}
const joined = JSON.parse(await guest.evaluate(code => localStorage.getItem(`relay:room:${code}`), created.code));

const hostContext = await browser.newContext();
const host = await hostContext.newPage();
host.on('console', message => { if (message.type() === 'error') browserErrors.push(`host console: ${message.text()}`); });
host.on('pageerror', error => browserErrors.push(`host page: ${error.message}`));
await host.goto(base);
await host.evaluate(({ code, value }) => localStorage.setItem(`relay:room:${code}`, JSON.stringify(value)), { code: created.code, value: created });
await host.goto(`${base}/room/${created.code}`);
await host.waitForTimeout(5000);
const presenceBeforeReload = {
  host: await host.locator('#room-status').count() ? await host.locator('#room-status').innerText() : `missing: ${await host.locator('main').innerText()}`,
  guest: await guest.locator('#room-status').count() ? await guest.locator('#room-status').innerText() : `missing: ${await guest.locator('main').innerText()}`,
};
if (!await host.locator('#room-status').count() || !await guest.locator('#room-status').count()) {
  console.log(JSON.stringify({ createStatus: createdResponse.status(), code: created.code, invalid, joined, joinResponses, presenceBeforeReload, browserErrors }, null, 2));
  await api.close(); await hostContext.close(); await guestContext.close(); await browser.close(); process.exit(2);
}
await guest.reload();
await guest.waitForTimeout(5000);
const presenceAfterReload = {
  host: await host.locator('#room-status').count() ? await host.locator('#room-status').innerText() : `missing: ${await host.locator('main').innerText()}`,
  guest: await guest.locator('#room-status').count() ? await guest.locator('#room-status').innerText() : `missing: ${await guest.locator('main').innerText()}`,
};
host.once('dialog', dialog => dialog.accept());
await host.getByRole('button', { name: 'End this room' }).click();
await guest.getByRole('heading', { name: 'The room did not open' }).waitFor();
const endedRead = await api.request.get(`/api/rooms/${created.code}?token=${created.token}`);
console.log(JSON.stringify({
  createStatus: createdResponse.status(), invalid, joinedRole: joined.role,
  presenceBeforeReload, presenceAfterReload, browserErrors,
  guestAfterEnd: await guest.locator('main').innerText(), endedReadStatus: endedRead.status(),
}, null, 2));
await api.close();
await hostContext.close();
await guestContext.close();
await browser.close();
