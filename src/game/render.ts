import { SCREEN, TIMING } from "../config"
import type { Enemy } from "../enemies/formation"
import { type EnemyKind, isChallengeStage } from "../enemies/waves"
import { ITEM_INFO } from "../entities/items"
import { invulnerable, shieldActive } from "../entities/player"
import { drawHud } from "../hud"
import { drawText, drawTextCentered } from "../render/font"
import { drawParticles } from "../render/particles"
import { type SpriteName, spriteCanvas } from "../render/sprites"
import { drawStarfield } from "../render/starfield"
import { DEFAULT_HISCORES } from "../scoring"
import type { Game } from "./state"

const ENEMY_SPRITE: Record<EnemyKind, readonly [SpriteName, SpriteName]> = {
  boss: ["bossA", "bossB"],
  mid: ["enemyMidA", "enemyMidB"],
  low: ["enemyLowA", "enemyLowB"],
}

const blinking = (nowMs: number): boolean => Math.floor(nowMs / TIMING.blinkMs) % 2 === 0

const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy, nowMs: number): void => {
  const pair = ENEMY_SPRITE[enemy.kind]
  const sprite = spriteCanvas(Math.floor(nowMs / 240) % 2 === 0 ? pair[0] : pair[1])
  const x = Math.round(enemy.x - sprite.width / 2)
  const y = Math.round(enemy.y - sprite.height / 2)
  ctx.drawImage(sprite, x, y)
  if (nowMs < enemy.hitFlashUntilMs) {
    ctx.globalCompositeOperation = "lighter"
    ctx.globalAlpha = 0.75
    ctx.drawImage(sprite, x, y)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
  }
}

