import { describe, expect, it } from "vitest"
import { TIMING } from "../src/config"
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
    g = {
      ...g,
      phase: { kind: "enterName", name: "LO ", cursor: 2 },
      score: { score: 99999, popups: [] },
    }
    const r = updateGame(g, frame({ fireEdge: true, fire: true }), 16, createRng(2))
    expect(r.game.phase.kind).toBe("attract")
    expect(r.persistHiScores).not.toBeNull()
    expect(r.persistHiScores?.[0]?.score).toBe(99999)
    expect(r.persistHiScores?.[0]?.name).toBe("LO ")
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
