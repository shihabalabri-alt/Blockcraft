// Keep the service-worker precache list in sync with the shipped item sprites.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const itemDir = path.join(root, 'assets', 'textures', 'items');
const items = fs.readdirSync(itemDir).filter(f => /\.png$/i.test(f)).sort();
const begin = '  // BCX ITEM SPRITES\n';
const end = '  // BCX ITEM SPRITES END\n';
const block = begin + items.map(f => "  '/assets/textures/items/" + f + "',").join('\n') + '\n' + end;
let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
sw = sw.replace(/const CACHE = 'blockcraft-v\d+';/, "const CACHE = 'blockcraft-v5';");
const a = sw.indexOf(begin), b = sw.indexOf(end);
if (a >= 0 && b > a) sw = sw.slice(0, a) + block + sw.slice(b + end.length);
else sw = sw.replace("  '/assets/textures/lapis_item.png',\n", "  '/assets/textures/lapis_item.png',\n\n" + block);
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log('service worker precaches ' + items.length + ' item sprites (cache v5)');
