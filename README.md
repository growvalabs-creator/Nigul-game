# NIGUL BIRD — A Nostalgic Flappy Bird Game

A nostalgic Flappy Bird-inspired retro arcade game built with HTML5 Canvas, Web Audio API, and custom character personalization.

## Features
- **Signature "Nigul" Voice Engine**: Plays the authentic vocal audio "Nigul" whenever you click, tap, or press Space to jump. Powered by pre-decoded Web Audio buffers for instant zero-latency retriggering, with independent volume and toggle controls.
- **Custom Character Uploader**: Click **"UPLOAD YOUR CHARACTER"** to import any PNG, JPG, or WEBP from local device storage. Transparent PNGs are handled gracefully with circular framing and live preview, stored locally in IndexedDB across reloads.
- **10 Distinct Playable Levels**:
  1. *Level 1 — First Flight*: Sunny sky, slow speed, wide gaps.
  2. *Level 2 — Old School*: Classic arcade grassy theme.
  3. *Level 3 — Pixel Dreams*: Twilight pastel palette with floating retro clouds.
  4. *Level 4 — Golden Memories*: Warm sunset glow and nostalgic horizon.
  5. *Level 5 — The Challenge*: Medium difficulty with retro perspective grid and new synthwave tune.
  6. *Level 6 — Retro Night*: Starfield and moonlit city scenery.
  7. *Level 7 — Neon Skies*: Cyberpunk glowing pipes and synth grid.
  8. *Level 8 — Final Stretch*: High-speed emerald aurora tempest.
  9. *Level 9 — Legend Mode*: Volcanic crimson obstacles for elite flyers.
  10. *Level 10 — Nigul Master*: Cosmic gold singularity, boss music, and special victory screen.
- **Nostalgic 8-Bit Chiptune Music**: Multi-track procedural synth engine featuring 4 melodic themes, dynamic arpeggios, and victory fanfares.
- **Sound Settings & Volume Controls**: Independent volume sliders and toggles for Music, SFX, and the "Nigul" voice.
- **Persistent Progress**: Best overall score, level high scores, and unlocked levels are stored persistently in LocalStorage, with a safe "Reset Progress" dialog.

## Controls
- **Desktop**: Click anywhere, press `Space`, or press `Arrow Up` to flap. Press `Esc` to pause.
- **Mobile**: Tap anywhere on screen (touch scrolling prevented during flight).

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:3000`
