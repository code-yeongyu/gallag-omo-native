import type { ItemKind } from "./entities/items"
import type { FrameInput, Game } from "./game/state"

/** Deterministic autopilot for QA captures: drift toward the lowest live
 * enemy and hold fire. Not a real AI — just enough to stage screenshots. */
export const autopilotInput = (game: Game): FrameInput => {
  const targets = game.formation.enemies.filter((e) => e.state !== "gone")
  const lowest = targets.reduce<(typeof targets)[number] | null>(
    (acc, e) => (acc === null || e.y > acc.y ? e : acc),
    null,
  )
  const dx = lowest ? lowest.x - game.player.x : 0
  return {
    left: dx < -4,
    right: dx > 4,
    fire: true,
    coinPressed: false,
    muteToggled: false,
    coinHeld: false,
    muteHeld: false,
    leftEdge: false,
    rightEdge: false,
    fireEdge: true,
  }
}

export type GallagQa = {
  readonly state: () => Game
  readonly coin: () => void
  readonly spawnItem: (kind: ItemKind) => void
  readonly killPlayer: () => void
  readonly setInvuln: (ms: number) => void
  readonly autopilot: (on: boolean) => void
  readonly isAutopilot: () => boolean
  readonly forceGameOver: () => void
  readonly addScore: (points: number) => void
}

declare global {
  interface Window {
    __gallag?: GallagQa
  }
}

export const installQa = (qa: GallagQa, enabled: boolean): void => {
  if (enabled) window.__gallag = qa
}
