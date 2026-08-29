import { createServer } from 'node:http';

const fixtureLicense = 'fixture-valid-family-edition-license';

createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:9091');
  if (url.pathname === '/api/v1/products/family-doodle-relay/verify') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ valid: url.searchParams.get('license') === fixtureLicense }));
    return;
  }
  response.writeHead(404).end();
}).listen(9091, '127.0.0.1');
