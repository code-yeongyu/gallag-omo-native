import { describe, expect, it } from "vitest"
import { createFormation, updateFormation } from "../src/enemies/formation"
import { stageLayout } from "../src/enemies/waves"
import { createBullets, firePlayer } from "../src/entities/bullets"
import type { Drop } from "../src/entities/items"
import { createPlayer } from "../src/entities/player"
import { collectDrops, hitEnemies, hitPlayer } from "../src/game/collisions"
import { createRng } from "../src/rng"

const settled = () => {
  let f = createFormation(stageLayout(1), 1)
  let steps = 0
  while (!f.enemies.every((e) => e.state === "formation") && steps < 4000) {
    f = updateFormation(f, 16)
    steps++
  }
  return f
}

describe("hitEnemies", () => {
  it("a bullet overlapping an enemy kills it, awards a kill record", () => {
    const f = settled()
    const target = f.enemies.find((e) => e.kind === "low")
    if (!target) throw new Error("target fixture missing")
    const bullets = { shots: [{ x: target.x, y: target.y, vy: -220, friendly: true }] }
    const result = hitEnemies(bullets, f.enemies, createRng(1), 100)
    expect(result.kills).toHaveLength(1)
    expect(result.kills[0]?.kind).toBe("low")
    const dead = result.enemies.find((e) => e.id === target.id)
    expect(dead?.state).toBe("gone")
    expect(result.bullets.shots).toHaveLength(0)
  })

  it("bosses survive the first hit with a flash, die on the second", () => {
    const f = settled()
    const boss = f.enemies.find((e) => e.kind === "boss")
    if (!boss) throw new Error("boss fixture missing")
    const bullets = { shots: [{ x: boss.x, y: boss.y, vy: -220, friendly: true }] }
    const first = hitEnemies(bullets, f.enemies, createRng(1), 100)
    expect(first.kills).toHaveLength(0)
    const flashed = first.enemies.find((e) => e.id === boss.id)
    expect(flashed?.hitFlashUntilMs).toBeGreaterThan(100)
    const second = hitEnemies(bullets, first.enemies, createRng(1), 300)
    expect(second.kills).toHaveLength(1)
  })

  it("bullets that miss everything stay in flight", () => {
    const f = settled()
    const bullets = firePlayer(createBullets(), 1, 270, false)
    const result = hitEnemies(bullets, f.enemies, createRng(1), 100)
    expect(result.bullets.shots).toHaveLength(1)
  })
})

describe("hitPlayer", () => {
  it("an enemy bullet on the player costs a life", () => {
    const p = createPlayer()
    const bullets = { shots: [{ x: p.x, y: p.y, vy: 78, friendly: false }] }
    const result = hitPlayer(p, bullets, [], 100)
    expect(result.player.lives).toBe(2)
    expect(result.died).toBe(true)
    expect(result.bullets.shots).toHaveLength(0)
  })

  it("a diving enemy crashing into the player dies with the player", () => {
    const f = settled()
    const p = createPlayer()
    const diver = f.enemies[0]
    if (!diver) throw new Error("diver fixture missing")
    const crashing = { ...diver, state: "diving" as const, x: p.x, y: p.y }
    const result = hitPlayer(p, createBullets(), [crashing], 100)
    expect(result.died).toBe(true)
    expect(result.enemies[0]?.state).toBe("gone")
  })

  it("no contact means no death", () => {
    const p = createPlayer()
    const result = hitPlayer(p, createBullets(), [], 100)
    expect(result.died).toBe(false)
    expect(result.player.lives).toBe(3)
  })
})

describe("collectDrops", () => {
  it("a drop on the player is collected, others remain", () => {
    const p = createPlayer()
    const drops: Drop[] = [
      { x: p.x, y: p.y, kind: "twin" },
      { x: 10, y: 10, kind: "bonus" },
    ]
    const result = collectDrops(p, drops, 100)
    expect(result.collected).toEqual(["twin"])
    expect(result.drops).toHaveLength(1)
  })
})
