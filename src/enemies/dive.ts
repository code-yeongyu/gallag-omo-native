import { SCREEN } from "../config"
import { cubicBezier, quadraticBezier } from "../math"
import type { Rng } from "../rng"
import type { Enemy, Formation } from "./formation"
import { formationSlotPos } from "./formation"

export const DIVE = {
  durationMs: 2600,
  returnMs: 1500,
  fireChance: 0.035,
} as const

export const pickDiver = (formation: Formation, rng: Rng): Enemy | null => {
  const candidates = formation.enemies.filter((e) => e.state === "formation")
  if (candidates.length === 0) return null
  return candidates[rng.int(0, candidates.length - 1)] ?? null
}

export const startDive = (enemy: Enemy, playerX: number): Enemy => ({
  ...enemy,
  state: "diving",
  t: 0,
  dive: { fromX: enemy.x, fromY: enemy.y, targetX: playerX },
})

const divePos = (dive: { fromX: number; fromY: number; targetX: number }, t: number) => {
  const sweep = dive.fromX < SCREEN.width / 2 ? 60 : -60
  return cubicBezier(
    { x: dive.fromX, y: dive.fromY },
    { x: dive.fromX + sweep, y: dive.fromY + 70 },
    { x: dive.targetX, y: SCREEN.height * 0.55 },
    { x: dive.targetX, y: SCREEN.height + 18 },
    t,
  )
}

export type DiveUpdate = {
  readonly enemy: Enemy
  readonly fired: boolean
}

/** Advances one diving/returning enemy by dtMs. `nowMs` unused paths return enemy
 * unchanged; firing only happens on the way down. */
export const updateDiving = (
  enemy: Enemy,
  dtMs: number,
  playerX: number,
  _screenH: number,
  rng: Rng,
  swayPhase = 0,
): DiveUpdate => {
  switch (enemy.state) {
    case "diving": {
      const dive = enemy.dive ?? { fromX: enemy.x, fromY: enemy.y, targetX: playerX }
      const t = Math.min(1, enemy.t + dtMs / DIVE.durationMs)
      const pos = divePos(dive, t)
      if (t >= 1) {
        return {
          enemy: { ...enemy, state: "returning", t: 0, x: dive.targetX, y: SCREEN.height + 16 },
          fired: false,
        }
      }
      return {
        enemy: { ...enemy, x: pos.x, y: pos.y, t, dive },
        fired: rng.chance(DIVE.fireChance),
      }
    }
    case "returning": {
      const t = Math.min(1, enemy.t + dtMs / DIVE.returnMs)
      const slot = formationSlotPos(enemy.col, enemy.row, swayPhase)
      const entryX = enemy.dive?.targetX ?? slot.x
      const pos = quadraticBezier({ x: entryX, y: -18 }, { x: SCREEN.width / 2, y: 50 }, slot, t)
      if (t >= 1) {
        return {
          enemy: { ...enemy, state: "formation", x: slot.x, y: slot.y, t: 0, dive: null },
          fired: false,
        }
      }
      return { enemy: { ...enemy, x: pos.x, y: pos.y, t }, fired: false }
    }
    case "entering":
    case "formation":
    case "gone":
      return { enemy, fired: false }
  }
}
