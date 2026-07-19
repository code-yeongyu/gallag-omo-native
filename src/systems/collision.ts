import type { Rect } from "../types"

/** AABB overlap; touching edges do not count (pixel-fair). */
export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
