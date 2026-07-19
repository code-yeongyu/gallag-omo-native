import { createSynth } from "./audio/synth"
import { ITEM, TIMING } from "./config"
import type { ItemKind } from "./entities/items"
import { drawGame } from "./game/render"
import { createGame, type FrameInput, type Game } from "./game/state"
import { updateGame } from "./game/update"
import { attachKeyboard, clearEdges, type InputState, reduceKey } from "./input"
import { autopilotInput, type GallagQa, installQa } from "./qa"
import { createRng } from "./rng"
import { DEFAULT_HISCORES, type HiScoreEntry } from "./scoring"

const HISCORE_KEY = "gallag.hiscores.v1"

const loadHiScores = (): readonly HiScoreEntry[] => {
  const raw = localStorage.getItem(HISCORE_KEY)
  if (!raw) return DEFAULT_HISCORES
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (e): e is HiScoreEntry =>
          typeof e === "object" &&
          e !== null &&
          "name" in e &&
          "score" in e &&
          typeof (e as { name: unknown }).name === "string" &&
          typeof (e as { score: unknown }).score === "number",
      )
    ) {
      return parsed.slice(0, 5)
    }
    return DEFAULT_HISCORES
  } catch (e) {
    if (e instanceof SyntaxError) return DEFAULT_HISCORES
    throw e
  }
}

const params = new URLSearchParams(window.location.search)
const seed = Number(params.get("seed") ?? Date.now())
const qaEnabled = params.get("qa") === "1"

const canvas = document.querySelector<HTMLCanvasElement>("#game")
if (!canvas) throw new Error("canvas #game missing")
const ctx = canvas.getContext("2d")
if (!ctx) throw new Error("2d context unavailable")
ctx.imageSmoothingEnabled = false

const synth = createSynth()
const rng = createRng(seed)
let game: Game = createGame(rng, loadHiScores())
let input: InputState = {
  left: false,
  right: false,
  fire: false,
  coinPressed: false,
  muteToggled: false,
  coinHeld: false,
  muteHeld: false,
}
let prevInput: InputState = input
let autopilot = false

const detach = attachKeyboard((code, down) => {
  if (down) synth.unlock()
  input = reduceKey(input, code, down)
})
window.addEventListener("beforeunload", detach)

const frameInput = (): FrameInput => {
  const frame: FrameInput = {
    ...input,
    leftEdge: input.left && !prevInput.left,
    rightEdge: input.right && !prevInput.right,
    fireEdge: input.fire && !prevInput.fire,
  }
  prevInput = input
  input = clearEdges(input)
  return frame
}

const qa: GallagQa = {
  state: () => game,
  coin: () => {
    synth.unlock()
    input = { ...input, coinPressed: true }
  },
  spawnItem: (kind: ItemKind) => {
    game = {
      ...game,
      drops: [...game.drops, { x: game.player.x, y: game.player.y - ITEM.magnetRadius - 30, kind }],
    }
  },
  killPlayer: () => {
    game = {
      ...game,
      player: {
        ...game.player,
        invulnUntilMs: 0,
        powers: { ...game.player.powers, shieldUntilMs: 0 },
      },
      bullets: { shots: [{ x: game.player.x, y: game.player.y, vy: 0, friendly: false }] },
    }
  },
  setInvuln: (ms: number) => {
    game = { ...game, player: { ...game.player, invulnUntilMs: game.nowMs + ms } }
  },
  autopilot: (on: boolean) => {
    autopilot = on
  },
  isAutopilot: () => autopilot,
  forceGameOver: () => {
    game = {
      ...game,
      player: { ...game.player, lives: 0 },
      phase: { kind: "gameOver", sinceMs: game.nowMs },
    }
  },
  addScore: (points: number) => {
    game = { ...game, score: { ...game.score, score: game.score.score + points } }
  },
}
installQa(qa, qaEnabled)

const STEP_MS = 1000 / TIMING.logicHz
let last = performance.now()
let acc = 0

const tick = (now: number): void => {
  const elapsed = Math.min(100, now - last)
  last = now
  acc += elapsed
  let steps = 0
  while (acc >= STEP_MS && steps < 5) {
    const frame = autopilot && game.phase.kind === "playing" ? autopilotInput(game) : frameInput()
    const result = updateGame(game, frame, STEP_MS, rng)
    game = result.game
    for (const event of result.events) synth.play(event)
    if (result.persistHiScores) {
      localStorage.setItem(HISCORE_KEY, JSON.stringify(result.persistHiScores))
    }
    acc -= STEP_MS
    steps++
  }
  synth.setMuted(game.muted)
  drawGame(ctx, game)
  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
