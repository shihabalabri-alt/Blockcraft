// Blockcraft service worker - custom project file (NOT vanilla Minecraft).
// v2: the game document is NETWORK-FIRST (users get every new deploy
// immediately whenever online; cache is only the offline fallback).
// Install assets (manifest/icons) stay cache-first; offline fallback '/'.
const CACHE = 'blockcraft-v5';
const ASSETS = [
  '/manifest.json', '/icon-192.png', '/icon-512.png',
  '/assets/fonts/Monocraft.ttf',
  '/assets/icons/trophy.png', '/assets/icons/menuGrid.png',
  '/assets/icons/multiplayer.png', '/assets/icons/barsHorizontal.png',
  '/assets/icons/audioOn.png', '/assets/icons/audioOff.png',
  '/assets/audio/place.ogg', '/assets/audio/break.ogg',
  '/assets/audio/step1.ogg', '/assets/audio/step2.ogg',
  '/assets/audio/boom.ogg', '/assets/audio/click.ogg',
  '/assets/textures/grass_top.png', '/assets/textures/grass_side.png',
  '/assets/textures/dirt.png', '/assets/textures/stone.png',
  '/assets/textures/cobble.png', '/assets/textures/sand.png',
  '/assets/textures/oak_log.png', '/assets/textures/oak_log_top.png',
  '/assets/textures/oak_leaves.png', '/assets/textures/planks.png',
  '/assets/textures/coal_ore.png', '/assets/textures/iron_ore.png',
  '/assets/textures/gold_ore.png', '/assets/textures/diamond_ore.png',
  '/assets/textures/redstone_ore.png', '/assets/textures/emerald_ore.png',
  '/assets/textures/copper_ore.png', '/assets/textures/lapis_ore.png',
  '/assets/textures/lapis_block.png', '/assets/textures/deepslate.png',
  '/assets/textures/deepslate_top.png',
  '/assets/textures/deepslate_lapis_ore.png',
  '/assets/textures/lapis_item.png',

  // BCX ITEM SPRITES
  '/assets/textures/items/apple.png',
  '/assets/textures/items/arrow.png',
  '/assets/textures/items/beef.png',
  '/assets/textures/items/bone.png',
  '/assets/textures/items/bow.png',
  '/assets/textures/items/bread.png',
  '/assets/textures/items/charcoal.png',
  '/assets/textures/items/chicken.png',
  '/assets/textures/items/coal.png',
  '/assets/textures/items/cooked_beef.png',
  '/assets/textures/items/cooked_chicken.png',
  '/assets/textures/items/cooked_mutton.png',
  '/assets/textures/items/cooked_porkchop.png',
  '/assets/textures/items/copper_ingot.png',
  '/assets/textures/items/diamond.png',
  '/assets/textures/items/diamond_axe.png',
  '/assets/textures/items/diamond_boots.png',
  '/assets/textures/items/diamond_chestplate.png',
  '/assets/textures/items/diamond_helmet.png',
  '/assets/textures/items/diamond_leggings.png',
  '/assets/textures/items/diamond_pickaxe.png',
  '/assets/textures/items/diamond_shovel.png',
  '/assets/textures/items/diamond_sword.png',
  '/assets/textures/items/emerald.png',
  '/assets/textures/items/feather.png',
  '/assets/textures/items/flint.png',
  '/assets/textures/items/flint_and_steel.png',
  '/assets/textures/items/gold_ingot.png',
  '/assets/textures/items/gunpowder.png',
  '/assets/textures/items/iron_axe.png',
  '/assets/textures/items/iron_boots.png',
  '/assets/textures/items/iron_chestplate.png',
  '/assets/textures/items/iron_helmet.png',
  '/assets/textures/items/iron_ingot.png',
  '/assets/textures/items/iron_leggings.png',
  '/assets/textures/items/iron_pickaxe.png',
  '/assets/textures/items/iron_shovel.png',
  '/assets/textures/items/iron_sword.png',
  '/assets/textures/items/lapis.png',
  '/assets/textures/items/leather.png',
  '/assets/textures/items/leather_boots.png',
  '/assets/textures/items/leather_chestplate.png',
  '/assets/textures/items/leather_helmet.png',
  '/assets/textures/items/leather_leggings.png',
  '/assets/textures/items/mutton.png',
  '/assets/textures/items/porkchop.png',
  '/assets/textures/items/raw_copper.png',
  '/assets/textures/items/raw_gold.png',
  '/assets/textures/items/raw_iron.png',
  '/assets/textures/items/redstone.png',
  '/assets/textures/items/rotten_flesh.png',
  '/assets/textures/items/stick.png',
  '/assets/textures/items/stone_axe.png',
  '/assets/textures/items/stone_pickaxe.png',
  '/assets/textures/items/stone_shovel.png',
  '/assets/textures/items/stone_sword.png',
  '/assets/textures/items/string.png',
  '/assets/textures/items/wheat.png',
  '/assets/textures/items/wheat_seeds.png',
  '/assets/textures/items/wooden_axe.png',
  '/assets/textures/items/wooden_pickaxe.png',
  '/assets/textures/items/wooden_shovel.png',
  '/assets/textures/items/wooden_sword.png',
  // BCX ITEM SPRITES END
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let path = '';
  try { path = new URL(req.url).pathname; } catch (_) {}
  const isGame = req.mode === 'navigate' || path === '/' || path === '/index.html';
  if (isGame) {
    // Fresh game whenever the network allows; fall back to the cached copy offline.
    e.respondWith(
      fetch(req).then((res) => {
        try {
          if (res && res.ok && res.type === 'basic') {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        try {
          if (res && res.ok && res.type === 'basic') {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
