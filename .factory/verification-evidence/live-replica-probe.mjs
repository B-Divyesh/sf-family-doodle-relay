import { chromium } from 'playwright';

const baseURL = 'https://family-doodle-relay.sociobot.in';
const browser = await chromium.launch({ headless: true });
const results = [];
for (let sample = 0; sample < 3; sample += 1) {
  const creator = await browser.newContext({ baseURL });
  const createdResponse = await creator.request.post('/api/rooms', { data: {} });
  const room = await createdResponse.json();
  await creator.close();
  const reads = await Promise.all(Array.from({ length: 6 }, async () => {
    const client = await browser.newContext({ baseURL });
    const response = await client.request.get(`/api/rooms/${room.code}?token=${room.token}`);
    const result = response.status();
    await client.close();
    return result;
  }));
  const joiner = await browser.newContext({ baseURL });
  const join = await joiner.request.post('/api/rooms/join', { data: { code: room.code } });
  await joiner.close();
  results.push({ sample: sample + 1, create: createdResponse.status(), code: room.code, reads, join: join.status() });
  await new Promise(resolve => setTimeout(resolve, 1200));
}
const health = await Promise.all(Array.from({ length: 6 }, async () => {
  const client = await browser.newContext({ baseURL });
  const response = await client.request.get('/health');
  const body = await response.json();
  await client.close();
  return { status: response.status(), build_sha: body.build_sha };
}));
console.log(JSON.stringify({ results, health }, null, 2));
await browser.close();
