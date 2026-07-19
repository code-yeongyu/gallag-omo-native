import type { Rng } from "../rng"

export type StarLayer = {
  readonly speed: number
  readonly color: string
  readonly count: number
}

export const STAR_LAYERS = [
  { speed: 8, color: "#3a3f58", count: 30 },
  { speed: 18, color: "#7d8bb0", count: 22 },
  { speed: 34, color: "#e8ecff", count: 14 },
] as const satisfies readonly StarLayer[]

export type Star = {
  readonly x: number
  readonly y: number
  readonly layer: number
}

export type Starfield = {
  readonly stars: readonly Star[]
}

export const createStarfield = (rng: Rng, width: number, height: number): Starfield => {
  const stars: Star[] = []
  STAR_LAYERS.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      stars.push({ x: rng.range(0, width), y: rng.range(0, height), layer: layerIndex })
    }
  })
  return { stars }
}

export const updateStarfield = (
  field: Starfield,
  dtMs: number,
  width: number,
  height: number,
): Starfield => ({
  stars: field.stars.map((star) => {
    const layer = STAR_LAYERS[star.layer] ?? STAR_LAYERS[0]
    const y = (star.y + (layer.speed * dtMs) / 1000) % height
    return { ...star, y, x: ((star.x % width) + width) % width }
  }),
})

export const drawStarfield = (ctx: CanvasRenderingContext2D, field: Starfield): void => {
  for (const star of field.stars) {
    const layer = STAR_LAYERS[star.layer] ?? STAR_LAYERS[0]
    ctx.fillStyle = layer.color
    ctx.fillRect(Math.round(star.x), Math.round(star.y), 1, 1)
  }
}
