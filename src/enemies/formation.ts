import { FORMATION, SCREEN } from "../config"
import { quadraticBezier } from "../math"
import type { EnemySpec } from "./waves"

export type EnemyState = "entering" | "formation" | "diving" | "returning" | "gone"

export type DivePath = {
  readonly fromX: number
  readonly fromY: number
  readonly targetX: number
}

export type Enemy = {
  readonly id: number
  readonly kind: EnemySpec["kind"]
  readonly col: number
  readonly row: number
  readonly state: EnemyState
  readonly x: number
  readonly y: number
  readonly t: number
  readonly delayMs: number
  readonly dive: DivePath | null
  readonly hitFlashUntilMs: number
}

export type Formation = {
  readonly enemies: readonly Enemy[]
  readonly swayPhase: number
  readonly challenge: boolean
}

const ENTRANCE_MS = 1600 as const
const ENTRANCE_STAGGER_MS = 600 as const
const CHALLENGE_FLIGHT_MS = 5200 as const

export const formationSlotPos = (
  col: number,
  row: number,
  swayPhase: number,
): { readonly x: number; readonly y: number } => ({
  x: FORMATION.originX + col * FORMATION.cellW + Math.sin(swayPhase) * FORMATION.swayAmplitude,
  y: FORMATION.originY + row * FORMATION.cellH,
})

const entranceStart = (group: number): { readonly x: number; readonly y: number } =>
  group % 2 === 0 ? { x: -14, y: -18 } : { x: SCREEN.width + 14, y: -18 }

export const createFormation = (specs: readonly EnemySpec[], _stage: number): Formation => ({
  enemies: specs.map((spec, index) => {
    const start = entranceStart(spec.entrance)
    return {
      id: index,
      kind: spec.kind,
      col: spec.col,
      row: spec.row,
      state: "entering",
      x: start.x,
      y: start.y,
      t: 0,
      delayMs: spec.entrance * ENTRANCE_STAGGER_MS,
      dive: null,
      hitFlashUntilMs: 0,
    }
  }),
  swayPhase: 0,
  challenge: specs.some((spec) => spec.row === -1),
})

const updateEnteringNormal = (enemy: Enemy, swayPhase: number): Enemy => {
  const t = Math.min(1, enemy.t)
  const start = { x: enemy.x, y: enemy.y }
  const slot = formationSlotPos(enemy.col, enemy.row, 0)
  const ctrl = { x: start.x < SCREEN.width / 2 ? 30 : SCREEN.width - 30, y: slot.y + 110 }
  const pos = quadraticBezier(start, ctrl, slot, t)
  if (t >= 1) {
    const settled = formationSlotPos(enemy.col, enemy.row, swayPhase)
    return { ...enemy, state: "formation", x: settled.x, y: settled.y, t: 0 }
  }
  return { ...enemy, x: pos.x, y: pos.y, t: enemy.t }
}

const updateEnteringChallenge = (enemy: Enemy): Enemy => {
  const t = Math.min(1, enemy.t)
  const startX = 24 + enemy.col * 22
  const ctrl = { x: enemy.col % 2 === 0 ? SCREEN.width - 20 : 20, y: 130 }
  const pos = quadraticBezier({ x: startX, y: -18 }, ctrl, { x: startX, y: SCREEN.height + 18 }, t)
  if (t >= 1) return { ...enemy, state: "gone", x: pos.x, y: pos.y }
  const wobble = Math.sin(t * Math.PI * 4 + enemy.col) * 10
  return { ...enemy, x: pos.x + wobble, y: pos.y }
}

export const updateFormation = (formation: Formation, dtMs: number): Formation => {
  const swayPhase =
    formation.swayPhase + (((dtMs / 1000) * FORMATION.swaySpeed * Math.PI) % (Math.PI * 2))
  const enemies = formation.enemies.map((enemy) => {
    switch (enemy.state) {
      case "entering": {
        if (enemy.delayMs > 0) return { ...enemy, delayMs: enemy.delayMs - dtMs }
        const advanced = {
          ...enemy,
          t: enemy.t + dtMs / (formation.challenge ? CHALLENGE_FLIGHT_MS : ENTRANCE_MS),
        }
        return formation.challenge
          ? updateEnteringChallenge(advanced)
          : updateEnteringNormal(advanced, swayPhase)
      }
      case "formation": {
        const slot = formationSlotPos(enemy.col, enemy.row, swayPhase)
        return { ...enemy, x: slot.x, y: slot.y }
      }
      case "diving":
      case "returning":
      case "gone":
        return enemy
    }
  })
  return { enemies, swayPhase, challenge: formation.challenge }
}

export const formationAlive = (formation: Formation): number =>
  formation.enemies.filter((e) => e.state !== "gone").length

export const formationSettled = (formation: Formation): boolean =>
  formation.enemies.every((e) => e.state === "formation" || e.state === "gone")
