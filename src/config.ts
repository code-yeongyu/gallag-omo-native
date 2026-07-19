export const SCREEN = { width: 224, height: 288 } as const

export const TIMING = {
  logicHz: 60,
  blinkMs: 530,
  stageIntroMs: 2200,
  deathPauseMs: 1600,
  gameOverMs: 2600,
} as const

export const PLAYER = {
  width: 13,
  height: 8,
  startX: SCREEN.width / 2,
  startY: 262,
  speedPx: 108,
  fireCooldownMs: 250,
  rapidCooldownMs: 110,
  invulnMs: 2200,
  startLives: 3,
  maxLives: 5,
} as const

export const BULLET = {
  playerSpeed: 220,
  enemySpeed: 78,
  playerWidth: 2,
  playerHeight: 6,
  enemyWidth: 3,
  enemyHeight: 5,
  maxPlayerShots: 4,
} as const

export const FORMATION = {
  cols: 8,
  rows: 4,
  cellW: 22,
  cellH: 18,
  originX: 28,
  originY: 46,
  swayAmplitude: 9,
  swaySpeed: 0.6,
} as const

export const ITEM = {
  width: 11,
  height: 9,
  driftSpeed: 26,
  magnetRadius: 28,
  magnetSpeed: 90,
  dropChance: 0.14,
  shieldMs: 8000,
  twinMs: 12000,
  rapidMs: 10000,
  bonusPoints: 1000,
} as const

export const SCORE = {
  boss: 150,
  mid: 100,
  low: 50,
  diveBonusMultiplier: 2,
  challengeHit: 100,
  extraLifeEvery: 30000,
} as const
