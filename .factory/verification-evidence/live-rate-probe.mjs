import { request } from 'playwright';

const baseURL = 'https://family-doodle-relay.sociobot.in';
const client = await request.newContext({ baseURL });
const summarize = async responses => {
  const statuses = responses.reduce((counts, response) => ({ ...counts, [response.status()]: (counts[response.status()] || 0) + 1 }), {});
  const limited = responses.find(response => response.status() === 429);
  return { statuses, firstRetryAfter: limited?.headers()['retry-after'] ?? null };
};
await new Promise(resolve => setTimeout(resolve, 1200));
const api = await Promise.all(Array.from({ length: 55 }, (_, index) => client.get('/api/rooms/NOTAROOM123?token=none', { headers: { 'X-Forwarded-For': `203.0.113.${index}, 198.51.100.44` } })));
await new Promise(resolve => setTimeout(resolve, 1200));
const pages = await Promise.all(Array.from({ length: 55 }, (_, index) => client.get('/privacy', { headers: { 'X-Forwarded-For': `203.0.113.${index}, 198.51.100.45` } })));
console.log(JSON.stringify({ api: await summarize(api), pages: await summarize(pages) }, null, 2));
await client.dispose();

await new Promise(resolve => setTimeout(resolve, 1200));
const unlock = await request.newContext({ baseURL: 'https://api.sociobot.in' });
const verify = await Promise.all(Array.from({ length: 40 }, (_, index) => unlock.get(`/api/v1/products/family-doodle-relay/verify?license=qa-invalid-${index}`)));
console.log(JSON.stringify({ sociobotVerify: await summarize(verify) }, null, 2));
await unlock.dispose();
