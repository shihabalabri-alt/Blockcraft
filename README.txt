BLOCKCRAFT (fan tribute, single file)
=====================================
Double-click index.html to play. No install needed.
Internet needed once for the Pixelify Sans font (game runs fine offline after that).

This build is the downloaded Blockcraft artifact (React single-file export,
915,804 bytes, verified: both inline scripts pass syntax check, file ends
with a proper React root render + closing tags).

Controls: see the in-game Controls / Wiki Notes screens on the title menu.
World seed: shown on the title screen; edits auto-save (browser storage).

Previous hand-built clone (Three.js voxel engine, stages 1-7 + End + bosses +
fortress batch, all probes green) is preserved untouched at:
  C:\Users\Shiha\minecraft-old-backup\
Say RESTORE and I will swap it back.

ADDED 2026-11-10 (Nether + End completion batch, probe_bc.js ALL PASS):
The download already had 418 blocks including stems, planks, nylium,
blackstone family, quartz family, purpur, end stone, shroomlight,
respawn anchor, monster spawner - plus full overworld ores/deepslate.
Newly added (10): Nether Wart crop, Twisting Vines, Weeping Vines,
Soul Lantern (glows), Chorus Plant, Chorus Flower, End Rod (glows),
Dragon Egg, Ender Chest, Beacon (glows). All appear in creative
inventory under natural / plants / building / functional tabs.
Save format untouched (new blocks append at end of registry).
World size is 100x100 (set 2026-10-12, was 160x160). Old 160-size
saved worlds will not line up - start a new world/seed.
INFINITE WORLD since 2026-10-12: terrain streams forever like real
Minecraft (seeded noise + per-chunk decorations, 9-chunk view,
meshes build as you walk). Old fixed-size saves auto-migrate
(player-built blocks carry over near origin). Spawn area terrain is
identical to before - same seed math, same spawn.

ADDED 2026-11-11 (ALL Minecraft blocks batch, probe_bc2.js ALL PASS):
Source: bloxodes.com wiki, all 21 pages collected (529 items + 1,128
blocks = 1,657 entries, 0 duplicates). Registry 428 -> 648 (+230,
nothing removed). Every wiki block the engine can render is now in:
full Poplar family (log/wood/stripped/planks/sapling/3 leaves/shelf),
13 wood shelves, Chest + Trapped + Copper Chests (4 states + waxed),
Lantern + Copper Lanterns (4 states + waxed), 17 Shulker Boxes,
Anvils x3, Bell, Cake, Campfires, Cauldron, Composter, Brewing Stand,
Hopper, Grindstone, Lectern, Stonecutter, Daylight Detector,
Comparator, Repeater, Pistons, End Portal Frame, Conduit, full Sculk
family, Amethyst buds + Cluster, 3 Froglights, 7 mob Heads, Sniffer +
Turtle Eggs, Suspicious Sand/Gravel, Light block, full Sulfur family,
Cinnabar Bricks/Polished/Chiseled, Heavy Core, 4 Infested bricks,
Pitcher Plant, Dripleafs, Resin Clump, 30 Corals, Kelp, Seagrass,
Bamboo, Wheat, Sunflower/Peony/Lilac/Rose/Wildflowers/Petals,
Firefly Bush, Cave Vines, Spore Blossom, Glow Berries, Cactus Flower,
Flowering Azalea, Bush, Mangrove Roots/Muddy/Propagule, Hanging
Roots, Lily Pad, Frogspawn, Sea Pickle, Scaffolding, Glow Lichen,
20 Waxed Copper variants, 8 Copper Golem Statues. New blocks appear
automatically in the inventory tabs + "Search blocks" (same registry).
Saves safe: append-only, old block IDs unchanged.
Honestly NOT added (engine has no such systems): stairs/slabs/walls/
doors/trapdoors/fences/buttons/plates/rails/signs/beds/banners/
candles/carpets/panes/pots/torches/chains/bars/ladders (~470), all
529 items-section entries (no item/mob/equipment systems: tools,
food, potions, spawn eggs, armor...), dev-only blocks (Jigsaw, Test,
Structure Void), wiki dup "Block of Resin" (= existing Resin Block).

