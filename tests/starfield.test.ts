import { describe, expect, it } from "vitest"
import { createStarfield, STAR_LAYERS, updateStarfield } from "../src/render/starfield"
import { createRng } from "../src/rng"

describe("starfield", () => {
  it("creates deterministic stars from a seed", () => {
    const a = createStarfield(createRng(1), 224, 288)
    const b = createStarfield(createRng(1), 224, 288)
    expect(a.stars).toEqual(b.stars)
    expect(a.stars.length).toBeGreaterThan(40)
  })

  it("assigns every star to a valid layer with depth-sorted speed", () => {
    const field = createStarfield(createRng(2), 224, 288)
    for (const star of field.stars) {
      expect(star.layer).toBeGreaterThanOrEqual(0)
      expect(star.layer).toBeLessThan(STAR_LAYERS.length)
    }
    for (let i = 1; i < STAR_LAYERS.length; i++) {
      const cur = STAR_LAYERS[i]
      const prev = STAR_LAYERS[i - 1]
      if (!cur || !prev) throw new Error("layer fixture missing")
      expect(cur.speed).toBeGreaterThan(prev.speed)
    }
  })

  it("wraps stars that scroll past the bottom back to the top", () => {
    const field = createStarfield(createRng(3), 224, 288)
    const next = updateStarfield(field, 10, 224, 288)
    for (const star of next.stars) {
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThan(288)
    }
    expect(next.stars.some((s, i) => s.y !== field.stars[i]?.y)).toBe(true)
  })
})
