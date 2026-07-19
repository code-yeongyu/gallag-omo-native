import { SCORE } from "./config"
import type { EnemyKind } from "./enemies/waves"

export type ScorePopup = {
  readonly x: number
  readonly y: number
  readonly text: string
  readonly ageMs: number
  readonly ttlMs: number
}

export type ScoreState = {
  readonly score: number
  readonly popups: readonly ScorePopup[]
}

export const createScore = (): ScoreState => ({ score: 0, popups: [] })

export const POPUP_TTL_MS = 520 as const

export const addKill = (
  state: ScoreState,
  kind: EnemyKind,
  diving: boolean,
  x: number,
  y: number,
): { state: ScoreState; extraLife: boolean } => {
  const base = SCORE[kind]
  const points = diving ? base * SCORE.diveBonusMultiplier : base
  const score = state.score + points
  const crossed =
    Math.floor(score / SCORE.extraLifeEvery) > Math.floor(state.score / SCORE.extraLifeEvery)
  const popup: ScorePopup = { x, y, text: String(points), ageMs: 0, ttlMs: POPUP_TTL_MS }
  return { state: { score, popups: [...state.popups, popup] }, extraLife: crossed }
}

export const addBonus = (state: ScoreState, points: number, x: number, y: number): ScoreState => ({
  score: state.score + points,
  popups: [...state.popups, { x, y, text: String(points), ageMs: 0, ttlMs: POPUP_TTL_MS }],
})

export const updatePopups = (state: ScoreState, dtMs: number): ScoreState => ({
  ...state,
  popups: state.popups
    .map((popup) => ({ ...popup, ageMs: popup.ageMs + dtMs, y: popup.y - (dtMs * 12) / 1000 }))
    .filter((popup) => popup.ageMs < popup.ttlMs),
})

export type HiScoreEntry = {
  readonly name: string
  readonly score: number
}

export const DEFAULT_HISCORES: readonly HiScoreEntry[] = [
  { name: "AAA", score: 30000 },
  { name: "GAL", score: 25000 },
  { name: "AGA", score: 20000 },
  { name: "LAG", score: 15000 },
  { name: "GAL", score: 10000 },
] as const

export const insertHiScore = (
  table: readonly HiScoreEntry[],
  entry: HiScoreEntry,
): readonly HiScoreEntry[] =>
  [...table, entry].sort((a, b) => b.score - a.score).slice(0, table.length)

export const qualifies = (table: readonly HiScoreEntry[], score: number): boolean => {
  const last = table[table.length - 1]
  return last !== undefined && score > last.score
}
