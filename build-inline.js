// Bundle the survival layer into the single-file game.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const files = ['bcx-core.js', 'bcx-craft.js', 'bcx-mobs.js', 'bcx-world.js', 'bcx-redstone.js'];
const start = '<!-- BCX-SURVIVAL:START -->';
const end = '<!-- BCX-SURVIVAL:END -->';
let src = '';
for (const f of files) {
  src += '\n/* ==== ' + f + ' ==== */\n' + fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n';
}
const block = start + '\n<script>\n' + src + '\n</script>\n' + end;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const a = html.indexOf(start), b = html.indexOf(end);
if (a >= 0 && b > a) {
  html = html.slice(0, a) + block + html.slice(b + end.length);
} else {
  const i = html.lastIndexOf('</body>');
  if (i < 0) throw new Error('No </body>');
  html = html.slice(0, i) + block + '\n' + html.slice(i);
}
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('Inlined ' + files.length + ' survival files; index.html is now ' + html.length + ' bytes.');
