import { createServer } from 'node:http';

const fixtureLicense = 'fixture-valid-family-edition-license';
const refundedLicense = 'fixture-refunded-family-edition-license';

createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:9091');
  if (url.pathname === '/api/v1/products/family-doodle-relay/verify') {
    if (url.searchParams.get('license') === 'fixture-verifier-unavailable-license') {
      request.socket.destroy();
      return;
    }
    const license = url.searchParams.get('license');
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      valid: license === fixtureLicense,
      reason: license === fixtureLicense ? 'ok' : license === refundedLicense ? 'revoked' : 'invalid',
    }));
    return;
  }
  response.writeHead(404).end();
}).listen(9091, '127.0.0.1');
