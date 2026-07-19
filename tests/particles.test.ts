import { describe, expect, it } from "vitest"
import { createParticles, spawnExplosion, updateParticles } from "../src/render/particles"
import { createRng } from "../src/rng"

describe("particles", () => {
  it("spawnExplosion emits 16-24 shards around the origin", () => {
    const sys = createParticles()
    const next = spawnExplosion(sys, 100, 120, createRng(4))
    expect(next.shards.length).toBeGreaterThanOrEqual(16)
    expect(next.shards.length).toBeLessThanOrEqual(24)
    for (const shard of next.shards) {
      const dist = Math.hypot(shard.x - 100, shard.y - 120)
      expect(dist).toBeLessThan(2)
    }
  })

  it("shards move, age, and expire", () => {
    let sys = createParticles()
    sys = spawnExplosion(sys, 50, 50, createRng(5))
    const before = sys.shards[0]
    const after = updateParticles(sys, 100).shards[0]
    if (!before || !after) throw new Error("shard fixture missing")
    expect(after.x !== before.x || after.y !== before.y).toBe(true)
    let aged = updateParticles(sys, 100)
    for (let i = 0; i < 20; i++) aged = updateParticles(aged, 100)
    expect(aged.shards.length).toBe(0)
  })

  it("is deterministic for the same seed", () => {
    const a = spawnExplosion(createParticles(), 10, 10, createRng(8))
    const b = spawnExplosion(createParticles(), 10, 10, createRng(8))
    expect(a.shards.map((s) => [s.vx, s.vy])).toEqual(b.shards.map((s) => [s.vx, s.vy]))
  })
})
