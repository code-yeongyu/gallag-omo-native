import type { SfxName } from "../audio/sfx"
import { SCREEN } from "../config"
import { createFormation, type Formation } from "../enemies/formation"
import { stageLayout } from "../enemies/waves"
import type { Bullets } from "../entities/bullets"
import { createBullets } from "../entities/bullets"
import type { Drop } from "../entities/items"
import { createPlayer, type Player } from "../entities/player"
import type { InputState } from "../input"
import { createParticles, type Particles } from "../render/particles"
import { createStarfield, type Starfield } from "../render/starfield"
import type { Rng } from "../rng"
import { createScore, type HiScoreEntry, type ScoreState } from "../scoring"

export type FrameInput = InputState & {
  readonly leftEdge: boolean
  readonly rightEdge: boolean
  readonly fireEdge: boolean
}

export type Phase =
  | { readonly kind: "attract" }
  | { readonly kind: "stageIntro"; readonly sinceMs: number }
  | { readonly kind: "playing" }
  | { readonly kind: "playerDeath"; readonly sinceMs: number }
  | { readonly kind: "gameOver"; readonly sinceMs: number }
  | { readonly kind: "enterName"; readonly name: string; readonly cursor: number }

export type Game = {
  readonly phase: Phase
  readonly player: Player
  readonly formation: Formation
  readonly bullets: Bullets
  readonly drops: readonly Drop[]
  readonly particles: Particles
  readonly starfield: Starfield
  readonly score: ScoreState
  readonly hiScores: readonly HiScoreEntry[]
  readonly credits: number
  readonly stage: number
  readonly nowMs: number
  readonly shakeUntilMs: number
  readonly flashUntilMs: number
  readonly muted: boolean
  readonly diveInMs: number
  readonly challengeHits: number
}

export type UpdateResult = {
  readonly game: Game
  readonly events: readonly SfxName[]
  readonly persistHiScores: readonly HiScoreEntry[] | null
}

export const createGame = (rng: Rng, hiScores: readonly HiScoreEntry[]): Game => ({
  phase: { kind: "attract" },
  player: createPlayer(),
  formation: createFormation(stageLayout(1), 1),
  bullets: createBullets(),
  drops: [],
  particles: createParticles(),
  starfield: createStarfield(rng, SCREEN.width, SCREEN.height),
  score: createScore(),
  hiScores,
  credits: 0,
  stage: 1,
  nowMs: 0,
  shakeUntilMs: 0,
  flashUntilMs: 0,
  muted: false,
  diveInMs: 2600,
  challengeHits: 0,
})

export const startStage = (game: Game, stage: number): Game => ({
  ...game,
  phase: { kind: "stageIntro", sinceMs: game.nowMs },
  stage,
  formation: createFormation(stageLayout(stage), stage),
  bullets: createBullets(),
  drops: [],
  diveInMs: 2600,
  challengeHits: 0,
})
