const canvas = document.querySelector<HTMLCanvasElement>("#game")
const ctx = canvas?.getContext("2d")
if (ctx) {
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, 224, 288)
}