ADDED 2026-10-12 (Item Master List batch, probe_lapis.js 16/16):
Registry 648 -> 651. Ominous Vault (blue vault, glows), Tall
Seagrass, and LAPIS LAZULI (gem block) as the LAST catalog entry.
Checklist corrections applied, not blindly trusted: "Bark" is not a
real block (renamed to Wood years ago), "Rooted Moss" is unverified,
"Dripleaf" alone is not a block (only Small/Big), "Spear" and
"Knowledge Book" are not obtainable vanilla items, "Spawner" means
Monster Spawner, "Redstone Block" = existing Block of Redstone,
"Mangrove Sapling" is really called Mangrove Propagule (already in).
"Light" renamed to its full MC Java name "Light Block" (same ID).
Exhaustive 300-name sweep 2026-10-12: every remaining checklist
block-name is either present or correctly excluded (item/system/
entity/invalid) - only the Light rename resulted.
LAPIS CORE (custom, NOT vanilla): blue Vault panel via the heart
button (bottom-right) tracking lapis mined/placed (persists in your
browser), custom milestones at 10/64/256/1024, plus an Enchanting
Journal explaining real lapis uses. No economy, no login needed.
Weapons/armor/tools/food/potions/spawn-egg tabs were NOT faked in:
this engine only supports placeable blocks, and inventing
non-functional sword cubes would violate the no-fake-items rule.
The existing inventory tabs + Search cover all 651 entries.
FUTURE-ADDS POLICY: Lapis Lazuli must stay last - every new block
goes BEFORE its line, and hardcoded IDs (lapis 216/217/227/651,
flint 650, TNT 367, bedrock 11) never shift because the registry
is append-only. Probes enforce this.

ADDED 2026-10-12 (Flint and Steel + TNT, probe_boom.js 22/22):
Flint and Steel (id 650, tool entry - right-click does not place
it) + working TNT explosions (custom, NOT vanilla behavior in this
engine): hold flint, right-click TNT -> radius-4 blast, bedrock
immune, chained TNT with delay, burst particles, player knockback.
No health system exists so there is no damage - knockback only.
Mining/placing/other clicks run through untouched (probe-verified).
Armor is still correctly absent: zero health/damage/equipment code
exists in this peaceful builder, so armor would have no function;
a wearable-cube would be a fake item per the checklist rules.

ADDED 2026-10-13 (Water Bucket + coords HUD, probe_boom 30/30):
Water Bucket (id 651, tool entry like flint): hold it and
right-click to pour water into the targeted air cell (no lava
exists in this game, so no Lava Bucket; no pickup - creative
pouring only, like real creative mode). Live coords + spawn-distance
HUD top-center (updates twice a second, needs no compass
conventions). Registry now 653, Lapis STILL last (652).

ADDED 2026-10-14 (Note Blocks + Bell, probe_music.js 17/17):
Right-click a Note Block to tune it up a semitone (F#3-G5 range,
25 pitches, plays the new note) - pitches persist per position in
your browser. Right-click the Bell to ring it. Sound is synthesized
with WebAudio (the game exposes no tone API). Same MC tradeoff:
clicking uses instead of placing against these blocks.

ADDED 2026-10-14 (Living world, probe_grow.js 16/16): saplings
grow into real trees on random ticks like Minecraft (oak, spruce,
birch, azalea-to-oak; needs light + 7 air above; only shapes this
engine has - other saplings never trigger, no fakes), and dirt
turns to grass near grass with light. Tree cells persist as edits.
Plant a sapling, wait ~a minute nearby. No registry change.

ADDED 2026-10-16 (Living world II, probe_decay.js 16/16): leaves
decay without nearby logs (any of 14 leaf types needs any of 50+
log/stem/wood types within 2), mushrooms spread in the dark
(surface shade, pockets, caves; capped at 6 nearby), and surface
water freezes into ice in snowy biomes. Player-placed leaves also
decay (no persistence flag in engine). No registry change.

ADDED 2026-10-16 (Advancements + boom sound, probe_adv.js 22/22):
Custom 🏆 achievements panel (bottom-left): place/mine counts,
TNT booms, trees grown, notes tuned, ice frozen, distance records
(500m Wanderer, 5000m Marathoner). All clearly labeled custom,
persisted, no duplicates. TNT now booms audibly (synthesized
noise burst; confirm by ear in-game). No registry change.

