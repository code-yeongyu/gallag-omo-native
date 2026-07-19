import { describe, expect, it } from "vitest"
import { overlaps } from "../src/systems/collision"
import { rect } from "../src/types"

describe("overlaps", () => {
  it("detects intersecting rects", () => {
    expect(overlaps(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true)
  })

  it("rejects disjoint rects", () => {
    expect(overlaps(rect(0, 0, 10, 10), rect(20, 20, 5, 5))).toBe(false)
  })

  it("treats touching edges as no collision (pixel-fair)", () => {
    expect(overlaps(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(false)
    expect(overlaps(rect(0, 0, 10, 10), rect(0, 10, 10, 10))).toBe(false)
  })

  it("detects containment", () => {
    expect(overlaps(rect(0, 0, 20, 20), rect(5, 5, 2, 2))).toBe(true)
  })
})
