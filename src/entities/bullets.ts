import { BULLET, SCREEN } from "../config"

export type Bullet = {
  readonly x: number
  readonly y: number
  readonly vy: number
  readonly friendly: boolean
}

export type Bullets = {
  readonly shots: readonly Bullet[]
}

export const createBullets = (): Bullets => ({ shots: [] })

export const firePlayer = (bullets: Bullets, x: number, y: number, twin: boolean): Bullets => {
  const room = BULLET.maxPlayerShots - bullets.shots.filter((s) => s.friendly).length
  if (room <= 0) return bullets
  const offsets = twin && room >= 2 ? [-4, 4] : [0]
  const spawned = offsets.map((dx) => ({
    x: x + dx,
    y: y - 6,
    vy: -BULLET.playerSpeed,
    friendly: true,
  }))
  return { shots: [...bullets.shots, ...spawned] }
}

export const fireEnemy = (bullets: Bullets, x: number, y: number): Bullets => ({
  shots: [...bullets.shots, { x, y: y + 6, vy: BULLET.enemySpeed, friendly: false }],
})

export const updateBullets = (
  bullets: Bullets,
  dtMs: number,
  screenH = SCREEN.height,
): Bullets => ({
  shots: bullets.shots
    .map((shot) => ({ ...shot, y: shot.y + (shot.vy * dtMs) / 1000 }))
    .filter((shot) => shot.y > -10 && shot.y < screenH + 10),
})
