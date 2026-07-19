import type { Enemy } from "../enemies/formation"
import type { EnemyKind } from "../enemies/waves"
import type { Bullet, Bullets } from "../entities/bullets"
import type { Drop, ItemKind } from "../entities/items"
import { applyHit, type Player } from "../entities/player"
import type { Rng } from "../rng"
import { overlaps } from "../systems/collision"
import { type Rect, rect } from "../types"

export const ENEMY_SIZE: Record<EnemyKind, { readonly w: number; readonly h: number }> = {
  boss: { w: 14, h: 10 },
  mid: { w: 12, h: 7 },
  low: { w: 10, h: 7 },
}

const PLAYER_RECT = { w: 13, h: 8 } as const

const playerRect = (player: Player): Rect =>
  rect(player.x - PLAYER_RECT.w / 2, player.y - PLAYER_RECT.h / 2, PLAYER_RECT.w, PLAYER_RECT.h)

const enemyRect = (enemy: Enemy): Rect => {
  const size = ENEMY_SIZE[enemy.kind]
  return rect(enemy.x - size.w / 2, enemy.y - size.h / 2, size.w, size.h)
}

const bulletRect = (shot: Bullet, friendly: boolean): Rect =>
  friendly ? rect(shot.x - 1, shot.y - 3, 2, 6) : rect(shot.x - 1.5, shot.y - 2.5, 3, 5)

export type KillRecord = {
  readonly x: number
  readonly y: number
  readonly kind: EnemyKind
  readonly diving: boolean
}

export type HitEnemiesResult = {
  readonly bullets: Bullets
  readonly enemies: readonly Enemy[]
  readonly kills: readonly KillRecord[]
}

export const hitEnemies = (
  bullets: Bullets,
  enemies: readonly Enemy[],
  _rng: Rng,
  nowMs: number,
): HitEnemiesResult => {
  const kills: KillRecord[] = []
  let nextEnemies = enemies
  const survivingShots = bullets.shots.filter((shot) => {
    if (!shot.friendly) return true
    const area = bulletRect(shot, true)
    const target = nextEnemies.find(
      (enemy) => enemy.state !== "gone" && overlaps(area, enemyRect(enemy)),
    )
    if (!target) return true
    const damaged = { ...target, hp: target.hp - 1, hitFlashUntilMs: nowMs + 120 }
    const final = damaged.hp <= 0 ? { ...damaged, state: "gone" as const } : damaged
    if (final.state === "gone") {
      kills.push({
        x: target.x,
        y: target.y,
        kind: target.kind,
        diving: target.state === "diving" || target.state === "returning",
      })
    }
    nextEnemies = nextEnemies.map((enemy) => (enemy.id === target.id ? final : enemy))
    return false
  })
  return { bullets: { shots: survivingShots }, enemies: nextEnemies, kills }
}

export type HitPlayerResult = {
  readonly player: Player
  readonly bullets: Bullets
  readonly enemies: readonly Enemy[]
  readonly died: boolean
  readonly shieldConsumed: boolean
}

export const hitPlayer = (
  player: Player,
  bullets: Bullets,
  enemies: readonly Enemy[],
  nowMs: number,
): HitPlayerResult => {
  const area = playerRect(player)
  const bulletHit = bullets.shots.some(
    (shot) => !shot.friendly && overlaps(area, bulletRect(shot, false)),
  )
  const crashing = enemies.find(
    (enemy) =>
      (enemy.state === "diving" || enemy.state === "returning") && overlaps(area, enemyRect(enemy)),
  )
  if (!bulletHit && !crashing) {
    return { player, bullets, enemies, died: false, shieldConsumed: false }
  }
  const hit = applyHit(player, nowMs)
  const nextEnemies = crashing
    ? enemies.map((enemy) =>
        enemy.id === crashing.id ? { ...enemy, state: "gone" as const } : enemy,
      )
    : enemies
  const nextShots = bulletHit
    ? bullets.shots.filter((shot) => shot.friendly || !overlaps(area, bulletRect(shot, false)))
    : bullets.shots
  return {
    player: hit.player,
    bullets: { shots: nextShots },
    enemies: nextEnemies,
    died: hit.lostLife,
    shieldConsumed: hit.shieldConsumed,
  }
}

export type CollectDropsResult = {
  readonly drops: readonly Drop[]
  readonly collected: readonly ItemKind[]
}

export const collectDrops = (
  player: Player,
  drops: readonly Drop[],
  _nowMs: number,
): CollectDropsResult => {
  const area = playerRect(player)
  const collected: ItemKind[] = []
  const remaining = drops.filter((drop) => {
    const hit = overlaps(area, rect(drop.x - 5.5, drop.y - 4.5, 11, 9))
    if (hit) collected.push(drop.kind)
    return !hit
  })
  return { drops: remaining, collected }
}
