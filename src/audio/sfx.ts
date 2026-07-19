export type SfxName =
  | "coin"
  | "shoot"
  | "enemyDie"
  | "playerDie"
  | "item"
  | "stageJingle"
  | "dive"
  | "gameOver"

export const SFX_NAMES = [
  "coin",
  "shoot",
  "enemyDie",
  "playerDie",
  "item",
  "stageJingle",
  "dive",
  "gameOver",
] as const satisfies readonly SfxName[]

export type WaveShape = "square" | "sawtooth" | "triangle" | "sine"

export type ToneEvent = {
  readonly kind: "tone"
  readonly atMs: number
  readonly durMs: number
  readonly freq: number
  readonly endFreq?: number
  readonly shape: WaveShape
  readonly gain: number
}

export type NoiseEvent = {
  readonly kind: "noise"
  readonly atMs: number
  readonly durMs: number
  readonly filterFreq: number
  readonly gain: number
}

export type SfxEvent = ToneEvent | NoiseEvent

const tone = (
  atMs: number,
  durMs: number,
  freq: number,
  shape: WaveShape,
  gain: number,
  endFreq?: number,
): ToneEvent => ({
  kind: "tone",
  atMs,
  durMs,
  freq,
  shape,
  gain,
  ...(endFreq !== undefined ? { endFreq } : {}),
})

const noise = (atMs: number, durMs: number, filterFreq: number, gain: number): NoiseEvent => ({
  kind: "noise",
  atMs,
  durMs,
  filterFreq,
  gain,
})

export const SFX_SCORES: Record<SfxName, readonly SfxEvent[]> = {
  coin: [tone(0, 70, 1318, "square", 0.5), tone(70, 220, 1975, "square", 0.45)],
  shoot: [tone(0, 60, 880, "square", 0.28, 440)],
  enemyDie: [noise(0, 160, 900, 0.5), tone(0, 120, 320, "sawtooth", 0.3, 90)],
  playerDie: [
    tone(0, 600, 520, "sawtooth", 0.5, 60),
    noise(0, 550, 500, 0.4),
    tone(180, 300, 240, "triangle", 0.3, 70),
  ],
  item: [
    tone(0, 80, 660, "square", 0.4),
    tone(80, 80, 880, "square", 0.4),
    tone(160, 80, 1108, "square", 0.4),
    tone(240, 140, 1318, "square", 0.45),
  ],
  stageJingle: [
    tone(0, 120, 523, "square", 0.4),
    tone(120, 120, 659, "square", 0.4),
    tone(240, 120, 784, "square", 0.4),
    tone(360, 120, 1046, "square", 0.45),
    tone(480, 260, 1318, "square", 0.4),
  ],
  dive: [tone(0, 260, 1400, "sawtooth", 0.22, 300)],
  gameOver: [
    tone(0, 240, 392, "triangle", 0.45),
    tone(240, 240, 311, "triangle", 0.45),
    tone(480, 520, 233, "triangle", 0.5),
  ],
}
