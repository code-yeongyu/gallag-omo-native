import { describe, expect, it } from "vitest"
import { BULLET } from "../src/config"
import { createBullets, fireEnemy, firePlayer, updateBullets } from "../src/entities/bullets"

describe("bullets", () => {
  it("firePlayer adds one shot, or two with twin power", () => {
    const b0 = createBullets()
    expect(firePlayer(b0, 100, 200, false).shots).toHaveLength(1)
    const twin = firePlayer(b0, 100, 200, true)
    expect(twin.shots).toHaveLength(2)
    const xs = twin.shots.map((s) => s.x)
    expect(new Set(xs).size).toBe(2)
  })

  it("respects the max player shot cap", () => {
    let b = createBullets()
    for (let i = 0; i < 10; i++) b = firePlayer(b, 100, 200, false)
    expect(b.shots.length).toBeLessThanOrEqual(BULLET.maxPlayerShots)
  })

  it("player shots travel up, enemy shots travel down", () => {
    let b = firePlayer(createBullets(), 100, 200, false)
    b = fireEnemy(b, 50, 50)
    const moved = updateBullets(b, 100)
    const p = moved.shots.find((s) => s.friendly)
    const e = moved.shots.find((s) => !s.friendly)
    if (!p || !e) throw new Error("shot fixture missing")
    expect(p.y).toBeLessThan(200)
    expect(e.y).toBeGreaterThan(50)
  })

  it("culls shots that leave the screen", () => {
    let b = firePlayer(createBullets(), 100, 200, false)
    for (let i = 0; i < 30; i++) b = updateBullets(b, 100)
    expect(b.shots).toHaveLength(0)
  })
})
