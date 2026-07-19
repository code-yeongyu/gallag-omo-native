import { describe, expect, it } from "vitest"
import { TIMING } from "../src/config"
import { updateFormation } from "../src/enemies/formation"
import { createGame, type FrameInput } from "../src/game/state"
import { updateGame } from "../src/game/update"
import { createInputState } from "../src/input"
import { createRng } from "../src/rng"

const frame = (partial?: Partial<FrameInput>): FrameInput => ({
  ...createInputState(),
  leftEdge: false,
  rightEdge: false,
  fireEdge: false,
  ...partial,
})

describe("game phase machine", () => {
  it("starts in attract with zero credits", () => {
    const g = createGame(createRng(1), [])
    expect(g.phase.kind).toBe("attract")
    expect(g.credits).toBe(0)
  })

  it("first coin adds a credit, second coin starts stage 1", () => {
    const g = createGame(createRng(1), [])
    const coin = frame({ coinPressed: true, coinHeld: true })
    let r = updateGame(g, coin, 16, createRng(2))
    expect(r.game.credits).toBe(1)
    expect(r.game.phase.kind).toBe("attract")
    expect(r.events).toContain("coin")
    r = updateGame(r.game, coin, 16, createRng(3))
    expect(r.game.credits).toBe(0)
    expect(r.game.phase.kind).toBe("stageIntro")
    expect(r.events).toContain("stageJingle")
  })

  it("stage intro advances to playing after its timer", () => {
    let g = createGame(createRng(1), [])
    const coin = frame({ coinPressed: true, coinHeld: true })
    g = updateGame(g, coin, 16, createRng(2)).game
    g = updateGame(g, coin, 16, createRng(3)).game
    const r = updateGame(g, frame(), TIMING.stageIntroMs + 32, createRng(4))
    expect(r.game.phase.kind).toBe("playing")
  })

  it("mute toggles flip the muted flag", () => {
    const g = createGame(createRng(1), [])
    const r = updateGame(g, frame({ muteToggled: true, muteHeld: true }), 16, createRng(2))
    expect(r.game.muted).toBe(true)
    const r2 = updateGame(r.game, frame({ muteToggled: true, muteHeld: true }), 16, createRng(3))
    expect(r2.game.muted).toBe(false)
  })

  it("name entry cycles letters with left/right edges and confirms with fire", () => {
    let g = createGame(createRng(1), [])
    g = {
      ...g,
      phase: { kind: "enterName", name: "AAA", cursor: 0 },
      score: { score: 99999, popups: [] },
    }
    let r = updateGame(g, frame({ rightEdge: true, right: true }), 16, createRng(2))
    expect(r.game.phase.kind).toBe("enterName")
    if (r.game.phase.kind !== "enterName") throw new Error("phase fixture")
    expect(r.game.phase.name[0]).toBe("B")
    r = updateGame(r.game, frame({ fireEdge: true, fire: true }), 16, createRng(3))
    if (r.game.phase.kind !== "enterName") throw new Error("phase fixture")
    expect(r.game.phase.cursor).toBe(1)
  })

  it("confirming the third letter saves the hi-score and returns to attract", () => {
    let g = createGame(createRng(1), [])
    let played = g.formation
    let steps = 0
    while (!played.enemies.every((e) => e.state === "formation") && steps < 4000) {
      played = updateFormation(played, 16)
      steps++
    }
    g = {
      ...g,
      formation: played,
      drops: [{ x: 50, y: 50, kind: "bonus" }],
      phase: { kind: "enterName", name: "LO ", cursor: 2 },
      score: { score: 99999, popups: [] },
    }
    expect(g.formation.enemies.some((e) => e.x >= 0 && e.x <= 224)).toBe(true)
    const r = updateGame(g, frame({ fireEdge: true, fire: true }), 16, createRng(2))
    expect(r.game.phase.kind).toBe("attract")
    expect(r.persistHiScores).not.toBeNull()
    expect(r.persistHiScores?.[0]?.score).toBe(99999)
    expect(r.persistHiScores?.[0]?.name).toBe("LO ")
    for (const enemy of r.game.formation.enemies) {
      const offscreen = enemy.x < 0 || enemy.x > 224
      expect(offscreen, `enemy ${enemy.id} must start offscreen in attract`).toBe(true)
    }
    expect(r.game.drops, "item drops must not leak into attract").toHaveLength(0)
  })

  it("playing updates move the player with input", () => {
    let g = createGame(createRng(1), [])
    const coin = frame({ coinPressed: true, coinHeld: true })
    g = updateGame(g, coin, 16, createRng(2)).game
    g = updateGame(g, coin, 16, createRng(3)).game
    g = updateGame(g, frame(), TIMING.stageIntroMs + 32, createRng(4)).game
    const before = g.player.x
    const r = updateGame(g, frame({ left: true }), 100, createRng(5))
    expect(r.game.player.x).toBeLessThan(before)
  })
})
