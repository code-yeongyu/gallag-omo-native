# GALLAG — Arcade-Cabinet Galaga-Style 2D Shooter

## Goal
A Galaga-style fixed 2D shooter with item power-ups, delivered as a modern
TypeScript web app that feels like a 1981 arcade cabinet: bezel, CRT scanlines,
attract mode with INSERT COIN, high-score table, chiptune WebAudio SFX.

## Tier
HEAVY — new multi-file build; reviewer gate = "Meticulous Game Director"
subagent loop until unconditional APPROVE (user-mandated). Verification is
visual-first per user request, backed by RED→GREEN unit tests for pure logic.

## Stack (per programming skill)
- Vite + vanilla TypeScript (Canvas 2D, no framework), pnpm
- Ultra-strict tsconfig (strict + noUncheckedIndexedAccess +
  exactOptionalPropertyTypes + verbatimModuleSyntax + noFallthroughCasesInSwitch)
- Biome 2 (lint+format), vitest (unit), Playwright Chromium (QA capture)
- Zero runtime deps; all sprites procedural pixel-art; all audio synthesized

## Architecture (each file <=250 pure LOC)
- index.html / src/style.css — cabinet bezel, CRT overlay (scanlines,
  vignette, curvature), marquee
- src/main.ts — boot + fixed-timestep loop (60Hz logic, rAF render)
- src/config.ts — as-const tuning table (224x288 logical, original Galaga res)
- src/types.ts — branded + readonly domain types
- src/rng.ts — seeded mulberry32 (deterministic QA via ?seed=)
- src/input.ts — keyboard/touch state
- src/audio/synth.ts + sfx.ts — WebAudio oscillator/noise SFX, mute
- src/sprites.ts — string-bitmap pixel sprites -> offscreen canvas cache
- src/starfield.ts, src/particles.ts — parallax stars, pixel explosions
- src/player.ts, src/bullets.ts, src/items.ts
- src/enemies/formation.ts (sway+entrance), src/enemies/dive.ts (bezier dives)
- src/enemies/waves.ts — pure stage scripts (testable)
- src/collision.ts — pure AABB (testable)
- src/scoring.ts — score/popups/high-scores core (testable)
- src/hud.ts, src/render.ts, src/game.ts — state machine:
  ATTRACT -> COIN -> STAGE_INTRO -> PLAY -> (CHALLENGE every 3rd) ->
  PLAYER_DEATH -> GAME_OVER -> ENTER_NAME -> ATTRACT

## Items (user requirement)
P = twin shot, R = rapid fire, S = shield (absorbs one hit, ring visual),
B = +1000 bonus, rare 1UP. Drop from killed enemies, drift down, magnet to
player when close.

## Game-feel checklist (director bait)
Screen shake on player death, hit flash, floating score popups, dive swoosh
warning, stage intro jingle, coin sound, formation entrance along curved
paths, challenge-stage bonus tally, initials entry for high scores,
localStorage persistence, CRT barrel curvature + scanlines + vignette +
phosphor glow, blinking INSERT COIN, credit counter.

## Success criteria + QA scenarios (visual-first)
1. ATTRACT renders a convincing cabinet: bezel, scanlines, blinking INSERT
   COIN (two frames differ), starfield, title, high-score table.
2. CORE LOOP: coin -> stage intro -> enemies curve into formation -> player
   moves/fires -> enemy dies with pixel explosion + score popup; divers leave
   formation on curved paths firing bullets.
3. ITEMS: capsule drops, pickup shows effect — twin bullets visible (P) and
   shield ring visible (S).
4. FEEL/FLOW: player death = explosion + shake frame; GAME OVER -> initials
   entry -> updated high-score table in attract. SFX engine present and wired.
5. HYGIENE: tsc clean, biome clean, vitest green, `vite build` ok, preview
   renders with zero console errors.

## QA wiring
`?qa=1&seed=N` exposes window.__gallag debug hooks (coin, start, autopilot,
spawnItem, forceDeath, state inspection) for deterministic Playwright captures
into .omo/evidence/galaga/.

## Reviewer loop
After all criteria pass: spawn fresh "Meticulous Game Director" subagent
(read-only) with captures + source + DESIGN.md. REQUEST_CHANGES -> fix ->
re-capture -> NEW director subagent. Repeat until APPROVE.

## Commits (atomic, conventional; pre-authorized by user)
scaffold -> docs(DESIGN/plan) -> core -> audio -> render primitives ->
entities -> systems -> state machine/HUD -> QA capture -> director fixes.
Each commit: tsc + biome + vitest green.
