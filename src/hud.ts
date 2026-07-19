import { SCREEN } from "./config"
import type { Game } from "./game/state"
import { drawText, drawTextCentered } from "./render/font"
import { spriteCanvas } from "./render/sprites"

export const drawHud = (ctx: CanvasRenderingContext2D, game: Game): void => {
  drawText(ctx, "1UP", 10, 4, "#ff3b30")
  drawText(ctx, String(game.score.score), 10, 13, "#f2f2f2")
  drawTextCentered(ctx, "HIGH SCORE", SCREEN.width / 2, 4, "#4d7df3")
  const best = game.hiScores[0]?.score ?? 0
  drawTextCentered(ctx, String(Math.max(best, game.score.score)), SCREEN.width / 2, 13, "#f2f2f2")

  const ship = spriteCanvas("player")
  const lives = Math.min(game.player.lives - 1, 4)
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(ship, 8 + i * 15, SCREEN.height - 11)
  }

  drawText(ctx, `CREDIT ${game.credits}`, SCREEN.width - 52, SCREEN.height - 9, "#8a8f9e")
  const badges = Math.min(game.stage, 8)
  const badge = spriteCanvas("bossA")
  for (let i = 0; i < badges; i++) {
    ctx.drawImage(badge, SCREEN.width - 14 - i * 11, SCREEN.height - 22, 10, 7)
  }
}
