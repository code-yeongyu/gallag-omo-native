import { describe, expect, it } from "vitest"
import { createInputState, reduceKey } from "../src/input"

describe("reduceKey", () => {
  it("sets left while ArrowLeft is down and clears on keyup", () => {
    const s0 = createInputState()
    const s1 = reduceKey(s0, "ArrowLeft", true)
    expect(s1.left).toBe(true)
    const s2 = reduceKey(s1, "ArrowLeft", false)
    expect(s2.left).toBe(false)
  })

  it("maps KeyA/KeyD to left/right", () => {
    const s0 = createInputState()
    expect(reduceKey(s0, "KeyA", true).left).toBe(true)
    expect(reduceKey(s0, "KeyD", true).right).toBe(true)
  })

  it("maps Space and KeyZ to fire", () => {
    const s0 = createInputState()
    expect(reduceKey(s0, "Space", true).fire).toBe(true)
    expect(reduceKey(s0, "KeyZ", true).fire).toBe(true)
  })

  it("raises coin only on the keydown edge, not while held", () => {
    const s0 = createInputState()
    const s1 = reduceKey(s0, "Enter", true)
    expect(s1.coinPressed).toBe(true)
    const s2 = reduceKey(s1, "Enter", true)
    expect(s2.coinPressed).toBe(false)
    const s3 = reduceKey(s2, "Enter", false)
    const s4 = reduceKey(s3, "Enter", true)
    expect(s4.coinPressed).toBe(true)
  })

  it("raises muteToggled on the KeyM keydown edge", () => {
    const s0 = createInputState()
    expect(reduceKey(s0, "KeyM", true).muteToggled).toBe(true)
  })

  it("does not mutate the previous state", () => {
    const s0 = createInputState()
    reduceKey(s0, "ArrowLeft", true)
    expect(s0.left).toBe(false)
  })

  it("ignores unmapped keys", () => {
    const s0 = createInputState()
    const s1 = reduceKey(s0, "KeyQ", true)
    expect(s1).toEqual(s0)
  })
})
