import { describe, expect, it } from "vitest"
import { parseSprite, SPRITE_DEFS, SpriteDefError } from "../src/render/sprites"

describe("parseSprite", () => {
  it("parses the player sprite to 13x8 with transparent corners", () => {
    const grid = parseSprite(SPRITE_DEFS.player)
    expect(grid.width).toBe(13)
    expect(grid.height).toBe(8)
    expect(grid.pixelAt(0, 0)).toBeNull()
    expect(grid.pixelAt(6, 0)).toBe("#ffffff")
  })

  it("maps palette characters to colors", () => {
    const grid = parseSprite(SPRITE_DEFS.enemyLowA)
    expect(grid.pixelAt(3, 0)).toBe("#4d7df3")
    expect(grid.pixelAt(3, 2)).toBe("#ffffff")
  })

  it("rejects ragged rows", () => {
    expect(() => parseSprite({ rows: ["##", "####"], palette: { "#": "#fff" } })).toThrow(
      SpriteDefError,
    )
  })

  it("rejects characters missing from the palette", () => {
    expect(() => parseSprite({ rows: ["##?#"], palette: { "#": "#fff" } })).toThrow(SpriteDefError)
  })

  it("every shipped sprite parses", () => {
    for (const def of Object.values(SPRITE_DEFS)) {
      expect(() => parseSprite(def)).not.toThrow()
    }
  })
})