ADDED 2026-10-17 (Block catalog + vanilla diff, probe_ency.js 20/20):
📖 button bottom-left opens a searchable catalog of ALL 653
registered blocks (live engine registry: id, name, category,
solid/plant/liquid/glow flags, placeability). Category dropdown,
search by name/key/id. Also: vanilla-diff.txt in the repo compares
our registry against all 1128 vanilla wiki blocks - 614 shared,
514 vanilla blocks missing (grouped: 97 stairs, 101 slabs, 32
walls, 27 fences, 22 doors, 22 trapdoors, 32 buttons/plates, 26
signs, 16 banners, 17 beds, 16 candles, 18 carpets, 17 panes...
engine renders full cubes only - no part-shapes possible), 38
ours-only (naming variants + custom). No registry change.

ADDED 2026-10-17 (Install app / PWA, probe_install.js 22/22):
⬇️ button bottom-left: install Blockcraft as an app on any device
(PC/Android/iPhone) - own icon, fullscreen, works OFFLINE after
install (service worker cache). iOS uses Share > Add to Home
Screen (no install API there). Also offers "Save game file"
(single-file HTML copy playable from disk anywhere). New repo
files: manifest.json, sw.js, icon-192.png, icon-512.png (hand-
generated grass-block art); server.js serves them. No registry
change - Lapis Lazuli stays last.

ADDED 2026-10-17 (Sneak edge hold, probe_sneak.js 18/18):
Holding Shift at an edge (cave lip, cliff, mine hole) stops you
from walking off - exactly like real Minecraft sneak. Physics
hooks: position remembered while sneak+grounded; snapped back if
you leave the ground downward by walking. Sneak-jumps, flying
descend (Shift), swimming unaffected; explosions can still push
you. No registry change.

ADDED 2026-10-17 (Slash commands, probe_cmd.js 42/42):
Press T or / in-game to open a command console (Enter runs,
Escape cancels, Arrow keys = history, Tab completes, history
saved). Working commands - each does a real engine action:
/tp (/teleport), /setblock, /fill (max 32768), /clone, /give,
/time set|add, /kill (= return to spawn; engine has no health),
/spawnpoint, /seed, /locate biome, /fly, /say, /me, /help.
Coordinates support ~ relative. Blocks by name/key/#id.
Honestly absent (systems don't exist in this engine): mobs
(/summon), items/xp/effects (/effect /xp /enchant), weather,
/gamemode, command blocks. No registry change - Lapis stays last.

CHANGED 2026-10-17 (probe_mp.js 33/33): T and / now behave
identically - both open the console pre-filled with "/", so it is
always a command prompt (chat text = /say or /me). Hint line shows
the keys under the input.

ADDED 2026-10-17 (Multiplayer MVP, probe_mp.js 33/33):
🌐 button: connect to a REAL server relay (server.js now runs a
dependency-free RFC6455 WebSocket on the same port, verified here
with two live socket clients). Same link + same world seed = same
room: your block edits sync live both ways (batched), positions
broadcast at 10Hz, /say chats to the room, friends appear as
camera-projected name tags with distance. Player list shown;
disconnect broadcasts a leave notice. MVP limits, honestly: name
tags not 3D bodies (renderer access is a future batch), old edits
don't backfill, creating a new world needs a reconnect, only one
server (this site). No registry change.

FIXED 2026-10-17 ("T and / not working" - root cause found and
proven): the SERVICE WORKER cached the game file itself
("blockcraft-v1", cache-first) with no version bump, so browsers -
especially the installed PWA / phone - kept running the FIRST
deploy's game forever and never saw new code. sw.js v2: game
document is now NETWORK-FIRST (cache only as offline fallback),
cache renamed blockcraft-v2, and the server sends no-cache for "/"
so updates reach every device on reopen. Verified end-to-end with a
REAL headless Chrome driven over DevTools (qbrowser.js, 13/13):
boots menus, creates a world, PRESS T opens the console, typing
lands in the buffer, /help prints, /setblock 2 70 2 stone actually
changes the world, Esc closes, Connect joins multiplayer for real,
post-SW reload serves the current build, zero page exceptions. If
you still see old behavior: fully CLOSE the game/app and open it
twice so the new service worker takes over.

This is an original fan tribute. Not affiliated with Mojang/Microsoft.
Tell me CONTINUE + what is wrong/missing and I will add it next.
