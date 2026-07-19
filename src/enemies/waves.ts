import { FORMATION } from "../config"

export const ENEMY_KINDS = ["boss", "mid", "low"] as const
export type EnemyKind = (typeof ENEMY_KINDS)[number]

export type EnemySpec = {
  readonly kind: EnemyKind
  readonly col: number
  readonly row: number
  readonly entrance: number
}

export const isChallengeStage = (stage: number): boolean => stage % 3 === 0

const normalLayout = (): EnemySpec[] => {
  const specs: EnemySpec[] = []
  for (let col = 2; col <= 5; col++) {
    specs.push({ kind: "boss", col, row: 0, entrance: (col + 0) % 4 })
  }
  for (let col = 0; col < FORMATION.cols; col++) {
    specs.push({ kind: "mid", col, row: 1, entrance: (col + 2) % 4 })
  }
  for (let col = 0; col < FORMATION.cols; col++) {
    specs.push({ kind: "low", col, row: 2, entrance: (col + 4) % 4 })
    specs.push({ kind: "low", col, row: 3, entrance: (col + 6) % 4 })
  }
  return specs
}

const challengeLayout = (): EnemySpec[] => {
  const specs: EnemySpec[] = []
  const kinds: readonly EnemyKind[] = ["low", "mid", "low", "boss", "mid"]
  for (let i = 0; i < 20; i++) {
    const kind = kinds[i % kinds.length] ?? "low"
    specs.push({ kind, col: i % FORMATION.cols, row: -1, entrance: i % 5 })
  }
  return specs
}

export const stageLayout = (stage: number): readonly EnemySpec[] =>
  isChallengeStage(stage) ? challengeLayout() : normalLayout()
