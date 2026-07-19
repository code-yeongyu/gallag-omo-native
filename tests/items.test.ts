import { describe, expect, it } from "vitest"
import { ITEM, SCREEN } from "../src/config"
import { type Drop, ITEM_INFO, maybeDrop, updateDrops } from "../src/entities/items"
import { createRng } from "../src/rng"

describe("items", () => {
  it("every kind has a distinct color and label", () => {
    const colors = new Set(Object.values(ITEM_INFO).map((i) => i.color))
    const labels = new Set(Object.values(ITEM_INFO).map((i) => i.label))
    expect(colors.size).toBe(5)
    expect(labels.size).toBe(5)
  })

  it("maybeDrop is deterministic for the same seed", () => {
    const a = maybeDrop(createRng(7), 50, 60)
    const b = maybeDrop(createRng(7), 50, 60)
    expect(a).toEqual(b)
  })

  it("drops drift downward and are culled offscreen", () => {
    const drop: Drop = { x: 100, y: 50, kind: "twin" }
    const moved = updateDrops([drop], { x: 300, y: 260 }, 100, 288)
    const first = moved[0]
    if (!first) throw new Error("drop fixture missing")
    expect(first.y).toBeGreaterThan(50)
    const gone = updateDrops([{ ...drop, y: SCREEN.height + 20 }], { x: 300, y: 260 }, 100, 288)
    expect(gone).toHaveLength(0)
  })

  it("magnet pulls nearby drops toward the player", () => {
    const drop: Drop = { x: 120, y: 210, kind: "shield" }
    const player = { x: 100, y: 220 }
    const moved = updateDrops([drop], player, 100, 288)
    const first = moved[0]
    if (!first) throw new Error("drop fixture missing")
    expect(first.x).toBeLessThan(120)
    expect(first.y).toBeGreaterThan(200)
  })

  it("magnet ignores distant drops", () => {
    const drop: Drop = { x: 200, y: 50, kind: "bonus" }
    const moved = updateDrops([drop], { x: 20, y: 260 }, 100, 288)
    const first = moved[0]
    if (!first) throw new Error("drop fixture missing")
    expect(first.x).toBe(200)
    expect(first.y).toBeCloseTo(50 + ITEM.driftSpeed * 0.1, 3)
  })
})
