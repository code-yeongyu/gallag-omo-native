import { ITEM } from "../config"
import { dist } from "../math"
import type { Rng } from "../rng"

export const ITEM_KINDS = ["twin", "rapid", "shield", "bonus", "extraLife"] as const
export type ItemKind = (typeof ITEM_KINDS)[number]

export const ITEM_INFO: Record<ItemKind, { readonly color: string; readonly label: string }> = {
  twin: { color: "#ffe94d", label: "P" },
  rapid: { color: "#4df3ff", label: "R" },
  shield: { color: "#6dff6d", label: "S" },
  bonus: { color: "#ff9df3", label: "B" },
  extraLife: { color: "#ffffff", label: "1" },
}

export type Drop = {
  readonly x: number
  readonly y: number
  readonly kind: ItemKind
}

const WEIGHTS: readonly (readonly [ItemKind, number])[] = [
  ["twin", 0.3],
  ["rapid", 0.25],
  ["shield", 0.2],
  ["bonus", 0.2],
  ["extraLife", 0.05],
]

export const maybeDrop = (rng: Rng, x: number, y: number): Drop | null => {
  if (!rng.chance(ITEM.dropChance)) return null
  const roll = rng.next()
  let acc = 0
  for (const [kind, weight] of WEIGHTS) {
    acc += weight
    if (roll < acc) return { x, y, kind }
  }
  return { x, y, kind: "bonus" }
}

export const updateDrops = (
  drops: readonly Drop[],
  playerPos: { readonly x: number; readonly y: number },
  dtMs: number,
  screenH: number,
): Drop[] =>
  drops
    .map((drop) => {
      const d = dist(drop.x, drop.y, playerPos.x, playerPos.y)
      if (d < ITEM.magnetRadius && d > 0.5) {
        const step = Math.min(d, (ITEM.magnetSpeed * dtMs) / 1000)
        return {
          ...drop,
          x: drop.x + ((playerPos.x - drop.x) / d) * step,
          y: drop.y + ((playerPos.y - drop.y) / d) * step,
        }
      }
      return { ...drop, y: drop.y + (ITEM.driftSpeed * dtMs) / 1000 }
    })
    .filter((drop) => drop.y < screenH + 12)
