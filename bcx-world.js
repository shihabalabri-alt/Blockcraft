/* BLOCKCRAFT SURVIVAL LAYER - structures, weather, farming */
(function () {
  'use strict';
  var B = window.BCX;
  if (!B || B.worldLoaded) return;
  B.worldLoaded = true;

  function el(tag, cls, parent, html) {
    var e = document.createElement(tag); if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function id(n) { return B.NB(n); }
  function posKey(x, y, z) { return x + ',' + y + ',' + z; }

  /* ---------- structure generation ---------- */
  B.structVersion = 'v1';
  B.buildQ = [];
  B.structBuilding = false;
  B.chestLoot = {};

  function op(x, y, z, bid) { B.buildQ.push([Math.floor(x), Math.floor(y), Math.floor(z), bid]); }
  function fill(x1, y1, z1, x2, y2, z2, bid) {
    for (var x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
      for (var y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
        for (var z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) op(x, y, z, bid);
  }
  function clearBox(x1, y1, z1, x2, y2, z2) { fill(x1, y1, z1, x2, y2, z2, 0); }

  function flatSpot(cx, cz, radius) {
    var best = null;
    for (var attempt = 0; attempt < 12; attempt++) {
      var x = Math.floor(cx + rnd(-radius, radius)), z = Math.floor(cz + rnd(-radius, radius));
      var h = B.topY(x, z), min = h, max = h, water = false;
      for (var dx = -4; dx <= 4; dx += 2) for (var dz = -4; dz <= 4; dz += 2) {
        var top = B.topY(x + dx, z + dz); min = Math.min(min, top); max = Math.max(max, top);
        if (B.KB(B.getBlock(x + dx, top, z + dz)) === 'WATER') water = true;
      }
      var score = (max - min) + (water ? 20 : 0);
      if (!best || score < best.score) best = { x: x, z: z, y: h, score: score };
      if (score <= 1) break;
    }
    return best;
  }

  function setChestLoot(x, y, z, kind) {
    var c = B.getChest(x, y, z);
    var items = new Array(27).fill(null);
    function add(idv, n, extra) {
      if (idv === null || idv === undefined || idv === -1) return;
      for (var i = 0; i < 27; i++) if (!items[i]) { items[i] = B.stack(idv, n, extra); return; }
    }
    if (kind === 'village') {
      add(id('Bread'), ri(2, 4));
      add('wheat', ri(2, 5));
      add('wheat_seeds', ri(2, 5));
      add('apple', ri(1, 3));
      add('iron_ingot', ri(1, 3));
      add('lapis', ri(2, 6));
      add('leather', ri(1, 3));
      add(id('Oak Planks'), ri(6, 12));
    } else {
      add('iron_ingot', ri(3, 6));
      add('gold_ingot', ri(2, 4));
      add('diamond', ri(1, 2));
      add('lapis', ri(4, 8));
      add('bread', ri(2, 4));
      add('arrow', ri(6, 12));
      add('iron_pickaxe', 1, { dur: 250, ench: { efficiency: 1 } });
      add('emerald', ri(1, 2));
      add(id('Obsidian'), ri(3, 5));
    }
    c.items = items; c.loot = kind; B.chests[x + ',' + y + ',' + z] = c; B.markDirty();
  }

  function house(x, y, z, w, d, h) {
    var log = id('Oak Log'), planks = id('Oak Planks'), cob = id('Cobblestone'), glass = id('Glass');
    var lantern = id('Lantern'); if (lantern < 0) lantern = id('Glowstone');
    clearBox(x, y + 1, z, x + w - 1, y + h + 1, z + d - 1);
    fill(x, y, z, x + w - 1, y, z + d - 1, planks);
    for (var yy = 1; yy <= h; yy++) {
      for (var xx = 0; xx < w; xx++) for (var zz = 0; zz < d; zz++) {
        if (xx !== 0 && xx !== w - 1 && zz !== 0 && zz !== d - 1) continue;
        var corner = (xx === 0 || xx === w - 1) && (zz === 0 || zz === d - 1);
        var b = corner ? log : planks;
        if (!corner && yy === 2 && (xx === 1 || xx === w - 2 || zz === 1 || zz === d - 2) && (xx + zz) % 2 === 0) b = glass;
        op(x + xx, y + yy, z + zz, b);
      }
    }
    fill(x, y + h + 1, z, x + w - 1, y + h + 1, z + d - 1, planks);
    op(x + Math.floor(w / 2), y + 1, z, 0); op(x + Math.floor(w / 2), y + 2, z, 0);
    if (lantern >= 0) op(x + 1, y + h, z + 1, lantern);
    op(x + w - 2, y + 1, z + d - 2, id('Chest'));
    if (id('Furnace') >= 0) op(x + 1, y + 1, z + d - 2, id('Furnace'));
    setChestLoot(x + w - 2, y + 1, z + d - 2, 'village');
    // path to door
    for (var pz = z - 1; pz >= z - 3; pz--) fill(x + Math.floor(w / 2), y, pz, x + Math.floor(w / 2), y, pz, cob);
  }

  function well(x, y, z) {
    var cob = id('Cobblestone'), water = id('Water');
    fill(x - 2, y, z - 2, x + 2, y, z + 2, cob);
    fill(x - 1, y, z - 1, x + 1, y, z + 1, water);
    for (var dx = -2; dx <= 2; dx += 4) for (var dz = -2; dz <= 2; dz += 4) {
      for (var yy = 1; yy <= 3; yy++) op(x + dx, y + yy, z + dz, id('Oak Fence') >= 0 ? id('Oak Fence') : cob);
    }
    fill(x - 2, y + 4, z - 2, x + 2, y + 4, z + 2, id('Oak Planks'));
  }

  function farm(x, y, z) {
    var dirt = id('Dirt'), water = id('Water'), wheat = id('Wheat');
    fill(x, y, z, x + 5, y, z + 6, dirt);
    fill(x + 2, y, z, x + 3, y, z + 6, water);
    for (var dx = 0; dx < 6; dx++) for (var dz = 0; dz < 7; dz++) {
      if (dx === 2 || dx === 3) continue;
      if (wheat >= 0) op(x + dx, y + 1, z + dz, wheat);
    }
    for (var p = 0; p < 7; p += 3) {
      op(x - 1, y + 1, z + p, id('Oak Fence')); op(x + 6, y + 1, z + p, id('Oak Fence'));
    }
  }

  function lamp(x, y, z) {
    var log = id('Oak Log'), lantern = id('Lantern'); if (lantern < 0) lantern = id('Glowstone');
    for (var yy = 1; yy <= 3; yy++) op(x, y + yy, z, log);
    if (lantern >= 0) op(x, y + 4, z, lantern);
  }

  function buildVillage(cx, cz) {
    var s = flatSpot(cx, cz, 26); if (!s) return null;
    var y = s.y;
    house(s.x - 12, y, s.z - 12, 5, 5, 4);
    house(s.x + 7, y, s.z - 11, 6, 5, 4);
    house(s.x - 11, y, s.z + 7, 5, 6, 4);
    house(s.x + 6, y, s.z + 6, 5, 5, 4);
    well(s.x, y, s.z);
    farm(s.x - 2, y, s.z + 9);
    lamp(s.x - 6, y, s.z - 2); lamp(s.x + 5, y, s.z + 2);
    // paths
    var cob = id('Cobblestone');
    for (var x = s.x - 12; x <= s.x + 12; x++) op(x, y, s.z, cob);
    for (var z = s.z - 12; z <= s.z + 12; z++) op(s.x, y, z, cob);
    return s;
  }

  function buildDungeon(cx, cz, deep) {
    var baseY = B.topY(cx, cz) - (deep ? 22 : 14);
    if (baseY < 8) baseY = 14;
    var cob = id('Cobblestone'), moss = id('Mossy Cobblestone'); if (moss < 0) moss = cob;
    var airY = baseY + 1;
    clearBox(cx - 5, airY, cz - 5, cx + 5, airY + 4, cz + 5);
    fill(cx - 6, baseY, cz - 6, cx + 6, baseY, cz + 6, cob);
    fill(cx - 6, airY + 5, cz - 6, cx + 6, airY + 5, cz + 6, cob);
    for (var x = -6; x <= 6; x++) for (var z = -6; z <= 6; z++) {
      if (Math.abs(x) !== 6 && Math.abs(z) !== 6) continue;
      for (var y = airY; y <= airY + 4; y++) {
        var wall = (Math.abs(x) === 6 && Math.abs(z) === 6) ? cob : (y === airY + 4 ? moss : cob);
        op(cx + x, y, cz + z, wall);
      }
    }
    // entrance shaft
    for (var sy = 0; sy <= 14; sy++) op(cx + 3, airY + 4 + sy, cz - 5, 0);
    // spawner
    var spawner = id('Monster Spawner');
    if (spawner >= 0) { op(cx, airY + 1, cz, spawner); B.spawners.push({ x: cx, y: airY + 1, z: cz }); }
    var chest = id('Chest');
    op(cx - 5, airY + 1, cz - 5, chest); setChestLoot(cx - 5, airY + 1, cz - 5, 'dungeon');
    op(cx + 5, airY + 1, cz + 5, chest); setChestLoot(cx + 5, airY + 1, cz + 5, 'dungeon');
    var lantern = id('Lantern'); if (lantern < 0) lantern = id('Glowstone');
    if (lantern >= 0) {
      op(cx - 4, airY + 4, cz - 4, lantern); op(cx + 4, airY + 4, cz + 4, lantern);
    }
    // small corridor
    for (var cz2 = 5; cz2 <= 12; cz2++) {
      clearBox(cx - 1, airY, cz + cz2, cx + 1, airY + 2, cz + cz2);
      for (var wx = -2; wx <= 2; wx++) { op(cx + wx, airY + 3, cz + cz2, cob); if (Math.abs(wx) === 2) op(cx + wx, airY, cz + cz2, cob); }
    }
    return { x: cx, y: airY, z: cz };
  }

  function processBuild() {
    if (!B.buildQ.length) {
      if (B.structBuilding) {
        B.structBuilding = false;
        lsSet('bcx:struct:' + B.structVersion + ':' + B.seed, 'done');
        B.saveNow();
        B.toast && B.toast('Nearby village and dungeons generated');
      }
      return;
    }
    B.structBuilding = true;
    var n = Math.min(120, B.buildQ.length);
    for (var i = 0; i < n; i++) {
      var o = B.buildQ.shift();
      try { B.setBlock(o[0], o[1], o[2], o[3]); } catch (e) {}
    }
    if (!B.buildQ.length) {
      B.structBuilding = false;
      lsSet('bcx:struct:' + B.structVersion + ':' + B.seed, 'done');
      B.saveNow();
      B.toast && B.toast('Nearby village and dungeons generated');
    }
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  B.startStructures = function (force) {
    if (!B.ready || !B.app) return;
    var flag = 'bcx:struct:' + B.structVersion + ':' + B.seed;
    if (!force && lsGet(flag)) return;
    if (B.buildQ.length) return;
    var sp = B.app.spawn || B.px();
    var cx = Math.floor(sp.x), cz = Math.floor(sp.z);
    var angle = Math.random() * Math.PI * 2;
    var dist = rnd(48, 82);
    var vx = Math.floor(cx + Math.cos(angle) * dist), vz = Math.floor(cz + Math.sin(angle) * dist);
    var v = buildVillage(vx, vz);
    var a2 = angle + Math.PI * .8;
    buildDungeon(Math.floor(cx + Math.cos(a2) * 28), Math.floor(cz + Math.sin(a2) * 28), false);
    var a3 = angle - Math.PI * .7;
    buildDungeon(Math.floor(cx + Math.cos(a3) * 56), Math.floor(cz + Math.sin(a3) * 56), true);
    if (v) B.toast && B.toast('A village is nearby - follow the cobblestone path');
  };
  B.structPending = false;
  B.structDelay = 0;
  B.registerTick(function (dt) {
    processBuild();
    if (B.structPending && B.app && B.app.mode === 'play') {
      B.structDelay -= dt;
      if (B.structDelay <= 0) { B.structPending = false; try { B.startStructures(false); } catch (e) {} }
    }
  });
  B.onWorld.push(function () { B.structPending = true; B.structDelay = 1.5; });

  /* ---------- weather ---------- */
  B.weather = { type: 'clear', t: 0, next: rnd(150, 280) };
  B.rainPoints = null;
  B.rainData = null;
  B.thunderT = 0;
  function ensureRain() {
    if (B.rainPoints || !B.app) return;
    try {
      var Geo = B.app.stars.geometry.constructor;
      var Attr = B.app.stars.geometry.attributes.position.constructor;
      var Points = B.app.stars.constructor;
      var Mat = B.app.stars.material.constructor;
      var n = 420, arr = new Float32Array(n * 3);
      var p = B.px();
      for (var i = 0; i < n; i++) { arr[i * 3] = p.x + rnd(-18, 18); arr[i * 3 + 1] = p.y + rnd(0, 18); arr[i * 3 + 2] = p.z + rnd(-18, 18); }
      var geo = new Geo(); geo.setAttribute('position', new Attr(arr, 3));
      var mat = new Mat({ color: 0xa8c8ff, size: .085, transparent: true, opacity: .72, depthWrite: false });
      var pts = new Points(geo, mat); pts.frustumCulled = false; pts.visible = false;
      B.app.scene.add(pts); B.rainPoints = pts; B.rainData = arr;
    } catch (e) {}
  }
  B.setWeather = function (type, seconds) {
    if (['clear', 'rain', 'thunder'].indexOf(type) < 0) return false;
    B.weather.type = type;
    B.weather.t = 0;
    B.weather.next = seconds || (type === 'clear' ? rnd(180, 320) : type === 'thunder' ? rnd(40, 80) : rnd(70, 140));
    if (B.weatherEl) B.weatherEl.classList.toggle('on', type !== 'clear');
    ensureRain(); if (B.rainPoints) B.rainPoints.visible = type !== 'clear';
    if (B.weatherEl && type === 'thunder') B.weatherEl.style.background = 'rgba(35,40,60,.32)';
    else if (B.weatherEl) B.weatherEl.style.background = 'rgba(55,70,90,.16)';
    return true;
  };
  B.isRaining = function () { return B.weather.type !== 'clear'; };
  B.tickWeather = function (dt) {
    B.weather.t += dt;
    if (B.weather.t >= B.weather.next) {
      var r = Math.random();
      if (B.weather.type === 'clear') B.setWeather(r < .15 ? 'thunder' : 'rain');
      else B.setWeather('clear');
    }
    if (!B.rainPoints || !B.rainData) return;
    if (B.weather.type === 'clear') { B.rainPoints.visible = false; return; }
    B.rainPoints.visible = true;
    var p = B.px(), arr = B.rainData;
    for (var i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] -= dt * (B.weather.type === 'thunder' ? 26 : 18);
      if (arr[i * 3 + 1] < p.y - 6) {
        arr[i * 3] = p.x + rnd(-18, 18); arr[i * 3 + 1] = p.y + rnd(10, 18); arr[i * 3 + 2] = p.z + rnd(-18, 18);
      }
    }
    try { B.rainPoints.geometry.attributes.position.needsUpdate = true; } catch (e) {}
    if (B.weather.type === 'thunder') {
      B.thunderT -= dt;
      if (B.thunderT <= 0) {
        B.thunderT = rnd(7, 17);
        if (B.weatherEl) {
          B.weatherEl.style.background = 'rgba(255,255,255,.55)';
          setTimeout(function () { if (B.weatherEl) B.weatherEl.style.background = 'rgba(35,40,60,.32)'; }, 90);
        }
        try { var a = new Audio('/assets/audio/boom.ogg'); a.volume = .35; a.play(); } catch (e) {}
      }
    }
  };
  B.registerTick(function (dt) {
    B.tickWeather(dt);
    // weather occasionally affects mob spawns by boosting the spawner timer
    if (B.isRaining()) B.spawnT = Math.min(B.spawnT, 3.5);
  });
  B.registerCommand && B.registerCommand('weather', function (a) {
    var t = (a[0] || '').toLowerCase();
    if (['clear', 'rain', 'thunder'].indexOf(t) < 0) return [{ t: 'Usage: /weather clear|rain|thunder', ok: false }];
    B.setWeather(t); return [{ t: 'Weather set to ' + t, ok: true }];
  }, '/weather clear|rain|thunder');

  /* ---------- farming ---------- */
  B.crops = {};
  B.cropKey = function (x, y, z) { return x + ',' + y + ',' + z; };
  B.plantSeed = function (x, y, z) {
    if (!B.app) return false;
    var below = B.getBlock(x, y, z), above = B.getBlock(x, y + 1, z);
    var bk = B.KB(below);
    if (!/GRASS|DIRT|FARMLAND|PODZOL/.test(bk)) return false;
    if (above !== 0) return false;
    var wheat = B.NB('Wheat'); if (wheat < 0) return false;
    B.setBlock(x, y + 1, z, wheat);
    B.crops[B.cropKey(x, y + 1, z)] = { t: 0, mature: false };
    B.saveDirty = true;
    B.play('grass', .25, .12);
    return true;
  };
  B.registerUse(function (e, hi, held) {
    if (!held || held.id !== 'wheat_seeds' || !hi) return false;
    if (B.plantSeed(hi.x, hi.y, hi.z)) { B.consumeSlot(B.selected, 1); B.toast('Planted wheat'); return true; }
    return false;
  });
  B.registerTick(function (dt) {
    var changed = false;
    for (var k in B.crops) {
      var c = B.crops[k]; if (!c) continue;
      var parts = k.split(','), x = +parts[0], y = +parts[1], z = +parts[2];
      if (B.getBlock(x, y, z) !== B.NB('Wheat')) { delete B.crops[k]; changed = true; continue; }
      if (!c.mature) {
        c.t += dt;
        if (c.t > 45) { c.mature = true; changed = true; }
      }
    }
    if (changed) B.saveDirty = true;
  });
  B.onSave.push(function (seed) {
    try { localStorage.setItem('bcx:crops:' + seed, JSON.stringify(B.crops)); } catch (e) {}
  });
  B.onWorld.push(function (seed) {
    try {
      var s = localStorage.getItem('bcx:crops:' + seed);
      B.crops = s ? JSON.parse(s) : {};
    } catch (e) { B.crops = {}; }
  });

  /* ---------- primed TNT ---------- */
  B.tntFuses = {};
  B.igniteTNT = function (x, y, z) {
    var tnt = B.NB('TNT');
    if (tnt < 0 || B.getBlock(x, y, z) !== tnt) return false;
    var k = B.cropKey(x, y, z);
    if (B.tntFuses[k]) return true;
    B.tntFuses[k] = { x: x, y: y, z: z, t: 2.0 };
    B.play('click', .5, .25);
    B.toast('TNT primed!');
    return true;
  };
  B.registerUse(function (e, hi, held) {
    if (!held || held.id !== 'flint_and_steel' || !hi) return false;
    if (!/TNT/.test(B.KB(hi.id))) return false;
    if (!B.igniteTNT(hi.x, hi.y, hi.z)) return false;
    if (B.gm !== 'creative') {
      held.dur = (held.dur === undefined ? 64 : held.dur) - 1;
      if (held.dur <= 0) { B.inv[B.selected] = null; B.toast('Flint and Steel broke'); }
    }
    B.refreshHotbar(); B.markDirty();
    return true;
  });
  B.registerTick(function (dt) {
    var tnt = B.NB('TNT');
    for (var k in B.tntFuses) {
      var f = B.tntFuses[k]; if (!f) continue;
      f.t -= dt;
      if (f.t > 0) continue;
      delete B.tntFuses[k];
      if (B.getBlock(f.x, f.y, f.z) === tnt) B.setBlock(f.x, f.y, f.z, 0);
      try { B.explodeAt(f.x + .5, f.y + .5, f.z + .5, 3.3, 16); } catch (e) {}
    }
  });

  /* ---------- tiny exploration command ---------- */
  B.registerCommand && B.registerCommand('locate', function (a) {
    var p = B.px();
    var lines = [{ t: 'Position ' + Math.floor(p.x) + ', ' + Math.floor(p.y) + ', ' + Math.floor(p.z), ok: true }];
    if (B.spawners && B.spawners.length) {
      var best = null, bd = 1e9;
      B.spawners.forEach(function (s) { var d = Math.hypot(s.x - p.x, s.z - p.z); if (d < bd) { bd = d; best = s; } });
      if (best) lines.push({ t: 'Nearest dungeon spawner: ' + Math.floor(best.x) + ', ' + Math.floor(best.y) + ', ' + Math.floor(best.z) + ' (' + Math.round(bd) + 'm)', ok: true });
    }
    return lines;
  }, '/locate - position and nearest dungeon');

  B.worldReady = true;
})();
