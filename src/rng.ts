export type Rng = {
  readonly next: () => number
  readonly range: (min: number, max: number) => number
  readonly int: (min: number, max: number) => number
  readonly chance: (p: number) => boolean
}

/** mulberry32 — small deterministic PRNG; `state` mutates by design (generator). */
export const createRng = (seed: number): Rng => {
  let state = seed >>> 0
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const range = (min: number, max: number): number => min + next() * (max - min)
  const int = (min: number, max: number): number => Math.floor(range(min, max + 1))
  const chance = (p: number): boolean => next() < p
  return { next, range, int, chance }
}
