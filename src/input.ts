export type InputState = {
  readonly left: boolean
  readonly right: boolean
  readonly fire: boolean
  readonly coinPressed: boolean
  readonly muteToggled: boolean
  readonly coinHeld: boolean
  readonly muteHeld: boolean
}

export const createInputState = (): InputState => ({
  left: false,
  right: false,
  fire: false,
  coinPressed: false,
  muteToggled: false,
  coinHeld: false,
  muteHeld: false,
})

export const reduceKey = (state: InputState, code: string, down: boolean): InputState => {
  switch (code) {
    case "ArrowLeft":
    case "KeyA":
      return { ...state, left: down }
    case "ArrowRight":
    case "KeyD":
      return { ...state, right: down }
    case "Space":
    case "KeyZ":
      return { ...state, fire: down }
    case "Enter":
      return { ...state, coinPressed: down && !state.coinHeld, coinHeld: down }
    case "KeyM":
      return { ...state, muteToggled: down && !state.muteHeld, muteHeld: down }
    default:
      return state
  }
}

/** Edge-triggered flags must be consumed once per logic tick. */
export const clearEdges = (state: InputState): InputState => ({
  ...state,
  coinPressed: false,
  muteToggled: false,
})

export const attachKeyboard = (onKey: (code: string, down: boolean) => void): (() => void) => {
  const keydown = (e: KeyboardEvent): void => {
    if (e.repeat) return
    onKey(e.code, true)
  }
  const keyup = (e: KeyboardEvent): void => onKey(e.code, false)
  window.addEventListener("keydown", keydown)
  window.addEventListener("keyup", keyup)
  return () => {
    window.removeEventListener("keydown", keydown)
    window.removeEventListener("keyup", keyup)
  }
}
