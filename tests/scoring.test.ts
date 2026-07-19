import { describe, expect, it } from "vitest"
import { SCORE } from "../src/config"
import {
  addKill,
  createScore,
  DEFAULT_HISCORES,
  insertHiScore,
  qualifies,
  updatePopups,
} from "../src/scoring"

describe("scoring", () => {
  it("awards base points per kind, doubled while diving", () => {
    const s0 = createScore()
    const calm = addKill(s0, "low", false, 10, 20)
    expect(calm.state.score).toBe(SCORE.low)
    const diving = addKill(s0, "boss", true, 10, 20)
    expect(diving.state.score).toBe(SCORE.boss * SCORE.diveBonusMultiplier)
  })

  it("pops up floating score text that expires", () => {
    const s0 = createScore()
    const kill = addKill(s0, "mid", false, 33, 44)
    expect(kill.state.popups).toHaveLength(1)
    const first = kill.state.popups[0]
    if (!first) throw new Error("popup fixture missing")
    expect(first.x).toBe(33)
    const expired = updatePopups(kill.state, 5000)
    expect(expired.popups).toHaveLength(0)
  })

  it("grants an extra life exactly once when crossing the threshold", () => {
    const s = { ...createScore(), score: SCORE.extraLifeEvery - SCORE.low }
    const cross = addKill(s, "low", false, 0, 0)
    expect(cross.extraLife).toBe(true)
    const again = addKill(cross.state, "low", false, 0, 0)
    expect(again.extraLife).toBe(false)
  })

  it("hi-score table stays sorted, truncated, and qualifies only top scores", () => {
    const table = insertHiScore(DEFAULT_HISCORES, { name: "LO ", score: 99999 })
    const first = table[0]
    if (!first) throw new Error("table fixture missing")
    expect(first.score).toBe(99999)
    expect(table).toHaveLength(DEFAULT_HISCORES.length)
    expect(qualifies(DEFAULT_HISCORES, 99999)).toBe(true)
    expect(qualifies(DEFAULT_HISCORES, 1)).toBe(false)
  })
})
