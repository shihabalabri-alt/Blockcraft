/* BLOCKCRAFT SURVIVAL LAYER - mobs, combat, projectiles */
(function () {
  'use strict';
  var B = window.BCX;
  if (!B || B.mobsLoaded) return;
  B.mobsLoaded = true;

  B.mobs = [];
  B.projectiles = [];
  B.spawners = B.spawners || [];
  B.mobCount = function () { return B.mobs.length; };
  B.lastAttack = 0;
  B.spawnT = 0;
  B.spawnerT = 0;

  function el(tag, cls, parent, html) {
    var e = document.createElement(tag); if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z; return Math.sqrt(dx * dx + dy * dy + dz * dz); }

  function wool(name) {
    var id = B.NB(name);
    if (id < 0) id = B.NB('White Wool');
    if (id < 0) id = B.NB('Wool');
    if (id < 0) id = B.NB('Stone');
    return id;
  }
  function solid(name) { var id = B.NB(name); return id >= 0 ? id : B.NB('Stone'); }

  /* body plan: simple cube creatures built from the game's own block atlas */
  var DEFS = {
    pig: {
      name: 'Pig', hp: 10, hostile: false, speed: 1.0, height: .9, w: .9, d: 1.2, xp: 1,
      parts: [
        { b: 'Pink Wool', s: [.78, .62, 1.15], o: [0, .62, 0], tint: 0xffb8b8 },
        { b: 'Pink Wool', s: [.55, .55, .55], o: [0, .78, .68], tint: 0xffc4c4 },
        { b: 'Pink Wool', s: [.12, .12, .05], o: [-.2, .75, .96], tint: 0x3a2020 },
        { b: 'Pink Wool', s: [.12, .12, .05], o: [.2, .75, .96], tint: 0x3a2020 },
        { b: 'Pink Wool', s: [.2, .45, .2], o: [-.28, .45, .35], leg: 1 },
        { b: 'Pink Wool', s: [.2, .45, .2], o: [.28, .45, .35], leg: 1, ph: 2 },
        { b: 'Pink Wool', s: [.2, .45, .2], o: [-.28, .45, -.35], leg: 1, ph: 2 },
        { b: 'Pink Wool', s: [.2, .45, .2], o: [.28, .45, -.35], leg: 1, ph: 4 }
      ]
    },
    cow: {
      name: 'Cow', hp: 10, hostile: false, speed: .9, height: 1.1, w: 1, d: 1.3, xp: 1,
      parts: [
        { b: 'Brown Wool', s: [.85, .7, 1.3], o: [0, .75, 0], tint: 0x8a5a3a },
        { b: 'Brown Wool', s: [.62, .55, .55], o: [0, .95, .78], tint: 0x5a3a24 },
        { b: 'White Wool', s: [.3, .16, .08], o: [0, .85, 1.05], tint: 0xe8e0d8 },
        { b: 'White Wool', s: [.1, .1, .05], o: [-.32, .95, .98], tint: 0xeee },
        { b: 'White Wool', s: [.1, .1, .05], o: [.32, .95, .98], tint: 0xeee },
        { b: 'Brown Wool', s: [.22, .5, .22], o: [-.32, .5, .4], leg: 1, tint: 0x5a3a24 },
        { b: 'Brown Wool', s: [.22, .5, .22], o: [.32, .5, .4], leg: 1, tint: 0x5a3a24, ph: 2 },
        { b: 'Brown Wool', s: [.22, .5, .22], o: [-.32, .5, -.4], leg: 1, tint: 0x5a3a24, ph: 2 },
        { b: 'Brown Wool', s: [.22, .5, .22], o: [.32, .5, -.4], leg: 1, tint: 0x5a3a24, ph: 4 }
      ]
    },
    sheep: {
      name: 'Sheep', hp: 8, hostile: false, speed: 1.0, height: 1.1, w: .95, d: 1.15, xp: 1,
      parts: [
        { b: 'White Wool', s: [.9, .7, 1.15], o: [0, .7, 0], tint: 0xf2f2ea },
        { b: 'White Wool', s: [.55, .55, .55], o: [0, .85, .72], tint: 0xe8e0d0 },
        { b: 'White Wool', s: [.5, .3, .25], o: [0, .65, .7], tint: 0xd8d0c0 },
        { b: 'White Wool', s: [.1, .1, .05], o: [-.2, .9, .98], tint: 0x222 },
        { b: 'White Wool', s: [.1, .1, .05], o: [.2, .9, .98], tint: 0x222 },
        { b: 'White Wool', s: [.18, .42, .18], o: [-.28, .42, .32], leg: 1, tint: 0xd8d0c0 },
        { b: 'White Wool', s: [.18, .42, .18], o: [.28, .42, .32], leg: 1, tint: 0xd8d0c0, ph: 2 },
        { b: 'White Wool', s: [.18, .42, .18], o: [-.28, .42, -.32], leg: 1, tint: 0xd8d0c0, ph: 2 },
        { b: 'White Wool', s: [.18, .42, .18], o: [.28, .42, -.32], leg: 1, tint: 0xd8d0c0, ph: 4 }
      ]
    },
    chicken: {
      name: 'Chicken', hp: 4, hostile: false, speed: 1.25, height: .7, w: .5, d: .5, xp: 1,
      parts: [
        { b: 'White Wool', s: [.45, .4, .5], o: [0, .45, 0], tint: 0xf4f0e8 },
        { b: 'White Wool', s: [.3, .32, .3], o: [0, .73, .16], tint: 0xf8f4ec },
        { b: 'Yellow Wool', s: [.14, .08, .16], o: [0, .7, .34], tint: 0xf0c030 },
        { b: 'Red Wool', s: [.08, .18, .08], o: [0, .86, .12], tint: 0xd03030 },
        { b: 'Yellow Wool', s: [.08, .18, .08], o: [-.12, .16, 0], leg: 1, tint: 0xe0a020 },
        { b: 'Yellow Wool', s: [.08, .18, .08], o: [.12, .16, 0], leg: 1, tint: 0xe0a020, ph: 2 }
      ]
    },
    zombie: {
      name: 'Zombie', hp: 20, hostile: true, speed: 1.35, height: 1.9, w: .6, d: .6, xp: 5, damage: 3,
      parts: [
        { b: 'Green Wool', s: [.55, .75, .32], o: [0, 1.05, 0], tint: 0x4f7a3a },
        { b: 'Green Wool', s: [.5, .5, .5], o: [0, 1.65, 0], tint: 0x5d8a45 },
        { b: 'Black Wool', s: [.12, .1, .05], o: [-.13, 1.68, .25], tint: 0x222 },
        { b: 'Black Wool', s: [.12, .1, .05], o: [.13, 1.68, .25], tint: 0x222 },
        { b: 'Green Wool', s: [.18, .7, .18], o: [-.36, 1.25, 0], leg: 1, tint: 0x4a7035 },
        { b: 'Green Wool', s: [.18, .7, .18], o: [.36, 1.25, 0], leg: 1, tint: 0x4a7035, ph: 2 },
        { b: 'Blue Wool', s: [.2, .65, .2], o: [-.22, .55, 0], leg: 1, tint: 0x3a4a7a },
        { b: 'Blue Wool', s: [.2, .65, .2], o: [.22, .55, 0], leg: 1, tint: 0x3a4a7a, ph: 2 }
      ]
    },
    skeleton: {
      name: 'Skeleton', hp: 20, hostile: true, speed: 1.25, height: 1.9, w: .55, d: .55, xp: 5, damage: 2, ranged: true,
      parts: [
        { b: 'Bone Block', s: [.42, .75, .26], o: [0, 1.05, 0], tint: 0xe0e0d0 },
        { b: 'Bone Block', s: [.48, .46, .46], o: [0, 1.62, 0], tint: 0xeeeedd },
        { b: 'Black Wool', s: [.1, .1, .05], o: [-.12, 1.65, .23], tint: 0x222 },
        { b: 'Black Wool', s: [.1, .1, .05], o: [.12, 1.65, .23], tint: 0x222 },
        { b: 'Bone Block', s: [.13, .7, .13], o: [-.3, 1.22, 0], leg: 1, tint: 0xd8d8c8 },
        { b: 'Bone Block', s: [.13, .7, .13], o: [.3, 1.22, 0], leg: 1, tint: 0xd8d8c8, ph: 2 },
        { b: 'Bone Block', s: [.14, .68, .14], o: [-.17, .5, 0], leg: 1, tint: 0xd0d0c0 },
        { b: 'Bone Block', s: [.14, .68, .14], o: [.17, .5, 0], leg: 1, tint: 0xd0d0c0, ph: 2 }
      ]
    },
    creeper: {
      name: 'Creeper', hp: 20, hostile: true, speed: 1.2, height: 1.7, w: .6, d: .6, xp: 5, damage: 0, creeper: true,
      parts: [
        { b: 'Green Wool', s: [.5, .85, .34], o: [0, .95, 0], tint: 0x4a8a3a },
        { b: 'Green Wool', s: [.55, .55, .55], o: [0, 1.6, 0], tint: 0x56a044 },
        { b: 'Black Wool', s: [.14, .14, .05], o: [-.14, 1.65, .25], tint: 0x111 },
        { b: 'Black Wool', s: [.14, .14, .05], o: [.14, 1.65, .25], tint: 0x111 },
        { b: 'Black Wool', s: [.12, .22, .05], o: [0, 1.45, .26], tint: 0x111 },
        { b: 'Green Wool', s: [.18, .4, .18], o: [-.2, .32, .15], leg: 1, tint: 0x3f7a33 },
        { b: 'Green Wool', s: [.18, .4, .18], o: [.2, .32, .15], leg: 1, tint: 0x3f7a33, ph: 2 },
        { b: 'Green Wool', s: [.18, .4, .18], o: [-.2, .32, -.15], leg: 1, tint: 0x3f7a33, ph: 2 },
        { b: 'Green Wool', s: [.18, .4, .18], o: [.2, .32, -.15], leg: 1, tint: 0x3f7a33, ph: 4 }
      ]
    },
    spider: {
      name: 'Spider', hp: 16, hostile: true, speed: 1.7, height: .8, w: 1.1, d: 1.1, xp: 5, damage: 2,
      parts: [
        { b: 'Black Wool', s: [.8, .5, .8], o: [0, .55, -.1], tint: 0x30282a },
        { b: 'Black Wool', s: [.45, .4, .45], o: [0, .6, .45], tint: 0x3a3032 },
        { b: 'Red Wool', s: [.09, .09, .05], o: [-.13, .67, .68], tint: 0xd02020 },
        { b: 'Red Wool', s: [.09, .09, .05], o: [.13, .67, .68], tint: 0xd02020 },
        { b: 'Black Wool', s: [.7, .1, .1], o: [-.55, .48, .3], tint: 0x2a2224, leg: 1 },
        { b: 'Black Wool', s: [.7, .1, .1], o: [.55, .48, .3], tint: 0x2a2224, leg: 1, ph: 2 },
        { b: 'Black Wool', s: [.7, .1, .1], o: [-.55, .48, -.2], tint: 0x2a2224, leg: 1, ph: 2 },
        { b: 'Black Wool', s: [.7, .1, .1], o: [.55, .48, -.2], tint: 0x2a2224, leg: 1, ph: 4 }
      ]
    }
  };
  B.mobDefs = DEFS;

  function makeMob(type, x, y, z) {
    var def = DEFS[type]; if (!def) return null;
    var parts = [];
    for (var i = 0; i < def.parts.length; i++) {
      var p = def.parts[i];
      var bid = B.NB(p.b); if (bid < 0) bid = solid('Stone');
      var mesh;
      try { mesh = window.__puppetApi.mk(bid); } catch (e) { B.mobError = String(e && e.stack || e) + ' | block ' + p.b + ' id ' + bid; return null; }
      mesh.material = mesh.material.clone();
      mesh.material.depthTest = true; mesh.material.depthWrite = true;
      if (p.tint !== undefined) mesh.material.color.setHex(p.tint);
      mesh.scale.set(p.s[0], p.s[1], p.s[2]);
      if (p.leg) mesh.geometry.translate(0, -.5, 0);
      B.app.scene.add(mesh);
      parts.push({ m: mesh, ox: p.o[0], oy: p.o[1], oz: p.o[2], leg: !!p.leg, ph: p.ph || 0, base: p.tint });
    }
    var mob = {
      type: type, def: def, parts: parts, x: x, y: y, z: z, yaw: Math.random() * 6.28,
      hp: def.hp, maxHp: def.hp, state: 'idle', timer: rnd(1, 4), attackCd: 0, fuse: 0,
      walk: Math.random() * 6, moveAmt: 0, vy: 0, hurtT: 0, grounded: false
    };
    B.mobs.push(mob);
    return mob;
  }
  B.spawnMobAt = function (type, x, y, z) { return makeMob(type, x, y, z); };

  function removeMob(mob, quiet) {
    for (var i = 0; i < mob.parts.length; i++) {
      var m = mob.parts[i].m;
      try { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); } catch (e) {}
    }
    var idx = B.mobs.indexOf(mob); if (idx >= 0) B.mobs.splice(idx, 1);
    if (!quiet) {
      var dps = dropsFor(mob.type);
      for (var d = 0; d < dps.length; d++) B.spawnDrop(dps[d].id, dps[d].count, mob.x, mob.y + .5, mob.z);
      B.addXP(mob.def.xp || 1);
      B.play('wool', .3, .1);
      for (var k = 0; k < 7; k++) B.spawnParticles(mob.x, mob.y + .5, mob.z, B.NB('White Wool'));
    }
  }
  B.removeAllMobs = function () { B.mobs.slice().forEach(function (m) { removeMob(m, true); }); };

  function dropsFor(type) {
    switch (type) {
      case 'pig': return [{ id: 'porkchop', count: ri(1, 3) }];
      case 'cow': return [{ id: 'beef', count: ri(1, 3) }, { id: 'leather', count: ri(0, 2) }];
      case 'sheep': return [{ id: 'mutton', count: ri(1, 2) }, { id: B.NB('White Wool'), count: 1 }];
      case 'chicken': return [{ id: 'chicken', count: 1 }, { id: 'feather', count: ri(0, 2) }];
      case 'zombie': return [{ id: 'rotten_flesh', count: ri(0, 2) }];
      case 'skeleton': return [{ id: 'bone', count: ri(0, 2) }, { id: 'arrow', count: ri(0, 2) }];
      case 'creeper': return [{ id: 'gunpowder', count: ri(0, 2) }];
      case 'spider': return [{ id: 'string', count: ri(0, 2) }];
    }
    return [];
  }
  B.mobDrops = dropsFor;

  function pose(mob) {
    var c = Math.cos(mob.yaw), s = Math.sin(mob.yaw);
    for (var i = 0; i < mob.parts.length; i++) {
      var p = mob.parts[i], m = p.m;
      var wx = mob.x + p.ox * c + p.oz * s;
      var wz = mob.z - p.ox * s + p.oz * c;
      m.position.set(wx, mob.y + p.oy, wz);
      m.rotation.y = mob.yaw;
      if (p.leg) m.rotation.x = Math.sin(mob.walk + p.ph) * .55 * mob.moveAmt;
      if (mob.hurtT > 0) {
        m.material.color.setHex(0xff7777);
      } else if (p.base !== undefined) m.material.color.setHex(p.base);
    }
  }

  function moveMob(mob, dx, dz, dt) {
    var nx = mob.x + dx, nz = mob.z + dz;
    var gy = B.topY(nx, nz) + 1;
    if (gy > mob.y + 1.15) { mob.yaw += Math.PI * .7; mob.moveAmt = .3; return; }
    var surf = B.getBlock(nx, gy - 1, nz);
    if (surf === B.waterId) { mob.yaw += Math.PI; return; }
    mob.x = nx; mob.z = nz;
    if (gy > mob.y && gy - mob.y <= 1.15) { mob.y = gy; mob.vy = 0; mob.grounded = true; }
    mob.moveAmt = Math.min(1, Math.sqrt(dx * dx + dz * dz) / Math.max(.001, dt) / 2);
  }

  function fireArrow(mob, target) {
    var dxc = target.x - mob.x, dyc = (target.y + 1) - (mob.y + 1.3), dzc = target.z - mob.z;
    var len = Math.sqrt(dxc * dxc + dyc * dyc + dzc * dzc) || 1;
    var sp = 11;
    var m = B.makeDropMesh('arrow');
    if (!m) return;
    try { m.scale.set(1.2, 1.2, 1.2); } catch (e) {}
    B.app.scene.add(m);
    m.position.set(mob.x, mob.y + 1.3, mob.z);
    B.projectiles.push({ mesh: m, x: mob.x, y: mob.y + 1.3, z: mob.z, vx: dxc / len * sp, vy: dyc / len * sp + .7, vz: dzc / len * sp, life: 3, dmg: 2 });
    B.play('click', .2, .03);
  }
  B.spawnArrow = function (x, y, z, dx, dy, dz, dmg, fromPlayer) {
    var m = B.makeDropMesh('arrow'); if (!m) return null;
    B.app.scene.add(m); m.position.set(x, y, z);
    var pr = { mesh: m, x: x, y: y, z: z, vx: dx, vy: dy, vz: dz, life: 4, dmg: dmg || 2, fromPlayer: !!fromPlayer };
    B.projectiles.push(pr);
    return pr;
  };

  B.registerUse(function (e, hi, held) {
    if (!held || held.id !== 'bow' || !B.app) return false;
    var t = performance.now();
    if (t - (B.bowCd || 0) < 520) return true;
    if (B.gm !== 'creative' && B.countItem('arrow') < 1) { B.toast('No arrows'); return true; }
    var cam = B.app.camera;
    var dir = new (B.app.player.pos.constructor)();
    cam.getWorldDirection(dir);
    var pr = B.spawnArrow(cam.position.x + dir.x * .6, cam.position.y + dir.y * .6 - .12, cam.position.z + dir.z * .6,
      dir.x * 24, dir.y * 24 + 1.1, dir.z * 24, 3, true);
    if (!pr) return true;
    if (B.gm !== 'creative') {
      B.takeItem('arrow', 1);
      held.dur = (held.dur === undefined ? 384 : held.dur) - 1;
      if (held.dur <= 0) { B.inv[B.selected] = null; B.toast('Bow broke'); }
    }
    B.bowCd = t;
    B.play('click', .34, .04);
    B.refreshHotbar(); B.markDirty();
    return true;
  });

  B.explodeAt = function (cx, cy, cz, radius, maxDmg, sourceMob) {
    B.play('break', .8, .02);
    var r = radius || 2.6, dmg = maxDmg || 12, removed = 0;
    var ri = Math.ceil(r);
    for (var x = -ri; x <= ri; x++) for (var y = -ri; y <= ri; y++) for (var z = -ri; z <= ri; z++) {
      if (x * x + y * y + z * z > r * r) continue;
      var bx = Math.floor(cx + x), by = Math.floor(cy + y), bz = Math.floor(cz + z);
      var id = B.getBlock(bx, by, bz);
      if (!id) continue;
      var k = B.KB(id);
      if (/BEDROCK|OBSIDIAN|WATER|LAVA/.test(k)) continue;
      if (B.hardness(k) > 8) continue;
      B.setBlock(bx, by, bz, 0); removed++;
    }
    var p = B.px(), pd = Math.sqrt((cx - p.x) * (cx - p.x) + (cy - p.y) * (cy - p.y) + (cz - p.z) * (cz - p.z));
    if (pd < r + 2.5) B.damage(Math.max(2, dmg - pd * 2), { force: false });
    for (var i = B.mobs.length - 1; i >= 0; i--) {
      var m = B.mobs[i]; if (m === sourceMob) continue;
      var md = Math.sqrt((cx - m.x) * (cx - m.x) + (cy - m.y) * (cy - m.y) + (cz - m.z) * (cz - m.z));
      if (md < r + 1.5) {
        m.hp -= Math.max(2, dmg - md * 2); m.hurtT = .3;
        if (m.hp <= 0) removeMob(m, false);
      }
    }
    try { B.spawnParticles(cx, cy, cz, B.NB('Fire')); } catch (e) {}
    try {
      if (window.__boomFx) window.__boomFx(cx, cy, cz);
      else { var boom = new Audio('/assets/audio/boom.ogg'); boom.volume = .55; boom.play(); }
    } catch (e) {}
    return removed;
  };
  function explode(mob) {
    B.explodeAt(mob.x, mob.y, mob.z, 2.6, 12, mob);
    removeMob(mob, true);
  }

  function tickMobs(dt) {
    if (!B.ready || !B.app) return;
    var app = B.app, p = app.player.pos;
    for (var i = B.mobs.length - 1; i >= 0; i--) {
      var mob = B.mobs[i], def = mob.def;
      var d = dist(mob, p);
      if (d > 90) { removeMob(mob, true); continue; }
      mob.timer -= dt; mob.attackCd = Math.max(0, mob.attackCd - dt); mob.hurtT = Math.max(0, mob.hurtT - dt);
      var dx = p.x - mob.x, dz = p.z - mob.z;
      var d2 = Math.sqrt(dx * dx + dz * dz);
      var speed = def.speed;
      var moving = false, mx = 0, mz = 0;
      if (def.hostile && !B.dead && d < 26) {
        if (mob.state !== 'chase') { mob.state = 'chase'; }
        if (d2 > .2) mob.yaw = Math.atan2(-dx, -dz);
        if (d2 > 1.5) { mx = -Math.sin(mob.yaw) * speed * dt; mz = -Math.cos(mob.yaw) * speed * dt; moving = true; }
        if (def.ranged && d2 > 4 && d2 < 22 && mob.attackCd <= 0) { fireArrow(mob, p); mob.attackCd = 2.2; }
        if (!def.ranged && d2 < 2.0 && mob.attackCd <= 0) {
          mob.attackCd = 1.1;
          B.damage(def.damage || 2);
          try { app.player.vel.y = 4; } catch (e) {}
          mob.moveAmt = .5;
        }
        if (def.creeper) {
          if (d2 < 2.7) {
            mob.fuse += dt;
            if (mob.fuse > 1.5) { explode(mob); continue; }
            B.play('click', .2, .02);
          } else mob.fuse = Math.max(0, mob.fuse - dt * 2);
        }
      } else {
        if (mob.state === 'flee') {
          mob.yaw = Math.atan2(dx, dz);
          mx = -Math.sin(mob.yaw) * def.speed * 1.5 * dt; mz = -Math.cos(mob.yaw) * def.speed * 1.5 * dt;
          moving = true;
          if (mob.timer <= 0) mob.state = 'idle';
        } else {
          if (mob.timer <= 0) { mob.timer = rnd(2, 6); mob.yaw = Math.random() * 6.28; mob.state = Math.random() < .55 ? 'walk' : 'idle'; }
          if (mob.state === 'walk') { mx = -Math.sin(mob.yaw) * speed * .55 * dt; mz = -Math.cos(mob.yaw) * speed * .55 * dt; moving = true; }
        }
      }
      if (moving) {
        moveMob(mob, mx, mz, dt);
        mob.walk += dt * 7;
      } else mob.moveAmt *= .8;
      // gravity
      if (!mob.grounded || mob.y > B.topY(mob.x, mob.z) + 1.2) {
        mob.vy -= 18 * dt; mob.y += mob.vy * dt;
        var g = B.topY(mob.x, mob.z) + 1;
        if (mob.y <= g) { mob.y = g; mob.vy = 0; mob.grounded = true; }
        else mob.grounded = false;
      } else {
        var gg = B.topY(mob.x, mob.z) + 1;
        if (mob.y > gg + .2) { mob.grounded = false; }
        else mob.y = gg;
      }
      pose(mob);
    }
    // projectiles
    for (var j = B.projectiles.length - 1; j >= 0; j--) {
      var pr = B.projectiles[j]; pr.life -= dt;
      pr.vy -= 12 * dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.z += pr.vz * dt;
      if (pr.mesh) { pr.mesh.position.set(pr.x, pr.y, pr.z); pr.mesh.rotation.z = Math.atan2(pr.vy, Math.sqrt(pr.vx * pr.vx + pr.vz * pr.vz)); }
      var hitPlayer = dist(pr, { x: p.x, y: p.y + .9, z: p.z }) < .75;
      if (hitPlayer && !pr.fromPlayer && !B.dead) { B.damage(pr.dmg); B.removeProjectile(pr); continue; }
      var hitMob = null;
      for (var m = 0; m < B.mobs.length; m++) if (dist(pr, { x: B.mobs[m].x, y: B.mobs[m].y + .8, z: B.mobs[m].z }) < .8) { hitMob = B.mobs[m]; break; }
      if (hitMob) {
        if (pr.fromPlayer) {
          hitMob.hp -= pr.dmg || 3;
          hitMob.hurtT = .22;
          B.spawnParticles(hitMob.x, hitMob.y + .8, hitMob.z, B.NB('White Wool'));
          if (hitMob.hp <= 0) removeMob(hitMob, false);
        }
        B.removeProjectile(pr); continue;
      }
      if (B.solid(pr.x, pr.y, pr.z) || pr.life <= 0) { B.removeProjectile(pr); continue; }
    }
  }
  B.removeProjectile = function (pr) {
    try { if (pr.mesh && pr.mesh.parent) pr.mesh.parent.remove(pr.mesh); } catch (e) {}
    var i = B.projectiles.indexOf(pr); if (i >= 0) B.projectiles.splice(i, 1);
  };

  /* player attack hook */
  B.onAttack = function () {
    if (!B.app || B.dead) return false;
    var t = performance.now();
    if (t - B.lastAttack < 300) return false;
    var cam = B.app.camera;
    var dir = new (B.app.player.pos.constructor)();
    cam.getWorldDirection(dir);
    var cp = cam.position;
    var best = null, bestD = 5;
    for (var i = 0; i < B.mobs.length; i++) {
      var mob = B.mobs[i];
      var vx = mob.x - cp.x, vy = mob.y + mob.def.height * .55 - cp.y, vz = mob.z - cp.z;
      var len = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (len > 5) continue;
      var dot = (vx * dir.x + vy * dir.y + vz * dir.z) / (len || 1);
      if (dot > .965 && len < bestD) { best = mob; bestD = len; }
    }
    if (!best) return false;
    B.lastAttack = t;
    var st = B.held(), d = st && B.items[st.id];
    var dmg = 1;
    if (d && d.damage) dmg = d.damage;
    if (st && st.ench && st.ench.sharpness) dmg += .5 + st.ench.sharpness * .5;
    best.hp -= dmg;
    best.hurtT = .22;
    best.state = 'flee'; best.timer = 4;
    var kb = 1.4;
    if (best.def.hostile) { best.state = 'chase'; }
    B.play(d && d.type === 'sword' ? 'click' : 'stone', .3, .06);
    B.spawnParticles(best.x, best.y + .8, best.z, B.NB('White Wool'));
    if (d && d.dur && /sword|axe/.test(st.id)) {
      st.dur = (st.dur === undefined ? d.dur : st.dur) - 1;
      if (st.dur <= 0) { B.inv[B.selected] = null; B.toast(d.name + ' broke'); }
      B.refreshHotbar();
    }
    if (best.hp <= 0) removeMob(best, false);
    return true;
  };

  /* spawning */
  function surfaceBlock(x, z) {
    var y = B.topY(x, z);
    return { x: x, y: y + 1, z: z, id: B.getBlock(x, y, z), key: B.KB(B.getBlock(x, y, z)) };
  }
  function canSpawnAt(s) {
    if (s.y < 4) return false;
    if (!/GRASS|DIRT|SAND|SNOW|PODZOL/.test(s.key)) return false;
    if (B.getBlock(s.x, s.y, s.z) !== 0 || B.getBlock(s.x, s.y + 1, s.z) !== 0) return false;
    var p = B.px(); if (Math.abs(s.x - p.x) < 10 && Math.abs(s.z - p.z) < 10) return false;
    return true;
  }
  B.trySpawnMob = function (type, minD, maxD) {
    var ang = Math.random() * Math.PI * 2, d = rnd(minD || 14, maxD || 34);
    var x = Math.floor(B.px().x + Math.cos(ang) * d), z = Math.floor(B.px().z + Math.sin(ang) * d);
    var s = surfaceBlock(x, z);
    if (!canSpawnAt(s)) return null;
    return makeMob(type, s.x + .5, s.y, s.z + .5);
  };
  function dayTime() {
    try { return Math.sin((B.app.time || 0) * Math.PI * 2) > .05; } catch (e) { return true; }
  }
  B.spawnT = 0;
  B.registerTick(function (dt) {
    tickMobs(dt);
    B.spawnT += dt;
    if (B.spawnT < 5) return;
    B.spawnT = 0;
    if (!B.app || B.app.mode !== 'play' || B.dead) return;
    var passive = 0, hostile = 0;
    B.mobs.forEach(function (m) { if (m.def.hostile) hostile++; else passive++; });
    var day = dayTime();
    if (B.mobs.length < 16) {
      var wantHostile = !day || Math.random() < .25;
      if (wantHostile && hostile < 9) {
        var types = ['zombie', 'skeleton', 'creeper', 'spider'];
        B.trySpawnMob(types[ri(0, 3)], 16, 38);
      } else if (day && passive < 8) {
        var pt = ['pig', 'cow', 'sheep', 'chicken'];
        B.trySpawnMob(pt[ri(0, 3)], 12, 34);
      }
    }
    // dungeon spawners
    for (var i = 0; i < B.spawners.length; i++) {
      var sp = B.spawners[i];
      if (dist(sp, B.px()) > 20) continue;
      var nearby = 0;
      for (var j = 0; j < B.mobs.length; j++) if (dist(B.mobs[j], sp) < 12 && B.mobs[j].def.hostile) nearby++;
      if (nearby < 5) {
        var t = Math.random() < .6 ? 'zombie' : 'skeleton';
        // Spawn inside the dungeon chamber around the spawner, not on the surface.
        var x = sp.x + ri(-3, 3), z = sp.z + ri(-3, 3);
        var y = sp.y - 1;
        if (B.getBlock(x, y, z) === 0 && B.getBlock(x, y + 1, z) === 0 && B.solid(x, y - 1, z)) {
          makeMob(t, x + .5, y, z + .5);
        }
      }
    }
  });

  B.registerCommand && B.registerCommand('summon', function (a) {
    var type = (a[0] || '').toLowerCase();
    if (!DEFS[type]) return [{ t: 'Unknown mob. Try: ' + Object.keys(DEFS).join(', '), ok: false }];
    var p = B.px();
    var m = makeMob(type, p.x + 3, B.topY(p.x + 3, p.z) + 1, p.z);
    return [{ t: m ? 'Summoned ' + DEFS[type].name : 'Summon failed', ok: !!m }];
  }, '/summon pig|cow|sheep|chicken|zombie|skeleton|creeper|spider');
  B.registerCommand('mobs', function () {
    var counts = {};
    B.mobs.forEach(function (m) { counts[m.type] = (counts[m.type] || 0) + 1; });
    return [{ t: 'Mobs ' + B.mobs.length + ' ' + JSON.stringify(counts), ok: true }];
  }, '/mobs - list loaded mobs');

  B.onWorld.push(function () { B.removeAllMobs(); B.projectiles.slice().forEach(function (p) { B.removeProjectile(p); }); });
  B.mobsReady = true;
})();
