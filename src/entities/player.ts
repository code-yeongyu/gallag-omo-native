import { PLAYER, SCREEN } from "../config"
import type { InputState } from "../input"
import { clamp } from "../math"

export type PowerUps = {
  readonly twinUntilMs: number
  readonly rapidUntilMs: number
  readonly shieldUntilMs: number
}

export type Player = {
  readonly x: number
  readonly y: number
  readonly lives: number
  readonly invulnUntilMs: number
  readonly cooldownUntilMs: number
  readonly powers: PowerUps
}

export const createPlayer = (): Player => ({
  x: PLAYER.startX,
  y: PLAYER.startY,
  lives: PLAYER.startLives,
  invulnUntilMs: 0,
  cooldownUntilMs: 0,
  powers: { twinUntilMs: 0, rapidUntilMs: 0, shieldUntilMs: 0 },
})

export const movePlayer = (player: Player, input: InputState, dtMs: number): Player => {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  if (dir === 0) return player
  const x = clamp(
    player.x + (dir * PLAYER.speedPx * dtMs) / 1000,
    PLAYER.width / 2,
    SCREEN.width - PLAYER.width / 2,
  )
  return { ...player, x }
}

export const tryFire = (player: Player, nowMs: number): { player: Player; fired: boolean } => {
  if (nowMs < player.cooldownUntilMs) return { player, fired: false }
  const rapid = nowMs < player.powers.rapidUntilMs
  const cooldown = rapid ? PLAYER.rapidCooldownMs : PLAYER.fireCooldownMs
  return { player: { ...player, cooldownUntilMs: nowMs + cooldown }, fired: true }
}

export type HitResult = {
  readonly player: Player
  readonly lostLife: boolean
  readonly shieldConsumed: boolean
}

export const applyHit = (player: Player, nowMs: number): HitResult => {
  if (nowMs < player.invulnUntilMs) {
    return { player, lostLife: false, shieldConsumed: false }
  }
  if (nowMs < player.powers.shieldUntilMs) {
    return {
      player: {
        ...player,
        powers: { ...player.powers, shieldUntilMs: 0 },
        invulnUntilMs: nowMs + PLAYER.invulnMs,
      },
      lostLife: false,
      shieldConsumed: true,
    }
  }
  return {
    player: {
      ...player,
      lives: player.lives - 1,
      invulnUntilMs: nowMs + PLAYER.invulnMs,
    },
    lostLife: true,
    shieldConsumed: false,
  }
}

/** Housekeeping per tick: deadlines in the past normalize to 0 (inactive). */
export const tickPlayer = (player: Player, nowMs: number): Player => ({
  ...player,
  powers: {
    twinUntilMs: player.powers.twinUntilMs > nowMs ? player.powers.twinUntilMs : 0,
    rapidUntilMs: player.powers.rapidUntilMs > nowMs ? player.powers.rapidUntilMs : 0,
    shieldUntilMs: player.powers.shieldUntilMs > nowMs ? player.powers.shieldUntilMs : 0,
  },
})

export const twinActive = (player: Player, nowMs: number): boolean =>
  nowMs < player.powers.twinUntilMs

export const shieldActive = (player: Player, nowMs: number): boolean =>
  nowMs < player.powers.shieldUntilMs

export const invulnerable = (player: Player, nowMs: number): boolean => nowMs < player.invulnUntilMs
