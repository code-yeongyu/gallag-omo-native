# GALLAG — Design Contract

Arcade-cabinet art direction for a Galaga-style fixed shooter. Every color,
spacing, motion, and surface decision in code traces back to a token here.

## 0. Research Log

| Lane | Deliverable |
|---|---|
| Reference target | Original 1981 arcade fixed-shooter aesthetic (Namco Galaga cabinet + CRT): 224x288 vertical playfield, saturated sprite palette on black, starfield scroll, attract mode with INSERT COIN. Canonical, fixed visual language — treated as the contract. |
| Embedded references / lazyweb | SKIPPED — the target is a historical arcade cabinet, not a modern web product surface; no Layer B brand applies. |
| Imagen concept drafts | SKIPPED — sprites are procedural pixel art (authentic technique, pixel-crisp at integer scale, zero asset risk). |

## 1. Canvas & Layout

- Logical playfield: **224 × 288 px** (original vertical arcade resolution), rendered
  with `image-rendering: pixelated`, integer-scaled to fit viewport height.
- Cabinet: dark room → cabinet body → marquee → black bezel → CRT screen.
  Screen has subtle barrel curvature (border-radius), inner shadow, vignette.
- CRT overlay: horizontal scanlines (2px period, low alpha), faint RGB
  aperture grille, corner vignette, soft phosphor glow on bright pixels
  (canvas-side `shadowBlur` used sparingly on text only).

## 2. Palette (sprite + UI tokens)

| Token | Hex | Use |
|---|---|---|
| `void` | `#000000` | playfield background |
| `star-dim` | `#3a3f58` | far starfield layer |
| `star-mid` | `#7d8bb0` | mid starfield |
| `star-hot` | `#e8ecff` | near starfield |
| `player` | `#4df3ff` cyan | player ship hull |
| `player-accent` | `#ffffff` | cockpit / engine white |
| `engine` | `#ff9d2e` | engine flame |
| `bullet-p` | `#ffe94d` | player shots |
| `bullet-e` | `#ff4d6d` | enemy shots |
| `enemy-boss` | `#e03a3a` red / `#ffd24d` trim | top-row guards |
| `enemy-mid` | `#c04df0` purple | row 2 |
| `enemy-low` | `#4d7df3` blue | rows 3-4 |
| `explosion-hot` | `#fff3b0` | explosion core |
| `explosion-mid` | `#ff9d2e` | explosion mid |
| `explosion-cool` | `#e03a3a` | explosion edge |
| `hud` | `#f2f2f2` | score text |
| `hud-dim` | `#8a8f9e` | labels (1UP / HIGH SCORE) |
| `accent-red` | `#ff3b30` | 1UP label, GAME OVER |
| `accent-blue` | `#4d7df3` | HIGH SCORE label |
| `item-P` `#ffe94d` / `item-R` `#4df3ff` / `item-S` `#6dff6d` / `item-B` `#ff9df3` / `item-1UP` `#ffffff` | item capsules |
| `shield` | `#6dff6d` | shield ring |

## 3. Typography

- All in-game text: **5x7 pixel font**, uppercase, drawn from a bitmap glyph
  table (no web fonts inside the playfield — authentic, crisp).
- Marquee (DOM): system sans, heavy weight, letter-spaced, cyan/red glow.
- Blink cadence for INSERT COIN / PRESS START: 530 ms on/off.

## 4. Motion rules (all motion signals state)

| Motion | Meaning |
|---|---|
| Starfield 3-speed parallax + attract drift | cabinet is alive |
| Enemy entrance along curved paths | stage beginning |
| Formation sway (sin offset, amplitude 8px) | idle threat |
| Dive: bezier swoop + bullet spray + swoosh SFX | attack |
| Pixel explosion (16-24 shards, radial) + hit flash | kill confirm |
| Screen shake 4px / 240ms + red flash | player death |
| Item capsule slow drift + magnet within 24px | pick it up |
| Shield ring pulse | invulnerable/absorb state |
| Score popup float-up 480ms fade | points awarded |
| Stage-intro banner drop + jingle | stage N begins |

No decorative animation without a state meaning (slop-motion ban).

## 5. Audio (WebAudio, all synthesized)

- coin: two-tone ping (E6→B6), shoot: square blip 880→440Hz 60ms,
  enemy die: noise burst 180ms lowpass, player die: descending saw 600ms +
  noise, item: 4-note arpeggio up, stage jingle: 5-note riff, dive: filtered
  swoop, game over: 3-note descent. Master gain 0.5, M toggles mute.

## 6. States & Screens

ATTRACT (title + high-score table + blinking INSERT COIN + demo starfield) →
STAGE_INTRO banner → PLAY (HUD: 1UP score, HIGH SCORE, lives as ship icons,
stage badges) → CHALLENGE every 3rd stage → PLAYER_DEATH → GAME_OVER →
ENTER_NAME (3-letter arcade initials) → ATTRACT. High scores persist in
localStorage (`gallag.hiscores.v1`).

## 7. Accessibility & debt

- Mute toggle (M). No photosensitive full-screen strobes: hit flash ≤ 2
  frames, death flash is a single 120ms red overlay, not a strobe.
- Keyboard-first; touch drag + auto-fire fallback.
- Accepted debt: no gamepad API; no dual-fighter capture mechanic from the
  original (item system takes its place).
