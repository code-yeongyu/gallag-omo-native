import { describe, expect, it } from "vitest"
import { pickDiver, startDive, updateDiving } from "../src/enemies/dive"
import { createFormation, updateFormation } from "../src/enemies/formation"
import { stageLayout } from "../src/enemies/waves"
import { createRng } from "../src/rng"

const settledFormation = () => {
  let f = createFormation(stageLayout(1), 1)
  let steps = 0
  while (!f.enemies.every((e) => e.state === "formation") && steps < 4000) {
    f = updateFormation(f, 16)
    steps++
  }
  return f
}

describe("dive", () => {
  it("pickDiver only chooses enemies settled in formation", () => {
    const f = settledFormation()
    const picked = pickDiver(f, createRng(9))
    expect(picked).not.toBeNull()
    expect(picked?.state).toBe("formation")
  })

  it("a diving enemy eventually returns to formation", () => {
    const f = settledFormation()
    const picked = pickDiver(f, createRng(9))
    if (!picked) throw new Error("diver fixture missing")
    let enemy = startDive(picked, 112)
    expect(enemy.state).toBe("diving")
    let steps = 0
    while (enemy.state !== "formation" && steps < 3000) {
      const result = updateDiving(enemy, 16, 112, 288, createRng(steps + 1))
      enemy = result.enemy
      steps++
    }
    expect(enemy.state).toBe("formation")
    expect(steps).toBeLessThan(3000)
  })

  it("divers sometimes fire while swooping", () => {
    const f = settledFormation()
    const picked = pickDiver(f, createRng(3))
    if (!picked) throw new Error("diver fixture missing")
    let enemy = startDive(picked, 112)
    let fired = false
    for (let i = 0; i < 500 && !fired; i++) {
      const result = updateDiving(enemy, 16, 112, 288, createRng(i * 31 + 7))
      enemy = result.enemy
      fired = result.fired
      if (enemy.state === "formation") break
    }
    expect(fired).toBe(true)
  })
})
