export type Vec2 = { readonly x: number; readonly y: number }

export type Rect = {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export const vec = (x: number, y: number): Vec2 => ({ x, y })

export const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })
