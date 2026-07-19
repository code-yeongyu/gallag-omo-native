import { describe, expect, it } from "vitest"
import { createRng } from "../src/rng"

describe("createRng", () => {
  it("produces a deterministic sequence for the same seed", () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = [a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it("produces different sequences for different seeds", () => {
    const a = createRng(1)
    const b = createRng(2)
    expect([a.next(), a.next()]).not.toEqual([b.next(), b.next()])
  })

  it("keeps next() inside [0, 1)", () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it("range() stays within inclusive bounds", () => {
    const rng = createRng(99)
    for (let i = 0; i < 500; i++) {
      const v = rng.range(3, 8)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(8)
    }
  })

  it("int() returns integers within inclusive bounds", () => {
    const rng = createRng(5)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const v = rng.int(0, 3)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(3)
      seen.add(v)
    }
    expect(seen).toEqual(new Set([0, 1, 2, 3]))
  })

  it("chance() honors p=0 and p=1", () => {
    const rng = createRng(11)
    expect(rng.chance(0)).toBe(false)
    expect(rng.chance(1)).toBe(true)
  })
})
