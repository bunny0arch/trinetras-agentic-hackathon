# NIGHTSHIFT: THE RED DOOR

A landscape 2D top-down horror/survival shooter built as an isolated playable route inside the existing project. Open `/nightshift` to play.

## Current build

This milestone includes a complete browser-playable vertical slice: splash/menu presentation, new/load flow using localStorage, centered world camera, keyboard/mouse controls, touch joystick and action buttons, gun pickup, limited magazine/reserve ammo, reload, healing, enemies, artifact drops, crafting-style locked door interaction, antidote/cure interaction, companion counter, Red Door requirement messaging, boss encounter, pause/save, and ending statistics screen.

The art direction uses two original generated assets in `client/public/`: `game-logo.png` and `game-texture.png`.

## Controls

- Desktop: **WASD** move, mouse aim, left click fire, **R** reload, right click heal, **E** interact, **Q** cure, **Esc** pause.
- Android/touch: left virtual joystick for movement; right-side **FIRE**, **RELOAD**, **HEAL**, and **CURE** buttons. The layout is designed for landscape two-thumb play.

## Run locally

```bash
pnpm install
pnpm dev
```

Then open the local development URL and visit `/nightshift`. Validate with `pnpm check` and build with `pnpm build`.

## Structure

- `client/src/pages/NightshiftGame.tsx` — isolated game loop, gameplay state, canvas renderer, input, persistence, HUD, menu, pause, boss, and ending.
- `client/src/pages/NightshiftGame.css` — responsive horror UI and mobile controls.
- `client/public/game-logo.png` — original generated title art.
- `client/public/game-texture.png` — original generated environment texture.
- `CONTINUATION.md` — exact status and recommended next work.

## Android packaging

The repository currently runs as a responsive web game. Android APK export is **not yet complete** because this repository does not currently include an Android/Gradle toolchain or Capacitor wrapper. The recommended next milestone is to add Capacitor, configure landscape orientation, add Android platform files, and validate an installable debug APK on a physical or emulated device.

## Collaboration

```bash
git clone https://github.com/bunny0arch/trinetras-agentic-hackathon.git
git checkout -b feature/nightshift-next
# make and test changes
git add .
git commit -m "Describe the milestone"
git push -u origin feature/nightshift-next
```

Use small milestone commits and keep `CONTINUATION.md` current. Do not commit credentials or generated dependency folders.

## Asset attribution

No third-party assets are used. The visual assets were generated for this project and are redistributable with the project.

## Known limitations

The current slice uses a lightweight canvas renderer for speed and maintainability. It needs a dedicated Android wrapper, richer room population and guaranteed 40+ enemy progression, more robust collision/pathfinding, real audio, and device testing before it should be called a competition-ready final build.
