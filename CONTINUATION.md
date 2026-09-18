# CONTINUATION.md

## Current status

Playable web vertical slice implemented at `/nightshift`. The existing placement app remains available on its original routes. This work is committed in the same selected repository because it was the repository authorized for this session.

## Completed in this milestone

- Added a coherent dark hospital horror visual direction.
- Added original generated logo and environment texture assets.
- Added main menu with New Game, Load Game, Options placeholder, and Quit.
- Added splash-like intro monologue before control begins.
- Added centered camera canvas presentation.
- Added desktop controls and landscape-oriented mobile touch controls.
- Added player movement, gun pickup, limited ammo, reload, health kits, damage, and healing.
- Added enemy approach/combat, enemy death, artifact drops, and locked-door crafting interaction.
- Added antidote pickup and cure interaction with companion counter.
- Added Red Door requirement messaging and a boss encounter.
- Added pause, manual local save, load, timer state, and ending statistics screen.

## Partially completed

- The current demo has 18 normal enemies, so the Red Door's 40-kill requirement is intentionally visible but not reachable in this first vertical slice. Increase the population and add room-gated spawns for the full campaign.
- Companion behavior is represented by the cure state/counter but needs follower movement and melee AI.
- Random room content, room-specific fog-of-war, and persistent enemy/room state need to be expanded.
- Options UI currently shows a placeholder message; add real music toggle and volume persistence.
- Audio is not yet wired.

## Known bugs / risks

- Canvas texture pattern is created per frame and should be cached before Android performance testing.
- Collision and navigation are intentionally lightweight; enemies can overlap walls in the current slice.
- `window.close()` is usually blocked by browsers and should be replaced with platform-appropriate Android back behavior.
- No Android wrapper or APK has been produced yet because the environment does not include Gradle/ADB/Android SDK.

## Current balancing values

- Player max HP: 200
- Normal enemy damage: 20 HP per second while in contact
- Normal enemy HP: 2 hits
- Gun magazine: 12
- Starting reserve: 18
- Standard door craft cost: 4 metal artifacts
- Boss HP: 40
- Target Red Door requirements: 40 kills and 2 cured companions

## Important files

- `client/src/pages/NightshiftGame.tsx`
- `client/src/pages/NightshiftGame.css`
- `client/src/App.tsx`
- `client/public/game-logo.png`
- `client/public/game-texture.png`
- `README.md`

## Android build status

Not yet available. Next exact step: install/add Capacitor and Android platform files, configure package id `com.bunny0arch.nightshift`, lock landscape orientation, then build and smoke test a debug APK.

## Next recommended task

Split the canvas logic into `game/` modules, cache rendering assets, add a deterministic 5-room campaign with at least 48 enemies and guaranteed antidote locations, implement companion follow/melee/armor/weapon systems, then wrap with Capacitor and verify on Android.
