/* BLOCKCRAFT SURVIVAL LAYER - compact redstone lamps + signal wire */
(function () {
  'use strict';
  var B = window.BCX;
  if (!B || B.redstoneLoaded) return;
  B.redstoneLoaded = true;

  var LAMP = B.NB('Redstone Lamp');
  var LIT = B.NB('Lit Redstone Lamp');
  var BLOCK = B.NB('Block of Redstone');
  var DAY = B.NB('Daylight Detector');
  var TARGET = B.NB('Target');
  var REPEATER = B.NB('Redstone Repeater');
  var COMPARATOR = B.NB('Redstone Comparator');
  B.RS = { lamp: LAMP, lit: LIT, block: BLOCK, daylight: DAY, target: TARGET, repeater: REPEATER, comparator: COMPARATOR };
  B.redstoneTargets = B.redstoneTargets || {};

  function k(x, y, z) { return x + ',' + y + ',' + z; }
  function isWire(id) { return id === REPEATER || id === COMPARATOR; }
  function isPart(id) { return id === LAMP || id === LIT || id === BLOCK || id === DAY || id === TARGET || isWire(id); }
  function dayTime() {
    try { return Math.sin((B.app.time || 0) * Math.PI * 2) > .05; } catch (e) { return true; }
  }
  function activeTarget(x, y, z) {
    var key = k(x, y, z), t = B.redstoneTargets[key];
    if (!t || t <= 0) return false;
    return true;
  }
  function sourceAt(x, y, z) {
    var id = B.getBlock(x, y, z);
    if (id === BLOCK) return true;
    if (id === DAY && dayTime()) return true;
    if (id === TARGET && activeTarget(x, y, z)) return true;
    return false;
  }
  var DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  // A lamp is powered by an adjacent source, or by a chain of repeater/
  // comparator blocks ("signal wire") touching a source. This is deliberately
  // compact: there is no orientation, delay, or strength in this engine.
  B.redstonePowered = function (x, y, z) {
    var queue = [], seen = {}, i, d, nx, ny, nz, id;
    for (i = 0; i < 6; i++) {
      d = DIRS[i]; nx = x + d[0]; ny = y + d[1]; nz = z + d[2];
      if (sourceAt(nx, ny, nz)) return true;
      id = B.getBlock(nx, ny, nz);
      if (isWire(id) && !seen[k(nx, ny, nz)]) { seen[k(nx, ny, nz)] = 1; queue.push([nx, ny, nz]); }
    }
    var guard = 0;
    while (queue.length && guard++ < 96) {
      var w = queue.shift();
      for (i = 0; i < 6; i++) {
        d = DIRS[i]; nx = w[0] + d[0]; ny = w[1] + d[1]; nz = w[2] + d[2];
        if (sourceAt(nx, ny, nz)) return true;
        id = B.getBlock(nx, ny, nz);
        if (isWire(id) && !seen[k(nx, ny, nz)]) { seen[k(nx, ny, nz)] = 1; queue.push([nx, ny, nz]); }
      }
    }
    return false;
  };

  B.redstoneUpdateNear = function (x, y, z, r) {
    if (B._rsBusy || !B.app) return;
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); r = r === undefined ? 4 : r;
    B._rsBusy = true;
    try {
      for (var dx = -r; dx <= r; dx++) for (var dy = -r; dy <= r; dy++) for (var dz = -r; dz <= r; dz++) {
        var lx = x + dx, ly = y + dy, lz = z + dz, id = B.getBlock(lx, ly, lz);
        if (id !== LAMP && id !== LIT) continue;
        var want = B.redstonePowered(lx, ly, lz);
        if (want && id === LAMP) B.setBlock(lx, ly, lz, LIT);
        else if (!want && id === LIT) B.setBlock(lx, ly, lz, LAMP);
      }
    } finally { B._rsBusy = false; }
  };

  // Hook our own edits (commands, structures, tests) so a nearby lamp
  // responds immediately. The engine's player placement goes through
  // B.onBlockPlaced below.
  var oldSet = B.setBlock;
  B.setBlock = function (x, y, z, id) {
    var old = B.getBlock(x, y, z);
    oldSet(x, y, z, id);
    if (!B._rsBusy && (isPart(old) || isPart(Math.floor(id)))) {
      try { B.redstoneUpdateNear(x, y, z, 4); } catch (e) {}
    }
  };

  var oldBreak = B.breakBlock;
  B.breakBlock = function (hit) {
    var x = hit && hit.x, y = hit && hit.y, z = hit && hit.z;
    oldBreak(hit);
    try { if (x !== undefined) B.redstoneUpdateNear(x, y, z, 4); } catch (e) {}
  };

  B.onBlockPlaced = function (x, y, z) {
    try { B.redstoneUpdateNear(x, y, z, 4); } catch (e) {}
    var id = B.getBlock(x, y, z);
    if (id === LAMP && B.redstonePowered(x, y, z)) B.redstoneUpdateNear(x, y, z, 1);
  };

  // Right-click a Target to power the local circuit for five seconds.
  B.registerUse(function (e, hi, held) {
    if (!hi || hi.id !== TARGET) return false;
    var kk = k(hi.x, hi.y, hi.z);
    B.redstoneTargets[kk] = 5;
    B.toast('Target powers the circuit for 5 seconds');
    B.play('click', .3, .12);
    B.redstoneUpdateNear(hi.x, hi.y, hi.z, 4);
    return true;
  });

  B.rsT = 0;
  B.registerTick(function (dt) {
    if (!B.app || B.app.mode !== 'play') return;
    B.rsT += dt;
    // Target pulses count down in game time, so a loading stall cannot
    // silently expire a pulse while the main thread is blocked.
    for (var tk in B.redstoneTargets) {
      if (B.redstoneTargets[tk] > 0) B.redstoneTargets[tk] -= dt;
      if (B.redstoneTargets[tk] <= 0) delete B.redstoneTargets[tk];
    }
    if (B.rsT < .75) return;
    B.rsT = 0;
    var p = B.px();
    var x = Math.floor(p.x), y = Math.floor(p.y), z = Math.floor(p.z);
    B._rsBusy = true;
    try {
      for (var dx = -10; dx <= 10; dx++) for (var dy = -6; dy <= 6; dy++) for (var dz = -10; dz <= 10; dz++) {
        var id = B.getBlock(x + dx, y + dy, z + dz);
        if (id !== LAMP && id !== LIT) continue;
        var want = B.redstonePowered(x + dx, y + dy, z + dz);
        if (want && id === LAMP) B.setBlock(x + dx, y + dy, z + dz, LIT);
        else if (!want && id === LIT) B.setBlock(x + dx, y + dy, z + dz, LAMP);
      }
    } finally { B._rsBusy = false; }
  });
})();
