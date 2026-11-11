// Tiny local preview server for dist/.  Usage: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST = join(fileURLToPath(import.meta.url), '..', '..', 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.ics': 'text/calendar', '.txt': 'text/plain' };
const port = Number(process.env.PORT) || Number(process.argv[2]) || 4173;
createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\\/]+/, '');
    let file = join(DIST, p);
    if (!file.startsWith(DIST)) throw 0;
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body);
  } catch {
    const body = await readFile(join(DIST, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end(body);
  }
}).listen(port, '127.0.0.1', () => console.log('http://localhost:' + port));
