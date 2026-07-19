export class SpriteDefError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpriteDefError"
  }
}

export type SpriteDef = {
  readonly rows: readonly string[]
  readonly palette: Readonly<Record<string, string>>
}

export type PixelGrid = {
  readonly width: number
  readonly height: number
  readonly pixels: readonly (string | null)[]
  readonly pixelAt: (x: number, y: number) => string | null
}

export const parseSprite = (def: SpriteDef): PixelGrid => {
  const height = def.rows.length
  const width = def.rows[0]?.length ?? 0
  if (height === 0 || width === 0) throw new SpriteDefError("sprite must be non-empty")
  const pixels: (string | null)[] = []
  for (const row of def.rows) {
    if (row.length !== width) throw new SpriteDefError("ragged sprite row")
    for (const ch of row) {
      if (ch === ".") {
        pixels.push(null)
        continue
      }
      const color = def.palette[ch]
      if (color === undefined)
        throw new SpriteDefError(`no palette color for ${JSON.stringify(ch)}`)
      pixels.push(color)
    }
  }
  return {
    width,
    height,
    pixels,
    pixelAt: (x, y) =>
      x < 0 || y < 0 || x >= width || y >= height ? null : (pixels[y * width + x] ?? null),
  }
}

const CYAN = "#4df3ff"
const WHITE = "#ffffff"
const YELLOW = "#ffd24d"
const RED = "#e03a3a"
const PURPLE = "#c04df0"
const BLUE = "#4d7df3"
const ORANGE = "#ff9d2e"
const BULLET_Y = "#ffe94d"
const BULLET_R = "#ff4d6d"

export const SPRITE_DEFS = {
  player: {
    rows: [
      "......W......",
      "......W......",
      ".....CWC.....",
      ".....CWC.....",
      "....CCWCC....",
      ".C..CCCCC..C.",
      "CC.CCCCCCC.CC",
      "CCCCCCCCCCCCC",
    ],
    palette: { C: CYAN, W: WHITE },
  },
  engineFlameA: {
    rows: ["..W..", ".OOO.", "OOOOO"],
    palette: { W: WHITE, O: ORANGE },
  },
  engineFlameB: {
    rows: ["..W..", "..O..", ".OOO."],
    palette: { W: WHITE, O: ORANGE },
  },
  bossA: {
    rows: [
      ".....YYYY.....",
      "....YRRRRY....",
      "...YRRRRRRY...",
      "..YRRWRRWRRY..",
      "..YRRRRRRRRY..",
      "...YRRRRRRY...",
      "....YRRRY.....",
      "...YYYRYYY....",
      "..Y..YRY..Y...",
      ".Y....Y....Y..",
    ],
    palette: { Y: YELLOW, R: RED, W: WHITE },
  },
  bossB: {
    rows: [
      ".....YYYY.....",
      "....YRRRRY....",
      "...YRRRRRRY...",
      "..YRRWRRWRRY..",
      "..YRRRRRRRRY..",
      "...YRRRRRRY...",
      "....YRRRY.....",
      "...YYYRYYY....",
      "....YRY.......",
      "...Y.R.Y......",
    ],
    palette: { Y: YELLOW, R: RED, W: WHITE },
  },
  enemyMidA: {
    rows: [
      ".....MM.....",
      "....MMMM....",
      "..MMWMMWMM..",
      ".MMMMMMMMMM.",
      "M..MMMMMM..M",
      "...MM..MM...",
      "..M......M..",
    ],
    palette: { M: PURPLE, W: WHITE },
  },
  enemyMidB: {
    rows: [
      ".....MM.....",
      "....MMMM....",
      "..MMWMMWMM..",
      ".MMMMMMMMMM.",
      "....MMMM....",
      "..M.M..M.M..",
      ".M........M.",
    ],
    palette: { M: PURPLE, W: WHITE },
  },
  enemyLowA: {
    rows: [
      "...BBBB...",
      "..BBBBBB..",
      ".BBWBBWBB.",
      "BBBBBBBBBB",
      "B.BBBBBB.B",
      "...B..B...",
      "..B....B..",
    ],
    palette: { B: BLUE, W: WHITE },
  },
  enemyLowB: {
    rows: [
      "...BBBB...",
      "..BBBBBB..",
      ".BBWBBWBB.",
      "BBBBBBBBBB",
      "....BB....",
      "..B.B..B..",
      ".B......B.",
    ],
    palette: { B: BLUE, W: WHITE },
  },
  bulletPlayer: {
    rows: ["YY", "YY", "YY", "YY", "YY", "YY"],
    palette: { Y: BULLET_Y },
  },
  bulletEnemyA: {
    rows: [".R.", "RRR", ".R.", "RRR", ".R."],
    palette: { R: BULLET_R },
  },
  bulletEnemyB: {
    rows: ["R.R", ".R.", "R.R", ".R.", "R.R"],
    palette: { R: BULLET_R },
  },
  itemCapsule: {
    rows: [
      "...CCCCC...",
      "..C.....C..",
      "..C.....C..",
      ".C.......C.",
      ".C.......C.",
      ".C.......C.",
      "..C.....C..",
      "..C.....C..",
      "...CCCCC...",
    ],
    palette: { C: WHITE },
  },
} as const satisfies Record<string, SpriteDef>

export type SpriteName = keyof typeof SPRITE_DEFS

const gridCache = new Map<string, PixelGrid>()
export const spriteGrid = (name: SpriteName): PixelGrid => {
  const cached = gridCache.get(name)
  if (cached) return cached
  const grid = parseSprite(SPRITE_DEFS[name])
  gridCache.set(name, grid)
  return grid
}

const canvasCache = new Map<string, HTMLCanvasElement>()

/** Build (or fetch) an offscreen canvas for a sprite, optionally overriding a
 * palette character's color (item capsules recolor "C" per item kind). */
export const spriteCanvas = (
  name: SpriteName,
  override?: { ch: string; color: string },
): HTMLCanvasElement => {
  const key = override ? `${name}:${override.color}` : name
  const cached = canvasCache.get(key)
  if (cached) return cached
  const def = SPRITE_DEFS[name]
  const palette = override ? { ...def.palette, [override.ch]: override.color } : def.palette
  const grid = parseSprite({ rows: def.rows, palette })
  const canvas = document.createElement("canvas")
  canvas.width = grid.width
  canvas.height = grid.height
  const ctx = canvas.getContext("2d")
  if (ctx) {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const color = grid.pixelAt(x, y)
        if (color !== null) {
          ctx.fillStyle = color
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
  }
  canvasCache.set(key, canvas)
  return canvas
}
