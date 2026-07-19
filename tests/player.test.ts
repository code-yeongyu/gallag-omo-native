import { describe, expect, it } from "vitest"
import { PLAYER, SCREEN } from "../src/config"
import { applyHit, createPlayer, movePlayer, tickPlayer, tryFire } from "../src/entities/player"
import { createInputState, reduceKey } from "../src/input"

describe("player", () => {
  it("moves left/right and clamps to the playfield", () => {
    let p = createPlayer()
    const left = reduceKey(createInputState(), "ArrowLeft", true)
    p = movePlayer(p, left, 1000)
    expect(p.x).toBeLessThan(PLAYER.startX)
    for (let i = 0; i < 50; i++) p = movePlayer(p, left, 100)
    expect(p.x).toBeGreaterThanOrEqual(PLAYER.width / 2)
    const right = reduceKey(createInputState(), "ArrowRight", true)
    for (let i = 0; i < 100; i++) p = movePlayer(p, right, 100)
    expect(p.x).toBeLessThanOrEqual(SCREEN.width - PLAYER.width / 2)
  })

  it("fire cooldown blocks spam, rapid fire shortens it", () => {
    const p = createPlayer()
    const first = tryFire(p, 0)
    expect(first.fired).toBe(true)
    const second = tryFire(first.player, 10)
    expect(second.fired).toBe(false)
    const rapid = {
      ...createPlayer(),
      powers: { twinUntilMs: 0, rapidUntilMs: 10000, shieldUntilMs: 0 },
    }
    const rapidFirst = tryFire(rapid, 0)
    expect(rapidFirst.fired).toBe(true)
    const rapidSecond = tryFire(rapidFirst.player, 200)
    expect(rapidSecond.fired).toBe(true)
  })

  it("invulnerability absorbs hits without losing a life", () => {
    const p = { ...createPlayer(), invulnUntilMs: 1000 }
    const hit = applyHit(p, 500)
    expect(hit.lostLife).toBe(false)
    expect(hit.player.lives).toBe(PLAYER.startLives)
  })

  it("shield absorbs one hit then drops", () => {
    const p = {
      ...createPlayer(),
      powers: { twinUntilMs: 0, rapidUntilMs: 0, shieldUntilMs: 9000 },
    }
    const first = applyHit(p, 100)
    expect(first.lostLife).toBe(false)
    expect(first.shieldConsumed).toBe(true)
    expect(first.player.powers.shieldUntilMs).toBe(0)
    const second = applyHit(first.player, 3000)
    expect(second.lostLife).toBe(true)
    expect(second.player.lives).toBe(PLAYER.startLives - 1)
  })

  it("a real hit costs a life and triggers respawn invulnerability", () => {
    const p = createPlayer()
    const hit = applyHit(p, 100)
    expect(hit.lostLife).toBe(true)
    expect(hit.player.invulnUntilMs).toBeGreaterThan(100)
  })

  it("expired power-ups deactivate after their deadline", () => {
    const p = {
      ...createPlayer(),
      powers: { twinUntilMs: 500, rapidUntilMs: 500, shieldUntilMs: 500 },
    }
    const ticked = tickPlayer(p, 600)
    expect(ticked.powers.twinUntilMs <= 600).toBe(true)
  })
})
