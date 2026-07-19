import type { SfxName } from "../audio/sfx"
import { PLAYER, SCREEN, TIMING } from "../config"
import { createFormation, updateFormation } from "../enemies/formation"
import { stageLayout } from "../enemies/waves"
import { updateParticles } from "../render/particles"
import { updateStarfield } from "../render/starfield"
import type { Rng } from "../rng"
import {
  DEFAULT_HISCORES,
  type HiScoreEntry,
  insertHiScore,
  qualifies,
  updatePopups,
} from "../scoring"
import { updatePlaying } from "./playing"
import type { FrameInput, Game, UpdateResult } from "./state"
import { startStage } from "./state"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" as const

const result = (
  game: Game,
  events: readonly SfxName[],
  persist: readonly HiScoreEntry[] | null = null,
): UpdateResult => ({
  game,
  events,
  persistHiScores: persist,
})

const resetForAttract = (game: Game): Game => ({
  ...game,
  phase: { kind: "attract" },
  player: { ...game.player, x: PLAYER.startX },
  formation: createFormation(stageLayout(1), 1),
  score: { score: 0, popups: [] },
  stage: 1,
  credits: game.credits,
  challengeHits: 0,
})

export const updateGame = (game: Game, input: FrameInput, dtMs: number, rng: Rng): UpdateResult => {
  const nowMs = game.nowMs + dtMs
  let g: Game = {
    ...game,
    nowMs,
    starfield: updateStarfield(game.starfield, dtMs, SCREEN.width, SCREEN.height),
    particles: updateParticles(game.particles, dtMs),
    score: updatePopups(game.score, dtMs),
    muted: input.muteToggled ? !game.muted : game.muted,
  }
  const events: SfxName[] = []

  switch (g.phase.kind) {
    case "attract": {
      if (!input.coinPressed) return result(g, events)
      if (g.credits === 0) {
        events.push("coin")
        return result({ ...g, credits: 1 }, events)
      }
      events.push("coin", "stageJingle")
      return result(
        startStage(
          {
            ...g,
            credits: 0,
            score: { score: 0, popups: [] },
            player: {
              ...g.player,
              lives: PLAYER.startLives,
              powers: { twinUntilMs: 0, rapidUntilMs: 0, shieldUntilMs: 0 },
            },
          },
          1,
        ),
        events,
      )
    }
    case "stageIntro": {
      g = { ...g, formation: updateFormation(g.formation, dtMs) }
      const since = g.phase.kind === "stageIntro" ? g.phase.sinceMs : nowMs
      if (nowMs - since >= TIMING.stageIntroMs) {
        return result({ ...g, phase: { kind: "playing" } }, events)
      }
      return result(g, events)
    }
    case "playing":
      return result(updatePlaying(g, input, dtMs, rng, events), events)
    case "playerDeath": {
      const since = g.phase.kind === "playerDeath" ? g.phase.sinceMs : nowMs
      if (nowMs - since < TIMING.deathPauseMs) return result(g, events)
      if (g.player.lives <= 0) {
        events.push("gameOver")
        return result({ ...g, phase: { kind: "gameOver", sinceMs: nowMs } }, events)
      }
      return result(
        {
          ...g,
          phase: { kind: "playing" },
          player: {
            ...g.player,
            x: PLAYER.startX,
            powers: { twinUntilMs: 0, rapidUntilMs: 0, shieldUntilMs: 0 },
          },
          bullets: { shots: g.bullets.shots.filter((s) => s.friendly) },
        },
        events,
      )
    }
    case "gameOver": {
      const since = g.phase.kind === "gameOver" ? g.phase.sinceMs : nowMs
      if (nowMs - since < TIMING.gameOverMs) return result(g, events)
      const table = g.hiScores.length >= 5 ? g.hiScores : DEFAULT_HISCORES
      if (qualifies(table, g.score.score)) {
        return result({ ...g, phase: { kind: "enterName", name: "AAA", cursor: 0 } }, events)
      }
      return result(resetForAttract(g), events)
    }
    case "enterName": {
      if (g.phase.kind !== "enterName") return result(g, events)
      const { name, cursor } = g.phase
      const idx = LETTERS.indexOf(name[cursor] ?? "A")
      let nextName = name
      if (input.leftEdge) {
        nextName = `${name.slice(0, cursor)}${LETTERS[(idx + LETTERS.length - 1) % LETTERS.length]}${name.slice(cursor + 1)}`
      }
      if (input.rightEdge) {
        nextName = `${name.slice(0, cursor)}${LETTERS[(idx + 1) % LETTERS.length]}${name.slice(cursor + 1)}`
      }
      if (!input.fireEdge) {
        return result({ ...g, phase: { kind: "enterName", name: nextName, cursor } }, events)
      }
      if (cursor < 2) {
        events.push("shoot")
        return result(
          { ...g, phase: { kind: "enterName", name: nextName, cursor: cursor + 1 } },
          events,
        )
      }
      const table = g.hiScores.length >= 5 ? g.hiScores : DEFAULT_HISCORES
      const saved = insertHiScore(table, { name: nextName, score: g.score.score })
      events.push("item")
      return result(resetForAttract({ ...g, hiScores: saved }), events, saved)
    }
  }
}