const drawPlayer = (ctx: CanvasRenderingContext2D, game: Game): void => {
  const { player, nowMs } = game
  if (invulnerable(player, nowMs) && Math.floor(nowMs / 90) % 2 === 0) return
  const ship = spriteCanvas("player")
  const x = Math.round(player.x - ship.width / 2)
  const y = Math.round(player.y - ship.height / 2)
  const flame = spriteCanvas(Math.floor(nowMs / 90) % 2 === 0 ? "engineFlameA" : "engineFlameB")
  ctx.drawImage(flame, Math.round(player.x - flame.width / 2), y + ship.height)
  ctx.drawImage(ship, x, y)
  if (shieldActive(player, nowMs)) {
    ctx.strokeStyle = "#6dff6d"
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(nowMs / 110)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(player.x, player.y, 10, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

const drawDrops = (ctx: CanvasRenderingContext2D, game: Game): void => {
  for (const drop of game.drops) {
    const info = ITEM_INFO[drop.kind]
    const capsule = spriteCanvas("itemCapsule", { ch: "C", color: info.color })
    const x = Math.round(drop.x - capsule.width / 2)
    const y = Math.round(drop.y - capsule.height / 2)
    ctx.drawImage(capsule, x, y)
    drawText(ctx, info.label, x + 3, y + 1, info.color)
  }
}

const drawBullets = (ctx: CanvasRenderingContext2D, game: Game): void => {
  const friendly = spriteCanvas("bulletPlayer")
  const hostile = spriteCanvas(
    Math.floor(game.nowMs / 120) % 2 === 0 ? "bulletEnemyA" : "bulletEnemyB",
  )
  for (const shot of game.bullets.shots) {
    const sprite = shot.friendly ? friendly : hostile
    ctx.drawImage(
      sprite,
      Math.round(shot.x - sprite.width / 2),
      Math.round(shot.y - sprite.height / 2),
    )
  }
}

const drawPopups = (ctx: CanvasRenderingContext2D, game: Game): void => {
  for (const popup of game.score.popups) {
    ctx.globalAlpha = Math.max(0, 1 - popup.ageMs / popup.ttlMs)
    drawTextCentered(ctx, popup.text, Math.round(popup.x), Math.round(popup.y), "#ffe94d")
  }
  ctx.globalAlpha = 1
}

const drawAttract = (ctx: CanvasRenderingContext2D, game: Game): void => {
  const now = game.nowMs
  drawTextCentered(ctx, "GALLAG", SCREEN.width / 2, 34, "#4df3ff", 4)
  drawTextCentered(ctx, "OMO ARCADE 2026", SCREEN.width / 2, 74, "#8a8f9e")
  drawTextCentered(ctx, "HIGH SCORES", SCREEN.width / 2, 96, "#4d7df3")
  const table = game.hiScores.length >= 5 ? game.hiScores : DEFAULT_HISCORES
  table.forEach((entry, i) => {
    const y = 108 + i * 10
    drawText(ctx, `${i + 1}.`, 58, y, "#8a8f9e")
    drawText(ctx, entry.name, 78, y, "#f2f2f2")
    drawText(ctx, String(entry.score), 118, y, "#ffe94d")
  })
  drawTextCentered(ctx, "SCORE ADVANCE TABLE", SCREEN.width / 2, 170, "#8a8f9e")
  const demo: readonly [EnemyKind, string][] = [
    ["boss", "150"],
    ["mid", "100"],
    ["low", "50"],
  ]
  demo.forEach(([kind, points], i) => {
    const y = 182 + i * 14
    const sprite = spriteCanvas(ENEMY_SPRITE[kind][0])
    ctx.drawImage(sprite, 66, y)
    drawText(ctx, `= ${points} PTS`, 88, y + 1, "#f2f2f2")
  })
  if (game.credits > 0) {
    drawText(ctx, `CREDIT ${game.credits}`, SCREEN.width - 52, SCREEN.height - 9, "#8a8f9e")
    if (blinking(now))
      drawTextCentered(ctx, "PRESS ENTER TO START", SCREEN.width / 2, 234, "#f2f2f2")
  } else if (blinking(now)) {
    drawTextCentered(ctx, "INSERT COIN", SCREEN.width / 2, 234, "#ffe94d")
  }
  drawTextCentered(ctx, "ARROWS MOVE  Z FIRE", SCREEN.width / 2, 252, "#8a8f9e")
  drawTextCentered(ctx, "M MUTE", SCREEN.width / 2, 262, "#8a8f9e")
}

const drawPhaseOverlay = (ctx: CanvasRenderingContext2D, game: Game): void => {
  const now = game.nowMs
  switch (game.phase.kind) {
    case "attract":
      drawAttract(ctx, game)
      return
    case "stageIntro": {
      const label = isChallengeStage(game.stage) ? "CHALLENGE STAGE" : `STAGE ${game.stage}`
      drawTextCentered(ctx, label, SCREEN.width / 2, 118, "#4df3ff", 2)
      if (blinking(now)) drawTextCentered(ctx, "READY!", SCREEN.width / 2, 146, "#ffe94d")
      return
    }
    case "playerDeath":
      return
    case "gameOver":
      drawTextCentered(ctx, "GAME OVER", SCREEN.width / 2, 128, "#ff3b30", 2)
      return
    case "enterName": {
      if (game.phase.kind !== "enterName") return
      const { name, cursor } = game.phase
      drawTextCentered(ctx, "ENTER YOUR NAME", SCREEN.width / 2, 96, "#4df3ff")
      const scale = 3
      const width = (name.length * 6 - 1) * scale
      const startX = Math.round(SCREEN.width / 2 - width / 2)
      drawText(ctx, name, startX, 128, "#f2f2f2", scale)
      if (blinking(now)) {
        ctx.fillStyle = "#ffe94d"
        ctx.fillRect(startX + cursor * 6 * scale, 128 + 8 * scale, 5 * scale, 2)
      }
      drawTextCentered(ctx, "ARROWS CHANGE  FIRE OK", SCREEN.width / 2, 168, "#8a8f9e")
      return
    }
    case "playing":
      return
  }
}

export const drawGame = (ctx: CanvasRenderingContext2D, game: Game): void => {
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, SCREEN.width, SCREEN.height)
  ctx.save()
  if (game.nowMs < game.shakeUntilMs) {
    const remaining = (game.shakeUntilMs - game.nowMs) / 240
    const amp = 4 * remaining
    ctx.translate(
      Math.round(Math.sin(game.nowMs * 1.7) * amp),
      Math.round(Math.cos(game.nowMs * 2.3) * amp),
    )
  }
  drawStarfield(ctx, game.starfield)
  const battlefieldVisible = game.phase.kind !== "attract" && game.phase.kind !== "enterName"
  if (battlefieldVisible) {
    for (const enemy of game.formation.enemies) {
      if (enemy.state !== "gone") drawEnemy(ctx, enemy, game.nowMs)
    }
  }
  drawDrops(ctx, game)
  drawBullets(ctx, game)
  if (game.phase.kind === "playing" || game.phase.kind === "stageIntro") {
    drawPlayer(ctx, game)
  }
  drawParticles(ctx, game.particles)
  drawPopups(ctx, game)
  ctx.restore()
  if (game.nowMs < game.flashUntilMs) {
    ctx.fillStyle = "rgba(255,59,48,0.28)"
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height)
  }
  if (game.phase.kind !== "attract") drawHud(ctx, game)
  drawPhaseOverlay(ctx, game)
}
