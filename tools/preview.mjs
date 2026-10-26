import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import def from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const world = def.create({ cfg: { ...def.defaults(), enabled: true }, dataDir: join(root, '.preview-data'), persist: () => {} });
await world.start({ log: { info: console.log } });
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  try {
    if (request.method === 'GET' && url.pathname === '/events') {
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      const socket = { open: true, send: data => response.write(`data: ${data}\n\n`), onClose: fn => request.on('close', fn), close: () => response.end() };
      world.stream('scores', socket); return;
    }
    if (request.method === 'GET' && url.pathname === '/manifest') {
      response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(world.webUi('zh'))); return;
    }
    const match = /^\/api\/(scores|works|instruments)\/([a-zA-Z]+)$/.exec(url.pathname);
    if (request.method === 'POST' && match) {
      const origin = request.headers.origin;
      if (origin && origin !== `http://${request.headers.host}`) throw new Error('Invalid origin');
      const chunks = []; let size = 0;
      for await (const chunk of request) { size += chunk.length; if (size > 250000) throw new Error('Request too large'); chunks.push(chunk); }
      const args = JSON.parse(Buffer.concat(chunks).toString('utf8') || '[]');
      const result = await world.invoke(match[1], match[2], args);
      if (result?.$binary) { response.setHeader('Content-Type', result.$binary.mime); response.end(Buffer.from(result.$binary.base64, 'base64')); }
      else if (result?.$file) { response.setHeader('Content-Type', result.$file.mime); response.end(readFileSync(result.$file.path)); }
      else { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(result)); }
      return;
    }
    const files = { '/': ['tools/preview.html', 'text/html;charset=utf-8'], '/harness.js': ['tools/harness.js', 'text/javascript'], '/webui.js': ['dist/webui.js', 'text/javascript'] };
    const file = files[url.pathname];
    if (!file) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', file[1]); response.end(readFileSync(join(root, file[0])));
  } catch (error) { response.writeHead(400, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: error.message })); }
});
server.listen(18796, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:18796'));
for (const event of ['SIGINT', 'SIGTERM']) process.on(event, async () => { await world.stop(); server.close(); process.exit(0); });
