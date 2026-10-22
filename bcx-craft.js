/* BLOCKCRAFT SURVIVAL LAYER - inventory, crafting, containers */
(function () {
  'use strict';
  var B = window.BCX;
  if (!B || B.craftLoaded) return;
  B.craftLoaded = true;

  var doc = document;
  function el(tag, cls, parent, html) {
    var e = doc.createElement(tag); if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
  }
  function deep(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }
  function same(a, b) { return B.same(a, b); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function keyName(id) { return B.KB(id); }

  document.addEventListener('mousemove', function (e) {
    if (B.cursorEl) { B.cursorEl.style.left = e.clientX + 'px'; B.cursorEl.style.top = e.clientY + 'px'; }
  });

  /* ---------- recipe data ---------- */
  var TAG = function (n) { return { tag: n }; };
  function tagMatch(tag, st) {
    if (!st) return false;
    if (typeof st.id === 'number') {
      var k = B.KB(st.id);
      if (tag === 'planks') return /PLANKS/.test(k);
      if (tag === 'logs') return /LOG|WOOD|STEM/.test(k);
      if (tag === 'stone') return /STONE|COBBLE/.test(k);
      if (tag === 'wool') return /WOOL/.test(k);
      if (tag === 'sand') return /SAND/.test(k);
      return false;
    }
    if (tag === 'coal') return st.id === 'coal' || st.id === 'charcoal';
    return false;
  }
  function specMatch(spec, st) {
    if (!st) return false;
    if (spec === null || spec === undefined) return false;
    if (spec.tag) return tagMatch(spec.tag, st);
    if (Array.isArray(spec)) { for (var i = 0; i < spec.length; i++) if (specMatch(spec[i], st)) return true; return false; }
    return String(st.id) === String(spec);
  }
  B.recipes = [];
  function nr(rows, out, count, size) {
    var r = { rows: rows, out: typeof out === 'string' ? out : out, count: count || 1, size: size || rows.length };
    B.recipes.push(r); return r;
  }
  var P = B.NB('Oak Planks'), C = B.NB('Cobblestone'), CT = B.NB('Crafting Table'), FN = B.NB('Furnace'), CH = B.NB('Chest');
  var LOGT = TAG('logs'), PLT = TAG('planks'), STT = TAG('stone');
  if (P >= 0) {
    nr([[LOGT]], P, 4, 1);
    nr([[PLT], [PLT]], 'stick', 4, 1);
    if (CT >= 0) nr([[PLT, PLT], [PLT, PLT]], CT, 1, 2);
    if (CH >= 0) nr([[PLT, PLT, PLT], [PLT, null, PLT], [PLT, PLT, PLT]], CH, 1, 3);
    nr([[PLT, PLT, PLT], [null, 'stick', null], [null, 'stick', null]], 'wooden_pickaxe', 1, 3);
    nr([[PLT, PLT], [PLT, 'stick'], [null, 'stick']], 'wooden_axe', 1, 3);
    nr([[PLT], ['stick'], ['stick']], 'wooden_shovel', 1, 3);
    nr([[PLT], [PLT], ['stick']], 'wooden_sword', 1, 3);
  }
  if (C >= 0) {
    if (FN >= 0) nr([[C, C, C], [C, null, C], [C, C, C]], FN, 1, 3);
    nr([[C, C, C], [null, 'stick', null], [null, 'stick', null]], 'stone_pickaxe', 1, 3);
    nr([[C, C], [C, 'stick'], [null, 'stick']], 'stone_axe', 1, 3);
    nr([[C], ['stick'], ['stick']], 'stone_shovel', 1, 3);
    nr([[C], [C], ['stick']], 'stone_sword', 1, 3);
  }
  nr([['iron_ingot', 'iron_ingot', 'iron_ingot'], [null, 'stick', null], [null, 'stick', null]], 'iron_pickaxe', 1, 3);
  nr([['iron_ingot', 'iron_ingot'], ['iron_ingot', 'stick'], [null, 'stick']], 'iron_axe', 1, 3);
  nr([['iron_ingot'], ['stick'], ['stick']], 'iron_shovel', 1, 3);
  nr([['iron_ingot'], ['iron_ingot'], ['stick']], 'iron_sword', 1, 3);
  nr([['diamond', 'diamond', 'diamond'], [null, 'stick', null], [null, 'stick', null]], 'diamond_pickaxe', 1, 3);
  nr([['diamond', 'diamond'], ['diamond', 'stick'], [null, 'stick']], 'diamond_axe', 1, 3);
  nr([['diamond'], ['stick'], ['stick']], 'diamond_shovel', 1, 3);
  nr([['diamond'], ['diamond'], ['stick']], 'diamond_sword', 1, 3);
  nr([['leather', 'leather', 'leather'], ['leather', null, 'leather']], 'leather_helmet', 1, 3);
  nr([['leather', null, 'leather'], ['leather', 'leather', 'leather'], ['leather', 'leather', 'leather']], 'leather_chestplate', 1, 3);
  nr([['leather', 'leather', 'leather'], ['leather', null, 'leather'], ['leather', null, 'leather']], 'leather_leggings', 1, 3);
  nr([['leather', null, 'leather'], ['leather', null, 'leather']], 'leather_boots', 1, 3);
  nr([['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], 'iron_helmet', 1, 3);
  nr([['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], 'iron_chestplate', 1, 3);
  nr([['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], 'iron_leggings', 1, 3);
  nr([['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], 'iron_boots', 1, 3);
  nr([['diamond', 'diamond', 'diamond'], ['diamond', null, 'diamond']], 'diamond_helmet', 1, 3);
  nr([['diamond', null, 'diamond'], ['diamond', 'diamond', 'diamond'], ['diamond', 'diamond', 'diamond']], 'diamond_chestplate', 1, 3);
  nr([['diamond', 'diamond', 'diamond'], ['diamond', null, 'diamond'], ['diamond', null, 'diamond']], 'diamond_leggings', 1, 3);
  nr([['diamond', null, 'diamond'], ['diamond', null, 'diamond']], 'diamond_boots', 1, 3);
  nr([['stick', null, 'string'], [null, 'stick', 'string'], ['string', null, 'stick']], 'bow', 1, 3);
  nr([['flint'], ['stick'], ['feather']], 'arrow', 4, 3);
  nr([['wheat', 'wheat', 'wheat']], 'bread', 1, 3);
  function storage(item, blockName, reversible) {
    var b = B.NB(blockName);
    if (b < 0) return;
    nr([[item, item, item], [item, item, item], [item, item, item]], b, 1, 3);
    if (reversible) nr([[b]], item, 9, 1);
  }
  storage('iron_ingot', 'Iron Block', true);
  storage('gold_ingot', 'Gold Block', true);
  storage('copper_ingot', 'Copper Block', true);
  storage('diamond', 'Diamond Block', true);
  storage('emerald', 'Emerald Block', true);
  storage('redstone', 'Redstone Block', true);
  storage('coal', 'Coal Block', true);
  storage('lapis', 'Lapis Block', true);
  var torch = B.NB('Torch');
  if (torch >= 0) nr([['coal'], ['stick']], torch, 4, 2);
  var rtorch = B.NB('Redstone Torch');
  if (rtorch >= 0) nr([['redstone'], ['stick']], rtorch, 1, 2);
  nr([['iron_ingot', 'flint']], 'flint_and_steel', 1, 2);
  var tnt = B.NB('TNT');
  if (tnt >= 0) nr([
    ['gunpowder', 'sand', 'gunpowder'],
    ['sand', 'gunpowder', 'sand'],
    ['gunpowder', 'sand', 'gunpowder']
  ], tnt, 1, 3);
  var obsidian = B.NB('Obsidian'), enchTable = B.NB('Enchanting Table');
  if (obsidian >= 0 && enchTable >= 0) nr([
    [obsidian, 'diamond', obsidian],
    ['diamond', 'lapis', 'diamond'],
    [null, obsidian, null]
  ], enchTable, 1, 3);
  // Basic redstone lamps and signal wire (see bcx-redstone.js).
  var glassB = B.NB('Glass'), lampB = B.NB('Redstone Lamp');
  var detB = B.NB('Daylight Detector'), targetB = B.NB('Target');
  var repeaterB = B.NB('Redstone Repeater');
  if (lampB >= 0 && glassB >= 0) nr([
    ['redstone', glassB, 'redstone'],
    [glassB, 'redstone', glassB],
    ['redstone', glassB, 'redstone']
  ], lampB, 1, 3);
  if (detB >= 0 && glassB >= 0) nr([
    [glassB, glassB, glassB],
    ['redstone', 'redstone', 'redstone'],
    [PLT, PLT, PLT]
  ], detB, 1, 3);
  if (targetB >= 0) nr([
    [PLT, 'redstone', PLT],
    [PLT, 'redstone', PLT],
    [PLT, PLT, PLT]
  ], targetB, 1, 3);
  if (repeaterB >= 0) nr([
    [C, 'redstone', C],
    [C, 'redstone', C],
    [C, C, C]
  ], repeaterB, 1, 3);
  B.craftRecipes = B.recipes;

  function trimGrid(grid, w, h) {
    var minR = h, maxR = -1, minC = w, maxC = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (grid[y * w + x]) { if (y < minR) minR = y; if (y > maxR) maxR = y; if (x < minC) minC = x; if (x > maxC) maxC = x; }
    }
    if (maxR < 0) return null;
    var cells = [];
    for (var yy = minR; yy <= maxR; yy++) for (var xx = minC; xx <= maxC; xx++) cells.push(grid[yy * w + xx] || null);
    return { cells: cells, w: maxC - minC + 1, h: maxR - minR + 1 };
  }
  B.matchRecipe = function (grid, size) {
    var t = trimGrid(grid, size, size); if (!t) return null;
    for (var i = 0; i < B.recipes.length; i++) {
      var r = B.recipes[i];
      if (r.size > size) continue;
      var rows = r.rows, width = 0;
      for (var q = 0; q < rows.length; q++) width = Math.max(width, rows[q].length);
      if (t.w !== width || t.h !== rows.length) continue;
      var ok = true;
      for (var y = 0; y < rows.length && ok; y++) for (var x = 0; x < width; x++) {
        var spec = rows[y][x] === undefined ? null : rows[y][x];
        var st = t.cells[y * width + x] || null;
        if (spec === null) { if (st) { ok = false; break; } }
        else if (!specMatch(spec, st)) { ok = false; break; }
      }
      if (ok) return { recipe: r, out: { id: r.out, count: r.count } };
    }
    return null;
  };
  B.craftFrom = function (grid, size) { return B.matchRecipe(grid, size); };

  function consumeGrid(grid) {
    for (var i = 0; i < grid.length; i++) {
      if (grid[i]) { grid[i].count--; if (grid[i].count <= 0) grid[i] = null; }
    }
    B.markDirty();
  }

  /* ---------- shared layout ---------- */
  function invGrid(parent, start, end) {
    var box = el('div', 'bcx-invbox bcx-grid', parent);
    box.style.gridTemplateColumns = 'repeat(9,40px)';
    for (var i = start; i < end; i++) invSlot(box, i);
    return box;
  }
  function invSlot(parent, i) {
    var s = B.slotEl(parent, {
      get: function () { return B.inv[i]; },
      set: function (v) { B.inv[i] = v; B.markDirty(); },
      accepts: function () { return true; }
    });
    s.title = 'Inventory ' + i;
    return s;
  }
  function armorSlot(parent, i) {
    var labels = ['Head', 'Chest', 'Legs', 'Feet'];
    var s = B.slotEl(parent, {
      get: function () { return B.armor[i]; },
      set: function (v) { B.armor[i] = v; B.markDirty(); },
      accepts: function (st) { var d = B.items[st.id]; return d && d.type === 'armor' && d.slot === ['head', 'chest', 'legs', 'feet'][i]; }
    });
    s.title = labels[i];
    return s;
  }
  function playerInv(parent) {
    var wrap = el('div', '', parent);
    el('div', 'sub', wrap, 'Inventory');
    invGrid(wrap, 9, 36);
    el('div', 'sub', wrap, 'Hotbar').style.marginTop = '8px';
    invGrid(wrap, 0, 9);
  }
  function tipBox(parent) { var t = el('div', 'bcx-tip', parent, 'Hover an item for details.'); t.id = 'bcx-tip'; return t; }
  function setupPanel(body, refresh) {
    B.cursor = null;
    B.updateCursor();
    B.panel.refresh = function () { B.refreshSlotEls(); refresh && refresh(); };
    refresh && refresh();
  }
  function returnGrid(grid) {
    for (var i = 0; i < grid.length; i++) { if (grid[i]) { B.addItem(grid[i].id, grid[i].count, grid[i]); grid[i] = null; } }
  }
  function returnCursor() { if (B.cursor) { B.addItem(B.cursor.id, B.cursor.count, B.cursor); B.cursor = null; } }

  /* ---------- inventory / 2x2 ---------- */
  B.openInventory = function () {
    if (B.dead) return;
    B.openPanel('inventory', 'Inventory (E)', function (body, panel) {
      var sec = el('div', 'bcx-sec', body);
      var left = el('div', '', sec);
      var armorWrap = el('div', 'bcx-invbox', left);
      armorWrap.style.gridTemplateColumns = 'repeat(2,40px)';
      for (var a = 0; a < 4; a++) armorSlot(armorWrap, a);
      var craftWrap = el('div', 'bcx-invbox', left);
      craftWrap.style.gridTemplateColumns = 'repeat(2,40px)'; craftWrap.style.marginTop = '10px';
      for (var c = 0; c < 4; c++) {
        (function (idx) {
          B.slotEl(craftWrap, {
            get: function () { return B.craft2[idx]; },
            set: function (v) { B.craft2[idx] = v; B.markDirty(); },
            accepts: function () { return true; }
          });
        })(c);
      }
      var right = el('div', '', sec);
      var rows = el('div', '', right); rows.style.display = 'flex'; rows.style.alignItems = 'center'; rows.style.gap = '10px';
      var resWrap = el('div', 'bcx-invbox', rows); resWrap.style.gridTemplateColumns = '40px';
      var result = makeResult(resWrap, B.craft2, 2, false);
      el('div', 'bcx-arrow', rows, '\u2192');
      var tip = tipBox(right);
      var inv = el('div', '', body); inv.style.marginTop = '12px';
      playerInv(inv);
      setupPanel(body, function () {
        B.refreshSlotEls();
        updateResultEl(result, B.craft2, 2);
      });
      panel.onClose = function () { returnGrid(B.craft2); returnGrid(B.craft3); returnCursor(); };
    });
  };

  function makeResult(parent, grid, size, table) {
    var wrap = el('div', 'bcx-invbox', parent); wrap.style.gridTemplateColumns = '40px';
    var btn = el('button', 'bcx-slot', wrap);
    btn.innerHTML = '<img alt=""><span class="n"></span>';
    btn.className = 'bcx-slot';
    btn.addEventListener('mousedown', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var r = B.matchRecipe(grid, size); if (!r) return;
      var out = r.out;
      if (B.cursor && (!same(B.cursor, { id: out.id }) || B.cursor.count + out.count > B.maxStack(out.id))) return;
      var times = ev.shiftKey ? 64 : 1;
      for (var t = 0; t < times; t++) {
        var rr = B.matchRecipe(grid, size); if (!rr) break;
        if (!B.cursor) B.cursor = { id: rr.out.id, count: rr.out.count };
        else B.cursor.count += rr.out.count;
        consumeGrid(grid);
      }
      B.updateCursor(); B.refreshPanels && B.refreshPanels(); B.refreshHotbar();
    });
    btn.addEventListener('mouseenter', function () {
      var r = B.matchRecipe(grid, size); var tip = document.getElementById('bcx-tip');
      if (tip && r) tip.innerHTML = B.itemName(r.out.id) + (r.out.count > 1 ? ' x' + r.out.count : '');
    });
    return btn;
  }
  function updateResultEl(btn, grid, size) {
    var r = B.matchRecipe(grid, size);
    var img = btn.querySelector('img'), n = btn.querySelector('.n');
    if (r) { img.src = B.iconURL(r.out.id); img.style.visibility = 'visible'; n.textContent = r.out.count > 1 ? r.out.count : ''; }
    else { img.style.visibility = 'hidden'; n.textContent = ''; }
  }

  /* ---------- crafting table 3x3 ---------- */
  B.openCrafting = function () {
    B.openPanel('crafting', 'Crafting Table', function (body, panel) {
      var sec = el('div', 'bcx-sec', body);
      var left = el('div', '', sec);
      var gridWrap = el('div', 'bcx-invbox', left);
      gridWrap.style.gridTemplateColumns = 'repeat(3,40px)';
      for (var c = 0; c < 9; c++) {
        (function (idx) {
          B.slotEl(gridWrap, {
            get: function () { return B.craft3[idx]; },
            set: function (v) { B.craft3[idx] = v; B.markDirty(); },
            accepts: function () { return true; }
          });
        })(c);
      }
      var rows = el('div', '', left); rows.style.display = 'flex'; rows.style.alignItems = 'center'; rows.style.gap = '10px'; rows.style.marginTop = '8px';
      el('div', 'bcx-arrow', rows, '\u2192');
      var result = makeResult(rows, B.craft3, 3, true);
      var right = el('div', '', sec); tipBox(right);
      var inv = el('div', '', body); inv.style.marginTop = '12px'; playerInv(inv);
      setupPanel(body, function () { B.refreshSlotEls(); updateResultEl(result, B.craft3, 3); });
      panel.onClose = function () { returnGrid(B.craft2); returnGrid(B.craft3); returnCursor(); };
    });
  };

  /* ---------- smelting ---------- */
  B.smelt = {};
  function addSmelt(inp, out, xp) {
    if (inp === null || inp === undefined || out === null || out === undefined || out === -1) return;
    B.smelt[String(inp)] = { out: out, xp: xp || .1 };
  }
  addSmelt(B.NB('Iron Ore'), 'iron_ingot', .7);
  addSmelt(B.NB('Deepslate Iron Ore'), 'iron_ingot', .7);
  addSmelt('raw_iron', 'iron_ingot', .7);
  addSmelt(B.NB('Gold Ore'), 'gold_ingot', 1);
  addSmelt(B.NB('Deepslate Gold Ore'), 'gold_ingot', 1);
  addSmelt('raw_gold', 'gold_ingot', 1);
  addSmelt(B.NB('Copper Ore'), 'copper_ingot', .5);
  addSmelt('raw_copper', 'copper_ingot', .5);
  addSmelt(B.NB('Sand'), B.NB('Glass'), .1);
  addSmelt(B.NB('Cobblestone'), B.NB('Stone'), .1);
  addSmelt(B.NB('Clay Ball'), 'brick', .3);
  addSmelt('beef', 'cooked_beef', .35);
  addSmelt('porkchop', 'cooked_porkchop', .35);
  addSmelt('chicken', 'cooked_chicken', .35);
  addSmelt('mutton', 'cooked_mutton', .35);
  addSmelt(B.NB('Oak Log'), 'charcoal', .15);
  B.fuelValue = function (id) {
    var d = B.items[id];
    if (d && d.fuel) return d.fuel;
    if (typeof id === 'number') {
      var k = B.KB(id);
      if (/COAL_BLOCK/.test(k)) return 16000;
      if (/PLANKS/.test(k)) return 300;
      if (/LOG|WOOD/.test(k)) return 300;
      if (/SAPLING/.test(k)) return 100;
      if (/STICK/.test(k)) return 100;
    }
    return 0;
  };
  B.canSmelt = function (st) { return !!(st && B.smelt[String(st.id)]); };
  function furnaceKey(p) { return p.x + ',' + p.y + ',' + p.z; }
  B.getFurnace = function (x, y, z) {
    var k = x + ',' + y + ',' + z;
    if (!B.furnaces[k]) B.furnaces[k] = { in: null, fuel: null, out: null, burn: 0, burnMax: 0, cook: 0, cookMax: 200, xp: 0 };
    return B.furnaces[k];
  };
  B.tickFurnaces = function (dt) {
    var changed = false;
    for (var k in B.furnaces) {
      var f = B.furnaces[k]; if (!f) continue;
      var recipe = f.in ? B.smelt[String(f.in.id)] : null;
      var canOut = f.out === null || (recipe && same(f.out, { id: recipe.out }) && f.out.count < B.maxStack(recipe.out));
      if (recipe && canOut && f.burn <= 0 && f.fuel) {
        var fv = B.fuelValue(f.fuel.id);
        if (fv > 0) {
          f.burnMax = fv; f.burn = fv;
          f.fuel.count--; if (f.fuel.count <= 0) f.fuel = null;
          changed = true;
        }
      }
      if (f.burn > 0) { f.burn = Math.max(0, f.burn - dt * 20 * 3); changed = true; }
      if (recipe && canOut && f.burn > 0) {
        f.cook += dt * 20;
        if (f.cook >= f.cookMax) {
          f.cook = 0;
          if (f.out) f.out.count += recipe.out === f.out.id ? 1 : 0;
          else f.out = { id: recipe.out, count: 1 };
          f.xp = (f.xp || 0) + (B.smelt[String(f.in.id)].xp || 0);
          f.in.count--; if (f.in.count <= 0) f.in = null;
          changed = true;
        }
      } else f.cook = Math.max(0, f.cook - dt * 20);
    }
    if (changed) B.saveDirty = true;
  };
  B.registerTick(function (dt) {
    B.tickFurnaces(dt);
    B.furnaceRefreshT = (B.furnaceRefreshT || 0) + dt;
    if (B.furnaceRefreshT > .3) {
      B.furnaceRefreshT = 0;
      if (B.panel && B.panel.kind === 'furnace' && B.panel.refresh) B.panel.refresh();
    }
  });

  B.openFurnace = function (p) {
    var x = p.x, y = p.y, z = p.z, f = B.getFurnace(x, y, z);
    B.openPanel('furnace', 'Furnace', function (body, panel) {
      var sec = el('div', 'bcx-sec', body);
      var left = el('div', '', sec);
      var row = el('div', '', left); row.style.display = 'flex'; row.style.gap = '10px'; row.style.alignItems = 'center';
      function fslot(parent, get, set, accepts) {
        return B.slotEl(parent, { get: get, set: set, accepts: accepts || function () { return true; } });
      }
      var col = el('div', 'bcx-invbox', row); col.style.gridTemplateColumns = '40px';
      fslot(col, function () { return f.in; }, function (v) { f.in = v; B.markDirty(); },
        function (st) { return B.canSmelt(st); });
      var mid = el('div', '', row);
      mid.innerHTML = '<div style="font-size:10px;text-align:center">SMELT</div>';
      var flame = el('div', 'bcx-prog', mid); var fi = el('i', '', flame); fi.style.background = '#ff9b2e';
      var prog = el('div', 'bcx-prog', mid); var pi = el('i', '', prog);
      var col2 = el('div', 'bcx-invbox', row); col2.style.gridTemplateColumns = '40px';
      fslot(col2, function () { return f.fuel; }, function (v) { f.fuel = v; B.markDirty(); },
        function (st) { return B.fuelValue(st.id) > 0; });
      var col3 = el('div', 'bcx-invbox', row); col3.style.gridTemplateColumns = '40px';
      var outSlot = fslot(col3, function () { return f.out; }, function (v) {
        if (!v && f.out) { B.addXP(f.xp || 0); f.xp = 0; }
        f.out = v; B.markDirty();
      }, function () { return false; });
      var inv = el('div', '', body); inv.style.marginTop = '12px'; playerInv(inv);
      tipBox(body);
      var refresh = function () {
        B.refreshSlotEls();
        fi.style.width = clamp(f.burn / Math.max(1, f.burnMax) * 100, 0, 100) + '%';
        pi.style.width = clamp(f.cook / f.cookMax * 100, 0, 100) + '%';
      };
      setupPanel(body, refresh);
      panel.refresh = refresh;
      panel.onClose = function () { returnGrid(B.craft2); returnCursor(); };
    });
  };

  /* ---------- chests ---------- */
  B.getChest = function (x, y, z) {
    var k = x + ',' + y + ',' + z;
    if (!B.chests[k]) B.chests[k] = { items: new Array(27).fill(null), x: x, y: y, z: z };
    if (!Array.isArray(B.chests[k].items)) B.chests[k].items = new Array(27).fill(null);
    while (B.chests[k].items.length < 27) B.chests[k].items.push(null);
    return B.chests[k];
  };
  B.openChest = function (p) {
    var c = B.getChest(p.x, p.y, p.z);
    B.openPanel('chest', 'Chest', function (body, panel) {
      var sec = el('div', 'bcx-sec', body);
      var grid = el('div', 'bcx-invbox', sec); grid.style.gridTemplateColumns = 'repeat(9,40px)';
      for (var i = 0; i < 27; i++) {
        (function (idx) {
          B.slotEl(grid, {
            get: function () { return c.items[idx]; },
            set: function (v) { c.items[idx] = v; B.markDirty(); },
            accepts: function () { return true; }
          });
        })(i);
      }
      var inv = el('div', '', body); inv.style.marginTop = '12px'; playerInv(inv);
      tipBox(body);
      setupPanel(body, null);
      panel.onClose = function () { B.saveDirty = true; returnGrid(B.craft2); returnCursor(); };
    });
  };

  /* ---------- enchanting ---------- */
  var ENCH = {
    efficiency: { name: 'Efficiency', max: 4, apply: 'tool' },
    sharpness: { name: 'Sharpness', max: 4, apply: 'weapon' },
    unbreaking: { name: 'Unbreaking', max: 3, apply: 'any' },
    protection: { name: 'Protection', max: 3, apply: 'armor' },
    fortune: { name: 'Fortune', max: 2, apply: 'tool' }
  };
  B.enchDefs = ENCH;
  function offers(p, level) {
    var seed = (p.x * 73856093 ^ p.y * 19349663 ^ p.z * 83492791 ^ (level + 1) * 2654435761) >>> 0;
    function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var keys = Object.keys(ENCH), out = [];
    for (var i = 0; i < 3; i++) {
      var k = keys[Math.floor(rand() * keys.length)];
      out.push({ key: k, lvl: 1 + Math.floor(rand() * Math.min(3, ENCH[k].max)), cost: i + 1, lapis: i + 1 });
    }
    return out;
  }
  B.openEnchant = function (p) {
    var opts = offers(p, B.level);
    B.openPanel('enchant', 'Enchanting Table', function (body, panel) {
      var info = el('div', 'sub', body, 'Spend XP levels and lapis to enchant the item in your selected hotbar slot.');
      var sec = el('div', 'bcx-sec', body);
      var left = el('div', '', sec);
      var heldBox = el('div', 'bcx-invbox', left); heldBox.style.gridTemplateColumns = '40px';
      B.slotEl(heldBox, {
        get: function () { return B.inv[B.selected]; },
        set: function (v) { B.inv[B.selected] = v; B.markDirty(); },
        accepts: function () { return true; }
      });
      var status = el('div', '', left); status.style.cssText = 'margin-top:8px;font-size:11px;color:#333';
      var lap = B.countItem('lapis');
      status.textContent = 'Level ' + B.level + '  |  Lapis ' + lap;
      var right = el('div', '', sec); right.style.display = 'flex'; right.style.flexDirection = 'column'; right.style.gap = '6px';
      opts.forEach(function (o) {
        var btn = el('button', 'bcx-btn', right);
        btn.style.textAlign = 'left'; btn.style.minWidth = '300px';
        btn.innerHTML = '<b>' + ENCH[o.key].name + ' ' + B.roman(o.lvl) + '</b> &nbsp; <span style="opacity:.8">cost ' + o.cost + ' level' + (o.cost > 1 ? 's' : '') + ' + ' + o.lapis + ' lapis</span>';
        btn.onclick = function () {
          var st = B.inv[B.selected];
          var d = st && B.items[st.id];
          if (!st || !d || (d.type !== 'armor' && !d.type)) { B.toast('Select a tool, weapon, or armor piece'); return; }
          if (B.level < o.cost) { B.toast('Not enough XP levels'); return; }
          if (B.countItem('lapis') < o.lapis) { B.toast('Not enough lapis'); return; }
          B.takeItem('lapis', o.lapis);
          B.level -= o.cost;
          st.ench = st.ench || {};
          var cur = st.ench[o.key] || 0;
          if (cur >= ENCH[o.key].max) { B.toast('Already at max level'); return; }
          st.ench[o.key] = Math.min(ENCH[o.key].max, cur + o.lvl);
          B.markDirty(); B.refreshHUD(); B.refreshHotbar();
          status.textContent = 'Level ' + B.level + '  |  Lapis ' + B.countItem('lapis');
          B.toast('Enchanted with ' + ENCH[o.key].name + ' ' + B.roman(st.ench[o.key]));
        };
      });
      tipBox(body);
      setupPanel(body, null);
      panel.onClose = function () { returnGrid(B.craft2); returnCursor(); };
    });
  };

  /* protection enchant hook */
  var oldArmorPoints = B.armorPoints;
  B.armorPoints = function () {
    var r = oldArmorPoints();
    for (var i = 0; i < 4; i++) {
      var st = B.armor[i]; if (st && st.ench && st.ench.protection) r.armor += st.ench.protection * 2;
    }
    return r;
  };

  /* ---------- block interaction ---------- */
  B.onBlockUse = function (hi, e) {
    if (!hi) return false;
    try { if (B.app.keys.has('ShiftLeft')) return false; } catch (err) {}
    var id = hi.id;
    if (id === B.NB('Chest')) { B.openChest(hi); return true; }
    if (id === B.NB('Furnace') || (B.NB('Lit Furnace') >= 0 && id === B.NB('Lit Furnace'))) { B.openFurnace(hi); return true; }
    if (id === B.NB('Crafting Table')) { B.openCrafting(); return true; }
    if (id === B.NB('Enchanting Table')) { B.openEnchant(hi); return true; }
    return false;
  };

  /* expose a few helpers for mods/tests */
  B.craftOnce = function (grid, size) {
    var r = B.matchRecipe(grid, size); if (!r) return null;
    consumeGrid(grid);
    return { id: r.out.id, count: r.out.count };
  };
  B.addSmeltRecipe = addSmelt;

  /*__CRAFT_MORE__*/
})();
