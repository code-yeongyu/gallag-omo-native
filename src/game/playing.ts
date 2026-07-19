import type { SfxName } from "../audio/sfx"
import { BULLET, ITEM, PLAYER, SCREEN } from "../config"
import { pickDiver, startDive, updateDiving } from "../enemies/dive"
import { formationAlive, updateFormation } from "../enemies/formation"
import { firePlayer, updateBullets } from "../entities/bullets"
import { maybeDrop, updateDrops } from "../entities/items"
import { movePlayer, tickPlayer, tryFire, twinActive } from "../entities/player"
import { spawnExplosion, spawnHitSpark } from "../render/particles"
import type { Rng } from "../rng"
import { addBonus, addKill } from "../scoring"
import { collectDrops, hitEnemies, hitPlayer } from "./collisions"
import type { FrameInput, Game } from "./state"
import { startStage } from "./state"

const applyDropEffect = (
  game: Game,
  kind: (typeof game.drops)[number]["kind"],
  events: SfxName[],
): Game => {
  const now = game.nowMs
  switch (kind) {
    case "twin":
      return {
        ...game,
        player: {
          ...game.player,
          powers: { ...game.player.powers, twinUntilMs: now + ITEM.twinMs },
        },
      }
    case "rapid":
      return {
        ...game,
        player: {
          ...game.player,
          powers: { ...game.player.powers, rapidUntilMs: now + ITEM.rapidMs },
        },
      }
    case "shield":
      return {
        ...game,
        player: {
          ...game.player,
          powers: { ...game.player.powers, shieldUntilMs: now + ITEM.shieldMs },
        },
      }
    case "bonus":
      events.push("item")
      return {
        ...game,
        score: addBonus(game.score, ITEM.bonusPoints, game.player.x, game.player.y - 14),
      }
    case "extraLife":
      return {
        ...game,
        player: { ...game.player, lives: Math.min(PLAYER.maxLives, game.player.lives + 1) },
      }
  }
}

export const updatePlaying = (
  game: Game,
  input: FrameInput,
  dtMs: number,
  rng: Rng,
  events: SfxName[],
): Game => {
  let g = game
  let player = tickPlayer(movePlayer(g.player, input, dtMs), g.nowMs)

  let bullets = g.bullets
  if (input.fire) {
    const attempt = tryFire(player, g.nowMs)
    player = attempt.player
    if (attempt.fired) {
      bullets = firePlayer(bullets, player.x, player.y, twinActive(player, g.nowMs))
      events.push("shoot")
    }
  }

  let formation = updateFormation(g.formation, dtMs)
  if (formationAlive(formation) > 0 && !formation.challenge) {
    const divingCount = formation.enemies.filter(
      (e) => e.state === "diving" || e.state === "returning",
    ).length
    const cap = Math.min(2 + Math.floor(g.stage / 3), 4)
    const diveInMs = g.diveInMs - dtMs
    if (diveInMs <= 0 && divingCount < cap) {
      const diver = pickDiver(formation, rng)
      if (diver) {
        formation = {
          ...formation,
          enemies: formation.enemies.map((e) => (e.id === diver.id ? startDive(e, player.x) : e)),
        }
        events.push("dive")
      }
      g = { ...g, diveInMs: Math.max(900, 2600 - g.stage * 150) + rng.range(0, 800) }
    } else {
      g = { ...g, diveInMs }
    }
  }

  formation = {
    ...formation,
    enemies: formation.enemies.map((enemy) => {
      if (enemy.state !== "diving" && enemy.state !== "returning") return enemy
      const update = updateDiving(enemy, dtMs, player.x, SCREEN.height, rng, formation.swayPhase)
      if (update.fired) {
        events.push("shoot")
        bullets = {
          shots: [
            ...bullets.shots,
            { x: enemy.x, y: enemy.y + 6, vy: BULLET.enemySpeed, friendly: false },
          ],
        }
      }
      return update.enemy
    }),
  }

  bullets = updateBullets(bullets, dtMs)
  let drops = updateDrops(g.drops, player, dtMs, SCREEN.height)

  const enemyHits = hitEnemies(bullets, formation.enemies, rng, g.nowMs)
  bullets = enemyHits.bullets
  formation = { ...formation, enemies: enemyHits.enemies }
  let score = g.score
  let particles = g.particles
  let challengeHits = g.challengeHits
  for (const kill of enemyHits.kills) {
    particles = spawnExplosion(particles, kill.x, kill.y, rng)
    events.push("enemyDie")
    const award = addKill(score, kill.kind, kill.diving, kill.x, kill.y)
    score = award.state
    if (award.extraLife) {
      player = { ...player, lives: Math.min(PLAYER.maxLives, player.lives + 1) }
      events.push("item")
    }
    if (formation.challenge) challengeHits++
    const drop = maybeDrop(rng, kill.x, kill.y)
    if (drop && !formation.challenge) drops = [...drops, drop]
  }

  const collection = collectDrops(player, drops, g.nowMs)
  let nextGame: Game = {
    ...g,
    player,
    bullets,
    formation,
    drops: collection.drops,
    score,
    particles,
    challengeHits,
  }
  for (const kind of collection.collected) {
    if (kind !== "bonus") events.push("item")
    nextGame = applyDropEffect(nextGame, kind, events)
  }

  if (!formation.challenge) {
    const playerHit = hitPlayer(
      nextGame.player,
      nextGame.bullets,
      nextGame.formation.enemies,
      g.nowMs,
    )
    if (playerHit.shieldConsumed) {
      nextGame = { ...nextGame, player: playerHit.player, bullets: playerHit.bullets }
      nextGame = {
        ...nextGame,
        particles: spawnHitSpark(nextGame.particles, player.x, player.y, rng),
      }
      events.push("item")
    } else if (playerHit.died) {
      events.push("playerDie")
      return {
        ...nextGame,
        player: playerHit.player,
        bullets: playerHit.bullets,
        formation: { ...nextGame.formation, enemies: playerHit.enemies },
        particles: spawnExplosion(
          spawnExplosion(nextGame.particles, player.x, player.y, rng),
          player.x,
          player.y,
          rng,
        ),
        shakeUntilMs: g.nowMs + 240,
        flashUntilMs: g.nowMs + 120,
        phase: { kind: "playerDeath", sinceMs: g.nowMs },
      }
    } else {
      nextGame = { ...nextGame, player: playerHit.player, bullets: playerHit.bullets }
    }
  }

  const finished = nextGame.formation.enemies.every((e) => e.state === "gone")
  if (finished && nextGame.formation.enemies.length > 0) {
    let out = nextGame
    if (nextGame.formation.challenge) {
      const total = nextGame.formation.enemies.length
      const bonus = nextGame.challengeHits * 100
      out = { ...out, score: addBonus(out.score, bonus, SCREEN.width / 2, 120) }
      if (nextGame.challengeHits === total) {
        out = { ...out, score: addBonus(out.score, 5000, SCREEN.width / 2, 100) }
      }
      events.push("item")
    }
    return startStage(out, out.stage + 1)
  }
  return nextGame
}
