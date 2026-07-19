import { describe, expect, it } from "vitest"
import { FORMATION } from "../src/config"
import { isChallengeStage, stageLayout } from "../src/enemies/waves"

describe("waves", () => {
  it("stage 1 fills the formation grid with a boss top row", () => {
    const layout = stageLayout(1)
    expect(layout).toHaveLength(28)
    const bosses = layout.filter((s) => s.kind === "boss")
    expect(bosses).toHaveLength(4)
    for (const boss of bosses) expect(boss.row).toBe(0)
  })

  it("keeps every spec inside the grid", () => {
    for (const stage of [1, 2, 4, 5, 7, 8]) {
      for (const spec of stageLayout(stage)) {
        expect(spec.col).toBeGreaterThanOrEqual(0)
        expect(spec.col).toBeLessThan(FORMATION.cols)
        expect(spec.row).toBeGreaterThanOrEqual(0)
        expect(spec.row).toBeLessThan(FORMATION.rows)
      }
    }
  })

  it("staggers entrance groups so enemies arrive in waves", () => {
    const groups = new Set(stageLayout(1).map((s) => s.entrance))
    expect(groups.size).toBeGreaterThanOrEqual(3)
  })

  it("flags every third stage as challenge", () => {
    expect(isChallengeStage(1)).toBe(false)
    expect(isChallengeStage(3)).toBe(true)
    expect(isChallengeStage(6)).toBe(true)
  })

  it("challenge stages never put enemies in formation rows", () => {
    const layout = stageLayout(3)
    expect(layout.length).toBeGreaterThan(0)
    for (const spec of layout) expect(spec.row).toBe(-1)
  })
})
