// Blockcraft static server + realtime relay (Render free tier).
// Serves the single-file game at /, answers Render health checks, and
// relays multiplayer traffic (block edits, positions, chat) between
// clients joined by world-seed room. WS handshake is hand-rolled
// RFC6455 (no dependencies).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// ---- multiplayer relay (custom) ----
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
let nextId = 1;
const conns = new Set();

function wsFrame(str) {
  const p = Buffer.from(str, 'utf8');
  const len = p.length;
  let head;
  if (len < 126) {
    head = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    head = Buffer.alloc(4);
    head[0] = 0x81; head[1] = 126;
    head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x81; head[1] = 127;
    head.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([head, p]);
}

function wsSend(c, obj) {
  try {
    if (c.alive && c.sock.writable) c.sock.write(wsFrame(JSON.stringify(obj)));
  } catch (_) { drop(c); }
}

function roommates(c) {
  const out = [];
  if (!c.room) return out;
  conns.forEach(x => { if (x !== c && x.alive && x.room === c.room) out.push(x); });
  return out;
}

function safeName(n, fallback) {
  let s = String(n == null ? '' : n).replace(/[^A-Za-z0-9 _\-]/g, '').slice(0, 12);
  return s || fallback;
}

function handleMsg(c, m) {
  try {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'join') {
      c.room = 'room:' + String(m.seed == null ? 'default' : m.seed).slice(0, 40);
      c.name = safeName(m.name, 'Player' + c.id);
      wsSend(c, { t: 'hello', id: c.id, seed: c.room.slice(5), count: roommates(c).length + 1 });
      roommates(c).forEach(x => wsSend(x, { t: 'join', id: c.id, name: c.name }));
      return;
    }
    if (!c.room) return;
    if (m.t === 'p') {
      roommates(c).forEach(x => wsSend(x, { t: 'p', id: c.id, name: c.name, x: m.x, y: m.y, z: m.z }));
      return;
    }
    if (m.t === 'b') {
      roommates(c).forEach(x => wsSend(x, { t: 'b', x: m.x, y: m.y, z: m.z, v: m.v }));
      return;
    }
    if (m.t === 'bs') {
      const it = Array.isArray(m.items) ? m.items.slice(0, 4096) : [];
      if (it.length) roommates(c).forEach(x => wsSend(x, { t: 'bs', items: it }));
      return;
    }
    if (m.t === 'chat') {
      const msg = String(m.msg == null ? '' : m.msg).slice(0, 120);
      roommates(c).forEach(x => wsSend(x, { t: 'chat', name: c.name, msg }));
      return;
    }
  } catch (_) {}
}

function feed(c, chunk) {
  try {
    c.buf = c.buf.length ? Buffer.concat([c.buf, chunk]) : chunk;
    for (;;) {
      if (c.buf.length < 2) break;
      const b0 = c.buf[0], b1 = c.buf[1];
      const op = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f;
      let off = 2;
      if (len === 126) {
        if (c.buf.length < 4) break;
        len = c.buf.readUInt16BE(2); off = 4;
      } else if (len === 127) {
        if (c.buf.length < 10) break;
        len = Number(c.buf.readBigUInt64BE(2)); off = 10;
      }
      if (len > (1 << 20)) { drop(c); break; }
      if (c.buf.length < off + (masked ? 4 : 0) + len) break;
      let mask = null;
      if (masked) { mask = c.buf.slice(off, off + 4); off += 4; }
      let payload = c.buf.slice(off, off + len);
      c.buf = c.buf.slice(off + len);
      if (mask) { for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3]; }
      if (op === 8) { drop(c); break; }
      if (op !== 1) continue;
      let msg = null;
      try { msg = JSON.parse(payload.toString('utf8')); } catch (_) { continue; }
      handleMsg(c, msg);
    }
  } catch (_) { drop(c); }
}

function drop(c) {
  try {
    if (!c.alive) return;
    c.alive = false;
    conns.delete(c);
    try { c.sock.destroy(); } catch (_) {}
    if (c.room) {
      conns.forEach(x => {
        if (x.alive && x.room === c.room && x !== c) wsSend(x, { t: 'bye', id: c.id, name: c.name });
      });
    }
  } catch (_) {}
}

server.on('upgrade', (req, sock) => {
  try {
    const url = (req.url || '/').split('?')[0];
    if (url !== '/ws' || !req.headers['sec-websocket-key'] || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') {
      sock.destroy();
      return;
    }
    const accept = crypto.createHash('sha1')
      .update(req.headers['sec-websocket-key'] + WS_GUID)
      .digest('base64');
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    const c = { sock, buf: Buffer.alloc(0), id: nextId++, name: '', room: null, alive: true };
    conns.add(c);
    sock.on('data', d => feed(c, d));
    sock.on('close', () => drop(c));
    sock.on('end', () => drop(c));
    sock.on('error', () => drop(c));
  } catch (_) { try { sock.destroy(); } catch (_) {} }
});

server.listen(PORT, () => console.log('Blockcraft live on port ' + PORT + ' (game + ws relay)'));
