import type { Rng } from "../rng"

export type Shard = {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly ageMs: number
  readonly ttlMs: number
  readonly color: string
  readonly size: number
}

export type Particles = {
  readonly shards: readonly Shard[]
}

export const createParticles = (): Particles => ({ shards: [] })

const HOT = "#fff3b0"
const MID = "#ff9d2e"
const COOL = "#e03a3a"

export const spawnExplosion = (sys: Particles, x: number, y: number, rng: Rng): Particles => {
  const count = rng.int(16, 24)
  const spawned: Shard[] = []
  for (let i = 0; i < count; i++) {
    const angle = rng.range(0, Math.PI * 2)
    const speed = rng.range(18, 92)
    const color = speed > 62 ? HOT : speed > 36 ? MID : COOL
    spawned.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ageMs: 0,
      ttlMs: rng.range(300, 700),
      color,
      size: rng.int(1, 2),
    })
  }
  return { shards: [...sys.shards, ...spawned] }
}

export const spawnHitSpark = (sys: Particles, x: number, y: number, rng: Rng): Particles => {
  const spawned: Shard[] = []
  for (let i = 0; i < 6; i++) {
    const angle = rng.range(0, Math.PI * 2)
    const speed = rng.range(30, 70)
    spawned.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ageMs: 0,
      ttlMs: rng.range(120, 240),
      color: HOT,
      size: 1,
    })
  }
  return { shards: [...sys.shards, ...spawned] }
}

export const updateParticles = (sys: Particles, dtMs: number): Particles => ({
  shards: sys.shards
    .map((shard) => ({
      ...shard,
      x: shard.x + (shard.vx * dtMs) / 1000,
      y: shard.y + (shard.vy * dtMs) / 1000,
      ageMs: shard.ageMs + dtMs,
    }))
    .filter((shard) => shard.ageMs < shard.ttlMs),
})

export const drawParticles = (ctx: CanvasRenderingContext2D, sys: Particles): void => {
  for (const shard of sys.shards) {
    const fade = 1 - shard.ageMs / shard.ttlMs
    ctx.globalAlpha = Math.max(0, fade)
    ctx.fillStyle = shard.color
    ctx.fillRect(Math.round(shard.x), Math.round(shard.y), shard.size, shard.size)
  }
  ctx.globalAlpha = 1
}
