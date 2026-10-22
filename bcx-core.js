/* BLOCKCRAFT SURVIVAL LAYER - core (custom code, not copied from Minecraft) */
(function () {
  'use strict';
  if (window.BCX) return;

  var B = window.BCX = {
    version: '2026-10-22-survival-3',
    ready: false,
    mods: [], ticks: [], uses: [], commands: {}, onWorld: [], onSave: [],
    drops: [], buildQ: [],
    panel: null, panelKind: null,
    toastEl: null, hud: {}, invEl: null, hotEl: null,
    dirty: false, saveTimer: 0, tickCount: 0,
    gm: 'survival',
    health: 20, maxHealth: 20, hunger: 20, saturation: 5, exhaustion: 0,
    air: 300, maxAir: 300, xp: 0, level: 0,
    selected: 0,
    inv: new Array(36).fill(null),
    armor: new Array(4).fill(null),
    craft2: new Array(4).fill(null),
    craft3: new Array(9).fill(null),
    chestOpen: null, furnaceOpen: null, chests: {}, furnaces: {},
    death: false, hurtT: 0, regenT: 0, starveT: 0, saveDirty: false,
    fallFrom: null, wasGround: true, stepT: 0, mining: null,
    files: {}, fileIcons: {}, iconCache: {},
    key2id: {}, id2block: {}, name2id: {}
  };

  var APP = null;
  var doc = document;
  function q(s, r) { return (r || doc).querySelector(s); }
  function el(tag, cls, parent, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function now() { return performance.now(); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function jget(k) { try { var s = lsGet(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function jset(k, v) { try { lsSet(k, JSON.stringify(v)); } catch (e) {} }
  function deep(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }
  function blockName(id) { var b = B.id2block[id]; return b ? b.name : 'Block'; }

  /* ---------- data-driven item registry ---------- */
  function def(id, name, o) {
    o = o || {};
    o.id = id; o.name = name; o.max = o.max || 64;
    B.items[id] = o;
    return o;
  }
  B.items = {};

  def('stick', 'Stick', { icon: 'stick', fuel: 100 });
  def('coal', 'Coal', { icon: 'coal', fuel: 1600 });
  def('charcoal', 'Charcoal', { icon: 'charcoal', fuel: 1600 });
  def('raw_iron', 'Raw Iron', { icon: 'raw_iron' });
  def('raw_gold', 'Raw Gold', { icon: 'raw_gold' });
  def('raw_copper', 'Raw Copper', { icon: 'raw_copper' });
  def('iron_ingot', 'Iron Ingot', { icon: 'ingot', color: '#d8d8d8' });
  def('gold_ingot', 'Gold Ingot', { icon: 'ingot', color: '#f6d34a' });
  def('copper_ingot', 'Copper Ingot', { icon: 'ingot', color: '#d8845a' });
  def('diamond', 'Diamond', { icon: 'gem', color: '#4fe7df' });
  def('emerald', 'Emerald', { icon: 'gem', color: '#2fd35b' });
  def('redstone', 'Redstone Dust', { icon: 'dust', color: '#e22a2a' });
  def('lapis', 'Lapis Lazuli', { icon: 'dust', color: '#245ad6' });
  def('flint', 'Flint', { icon: 'flint' });
  def('apple', 'Apple', { icon: 'apple', type: 'food', food: 4, sat: 2.4 });
  def('bread', 'Bread', { icon: 'bread', type: 'food', food: 5, sat: 3 });
  def('wheat', 'Wheat', { icon: 'wheat' });
  def('wheat_seeds', 'Wheat Seeds', { icon: 'seeds', plant: 'Wheat' });
  def('leather', 'Leather', { icon: 'leather' });
  def('beef', 'Raw Beef', { icon: 'meat', color: '#b74f4f', type: 'food', food: 3, sat: 1.8, cook: 'cooked_beef' });
  def('cooked_beef', 'Steak', { icon: 'meat', color: '#8a4a2c', type: 'food', food: 8, sat: 6.4 });
  def('porkchop', 'Raw Porkchop', { icon: 'meat', color: '#e08a8a', type: 'food', food: 3, sat: 1.8, cook: 'cooked_porkchop' });
  def('cooked_porkchop', 'Cooked Porkchop', { icon: 'meat', color: '#b96a42', type: 'food', food: 8, sat: 6.4 });
  def('chicken', 'Raw Chicken', { icon: 'meat', color: '#e6b8a0', type: 'food', food: 2, sat: 1.2, cook: 'cooked_chicken' });
  def('cooked_chicken', 'Cooked Chicken', { icon: 'meat', color: '#c98452', type: 'food', food: 6, sat: 4.8 });
  def('mutton', 'Raw Mutton', { icon: 'meat', color: '#c76666', type: 'food', food: 2, sat: 1.2, cook: 'cooked_mutton' });
  def('cooked_mutton', 'Cooked Mutton', { icon: 'meat', color: '#9b5436', type: 'food', food: 6, sat: 4.8 });
  def('rotten_flesh', 'Rotten Flesh', { icon: 'meat', color: '#7d6045', type: 'food', food: 2, sat: .8 });
  def('feather', 'Feather', { icon: 'feather' });
  def('bone', 'Bone', { icon: 'bone' });
  def('string', 'String', { icon: 'string' });
  def('gunpowder', 'Gunpowder', { icon: 'dust', color: '#777777' });
  def('arrow', 'Arrow', { icon: 'arrow' });
  def('bow', 'Bow', { icon: 'bow', type: 'bow', dur: 384, damage: 3 });
  def('flint_and_steel', 'Flint and Steel', { icon: 'flint_and_steel', type: 'tool', dur: 64, max: 1 });

  function tool(id, name, type, tier, dur, speed, dmg, mat) {
    def(id, name, { icon: type === 'sword' ? 'sword' : type, type: type, tier: tier, dur: dur, speed: speed, damage: dmg, mat: mat });
  }
  tool('wooden_pickaxe', 'Wooden Pickaxe', 'pickaxe', 1, 59, 2, 2, 'wood');
  tool('stone_pickaxe', 'Stone Pickaxe', 'pickaxe', 2, 131, 4, 3, 'stone');
  tool('iron_pickaxe', 'Iron Pickaxe', 'pickaxe', 3, 250, 6, 4, 'iron');
  tool('diamond_pickaxe', 'Diamond Pickaxe', 'pickaxe', 4, 1561, 8, 5, 'diamond');
  tool('wooden_axe', 'Wooden Axe', 'axe', 1, 59, 2, 3, 'wood');
  tool('stone_axe', 'Stone Axe', 'axe', 2, 131, 4, 4, 'stone');
  tool('iron_axe', 'Iron Axe', 'axe', 3, 250, 6, 5, 'iron');
  tool('diamond_axe', 'Diamond Axe', 'axe', 4, 1561, 8, 6, 'diamond');
  tool('wooden_shovel', 'Wooden Shovel', 'shovel', 1, 59, 2, 1, 'wood');
  tool('stone_shovel', 'Stone Shovel', 'shovel', 2, 131, 4, 2, 'stone');
  tool('iron_shovel', 'Iron Shovel', 'shovel', 3, 250, 6, 3, 'iron');
  tool('diamond_shovel', 'Diamond Shovel', 'shovel', 4, 1561, 8, 4, 'diamond');
  tool('wooden_sword', 'Wooden Sword', 'sword', 1, 59, 1, 4, 'wood');
  tool('stone_sword', 'Stone Sword', 'sword', 2, 131, 1, 5, 'stone');
  tool('iron_sword', 'Iron Sword', 'sword', 3, 250, 1, 6, 'iron');
  tool('diamond_sword', 'Diamond Sword', 'sword', 4, 1561, 1, 7, 'diamond');

  function armor(id, name, slot, defense, dur, mat) {
    def(id, name, { icon: 'armor_' + slot, type: 'armor', slot: slot, defense: defense, dur: dur, mat: mat });
  }
  armor('leather_helmet', 'Leather Cap', 'head', 1, 55, 'leather');
  armor('leather_chestplate', 'Leather Tunic', 'chest', 3, 80, 'leather');
  armor('leather_leggings', 'Leather Pants', 'legs', 2, 75, 'leather');
  armor('leather_boots', 'Leather Boots', 'feet', 1, 65, 'leather');
  armor('iron_helmet', 'Iron Helmet', 'head', 2, 165, 'iron');
  armor('iron_chestplate', 'Iron Chestplate', 'chest', 6, 240, 'iron');
  armor('iron_leggings', 'Iron Leggings', 'legs', 5, 225, 'iron');
  armor('iron_boots', 'Iron Boots', 'feet', 2, 195, 'iron');
  armor('diamond_helmet', 'Diamond Helmet', 'head', 3, 363, 'diamond');
  armor('diamond_chestplate', 'Diamond Chestplate', 'chest', 8, 528, 'diamond');
  armor('diamond_leggings', 'Diamond Leggings', 'legs', 6, 495, 'diamond');
  armor('diamond_boots', 'Diamond Boots', 'feet', 3, 429, 'diamond');

  B.toolMat = { wood: '#a9783f', stone: '#8d8d8d', iron: '#e0e0e0', diamond: '#4fe7df', leather: '#b97843' };

  /* ---------- inventory ---------- */
  B.stack = function (id, count, extra) {
    var st = { id: id, count: count || 1 };
    if (extra) for (var k in extra) st[k] = extra[k];
    return st;
  };
  B.maxStack = function (id) {
    var d = B.items[id];
    return d ? (d.max || 64) : 64;
  };
  B.same = function (a, b) {
    if (!a || !b) return false;
    if (String(a.id) !== String(b.id)) return false;
    return JSON.stringify(a.ench || {}) === JSON.stringify(b.ench || {});
  };
  B.itemName = function (id) {
    if (typeof id === 'number') return blockName(id);
    var d = B.items[id]; return d ? d.name : String(id);
  };
  B.held = function () { return B.inv[B.selected] || null; };
  B.markDirty = function () { B.dirty = true; B.saveDirty = true; };
  B.addItem = function (id, count, extra) {
    count = count || 1;
    var max = B.maxStack(id), left = count, i, st;
    for (i = 0; i < 36 && left > 0; i++) {
      st = B.inv[i];
      if (st && B.same(st, { id: id, ench: extra && extra.ench }) && st.count < max) {
        var add = Math.min(max - st.count, left); st.count += add; left -= add;
      }
    }
    for (i = 0; i < 36 && left > 0; i++) {
      if (!B.inv[i]) {
        var n = Math.min(max, left);
        B.inv[i] = B.stack(id, n, extra); left -= n;
      }
    }
    if (count !== left) { B.markDirty(); B.refreshHotbar && B.refreshHotbar(); B.refreshPanels && B.refreshPanels(); }
    return left;
  };
  B.countItem = function (id) {
    var n = 0;
    for (var i = 0; i < 36; i++) if (B.inv[i] && String(B.inv[i].id) === String(id)) n += B.inv[i].count;
    return n;
  };
  B.takeItem = function (id, count) {
    count = count || 1;
    if (B.countItem(id) < count) return false;
    for (var i = 0; i < 36 && count > 0; i++) {
      var st = B.inv[i];
      if (st && String(st.id) === String(id)) {
        var n = Math.min(st.count, count); st.count -= n; count -= n;
        if (st.count <= 0) B.inv[i] = null;
      }
    }
    B.markDirty(); B.refreshHotbar && B.refreshHotbar();
    return true;
  };
  B.consumeSlot = function (i, n) {
    var st = B.inv[i]; if (!st) return false;
    st.count -= (n || 1);
    if (st.count <= 0) B.inv[i] = null;
    B.markDirty(); B.refreshHotbar && B.refreshHotbar(); B.refreshPanels && B.refreshPanels();
    return true;
  };
  B.give = function (id, n) {
    var leftover = B.addItem(id, n || 1);
    if (leftover) B.toast && B.toast('Inventory full (' + leftover + ' left)');
    return !leftover;
  };
  B.equipArmor = function (st) {
    var d = B.items[st.id]; if (!d || d.type !== 'armor') return false;
    var idx = { head: 0, chest: 1, legs: 2, feet: 3 }[d.slot];
    if (idx === undefined) return false;
    var old = B.armor[idx]; B.armor[idx] = st;
    if (old) B.addItem(old.id, 1, old);
    B.markDirty(); if (B.refreshPanels) B.refreshPanels();
    return true;
  };
  B.armorPoints = function () {
    var n = 0, tough = 0;
    for (var i = 0; i < 4; i++) {
      var st = B.armor[i]; if (!st) continue;
      var d = B.items[st.id]; if (d) { n += d.defense || 0; if (d.mat === 'diamond') tough += 2; }
    }
    return { armor: n, tough: tough };
  };
  B.damageArmor = function (amount) {
    var used = false;
    for (var i = 0; i < 4; i++) {
      var st = B.armor[i]; if (!st) continue;
      var d = B.items[st.id]; if (!d || !d.dur) continue;
      var unbr = (st.ench && st.ench.unbreaking) || 0;
      if (unbr > 0 && Math.random() < unbr / (unbr + 1)) continue;
      st.dur = (st.dur === undefined ? d.dur : st.dur) - Math.max(1, Math.round(amount / 4));
      if (st.dur <= 0) { B.armor[i] = null; B.toast && B.toast(d.name + ' broke'); }
      used = true;
    }
    if (used) B.markDirty();
  };

  /* ---------- block lookup ---------- */
  B.NB = function (name) {
    if (name === undefined || name === null) return -1;
    if (typeof name === 'number') return name;
    var s = String(name);
    if (B.name2id[s] !== undefined) return B.name2id[s];
    var up = s.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    if (B.key2id[up] !== undefined) return B.key2id[up];
    var low = s.toLowerCase(), i;
    for (i = 0; i < window.__BLOCKS.length; i++) {
      if (String(window.__BLOCKS[i].name).toLowerCase() === low) return window.__BLOCKS[i].id;
    }
    for (i = 0; i < window.__BLOCKS.length; i++) {
      if (String(window.__BLOCKS[i].name).toLowerCase().indexOf(low) >= 0) return window.__BLOCKS[i].id;
    }
    return -1;
  };
  B.KB = function (id) { var b = B.id2block[id]; return b ? b.key : ''; };
  B.blockByName = function (name) { return window.__BLOCKS[B.NB(name)] || null; };

  B.toast = function (msg, ms) {
    if (!B.toastEl) {
      B.toastEl = el('div', 'bcx-toast', doc.body);
    }
    B.toastEl.textContent = msg;
    B.toastEl.classList.add('on');
    clearTimeout(B.toastT);
    B.toastT = setTimeout(function () { B.toastEl.classList.remove('on'); }, ms || 2200);
  };

  /* ---------- icon art (real block atlas; small original item symbols) ---------- */
  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function itemArt(id, g, d) {
    var mat = B.toolMat[d.mat] || d.color || '#c8c8c8';
    if (d.icon === 'stick') { px(g, 7, 3, 2, 10, '#7b5430'); px(g, 9, 4, 1, 8, '#9a6c3f'); return; }
    if (d.icon === 'coal' || d.icon === 'charcoal') { var c = d.icon === 'coal' ? '#262626' : '#3b332b'; px(g, 4, 5, 8, 7, c); px(g, 3, 7, 10, 4, c); px(g, 5, 4, 3, 2, '#555'); return; }
    if (d.icon === 'raw_iron') { px(g, 4, 5, 8, 6, '#b9a58d'); px(g, 6, 3, 5, 3, '#cdb99f'); return; }
    if (d.icon === 'raw_gold') { px(g, 4, 5, 8, 6, '#d9b24b'); px(g, 6, 3, 5, 3, '#f0d06a'); return; }
    if (d.icon === 'raw_copper') { px(g, 4, 5, 8, 6, '#b96c4a'); px(g, 6, 3, 5, 3, '#d1835c'); return; }
    if (d.icon === 'ingot') { px(g, 3, 6, 10, 5, mat); px(g, 5, 5, 7, 2, mat); px(g, 4, 8, 8, 2, 'rgba(255,255,255,.35)'); return; }
    if (d.icon === 'gem') { px(g, 6, 3, 4, 2, mat); px(g, 4, 5, 8, 4, mat); px(g, 6, 9, 4, 2, mat); px(g, 6, 5, 3, 2, 'rgba(255,255,255,.55)'); return; }
    if (d.icon === 'dust') { for (var i = 0; i < 9; i++) px(g, 3 + (i * 5) % 10, 4 + (i * 7) % 9, 2, 2, mat); return; }
    if (d.icon === 'flint') { px(g, 4, 6, 4, 6, '#4a4a52'); px(g, 8, 4, 4, 5, '#62626c'); return; }
    if (d.icon === 'apple') { px(g, 4, 5, 8, 8, '#d93a3a'); px(g, 5, 4, 6, 2, '#e65a5a'); px(g, 8, 2, 2, 4, '#5a3a1d'); px(g, 9, 3, 3, 2, '#3a8a3a'); return; }
    if (d.icon === 'bread') { px(g, 3, 6, 10, 6, '#c88b43'); px(g, 4, 5, 8, 2, '#dca75c'); px(g, 5, 8, 2, 1, '#8f5a25'); return; }
    if (d.icon === 'wheat') { for (var w = 0; w < 3; w++) { px(g, 4 + w * 4, 3, 1, 11, '#d6a83f'); px(g, 3 + w * 4, 5, 3, 1, '#f0c65a'); px(g, 3 + w * 4, 7, 3, 1, '#f0c65a'); } return; }
    if (d.icon === 'seeds') { for (var s = 0; s < 7; s++) px(g, 3 + (s * 5) % 10, 4 + (s * 3) % 9, 2, 2, '#6f9a3a'); return; }
    if (d.icon === 'leather') { px(g, 3, 4, 10, 9, '#a86f3e'); px(g, 4, 3, 8, 2, '#c08850'); return; }
    if (d.icon === 'meat') { px(g, 4, 4, 8, 7, d.color || '#b74f4f'); px(g, 6, 6, 4, 2, 'rgba(255,255,255,.25)'); px(g, 10, 8, 3, 2, '#e8d8c0'); return; }
    if (d.icon === 'feather') { px(g, 8, 3, 2, 8, '#e8e8e8'); px(g, 6, 5, 2, 5, '#cfcfcf'); return; }
    if (d.icon === 'bone') { px(g, 4, 4, 2, 2, '#e8e8d8'); px(g, 10, 10, 2, 2, '#e8e8d8'); px(g, 6, 6, 6, 6, '#dedecc'); px(g, 4, 10, 2, 2, '#e8e8d8'); px(g, 10, 4, 2, 2, '#e8e8d8'); return; }
    if (d.icon === 'string') { px(g, 4, 3, 1, 6, '#eee'); px(g, 5, 8, 3, 1, '#eee'); px(g, 8, 4, 1, 7, '#eee'); return; }
    if (d.icon === 'arrow') { px(g, 8, 5, 6, 2, '#d8d8d8'); px(g, 11, 3, 3, 6, '#eee'); px(g, 4, 4, 2, 7, '#c8c8c8'); px(g, 6, 8, 3, 2, '#ccc'); return; }
    if (d.icon === 'bow') { g.strokeStyle = '#8a5a2a'; g.lineWidth = 2; g.beginPath(); g.arc(8, 8, 6, -1.1, 1.1); g.stroke(); px(g, 4, 2, 1, 12, '#ddd'); return; }
    if (d.icon === 'pickaxe' || d.icon === 'axe' || d.icon === 'shovel' || d.icon === 'sword') {
      px(g, 7, 5, 2, 9, '#7b5430'); px(g, 6, 4, 4, 1, '#9a6c3f');
      if (d.icon === 'pickaxe') { px(g, 3, 3, 10, 2, mat); px(g, 2, 5, 2, 2, mat); px(g, 12, 5, 2, 2, mat); }
      if (d.icon === 'axe') { px(g, 8, 2, 5, 3, mat); px(g, 10, 4, 3, 3, mat); }
      if (d.icon === 'shovel') { px(g, 6, 2, 4, 4, mat); px(g, 7, 1, 2, 1, mat); }
      if (d.icon === 'sword') { px(g, 8, 1, 2, 8, mat); px(g, 7, 8, 4, 2, '#6a4a2a'); px(g, 9, 10, 2, 3, '#5a3a1a'); }
      return;
    }
    if (d.icon === 'armor_head') { px(g, 4, 3, 8, 7, mat); px(g, 5, 9, 6, 3, mat); px(g, 5, 5, 2, 2, '#222'); px(g, 9, 5, 2, 2, '#222'); return; }
    if (d.icon === 'armor_chest') { px(g, 3, 4, 10, 8, mat); px(g, 2, 5, 2, 4, mat); px(g, 12, 5, 2, 4, mat); px(g, 6, 3, 4, 1, mat); return; }
    if (d.icon === 'armor_legs') { px(g, 4, 3, 8, 5, mat); px(g, 4, 8, 3, 5, mat); px(g, 9, 8, 3, 5, mat); return; }
    if (d.icon === 'armor_feet') { px(g, 3, 8, 4, 5, mat); px(g, 9, 8, 4, 5, mat); px(g, 6, 6, 4, 2, mat); return; }
    px(g, 5, 5, 6, 6, '#8a8a8a'); px(g, 6, 6, 4, 4, '#b0b0b0');
  }

  B.tileCanvas = function (idx, shade, tint) {
    var c = doc.createElement('canvas'); c.width = c.height = 16;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    var at = window.__atlas;
    if (at && idx !== undefined) {
      var tx = (idx % at.grid) * 16, ty = Math.floor(idx / at.grid) * 16;
      g.drawImage(at.canvas, tx, ty, 16, 16, 0, 0, 16, 16);
    } else { px(g, 0, 0, 16, 16, '#777'); }
    if (shade) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(0,0,0,' + shade + ')'; g.fillRect(0, 0, 16, 16); }
    if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.globalAlpha = .45; g.fillRect(0, 0, 16, 16); }
    return c;
  };
  B.iconCanvas = function (id) {
    var key = String(id), c = B.iconCache[key];
    if (c) return c;
    c = doc.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    if (typeof id === 'number') {
      var b = B.id2block[id];
      if (!b) { px(g, 8, 8, 48, 48, '#888'); return c; }
      var t = b.t || [0, 0, 0];
      var top = t.length > 3 ? t[3] : (t[2] !== undefined ? t[2] : t[0]);
      var side = t[2] !== undefined ? t[2] : t[0];
      var bot = t[1] !== undefined ? t[1] : side;
      var topC = B.tileCanvas(top, 0), sideC = B.tileCanvas(side, .18), botC = B.tileCanvas(bot, .3);
      if (b.cutout && !b.t) { /* plants */ }
      g.setTransform(28 / 16, 14 / 16, -28 / 16, 14 / 16, 32, 5);
      g.drawImage(topC, 0, 0, 16, 16, 0, 0, 16, 16);
      g.setTransform(28 / 16, 14 / 16, 0, 30 / 16, 4, 19);
      g.drawImage(sideC, 0, 0, 16, 16, 0, 0, 16, 16);
      g.setTransform(28 / 16, -14 / 16, 0, 30 / 16, 32, 33);
      g.drawImage(sideC, 0, 0, 16, 16, 0, 0, 16, 16);
      g.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      var d = B.items[id] || {};
      if (B.fileIcons[id]) {
        g.drawImage(B.fileIcons[id], 0, 0, 64, 64);
      } else {
        var tmp = doc.createElement('canvas'); tmp.width = tmp.height = 16;
        itemArt(id, tmp.getContext('2d'), d);
        g.drawImage(tmp, 0, 0, 64, 64);
      }
    }
    B.iconCache[key] = c;
    return c;
  };
  B.iconURL = function (id) { try { return B.iconCanvas(id).toDataURL(); } catch (e) { return ''; } };
  B.loadFileIcons = function (map) {
    Object.keys(map || {}).forEach(function (id) {
      var im = new Image();
      im.onload = function () { B.fileIcons[id] = im; B.iconCache = {}; if (B.refreshHotbar) B.refreshHotbar(); if (B.refreshPanels) B.refreshPanels(); };
      im.src = map[id];
    });
  };

  /* ---------- world/player access ---------- */
  B.px = function () { return APP && APP.player ? APP.player.pos : { x: 0, y: 0, z: 0 }; };
  B.camera = function () { return APP ? APP.camera : null; };
  B.world = function () { return APP ? APP.world : null; };
  B.setBlock = function (x, y, z, id) {
    id = Math.floor(id);
    if (!isFinite(id) || id < 0 || id >= window.__BLOCKS.length || !B.id2block[id]) return;
    if (APP && APP.setBlock) APP.setBlock(Math.floor(x), Math.floor(y), Math.floor(z), id, true);
  };
  B.getBlock = function (x, y, z) { return APP && APP.world ? APP.world.get(Math.floor(x), Math.floor(y), Math.floor(z)) : 0; };
  B.topY = function (x, z) { return APP && APP.world ? APP.world.topY(Math.floor(x), Math.floor(z)) : 64; };
  B.solid = function (x, y, z) { return APP && APP.solidAt ? APP.solidAt(Math.floor(x), Math.floor(y), Math.floor(z)) : false; };
  B.play = function (snd, vol, pitch) { try { APP.sound.play(snd || 'stone', vol || .25, pitch || .1); } catch (e) {} };
  B.burst = function (x, y, z, id, n) { try { APP.burst(x, y, z, id || B.NB('Stone'), n || 8); } catch (e) {} };
  B.spawnParticles = function (x, y, z, id) { try { APP.burst(Math.floor(x), Math.floor(y), Math.floor(z), id, 10); } catch (e) {} };

  /* ---------- HUD + hotbar ---------- */
  B.injectCSS = function () {
    if (q('#bcx-style')) return;
    var st = el('style', '', doc.head); st.id = 'bcx-style';
    st.textContent = [
      'body.bcx-on .hotbar:not(.bcx-hotbar),body.bcx-on .hotbar-wrap,body.bcx-on .item-name,body.bcx-on #hint{display:none!important}',
      '#bcx-hud{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);width:420px;z-index:30;pointer-events:none;font-family:Monocraft,monospace;color:#fff;text-shadow:2px 2px 0 #222}',
      '#bcx-hud canvas{image-rendering:pixelated}',
      '.bcx-statusrow{display:flex;justify-content:space-between;align-items:flex-end;height:12px;margin-bottom:2px}',
      '.bcx-armorbar,.bcx-airbar{width:180px;height:12px;image-rendering:pixelated}',
      '.bcx-airbar{margin-left:auto}',
      '.bcx-topline{display:flex;justify-content:space-between;align-items:flex-end;height:24px;margin-bottom:3px}',
      '.bcx-hearts,.bcx-hunger{width:200px;height:20px}',
      '.bcx-hunger{transform:scaleX(-1)}',
      '.bcx-xpwrap{position:relative;height:19px;margin:0 4px 2px}',
      '.bcx-xp{position:absolute;left:0;right:0;bottom:0;height:6px;background:#1c1c1c;border:2px solid #0b0b0b;box-shadow:0 0 0 1px rgba(255,255,255,.15)}',
      '.bcx-xp>i{display:block;height:100%;background:linear-gradient(#a6ff5a,#49b51b);width:0}',
      '.bcx-level{position:absolute;left:50%;top:-7px;transform:translateX(-50%);color:#9bff4a;font-size:14px}',
      '.bcx-hotbar{display:flex;gap:2px;justify-content:center;pointer-events:auto;background:rgba(12,12,12,.72);padding:3px;border:2px solid #2a2a2a;border-radius:2px;width:max-content;margin:0 auto}',
      '.bcx-slot{position:relative;width:40px;height:40px;background:rgba(52,52,52,.85);border:2px solid #1a1a1a;box-sizing:border-box;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}',
      '.bcx-slot:hover{border-color:#8d8d8d}.bcx-slot.sel{border-color:#fff;box-shadow:0 0 0 2px #000 inset,0 0 0 1px #fff}',
      '.bcx-slot img{width:32px;height:32px;image-rendering:pixelated;pointer-events:none}',
      '.bcx-slot .n{position:absolute;right:1px;bottom:-1px;font-size:12px;color:#fff;text-shadow:2px 2px 0 #000;pointer-events:none}',
      '.bcx-slot .dur{position:absolute;left:3px;right:3px;bottom:2px;height:3px;background:#111;pointer-events:none}.bcx-slot .dur>i{display:block;height:100%;background:#6dff3a}',
      '.bcx-slot .en{position:absolute;left:1px;top:0;font-size:9px;color:#b78aff;text-shadow:1px 1px 0 #000;pointer-events:none}',
      '.bcx-toast{position:fixed;left:50%;bottom:130px;transform:translateX(-50%) translateY(8px);background:rgba(10,10,10,.88);border:2px solid #555;padding:7px 16px;color:#fff;font-family:Monocraft,monospace;font-size:13px;z-index:70;opacity:0;transition:.15s;pointer-events:none;max-width:70vw;text-align:center}',
      '.bcx-toast.on{opacity:1;transform:translateX(-50%) translateY(0)}',
      '#bcx-hurt{position:fixed;inset:0;background:radial-gradient(circle,transparent 35%,rgba(180,0,0,.55));opacity:0;pointer-events:none;z-index:25;transition:opacity .12s}',
      '#bcx-hurt.on{opacity:1}',
      '#bcx-weather{position:fixed;inset:0;background:rgba(55,70,90,.16);pointer-events:none;z-index:20;display:none}',
      '#bcx-weather.on{display:block}',
      '.bcx-panelwrap{position:fixed;inset:0;background:rgba(5,5,5,.55);z-index:60;display:flex;align-items:center;justify-content:center;font-family:Monocraft,monospace;color:#fff}',
      '.bcx-panel{background:#c6c6c6;border:4px solid #111;box-shadow:inset -4px -4px 0 #555,inset 4px 4px 0 #fff,0 8px 40px #000;color:#222;padding:14px 16px 16px;max-width:96vw;max-height:92vh;overflow:auto}',
      '.bcx-panel h2{margin:0 0 10px;font-size:15px;color:#3a3a3a;text-shadow:1px 1px 0 #fff;letter-spacing:.5px}',
      '.bcx-panel .sub{font-size:11px;color:#444;margin:-6px 0 10px}',
      '.bcx-grid{display:grid;gap:3px}.bcx-sec{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}',
      '.bcx-invbox{background:#8b8b8b;border:3px solid #373737;box-shadow:inset 2px 2px 0 #565656,inset -2px -2px 0 #bdbdbd;padding:7px;display:grid;gap:2px}',
      '.bcx-panel .bcx-slot{background:#8b8b8b;border-color:#373737;box-shadow:inset 2px 2px 0 #565656,inset -2px -2px 0 #bdbdbd}',
      '.bcx-panel .bcx-slot:hover{border-color:#fff}',
      '.bcx-panel .bcx-slot.sel{border-color:#fff;box-shadow:0 0 0 2px #49b51b inset}',
      '.bcx-btn{background:#7d7d7d;border:3px solid #222;box-shadow:inset 2px 2px 0 #bdbdbd,inset -2px -2px 0 #4c4c4c;color:#fff;text-shadow:2px 2px 0 #222;font-family:Monocraft,monospace;font-size:12px;padding:7px 13px;cursor:pointer}',
      '.bcx-btn:hover{background:#8d9d7d}.bcx-btn:active{box-shadow:inset -2px -2px 0 #bdbdbd,inset 2px 2px 0 #4c4c4c}',
      '.bcx-close{position:absolute;right:12px;top:8px;background:none;border:0;color:#333;font-size:20px;cursor:pointer;font-family:monospace}',
      '.bcx-tip{min-height:70px;background:rgba(255,255,255,.45);border:1px solid #777;padding:6px;font-size:11px;color:#222;line-height:1.45;max-width:210px}',
      '.bcx-cursor{position:fixed;width:34px;height:34px;pointer-events:none;z-index:80;transform:translate(-50%,-50%);display:none}',
      '.bcx-cursor img{width:34px;height:34px;image-rendering:pixelated;filter:drop-shadow(2px 2px 0 #000)}',
      '.bcx-arrow{font-size:22px;color:#555;align-self:center}',
      '.bcx-prog{width:70px;height:12px;border:2px solid #333;background:#555;position:relative}.bcx-prog>i{display:block;height:100%;background:#e8a33a;width:0}',
      '.bcx-death{position:fixed;inset:0;background:rgba(90,0,0,.55);z-index:90;display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:Monocraft,monospace;color:#fff;text-shadow:3px 3px 0 #300}',
      '.bcx-death h1{font-size:34px;margin:0 0 18px}.bcx-death p{margin:0 0 20px;color:#ffb0b0}',
      '@media(max-width:560px){#bcx-hud{transform:translateX(-50%) scale(.82);bottom:2px}.bcx-panel{transform:scale(.82)}}'
    ].join('');
    var hurt = el('div', '', doc.body); hurt.id = 'bcx-hurt';
    var weather = el('div', '', doc.body); weather.id = 'bcx-weather';
    B.hurtEl = hurt; B.weatherEl = weather;
    var cur = el('div', 'bcx-cursor', doc.body); cur.innerHTML = '<img alt="">';
    B.cursorEl = cur;
  };

  function drawHeart(g, x, y, fill) {
    var rows = ['0110110', '1111111', '1111111', '1111111', '0111110', '0011100', '0001000'];
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < 7; c++) {
      if (rows[r][c] === '1') px(g, x + c * 2, y + r * 2, 2, 2, fill);
    }
  }
  function drawFood(g, x, y, fill) {
    var rows = ['0011000', '0111100', '1111110', '1111100', '0111000', '0010000'];
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < 7; c++) {
      if (rows[r][c] === '1') px(g, x + c * 2, y + r * 2, 2, 2, fill);
    }
  }
  function drawShield(g, x, y, fill) {
    var rows = ['1111111', '1111111', '1111111', '0111110', '0011100', '0001000'];
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < 7; c++) {
      if (rows[r][c] === '1') px(g, x + c * 2, y + r * 2, 2, 2, fill);
    }
  }
  function drawBubble(g, x, y, fill) {
    var rows = ['01110', '11111', '11111', '01110'];
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < 5; c++) {
      if (rows[r][c] === '1') px(g, x + c * 2, y + r * 2, 2, 2, fill);
    }
  }
  B.buildHUD = function () {
    if (q('#bcx-hud')) return;
    B.injectCSS();
    doc.body.classList.add('bcx-on');
    var hud = el('div', '', doc.body); hud.id = 'bcx-hud';
    var status = el('div', 'bcx-statusrow', hud);
    var armor = el('canvas', 'bcx-armorbar', status); armor.width = 180; armor.height = 12;
    var air = el('canvas', 'bcx-airbar', status); air.width = 180; air.height = 12;
    B.hud.status = status; B.hud.armor = armor; B.hud.air = air;
    var top = el('div', 'bcx-topline', hud);
    var hc = el('canvas', 'bcx-hearts', top); hc.width = 200; hc.height = 20;
    var uc = el('canvas', 'bcx-hunger', top); uc.width = 200; uc.height = 20;
    B.hud.hearts = hc; B.hud.hunger = uc;
    var xp = el('div', 'bcx-xpwrap', hud);
    var xpb = el('div', 'bcx-xp', xp); var xpi = el('i', '', xpb); B.hud.xp = xpi;
    var lvl = el('div', 'bcx-level', xp, ''); B.hud.level = lvl;
    var hot = el('div', 'bcx-hotbar', hud); B.hotEl = hot;
    B.hotSlots = [];
    for (var i = 0; i < 9; i++) {
      var b = el('button', 'bcx-slot', hot);
      b.title = 'Hotbar ' + (i + 1);
      b.dataset.i = i;
      b.innerHTML = '<img alt=""><span class="n"></span><span class="dur"><i></i></span><span class="en"></span>';
      (function (idx) { b.addEventListener('mousedown', function (ev) { ev.preventDefault(); B.select(idx); }); })(i);
      B.hotSlots.push(b);
    }
    B.refreshHUD();
    B.refreshHotbar();
  };

  B.refreshHUD = function () {
    if (!B.hud.hearts) return;
    var g1 = B.hud.hearts.getContext('2d'); g1.clearRect(0, 0, 200, 20);
    for (var i = 0; i < 10; i++) {
      var x = i * 19 + 2, y = 2;
      drawHeart(g1, x, y, '#3a1616');
      var hp = B.health - i * 2;
      if (hp >= 2) drawHeart(g1, x, y, '#e33b3b');
      else if (hp > 0) { g1.save(); g1.beginPath(); g1.rect(x, y, 7, 14); g1.clip(); drawHeart(g1, x, y, '#e33b3b'); g1.restore(); }
    }
    var g2 = B.hud.hunger.getContext('2d'); g2.clearRect(0, 0, 200, 20);
    for (var j = 0; j < 10; j++) {
      var hx = j * 19 + 2, hy = 2;
      drawFood(g2, hx, hy, '#3a2a16');
      var hn = B.hunger - j * 2;
      if (hn >= 2) drawFood(g2, hx, hy, '#e8a33a');
      else if (hn > 0) { g2.save(); g2.beginPath(); g2.rect(hx, hy, 7, 12); g2.clip(); drawFood(g2, hx, hy, '#e8a33a'); g2.restore(); }
    }
    var ar = B.armorPoints();
    var ga = B.hud.armor.getContext('2d'); ga.clearRect(0, 0, 180, 12);
    if (ar.armor > 0) {
      B.hud.armor.style.display = 'block';
      for (var ai = 0; ai < 10; ai++) {
        var ax = ai * 18 + 2, av = ar.armor - ai * 2;
        drawShield(ga, ax, 0, '#2b3548');
        if (av >= 2) drawShield(ga, ax, 0, '#dbe6ff');
        else if (av > 0) { ga.save(); ga.beginPath(); ga.rect(ax, 0, 7, 12); ga.clip(); drawShield(ga, ax, 0, '#dbe6ff'); ga.restore(); }
      }
    } else B.hud.armor.style.display = 'none';
    var gu = B.hud.air.getContext('2d'); gu.clearRect(0, 0, 180, 12);
    if (B.air < B.maxAir) {
      B.hud.air.style.display = 'block';
      var bubbles = B.air / 30;
      for (var bi = 0; bi < 10; bi++) {
        var bx = bi * 18 + 10, bv = bubbles - bi;
        drawBubble(gu, bx, 1, '#243746');
        if (bv >= 1) drawBubble(gu, bx, 1, '#8ce8ff');
        else if (bv > 0) { gu.save(); gu.beginPath(); gu.rect(bx, 1, 10 * bv, 10); gu.clip(); drawBubble(gu, bx, 1, '#8ce8ff'); gu.restore(); }
      }
    } else B.hud.air.style.display = 'none';
    B.hud.status.style.display = (ar.armor > 0 || B.air < B.maxAir) ? 'flex' : 'none';
    var need = B.xpNeed(B.level);
    B.hud.xp.style.width = (need ? clamp(B.xpInLevel / need * 100, 0, 100) : 0) + '%';
    B.hud.level.textContent = B.level > 0 ? String(B.level) : '';
  };

  B.refreshHotbar = function () {
    if (!B.hotSlots) return;
    for (var i = 0; i < 9; i++) {
      var st = B.inv[i], s = B.hotSlots[i];
      var img = s.querySelector('img'), n = s.querySelector('.n'), dur = s.querySelector('.dur'), di = s.querySelector('.dur>i'), en = s.querySelector('.en');
      if (st) {
        img.src = B.iconURL(st.id); img.style.visibility = 'visible';
        n.textContent = st.count > 1 ? st.count : '';
        var d = B.items[st.id];
        if (d && d.dur && st.dur !== undefined) {
          dur.style.display = 'block';
          di.style.width = clamp(st.dur / d.dur * 100, 0, 100) + '%';
          di.style.background = st.dur / d.dur > .5 ? '#6dff3a' : st.dur / d.dur > .2 ? '#ffd23a' : '#ff3a3a';
        } else dur.style.display = 'none';
        var ench = st.ench ? Object.keys(st.ench).length : 0;
        en.textContent = ench ? '+' : '';
      } else {
        img.removeAttribute('src'); img.style.visibility = 'hidden'; n.textContent = ''; dur.style.display = 'none'; en.textContent = '';
      }
      s.classList.toggle('sel', i === B.selected);
    }
  };

  B.select = function (i) {
    B.selected = i;
    if (!APP) return;
    var st = B.inv[i];
    APP.hotbar[i] = (st && typeof st.id === 'number') ? st.id : 0;
    APP.slot = i;
    try { APP.setHand(); APP.emitHotbar(true); } catch (e) {}
    B.refreshHotbar();
    B.saveDirty = true;
  };

  B.syncEngineHotbar = function () {
    if (!APP) return;
    for (var i = 0; i < 9; i++) {
      var st = B.inv[i];
      APP.hotbar[i] = (st && typeof st.id === 'number') ? st.id : 0;
    }
    B.select(B.selected);
  };

  /* ---------- panels ---------- */
  B.openPanel = function (kind, title, build, onClose) {
    B.closePanel(true);
    B.injectCSS();
    var wrap = el('div', 'bcx-panelwrap', doc.body);
    var p = el('div', 'bcx-panel', wrap);
    p.style.position = 'relative';
    var h = el('h2', '', p, title);
    var close = el('button', 'bcx-close', p, '\u00d7');
    close.onclick = function () { B.closePanel(); };
    var body = el('div', '', p);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) B.closePanel(); });
    B.panel = { wrap: wrap, panel: p, body: body, kind: kind, title: title, onClose: onClose };
    B.panelKind = kind;
    B._slotEls = [];
    if (build) build(body, p);
    try { APP.unlock(); } catch (e) {}
    B.uiOpen = true;
    B.refreshPanels = function () { if (B.panel && B.panel.refresh) B.panel.refresh(); };
    return B.panel;
  };
  B.closePanel = function (silent) {
    if (B.panel) {
      var p = B.panel; B.panel = null; B.panelKind = null;
      try { if (p.onClose) p.onClose(); } catch (e) { B._closeErr = String(e); }
      if (p.wrap && p.wrap.parentNode) p.wrap.parentNode.removeChild(p.wrap);
      if (!silent && !B.uiOpen) { try { APP.lock(); } catch (e) {} }
    }
    B.uiOpen = false;
    B.refreshPanels = null;
    // Never destroy an item held on the mouse, even if a panel close hook failed.
    if (B.cursor) {
      var held = B.cursor; B.cursor = null;
      try {
        var left = B.addItem(held.id, held.count, held);
        if (left > 0 && B.spawnDrop) { var pp = B.app && B.app.player && B.app.player.pos; B.spawnDrop(held.id, left, pp.x, pp.y + 1, pp.z); }
      } catch (e) { B._closeErr = String(e); }
    }
    B.updateCursor();
    if (!silent) { try { APP.lock(); } catch (e) {} }
  };
  B.updateCursor = function () {
    if (!B.cursorEl) return;
    if (B.cursor) {
      B.cursorEl.style.display = 'block';
      B.cursorEl.querySelector('img').src = B.iconURL(B.cursor.id);
    } else B.cursorEl.style.display = 'none';
  };

  B.slotEl = function (parent, spec) {
    var b = el('button', 'bcx-slot', parent);
    b.innerHTML = '<img alt=""><span class="n"></span><span class="dur"><i></i></span><span class="en"></span>';
    b._spec = spec;
    b.addEventListener('mousedown', function (ev) {
      ev.preventDefault();
      if (ev.button === 2) B.clickSlot(spec, true);
      else B.clickSlot(spec, false);
    });
    b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    b.addEventListener('mouseenter', function () { B.showTip(spec); });
    if (!B._slotEls) B._slotEls = [];
    B._slotEls.push(b);
    return b;
  };
  B.showTip = function (spec) {
    var st = spec.get();
    if (!st) return;
    var name = B.itemName(st.id), d = B.items[st.id];
    var s = name;
    if (d && d.dur) s += '<br>Durability ' + (st.dur === undefined ? d.dur : st.dur) + ' / ' + d.dur;
    if (d && d.defense) s += '<br>Armor +' + d.defense;
    if (d && d.food) s += '<br>Restores ' + d.food + ' hunger';
    if (st.ench) for (var k in st.ench) s += '<br><span style="color:#7b3fc4">' + k + ' ' + roman(st.ench[k]) + '</span>';
    if (d && d.type) s += '<br><span style="color:#666">' + d.type + '</span>';
    var tip = q('#bcx-tip'); if (tip) tip.innerHTML = s;
  };
  function roman(n) { return ['', 'I', 'II', 'III', 'IV', 'V'][n] || n; }
  B.roman = roman;

  B.clickSlot = function (spec, right) {
    if (B.dead) return;
    var st = spec.get();
    if (right) {
      if (B.cursor) {
        if (!st) { var one = deep(B.cursor); one.count = 1; B.cursor.count--; spec.set(one); }
        else if (B.same(st, B.cursor) && st.count < B.maxStack(st.id)) { st.count++; B.cursor.count--; }
        else if (B.cursor.count === 1 && spec.accepts && spec.accepts(B.cursor)) { var old = deep(st); spec.set(B.cursor); B.cursor = old; }
      } else if (st) {
        var half = Math.ceil(st.count / 2);
        B.cursor = deep(st); B.cursor.count = half; st.count -= half;
        if (st.count <= 0) spec.set(null); else spec.set(st);
      }
    } else {
      if (B.cursor) {
        if (!st) {
          if (!spec.accepts || spec.accepts(B.cursor)) { spec.set(B.cursor); B.cursor = null; }
        } else if (B.same(st, B.cursor) && st.count < B.maxStack(st.id)) {
          var add = Math.min(B.maxStack(st.id) - st.count, B.cursor.count);
          st.count += add; B.cursor.count -= add;
          if (B.cursor.count <= 0) B.cursor = null; else spec.set(st);
        } else if (spec.accepts && !spec.accepts(B.cursor)) {
          B.toast('That item does not fit here');
        } else {
          var old2 = deep(st); spec.set(B.cursor); B.cursor = old2;
        }
      } else if (st) {
        B.cursor = deep(st); spec.set(null);
      }
    }
    B.markDirty(); B.refreshHotbar(); B.refreshPanels && B.refreshPanels(); B.updateCursor(); B.refreshHUD();
  };
  B.refreshSlotEls = function () {
    if (!B._slotEls) return;
    for (var i = 0; i < B._slotEls.length; i++) {
      var b = B._slotEls[i], spec = b._spec, st = spec.get();
      var img = b.querySelector('img'), n = b.querySelector('.n'), dur = b.querySelector('.dur'), di = b.querySelector('.dur>i'), en = b.querySelector('.en');
      if (st) {
        img.src = B.iconURL(st.id); img.style.visibility = 'visible';
        n.textContent = st.count > 1 ? st.count : '';
        var d = B.items[st.id];
        if (d && d.dur && st.dur !== undefined) {
          dur.style.display = 'block'; di.style.width = clamp(st.dur / d.dur * 100, 0, 100) + '%';
          di.style.background = st.dur / d.dur > .5 ? '#6dff3a' : st.dur / d.dur > .2 ? '#ffd23a' : '#ff3a3a';
        } else dur.style.display = 'none';
        en.textContent = st.ench && Object.keys(st.ench).length ? '+' : '';
      } else { img.removeAttribute('src'); img.style.visibility = 'hidden'; n.textContent = ''; dur.style.display = 'none'; en.textContent = ''; }
    }
  };

  /* ---------- health / hunger / xp ---------- */
  B.xpNeed = function (lvl) { return lvl < 16 ? 2 * lvl + 7 : lvl < 31 ? 5 * lvl - 38 : 9 * lvl - 158; };
  B.xpInLevel = 0;
  B.addXP = function (n) {
    if (n <= 0) return;
    B.xp += n; B.xpInLevel += n;
    var need = B.xpNeed(B.level);
    while (B.xpInLevel >= need) {
      B.xpInLevel -= need; B.level++; need = B.xpNeed(B.level);
      B.toast('Level up! ' + B.level); B.play('click', .35, .07);
    }
    B.refreshHUD();
  };
  B.heal = function (n) { B.health = clamp(B.health + (n || 1), 0, B.maxHealth); B.refreshHUD(); };
  B.feed = function (n, sat) {
    B.hunger = clamp(B.hunger + (n || 1), 0, 20);
    B.saturation = clamp(B.saturation + (sat || 0), 0, B.hunger);
    B.refreshHUD();
  };
  B.damage = function (n, opts) {
    opts = opts || {};
    if (B.dead || B.health <= 0) return;
    if (B.gm === 'creative' && !opts.force) return;
    if (n <= 0) return;
    if (!opts.ignoreArmor) {
      var ar = B.armorPoints();
      var red = Math.min(80, ar.armor * 4 + ar.tough);
      n = n * (1 - red / 100);
      B.damageArmor(n);
    }
    B.health = clamp(B.health - n, 0, B.maxHealth);
    B.hurtT = .32; if (B.hurtEl) B.hurtEl.classList.add('on');
    try { B.play('stone', .35, .05); } catch (e) {}
    if (B.health <= 0) B.die();
    B.refreshHUD(); B.saveDirty = true;
  };
  B.die = function () {
    if (B.dead) return;
    B.dead = true;
    try { APP.keys.clear(); APP.unlock(); } catch (e) {}
    var d = el('div', 'bcx-death', doc.body);
    d.innerHTML = '<h1>You died!</h1><p>Your items stay in your inventory. This is a forgiving tribute build.</p>';
    var b = el('button', 'bcx-btn', d, 'Respawn'); b.onclick = function () { d.remove(); B.respawn(); };
    B.deathEl = d;
    B.closePanel(true);
  };
  B.respawn = function () {
    B.dead = false; B.health = B.maxHealth; B.hunger = 20; B.saturation = 5; B.air = B.maxAir; B.exhaustion = 0;
    B.fallFrom = null;
    try {
      var p = APP.player.pos;
      if (APP.spawn) p.copy(APP.spawn); else p.set(0, B.topY(0, 0) + 2, 0);
      APP.player.vel.set(0, 0, 0);
      APP.lock();
    } catch (e) {}
    B.refreshHUD(); B.refreshHotbar(); B.saveDirty = true;
  };
  B.eat = function (st) {
    var d = B.items[st.id]; if (!d || d.type !== 'food') return false;
    if (B.hunger >= 20 && B.health >= B.maxHealth) { B.toast('You are not hungry'); return true; }
    B.feed(d.food, d.sat || 0);
    B.consumeSlot(B.selected, 1);
    B.play('wool', .3, .12); B.saveDirty = true;
    return true;
  };

  /* ---------- save / load ---------- */
  B.seed = '0';
  B.profileKey = function () { return 'bcx:player:' + B.seed; };
  B.serialize = function () {
    var pos = null;
    try {
      var p = APP.player.pos;
      pos = { x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3) };
    } catch (e) {}
    return {
      v: 1, gm: B.gm, health: B.health, hunger: B.hunger, saturation: B.saturation,
      air: B.air, xp: B.xp, xpInLevel: B.xpInLevel, level: B.level,
      selected: B.selected, inv: B.inv, armor: B.armor, pos: pos
    };
  };
  B.findDrySpawn = function () {
    if (!APP || !APP.world) return false;
    var p = APP.player.pos, x0 = Math.floor(p.x), z0 = Math.floor(p.z);
    for (var r = 0; r <= 64; r += 4) {
      for (var a = 0; a < 16; a++) {
        var ang = a / 16 * Math.PI * 2;
        var x = x0 + Math.round(Math.cos(ang) * r), z = z0 + Math.round(Math.sin(ang) * r);
        var y = APP.world.topY(x, z) + 1;
        if (y < 3) continue;
        var below = B.getBlock(x, y - 1, z), at = B.getBlock(x, y, z), above = B.getBlock(x, y + 1, z);
        var bk = B.KB(below);
        if (at !== 0 || above !== 0 || !below) continue;
        if (/WATER|LAVA|LEAVES|LOG|CACTUS|ICE|MAGMA/.test(bk)) continue;
        p.set(x + .5, y + .05, z + .5);
        try { APP.player.vel.set(0, 0, 0); if (APP.spawn) APP.spawn.copy(p); } catch (e) {}
        return true;
      }
    }
    return false;
  };
  B.saveNow = function () {
    jset(B.profileKey(), B.serialize());
    jset('bcx:containers:' + B.seed, { chests: B.chests, furnaces: B.furnaces });
    for (var i = 0; i < B.onSave.length; i++) { try { B.onSave[i](B.seed); } catch (e) {} }
    B.saveDirty = false; B.dirty = false;
  };
  B.starter = function () {
    var P = B.NB('Oak Planks');
    B.inv = new Array(36).fill(null);
    B.inv[0] = B.stack(P, 16);
    B.inv[1] = B.stack('wooden_pickaxe', 1, { dur: 59 });
    B.inv[2] = B.stack('wooden_axe', 1, { dur: 59 });
    B.inv[3] = B.stack('bread', 8);
    B.inv[4] = B.stack('apple', 4);
    B.inv[5] = B.stack(B.NB('Cobblestone'), 12);
    B.armor = new Array(4).fill(null);
    B.health = 20; B.hunger = 20; B.saturation = 5; B.air = 300; B.xp = 0; B.xpInLevel = 0; B.level = 0;
    B.gm = 'survival'; B.selected = 0;
  };
  B.loadPlayer = function (seed) {
    B.seed = String(seed === undefined ? (APP && APP.world ? APP.world.seed : '0') : seed);
    var s = jget(B.profileKey());
    if (s) {
      B.gm = s.gm || 'survival'; B.health = s.health === undefined ? 20 : s.health;
      B.hunger = s.hunger === undefined ? 20 : s.hunger; B.saturation = s.saturation || 0;
      B.air = s.air === undefined ? 300 : s.air; B.xp = s.xp || 0; B.xpInLevel = s.xpInLevel || 0; B.level = s.level || 0;
      B.selected = s.selected || 0;
      B.inv = Array.isArray(s.inv) ? s.inv : new Array(36).fill(null);
      while (B.inv.length < 36) B.inv.push(null);
      B.armor = Array.isArray(s.armor) ? s.armor : new Array(4).fill(null);
      while (B.armor.length < 4) B.armor.push(null);
      if (s.pos && isFinite(s.pos.x) && isFinite(s.pos.y) && isFinite(s.pos.z)) {
        B.pendingPos = { x: s.pos.x, y: s.pos.y, z: s.pos.z };
        try { APP.player.pos.set(s.pos.x, s.pos.y, s.pos.z); APP.player.vel.set(0, 0, 0); } catch (e) {}
      } else B.findDrySpawn();
    } else { B.starter(); B.findDrySpawn(); }
    var c = jget('bcx:containers:' + B.seed) || {};
    B.chests = c.chests || {}; B.furnaces = c.furnaces || {};
    B.dirty = false; B.saveDirty = false;
    B.syncEngineHotbar(); B.refreshHUD(); B.refreshHotbar();
    for (var i = 0; i < B.onWorld.length; i++) { try { B.onWorld[i](B.seed); } catch (e) {} }
  };
  B.applySavedPos = function () {
    if (!B.pendingPos || !APP || !APP.player) return false;
    var q = B.pendingPos; B.pendingPos = null;
    try {
      APP.player.pos.set(q.x, q.y, q.z);
      APP.player.vel.set(0, 0, 0);
      return true;
    } catch (e) { return false; }
  };
  setInterval(function () { if (B.saveDirty && !B.dead) B.saveNow(); }, 3000);
  window.addEventListener('beforeunload', function () { if (B.seed) B.saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && B.seed) B.saveNow(); });

  /* ---------- mining / drops / use ---------- */
  function hitBlock(hit) {
    if (!hit) return null;
    var x = hit.x, y = hit.y, z = hit.z;
    if (x === undefined && hit.p) { x = hit.p.x; y = hit.p.y; z = hit.p.z; }
    if (x === undefined) return null;
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    var id = (hit.id !== undefined ? hit.id : B.getBlock(x, y, z));
    return { x: x, y: y, z: z, id: id, n: hit.n || hit.normal || [0, 1, 0], key: B.KB(id) };
  }
  B.hitBlock = hitBlock;

  B.hardness = function (key) {
    key = String(key || '');
    if (/BEDROCK|BARRIER/.test(key)) return -1;
    if (/OBSIDIAN/.test(key)) return 12;
    if (/LEAVES|SAPLING|FLOWER|GRASS$|FERN|BUSH|CROP|WHEAT|SEEDS/.test(key)) return .25;
    if (/DIRT|SAND|GRAVEL|CLAY|SNOW/.test(key)) return .6;
    if (/LOG|WOOD|PLANKS|FENCE|DOOR|TABLE|CHEST|BOOKSHELF/.test(key)) return 2;
    if (/COAL_ORE/.test(key)) return 3;
    if (/IRON_ORE|COPPER_ORE|LAPIS_ORE/.test(key)) return 3;
    if (/GOLD_ORE|DIAMOND_ORE|REDSTONE_ORE|EMERALD_ORE/.test(key)) return 3.5;
    if (/DEEPSLATE/.test(key)) return 3.8;
    if (/STONE|COBBLE|BRICK|CONCRETE|TERRACOTTA|FURNACE|ANVIL/.test(key)) return 2;
    if (/GLASS|ICE/.test(key)) return .4;
    return 1.2;
  };
  B.needsPick = function (key) {
    return /STONE|COBBLE|BRICK|ORE|DEEPSLATE|OBSIDIAN|FURNACE|ANVIL|IRON_BLOCK|GOLD_BLOCK|DIAMOND_BLOCK|EMERALD_BLOCK|LAPIS_BLOCK|COPPER_BLOCK|REDSTONE_BLOCK/.test(String(key || ''));
  };
  B.requiredTier = function (key) {
    key = String(key || '');
    if (/OBSIDIAN/.test(key)) return 4;
    if (/DIAMOND_ORE|GOLD_ORE|REDSTONE_ORE|EMERALD_ORE/.test(key)) return 3;
    if (/IRON_ORE|COPPER_ORE|LAPIS_ORE|DEEPSLATE/.test(key)) return 2;
    if (B.needsPick(key)) return 1;
    return 0;
  };
  function toolTypeFor(key) {
    key = String(key || '');
    if (/LOG|WOOD|PLANKS|FENCE|DOOR|TABLE|CHEST|BOOKSHELF/.test(key)) return 'axe';
    if (/DIRT|SAND|GRAVEL|CLAY|SNOW/.test(key)) return 'shovel';
    if (B.needsPick(key)) return 'pickaxe';
    return '';
  }
  B.breakSeconds = function (key, st) {
    var h = B.hardness(key); if (h < 0) return 999;
    var d = st && B.items[st.id], speed = 1, type = toolTypeFor(key);
    if (d && d.type) {
      if (d.type === type) speed = d.speed || 1;
      else if ((d.type === 'sword' || d.type === 'axe' || d.type === 'shovel' || d.type === 'pickaxe')) speed = .7;
      var eff = st.ench && st.ench.efficiency ? 1 + st.ench.efficiency * .35 : 1;
      speed *= eff;
    }
    return clamp(h / speed, .06, 9);
  };
  function dropList(key) {
    var out = [], S = key;
    function one(id, n) { if (id !== -1 && id !== undefined) out.push({ id: id, count: n || 1 }); }
    if (S === 'GRASS' || S === 'GRASS_BLOCK' || S === 'SNOW_GRASS') { one(B.NB('Dirt')); if (Math.random() < .12) one('wheat_seeds'); }
    else if (/LEAVES/.test(S)) {
      if (Math.random() < .05) one(B.NB('Oak Sapling'));
      if (Math.random() < .08) one('stick');
      if (Math.random() < .006) one('apple');
    }
    else if (S === 'STONE') one(B.NB('Cobblestone'));
    else if (/COAL_ORE/.test(S)) { one('coal', 1); if (Math.random() < .2) B.addXP(1); }
    else if (/IRON_ORE/.test(S)) one('raw_iron');
    else if (/GOLD_ORE/.test(S)) one('raw_gold');
    else if (/COPPER_ORE/.test(S)) one('raw_copper', ri(2, 3));
    else if (/DIAMOND_ORE/.test(S)) one('diamond');
    else if (/EMERALD_ORE/.test(S)) one('emerald');
    else if (/LAPIS_ORE/.test(S)) one('lapis', ri(4, 8));
    else if (/REDSTONE_ORE/.test(S)) one('redstone', ri(4, 5));
    else if (S === 'LIT_REDSTONE_LAMP') one(B.NB('Redstone Lamp'));
    else if (S === 'GRAVEL') { one(B.NB('Gravel')); if (Math.random() < .1) one('flint'); }
    else if (/WHEAT/.test(S)) { one('wheat', ri(1, 3)); one('wheat_seeds', ri(1, 3)); }
    else if (/SAPLING|TALL_GRASS|FERN|BUSH|FLOWER|DANDELION|POPPY/.test(S)) { /* no drop for plain plants */ }
    else if (/OAK_LOG|BIRCH_LOG|SPRUCE_LOG|JUNGLE_LOG|ACACIA_LOG|DARK_OAK_LOG/.test(S)) { one(B.NB(B.id2block[key].name)); }
    else one(B.NB(S));
    return out;
  }
  B.dropsFor = dropList;

  B.spawnDrop = function (id, count, x, y, z) {
    if (!APP || !window.__puppetApi) return;
    if (B.drops.length > 180) return;
    var m = B.makeDropMesh(id);
    if (!m) return;
    m.position.set(x, y, z);
    APP.scene.add(m);
    B.drops.push({ id: id, count: count, mesh: m, t: now(), delay: .45, life: 300, spin: Math.random() * 6 });
  };
  B.makeDropMesh = function (id) {
    try {
      var Mesh = APP.hand.constructor;
      var Mat = APP.handMat.constructor;
      if (typeof id === 'number') {
        var mesh = window.__puppetApi.mk(id);
        mesh.material = mesh.material.clone();
        mesh.material.depthTest = true;
        mesh.material.depthWrite = true;
        mesh.scale.setScalar(.26);
        return mesh;
      }
      var AT = APP.tex || (window.__atlas && window.__atlas.tex);
      if (!AT) throw new Error('atlas texture unavailable');
      var tex = new (AT.constructor)(B.iconCanvas(id));
      tex.magFilter = AT.magFilter; tex.minFilter = AT.magFilter;
      tex.generateMipmaps = false; tex.needsUpdate = true;
      var g = new (APP.clouds.geometry.constructor)(.34, .34);
      var mm = new Mesh(g, new Mat({ map: tex, transparent: true, alphaTest: .35, depthTest: true, depthWrite: true }));
      return mm;
    } catch (e) {
      B.dropMeshError = String(e && e.stack || e);
      try {
        var fb = window.__puppetApi.mk(B.NB('Stone'));
        fb.material = fb.material.clone();
        fb.material.depthTest = true;
        fb.scale.setScalar(.24);
        return fb;
      } catch (e2) { B.dropMeshError2 = String(e2); return null; }
    }
  };
  function removeMesh(m) {
    if (!m) return;
    try { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material && m.material.dispose) m.material.dispose(); } catch (e) {}
  }
  B.removeDrop = function (d) { removeMesh(d.mesh); var i = B.drops.indexOf(d); if (i >= 0) B.drops.splice(i, 1); };
  B.tickDrops = function (dt) {
    var p = B.px();
    for (var i = B.drops.length - 1; i >= 0; i--) {
      var d = B.drops[i];
      d.t += dt * 1000;
      if (d.t > d.life * 1000) { B.removeDrop(d); continue; }
      if (!d.mesh) continue;
      d.mesh.rotation.y += dt * 1.4;
      var dx = p.x - d.mesh.position.x, dy = (p.y + .6) - d.mesh.position.y, dz = p.z - d.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d.t > d.delay * 1000 && dist < 2.4) {
        var s = Math.min(1, dt * 5);
        d.mesh.position.x += dx * s; d.mesh.position.y += dy * s; d.mesh.position.z += dz * s;
      }
      if (d.t > d.delay * 1000 && dist < 1.15) {
        var left = B.addItem(d.id, d.count);
        if (left <= 0) {
          B.play('click', .15, .08);
          B.removeDrop(d);
        } else d.count = left;
      }
      if (d.mesh.material && d.mesh.geometry && d.mesh.geometry.type === 'PlaneGeometry') {
        try { d.mesh.quaternion.copy(APP.camera.quaternion); } catch (e) {}
      }
    }
  };

  B.breakBlock = function (hit) {
    var info = hitBlock(hit);
    if (!info) return;
    if (B.gm === 'creative') { return; }
    var st = B.held(), d = st && B.items[st.id];
    var tier = d && d.type === 'pickaxe' ? d.tier : 0;
    var key = info.key;
    if (B.needsPick(key) && tier < B.requiredTier(key)) {
      B.toast('Needs ' + ['', 'a pickaxe', 'a stone pickaxe', 'an iron pickaxe', 'a diamond pickaxe'][B.requiredTier(key)]);
      return;
    }
    var drops = dropList(key);
    var x = info.x + .5, y = info.y + .45, z = info.z + .5;
    for (var i = 0; i < drops.length; i++) B.spawnDrop(drops[i].id, drops[i].count, x, y, z);
    var xp = 0;
    if (/COAL_ORE/.test(key)) xp = 1; else if (/DIAMOND_ORE|EMERALD_ORE/.test(key)) xp = 4; else if (/LAPIS_ORE/.test(key)) xp = 3; else if (/IRON_ORE|GOLD_ORE|COPPER_ORE|REDSTONE_ORE/.test(key)) xp = 2;
    if (xp) B.addXP(xp);
    if (d && d.dur && /_pickaxe|_axe|_shovel|_sword/.test(st.id) && B.hardness(key) > .3) {
      var unbr = st.ench && st.ench.unbreaking ? st.ench.unbreaking : 0;
      if (!(unbr && Math.random() < unbr / (unbr + 1))) {
        st.dur = (st.dur === undefined ? d.dur : st.dur) - 1;
        if (st.dur <= 0) { B.inv[B.selected] = null; B.toast(d.name + ' broke'); B.play('break', .4, .1); }
      }
      B.refreshHotbar(); B.markDirty();
    }
  };

  /* ---------- hooks ---------- */
  function installHooks() {
    var origAction = APP.action.bind(APP);
    B.origAction = origAction;
    APP.action = function (btn) {
      if (btn === 0) {
        if (B.dead || B.uiOpen) return;
        if (B.onAttack) { try { if (B.onAttack()) return; } catch (e) {} }
        var hit = hitBlock(APP.hit);
        if (!hit) { try { origAction(btn); } catch (e) {} B.mining = null; return; }
        if (B.gm === 'creative') { try { origAction(btn); } catch (e) {} B.mining = null; return; }
        var key = hit.key;
        var held = B.held(), hd = held && B.items[held.id];
        var tier = hd && hd.type === 'pickaxe' ? hd.tier : 0;
        var req = B.requiredTier(key);
        if (B.needsPick(key) && tier < req) {
          if (!B.tierToastT || now() - B.tierToastT > 1400) {
            B.tierToastT = now();
            B.toast('Needs ' + ['', 'a pickaxe', 'a stone pickaxe', 'an iron pickaxe', 'a diamond pickaxe'][req]);
          }
          B.mining = null;
          return;
        }
        if (!B.mining || B.mining.x !== hit.x || B.mining.y !== hit.y || B.mining.z !== hit.z) B.mining = { x: hit.x, y: hit.y, z: hit.z, prog: 0, last: now() - 220 };
        var t = now(), dt = Math.min(500, t - B.mining.last); B.mining.last = t;
        var secs = B.breakSeconds(key, B.held());
        B.mining.prog += (dt / 1000) / secs;
        if (Math.random() < .3) B.spawnParticles(hit.x + .5, hit.y + .5, hit.z + .5, hit.id);
        if (B.mining.prog < 1) { try { APP.swing = 1; } catch (e) {} return; }
        B.mining = null;
        var before = B.getBlock(hit.x, hit.y, hit.z);
        try { origAction(0); } catch (e) {}
        if (before !== 0 && B.getBlock(hit.x, hit.y, hit.z) === 0) B.breakBlock(hit);
        return;
      }
      if (btn === 1) {
        if (B.gm !== 'creative') { B.toast('Pick Block is creative-only. Use /gamemode creative.'); return; }
        try { origAction(btn); } catch (e) {}
        return;
      }
      if (btn === 2) {
        var hi = hitBlock(APP.hit);
        var cands = [];
        if (hi) {
          cands.push([hi.x, hi.y, hi.z]);
          cands.push([hi.x + (hi.n[0] || 0), hi.y + (hi.n[1] || 0), hi.z + (hi.n[2] || 0)]);
        }
        var beforeIds = cands.map(function (c) { return B.getBlock(c[0], c[1], c[2]); });
        try { origAction(btn); } catch (e) {}
        for (var pi = 0; pi < cands.length; pi++) {
          var pnow = B.getBlock(cands[pi][0], cands[pi][1], cands[pi][2]);
          if (pnow !== beforeIds[pi] && B.onBlockPlaced) {
            try { B.onBlockPlaced(cands[pi][0], cands[pi][1], cands[pi][2]); } catch (e) {}
          }
        }
        if (B.gm === 'survival') {
          var hst = B.held();
          if (hst && typeof hst.id === 'number') {
            for (var i = 0; i < cands.length; i++) {
              var after = B.getBlock(cands[i][0], cands[i][1], cands[i][2]);
              if (after === hst.id && beforeIds[i] !== after) { B.consumeSlot(B.selected, 1); break; }
            }
          }
        }
        return;
      }
      try { origAction(btn); } catch (e) {}
    };

    var oldFuse = window.__fuse;
    window.__fuse = function (app, e, hit) {
      try {
        var hi = hitBlock(hit);
        if (hi && B.onBlockUse) { if (B.onBlockUse(hi, e)) return true; }
        for (var i = 0; i < B.uses.length; i++) {
          try { if (B.uses[i](e, hi, B.held())) return true; } catch (err) {}
        }
        var st = B.held();
        if (st && typeof st.id === 'string') {
          var d = B.items[st.id];
          if (d && d.type === 'food') { B.eat(st); return true; }
          if (d && d.type === 'armor') { B.equipArmor(st); B.consumeSlot(B.selected, 1); B.toast('Equipped ' + d.name); return true; }
          return true;
        }
        if (B.gm === 'survival' && st && typeof st.id === 'number' && st.count <= 0) return true;
      } catch (err) {}
      return oldFuse ? oldFuse(app, e, hit) : false;
    };

    var oldTick = window.__tick;
    window.__tick = function (app) {
      if (oldTick) { try { oldTick(app); } catch (e) {} }
      try { B.tick(app); } catch (e) { if (window.__bcxErr !== true) { window.__bcxErr = true; console.error('BCX tick', e); } }
    };

    var oldLoad = APP.loadWorld.bind(APP);
    APP.loadWorld = function (seed) {
      try { if (B.seed) B.saveNow(); } catch (e) {}
      B.removeAllMobs && B.removeAllMobs();
      B.drops.slice().forEach(function (d) { B.removeDrop(d); });
      // Drop invalid numeric block ids from older saves before chunk meshing.
      try {
        var wk = 'blockcraft:w:' + seed, raw = localStorage.getItem(wk);
        if (raw) {
          var arr = JSON.parse(raw), fixed = [];
          for (var i = 0; i < arr.length; i++) {
            var id = arr[i] && arr[i][1];
            if (isFinite(id) && id >= 0 && id < window.__BLOCKS.length && B.id2block[id]) fixed.push(arr[i]);
          }
          if (fixed.length !== arr.length) localStorage.setItem(wk, JSON.stringify(fixed));
        }
      } catch (e) {}
      var r = oldLoad(seed);
      try { B.loadPlayer(seed); } catch (e) {}
      return r;
    };
    var oldHand = APP.setHand.bind(APP);
    APP.setHand = function () {
      try { oldHand(); } catch (e) {}
      try {
        var st = B.held();
        if (st && typeof st.id === 'string') APP.hand.visible = false;
      } catch (e) {}
    };
    var oldPick = APP.pick.bind(APP);
    APP.pick = function () {
      if (B.gm !== 'creative') { B.toast('Pick Block is creative-only'); return; }
      oldPick();
      B.select(APP.slot || 0);
    };
    var oldSelect = APP.selectSlot.bind(APP);
    APP.selectSlot = function (i) {
      oldSelect(i);
      B.selected = clamp(i | 0, 0, 8);
      B.refreshHotbar();
    };
  }

  /* ---------- survival tick ---------- */
  B.tick = function (app) {
    if (!B.ready || B.dead) return;
    var dt = Math.min(.1, (now() - (B.lastTick || now())) / 1000); B.lastTick = now();
    B.tickCount++;
    if (app.mode === 'play' && B.pendingPos) B.applySavedPos();
    var p = app.player.pos;
    if (B.gm === 'survival' && app.player.flying) {
      app.player.flying = false; app.player.vel.y = Math.min(0, app.player.vel.y);
      if (!B._flyToast || now() - B._flyToast > 5000) { B._flyToast = now(); B.toast('Flight is creative-only. Use /gamemode creative.'); }
    }
    if (B.gm === 'survival') {
      // fall damage
      var grounded = !!app.player.onGround;
      if (!grounded && !app.player.flying) {
        if (B.fallFrom === null) B.fallFrom = p.y;
        if (p.y > B.fallFrom) B.fallFrom = p.y;
      } else if (grounded) {
        if (B.fallFrom !== null) {
          var fall = B.fallFrom - p.y;
          if (fall > 3.2) { B.damage(Math.floor(fall - 3), { ignoreArmor: false }); B.play('stone', .4, .05); }
          B.fallFrom = null;
        }
      }
      // air / drowning
      var waterId = B.waterId === undefined ? (B.waterId = B.NB('Water')) : B.waterId;
      var headBlock = B.getBlock(p.x, p.y + 1.4, p.z);
      var inWater = headBlock === waterId || B.getBlock(p.x, p.y + .2, p.z) === waterId;
      if (inWater) {
        B.air -= dt * 20;
        if (B.air <= 0) { B.air = 0; if (B.tickCount % 20 === 0) B.damage(1, { ignoreArmor: true }); }
      } else B.air = Math.min(B.maxAir, B.air + dt * 80);
      // sprint / exhaustion
      var dx = p.x - (B._lastX === undefined ? p.x : B._lastX);
      var dz = p.z - (B._lastZ === undefined ? p.z : B._lastZ);
      var moved = Math.sqrt(dx * dx + dz * dz);
      B._lastX = p.x; B._lastZ = p.z;
      var sprinting = false;
      try { sprinting = app.player.sprinting || (app.keys.has('ShiftLeft') && (app.keys.has('KeyW') || app.keys.has('ArrowUp'))); } catch (e) {}
      if (sprinting && B.hunger <= 6) { sprinting = false; try { app.player.sprinting = false; } catch (e) {} }
      B.exhaustion += moved * (sprinting ? .12 : .025);
      if (B.exhaustion >= 4) {
        B.exhaustion -= 4;
        if (B.saturation > 0) B.saturation = Math.max(0, B.saturation - 1);
        else if (B.hunger > 0) B.hunger--;
        B.refreshHUD();
      }
      // regen / starvation
      B.regenT += dt;
      if (B.hunger >= 18 && B.health < B.maxHealth) {
        if (B.regenT >= 3.5) { B.regenT = 0; B.heal(1); B.exhaustion += .4; }
      } else if (B.hunger <= 0) {
        B.starveT += dt;
        if (B.starveT >= 4) { B.starveT = 0; B.damage(1, { ignoreArmor: true }); }
      } else B.regenT = 0;
      if (B.hunger <= 0 && B.gm === 'survival') { /* handled */ }
    }
    if (B.hurtT > 0) { B.hurtT -= dt; if (B.hurtT <= 0 && B.hurtEl) B.hurtEl.classList.remove('on'); }
    if (B.mining && now() - B.mining.last > 500) B.mining = null;
    B.tickDrops(dt);
    for (var i = 0; i < B.ticks.length; i++) { try { B.ticks[i](dt, app); } catch (e) { if (!window.__bcxModErr) { window.__bcxModErr = 1; console.error('BCX mod', e); } } }
    B.hudT = (B.hudT || 0) + dt;
    if (B.hudT > .12) { B.hudT = 0; B.refreshHUD(); }
    B.posSaveT = (B.posSaveT || 0) + dt;
    if (B.posSaveT > 5 && app.mode === 'play' && !B.dead) { B.posSaveT = 0; B.saveDirty = true; }
    if (B.saveDirty && now() - B.saveTimer > 3000) { B.saveTimer = now(); B.saveNow(); }
  };

  B.registerTick = function (fn) { B.ticks.push(fn); };
  B.registerUse = function (fn) { B.uses.push(fn); };
  B.addCommand = function (name, fn, help) { B.commands[name] = fn; B.commands['__help_' + name] = help; };
  B.registerCommand = B.addCommand;

  /* ---------- commands ---------- */
  B.findItem = function (name) {
    var n = String(name || '').toLowerCase().replace(/^minecraft:/, '');
    if (B.items[n]) return n;
    var keys = Object.keys(B.items);
    for (var i = 0; i < keys.length; i++) if (B.items[keys[i]].name.toLowerCase() === n) return keys[i];
    for (var j = 0; j < keys.length; j++) if (B.items[keys[j]].name.toLowerCase().indexOf(n) >= 0) return keys[j];
    var bid = B.NB(name); if (bid >= 0) return bid;
    return null;
  };
  B.giveByName = function (name, n) {
    var id = B.findItem(name);
    if (id === null) return false;
    B.give(id, n || 1); return true;
  };
  function out(t, ok) { return { t: t, ok: ok !== false }; }
  B.registerCommand('gamemode', function (a) {
    var m = (a[0] || '').toLowerCase();
    if (m === 's' || m === '0') m = 'survival';
    if (m === 'c' || m === '1') m = 'creative';
    if (m !== 'survival' && m !== 'creative') return [out('Usage: /gamemode survival|creative', false)];
    B.gm = m; B.saveDirty = true;
    try { APP.player.flying = m === 'creative'; } catch (e) {}
    return [out('Game mode set to ' + m)];
  }, '/gamemode survival|creative');
  B.registerCommand('gm', function (a) { return B.commands.gamemode(a); }, '/gm = /gamemode');
  B.registerCommand('give', function (a) {
    if (!a.length) return [out('Usage: /give <item|block> [count]', false)];
    var n = parseInt(a[1] || '1', 10); if (!isFinite(n) || n < 1) n = 1;
    if (B.giveByName(a.join(' '), n)) return [out('Gave ' + n + ' x ' + a.join(' '))];
    if (B.giveByName(a[0], n)) return [out('Gave ' + n + ' x ' + a[0])];
    return [out('Unknown item: ' + a.join(' '), false)];
  }, '/give <item|block> [count]');
  B.registerCommand('heal', function () { B.health = B.maxHealth; B.refreshHUD(); B.saveDirty = true; return [out('Healed')]; }, '/heal');
  B.registerCommand('feed', function () { B.feed(20, 20); B.saveDirty = true; return [out('Fed')]; }, '/feed');
  B.registerCommand('hunger', function () { B.feed(20, 20); return [out('Hunger restored')]; }, '/hunger');
  B.registerCommand('xp', function (a) {
    var n = parseInt(a[a.length - 1] || '10', 10); if (!isFinite(n)) n = 10;
    B.addXP(n); B.saveDirty = true; return [out('Added ' + n + ' XP')];
  }, '/xp [add] <amount>');
  B.registerCommand('kill', function () { B.health = 0; B.die(); return [out('You died')]; }, '/kill');
  B.registerCommand('clear', function () { B.inv = new Array(36).fill(null); B.markDirty(); B.refreshHotbar(); return [out('Inventory cleared')]; }, '/clear');
  B.registerCommand('bcx', function () { return [out('Survival layer ' + B.version + ' | HP ' + B.health + ' | food ' + B.hunger + ' | XP ' + B.level + ' | mobs ' + (B.mobCount ? B.mobCount() : 0))]; }, '/bcx - status');
  B.registerCommand('help', function () {
    var lines = [out('Commands: /gamemode /give /heal /feed /xp /kill /clear /bcx'), out('/give <block> [count]  |  /give <item> [count]')];
    Object.keys(B.commands).forEach(function (k) {
      if (k.indexOf('__help_') === 0) return;
      if (k === 'help' || k === 'give' || k === 'kill') return;
      var h = B.commands['__help_' + k]; if (h) lines.push(out(h));
    });
    lines.push(out('/time /tp /setblock /weather /summon /seed (engine or mods)'));
    // Keep these two at the tail: the in-game log shows only its last few lines.
    lines.push(out('/give <block> [count]  |  /give <item> [count]'));
    lines.push(out('/kill - die and respawn'));
    return lines;
  }, '/help');
  function installCommands() {
    var prev = window.__cmdExec;
    if (!prev || prev.__bcxWrap) return;
    var wrapped = function (app, raw) {
      try {
        var s = String(raw || '').trim().replace(/^\//, '');
        var parts = s.split(/\s+/), cmd = (parts.shift() || '').toLowerCase();
        if (B.commands[cmd]) return B.commands[cmd](parts, raw);
        return prev(app, raw);
      } catch (e) { return [out('Command error: ' + e.message, false)]; }
    };
    wrapped.__bcxWrap = true;
    window.__cmdExec = wrapped;
  }

  /* ---------- keyboard ---------- */
  function onKey(e) {
    if (!B.ready) return;
    var tag = (e.target && e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (B.panel) {
      if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'KeyI') {
        e.preventDefault(); e.stopImmediatePropagation(); B.closePanel();
      }
      return;
    }
    if (B.dead || !APP || APP.mode !== 'play') return;
    if (/^Digit[1-9]$/.test(e.code)) {
      e.preventDefault(); e.stopImmediatePropagation(); B.select(parseInt(e.code.slice(5), 10) - 1); return;
    }
    if (e.code === 'KeyE' || e.code === 'KeyI') {
      if (B.openInventory) { e.preventDefault(); e.stopImmediatePropagation(); B.openInventory(); }
      return;
    }
    if (e.code === 'KeyF' && B.gm !== 'creative') {
      e.preventDefault(); e.stopImmediatePropagation();
      B.toast('Flight is creative-only. Use /gamemode creative.');
      return;
    }
    if (e.code === 'KeyQ' && !e.ctrlKey) {
      var st = B.held();
      if (st) {
        e.preventDefault(); e.stopImmediatePropagation();
        var p = B.px();
        B.spawnDrop(st.id, 1, p.x, p.y + .4, p.z);
        B.consumeSlot(B.selected, 1);
      }
    }
  }
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('wheel', function (e) {
    if (!B.ready || B.panel || B.dead || !APP || APP.mode !== 'play') return;
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() !== 'canvas') return;
    e.preventDefault(); e.stopImmediatePropagation();
    B.select((B.selected + (e.deltaY > 0 ? 1 : 8)) % 9);
  }, { capture: true, passive: false });

  /* ---------- boot ---------- */
  function mapBlocks() {
    var bs = window.__BLOCKS || [];
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      B.key2id[b.key] = b.id; B.id2block[b.id] = b;
      if (b.name) B.name2id[b.name] = b.id;
    }
    B.waterId = B.NB('Water');
  }
  B.boot = function () {
    if (!window.__app || !window.__BLOCKS || !window.__puppetApi) return false;
    APP = window.__app; B.app = APP;
    mapBlocks();
    B.injectCSS();
    B.buildHUD();
    B.hotEl && B.hotEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    installHooks();
    installCommands();
    var iconMap = {};
    [
      'stick', 'coal', 'charcoal', 'raw_iron', 'raw_gold', 'raw_copper',
      'iron_ingot', 'gold_ingot', 'copper_ingot', 'diamond', 'emerald', 'redstone', 'lapis', 'flint',
      'apple', 'bread', 'wheat', 'wheat_seeds', 'leather',
      'beef', 'cooked_beef', 'porkchop', 'cooked_porkchop', 'chicken', 'cooked_chicken',
      'mutton', 'cooked_mutton', 'rotten_flesh', 'feather', 'bone', 'string', 'gunpowder', 'arrow', 'bow', 'flint_and_steel',
      'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe',
      'wooden_axe', 'stone_axe', 'iron_axe', 'diamond_axe',
      'wooden_shovel', 'stone_shovel', 'iron_shovel', 'diamond_shovel',
      'wooden_sword', 'stone_sword', 'iron_sword', 'diamond_sword',
      'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
      'iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots',
      'diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots'
    ].forEach(function (id) { iconMap[id] = '/assets/textures/items/' + id + '.png?v=items1'; });
    B.loadFileIcons(iconMap);
    B.seed = String((APP.world && APP.world.seed) || APP.seed || 'world');
    B.loadPlayer(B.seed);
    B.select(B.selected);
    B.ready = true;
    B.toast('Survival mode loaded. Press E for inventory, F3 not required. /help for commands.');
    return true;
  };
  B.initTimer = setInterval(function () {
    if (B.ready) { clearInterval(B.initTimer); return; }
    try { if (B.boot()) clearInterval(B.initTimer); } catch (e) { console.error('BCX boot', e); }
  }, 120);
  setTimeout(function () { try { B.boot(); } catch (e) {} }, 60);

  window.__bcxState = function () {
    return {
      ready: B.ready, seed: B.seed, gm: B.gm, health: B.health, hunger: B.hunger,
      air: B.air, xp: B.xp, level: B.level, selected: B.selected,
      pos: (function () { try { var p = APP.player.pos; return { x: p.x, y: p.y, z: p.z }; } catch (e) { return null; } })(),
      inv: B.inv, armor: B.armor, mobs: B.mobCount ? B.mobCount() : 0,
      drops: B.drops.length, ui: !!B.panel, dead: B.dead, version: B.version
    };
  };

  /*__BCX_MORE__*/
})();
