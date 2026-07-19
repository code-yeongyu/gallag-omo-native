import { describe, expect, it } from "vitest"
import { FORMATION, SCREEN } from "../src/config"
import { createFormation, formationSlotPos, updateFormation } from "../src/enemies/formation"
import { stageLayout } from "../src/enemies/waves"

describe("formation", () => {
  it("slots tile the grid centered in the playfield", () => {
    const a = formationSlotPos(0, 0, 0)
    const b = formationSlotPos(FORMATION.cols - 1, 0, 0)
    expect(a.x).toBeGreaterThanOrEqual(0)
    expect(b.x).toBeLessThanOrEqual(SCREEN.width)
    expect(a.y).toBe(FORMATION.originY)
  })

  it("sway oscillates slots horizontally", () => {
    const early = formationSlotPos(3, 1, 0)
    const later = formationSlotPos(3, 1, Math.PI / 2)
    expect(later.x).not.toBe(early.x)
    expect(Math.abs(later.x - early.x)).toBeLessThanOrEqual(FORMATION.swayAmplitude)
  })

  it("enemies fly in and eventually settle into formation", () => {
    let f = createFormation(stageLayout(1), 1)
    expect(f.enemies.every((e) => e.state === "entering")).toBe(true)
    let steps = 0
    while (!f.enemies.every((e) => e.state === "formation") && steps < 4000) {
      f = updateFormation(f, 16)
      steps++
    }
    expect(f.enemies.every((e) => e.state === "formation")).toBe(true)
    expect(steps).toBeLessThan(4000)
  })

  it("settled enemies sit on their slots", () => {
    let f = createFormation(stageLayout(1), 1)
    let steps = 0
    while (!f.enemies.every((e) => e.state === "formation") && steps < 4000) {
      f = updateFormation(f, 16)
      steps++
    }
    const enemy = f.enemies[0]
    if (!enemy) throw new Error("enemy fixture missing")
    const slot = formationSlotPos(enemy.col, enemy.row, f.swayPhase)
    expect(Math.abs(enemy.x - slot.x)).toBeLessThanOrEqual(FORMATION.swayAmplitude + 1)
  })
})
