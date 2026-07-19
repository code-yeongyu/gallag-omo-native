// GALLAG visual QA capture — drives the real game in system Chrome via
// playwright-core, staging each success-criterion scenario through the
// window.__gallag debug hooks (?qa=1&seed=42 for determinism).
// Usage: node scripts/qa/capture.mjs [baseUrl] [evidenceDir]

import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright-core"

const baseUrl = process.argv[2] ?? "http://localhost:4173"
const evidenceDir = process.argv[3] ?? ".omo/evidence/galaga"
mkdirSync(evidenceDir, { recursive: true })

const consoleErrors = []
const failures = []
const passes = []

const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 960, height: 1280 }, deviceScaleFactor: 2 })
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text())
})
page.on("pageerror", (err) => consoleErrors.push(String(err)))

const shot = (name) => page.screenshot({ path: join(evidenceDir, `${name}.png`) })
const state = () => page.evaluate(() => window.__gallag.state())
const qa = (expr) => page.evaluate(expr)

const waitState = async (description, predicate, timeoutMs = 20000) => {
  await page.waitForFunction(predicate, null, { timeout: timeoutMs, polling: 50 })
  console.log(`  ok: ${description}`)
}

const scenario = async (name, fn) => {
  try {
    await fn()
    passes.push(name)
    console.log(`PASS ${name}`)
  } catch (err) {
    failures.push(`${name}: ${String(err).split("\n")[0]}`)
    console.log(`FAIL ${name}: ${String(err).split("\n")[0]}`)
  }
}

await page.goto(`${baseUrl}/?qa=1&seed=42`, { waitUntil: "networkidle" })
await page.waitForFunction(() => window.__gallag !== undefined, null, { timeout: 10000 })

// ── Criterion 1: attract cabinet ─────────────────────────────────────
await scenario("c1-attract", async () => {
  await waitState("attract phase", () => window.__gallag.state().phase.kind === "attract")
  await page.waitForTimeout(700)
  await shot("01-attract-a")
  // INSERT COIN blinks at 530ms cadence — capture the opposite blink frame
  const firstBlink = await page.evaluate(() => Math.floor(window.__gallag.state().nowMs / 530) % 2)
  await page.waitForFunction(
    (first) => Math.floor(window.__gallag.state().nowMs / 530) % 2 !== first,
    firstBlink,
    { timeout: 5000, polling: 30 },
  )
  await shot("02-attract-b")
})

// ── Criterion 2: coin -> intro -> formation -> combat ────────────────
await scenario("c2-core-loop", async () => {
  await qa(() => window.__gallag.coin())
  await waitState("credit registered", () => window.__gallag.state().credits === 1)
  await shot("03-credit")
  await qa(() => window.__gallag.coin())
  await waitState("stage intro", () => window.__gallag.state().phase.kind === "stageIntro")
  await page.waitForTimeout(350)
  await shot("04-stage-intro")
  await waitState("playing", () => window.__gallag.state().phase.kind === "playing")
  await waitState(
    "formation settled",
    () => window.__gallag.state().formation.enemies.every((e) => e.state === "formation"),
    30000,
  )
  await shot("05-formation")
  await qa(() => window.__gallag.autopilot(true))
  await page.waitForFunction(
    () =>
      window.__gallag.state().bullets.shots.some((s) => s.friendly) &&
      window.__gallag.state().particles.shards.length > 4,
    null,
    { timeout: 30000, polling: 40 },
  )
  await shot("06-combat-explosion")
  await page.waitForFunction(
    () => window.__gallag.state().formation.enemies.some((e) => e.state === "diving"),
    null,
    { timeout: 30000, polling: 40 },
  )
  await shot("07-dive")
  await qa(() => window.__gallag.autopilot(false))
})

// ── Criterion 3: items ───────────────────────────────────────────────
await scenario("c3-items", async () => {
  await qa(() => window.__gallag.autopilot(false))
  await qa(() => window.__gallag.setInvuln(45000))
  await waitState(
    "playing for items",
    () => window.__gallag.state().phase.kind === "playing",
    30000,
  )
  await qa(() => window.__gallag.spawnItem("twin"))
  await page.waitForTimeout(260)
  await shot("08-item-drop")
  await waitState(
    "twin collected",
    () => window.__gallag.state().player.powers.twinUntilMs > window.__gallag.state().nowMs,
  )
  await page.keyboard.down("KeyZ")
  await page.waitForFunction(
    () => window.__gallag.state().bullets.shots.filter((s) => s.friendly).length >= 2,
    null,
    { timeout: 15000, polling: 40 },
  )
  await page.waitForFunction(() => Math.floor(window.__gallag.state().nowMs / 90) % 2 !== 0, null, {
    timeout: 5000,
    polling: 20,
  })
  await shot("09-twin-shot")
  await page.keyboard.up("KeyZ")
  await qa(() => window.__gallag.spawnItem("shield"))
  await waitState(
    "shield collected",
    () => window.__gallag.state().player.powers.shieldUntilMs > window.__gallag.state().nowMs,
  )
  await page.waitForFunction(() => Math.floor(window.__gallag.state().nowMs / 90) % 2 !== 0, null, {
    timeout: 5000,
    polling: 20,
  })
  await shot("10-shield-ring")
})

// ── Criterion 4: death, game over, name entry, hi-score ─────────────
await scenario("c4-flow", async () => {
  await waitState(
    "playing for death",
    () => window.__gallag.state().phase.kind === "playing",
    30000,
  )
  await qa(() => window.__gallag.addScore(99999))
  await qa(() => window.__gallag.killPlayer())
  await page.waitForTimeout(140)
  await shot("11-death-explosion")
  const phase = (await state()).phase.kind
  if (phase !== "playerDeath") throw new Error(`expected playerDeath, got ${phase}`)
  await qa(() => window.__gallag.forceGameOver())
  await shot("12-game-over")
  await waitState("enter name", () => window.__gallag.state().phase.kind === "enterName", 15000)
  await shot("13-enter-name")
  const holdKey = async (code) => {
    await page.keyboard.down(code)
    await page.waitForTimeout(140)
    await page.keyboard.up(code)
    await page.waitForTimeout(80)
  }
  await holdKey("ArrowRight")
  await holdKey("KeyZ")
  await holdKey("KeyZ")
  await holdKey("KeyZ")
  await waitState("back to attract", () => window.__gallag.state().phase.kind === "attract")
  await page.waitForTimeout(300)
  await shot("14-hiscore-updated")
  const top = (await state()).hiScores[0]
  if (!top || top.score < 99999 || top.name !== "BAA") {
    throw new Error(`hi-score not saved: ${JSON.stringify(top)}`)
  }
})

await browser.close()

console.log(
  `\n${passes.length} passed, ${failures.length} failed, ${consoleErrors.length} console errors`,
)
for (const f of failures) console.log(`  FAIL ${f}`)
for (const e of consoleErrors) console.log(`  CONSOLE ${e}`)
if (failures.length > 0 || consoleErrors.length > 0) process.exit(1)
console.log("ALL QA SCENARIOS PASS")
