import { describe, expect, it } from "vitest"
import { SFX_NAMES, SFX_SCORES } from "../src/audio/sfx"

describe("SFX_SCORES", () => {
  it("defines a score for every named effect", () => {
    for (const name of SFX_NAMES) {
      expect(SFX_SCORES[name].length).toBeGreaterThan(0)
    }
  })

  it("covers the full arcade set", () => {
    expect([...SFX_NAMES].sort()).toEqual(
      ["coin", "dive", "enemyDie", "gameOver", "item", "playerDie", "shoot", "stageJingle"].sort(),
    )
  })

  it("keeps event offsets monotonic and durations positive", () => {
    for (const name of SFX_NAMES) {
      let prev = -1
      for (const ev of SFX_SCORES[name]) {
        expect(ev.atMs).toBeGreaterThanOrEqual(prev)
        expect(ev.durMs).toBeGreaterThan(0)
        prev = ev.atMs
      }
    }
  })

  it("keeps tone frequencies in audible range", () => {
    for (const name of SFX_NAMES) {
      for (const ev of SFX_SCORES[name]) {
        if (ev.kind === "tone") {
          expect(ev.freq).toBeGreaterThan(20)
          expect(ev.freq).toBeLessThan(12000)
        }
      }
    }
  })

  it("uses both tones and noise across the set (percussion + melody)", () => {
    const kinds = new Set(SFX_NAMES.flatMap((n) => SFX_SCORES[n].map((e) => e.kind)))
    expect(kinds.has("tone")).toBe(true)
    expect(kinds.has("noise")).toBe(true)
  })

  it("jingles are longer than blips (melodic phrasing)", () => {
    const span = (name: (typeof SFX_NAMES)[number]): number => {
      const evs = SFX_SCORES[name]
      const last = evs[evs.length - 1]
      return last ? last.atMs + last.durMs : 0
    }
    expect(span("stageJingle")).toBeGreaterThan(span("shoot") * 3)
    expect(span("playerDie")).toBeGreaterThan(span("enemyDie"))
  })
})
