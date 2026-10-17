// Blockcraft static server (Render free tier).
// Serves the single-file game at / and answers Render health checks.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'));

// Extra install/PWA files (manifest, service worker, icons).
const STATIC = {
  '/manifest.json': ['manifest.json', 'application/manifest+json'],
  '/sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  '/icon-192.png': ['icon-192.png', 'image/png'],
  '/icon-512.png': ['icon-512.png', 'image/png'],
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': INDEX.length,
      'Cache-Control': 'public, max-age=300',
    });
    res.end(INDEX);
    return;
  }
  const hit = STATIC[url];
  if (hit) {
    try {
      const buf = fs.readFileSync(path.join(ROOT, hit[0]));
      const headers = {
        'Content-Type': hit[1],
        'Content-Length': buf.length,
        'Cache-Control': 'public, max-age=300',
      };
      if (url === '/sw.js') headers['Service-Worker-Allowed'] = '/';
      res.writeHead(200, headers);
      res.end(buf);
      return;
    } catch (_) {}
  }
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => console.log('Blockcraft live on port ' + PORT));
