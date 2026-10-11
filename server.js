// Blockcraft static server (Render free tier).
// Serves the single-file game at / and answers Render health checks.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'));

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
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => console.log('Blockcraft live on port ' + PORT));
