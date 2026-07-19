import { describe, expect, it } from "vitest"
import { GLYPHS, measureText, REQUIRED_CHARSET } from "../src/render/font"

describe("GLYPHS", () => {
  it("covers every character the game UI needs", () => {
    for (const ch of REQUIRED_CHARSET) {
      expect(GLYPHS[ch], `missing glyph for ${JSON.stringify(ch)}`).toBeDefined()
    }
  })

  it("every glyph is 5x7 with uniform row width", () => {
    for (const [ch, rows] of Object.entries(GLYPHS)) {
      expect(rows.length, `${ch} height`).toBe(7)
      for (const row of rows) {
        expect(row.length, `${ch} row width`).toBe(5)
        expect(/^[#.]+$/.test(row), `${ch} uses only # and .`).toBe(true)
      }
    }
  })

  it("space glyph is fully empty", () => {
    for (const row of GLYPHS[" "] ?? []) {
      expect(row).toBe(".....")
    }
  })
})

describe("measureText", () => {
  it("width is 6px per char minus trailing gap", () => {
    expect(measureText("A", 1)).toBe(5)
    expect(measureText("AB", 1)).toBe(11)
    expect(measureText("AB", 2)).toBe(22)
  })
})
