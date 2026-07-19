import type { SfxEvent, SfxName } from "./sfx"
import { SFX_SCORES } from "./sfx"

/** Thin WebAudio player for SFX scores. Context is created lazily on unlock()
 * (browser autoplay policy requires a user gesture first). */
export type Synth = {
  readonly unlock: () => void
  readonly play: (name: SfxName) => void
  readonly setMuted: (muted: boolean) => void
  readonly isMuted: () => boolean
}

export const createSynth = (): Synth => {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let muted = false

  const unlock = (): void => {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.5
      master.connect(ctx.destination)
    }
    if (ctx.state === "suspended") {
      void ctx.resume()
    }
  }

  const playTone = (ctx: AudioContext, master: GainNode, ev: SfxEvent & { kind: "tone" }): void => {
    const t0 = ctx.currentTime + ev.atMs / 1000
    const osc = ctx.createOscillator()
    osc.type = ev.shape
    osc.frequency.setValueAtTime(ev.freq, t0)
    if (ev.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, ev.endFreq), t0 + ev.durMs / 1000)
    }
    const env = ctx.createGain()
    env.gain.setValueAtTime(ev.gain, t0)
    env.gain.exponentialRampToValueAtTime(0.001, t0 + ev.durMs / 1000)
    osc.connect(env)
    env.connect(master)
    osc.start(t0)
    osc.stop(t0 + ev.durMs / 1000 + 0.02)
  }

  const playNoise = (
    ctx: AudioContext,
    master: GainNode,
    ev: SfxEvent & { kind: "noise" },
  ): void => {
    const t0 = ctx.currentTime + ev.atMs / 1000
    const frames = Math.max(1, Math.floor((ctx.sampleRate * ev.durMs) / 1000))
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = ev.filterFreq
    const env = ctx.createGain()
    env.gain.setValueAtTime(ev.gain, t0)
    env.gain.exponentialRampToValueAtTime(0.001, t0 + ev.durMs / 1000)
    src.connect(filter)
    filter.connect(env)
    env.connect(master)
    src.start(t0)
  }

  const play = (name: SfxName): void => {
    if (!ctx || !master || muted) return
    for (const ev of SFX_SCORES[name]) {
      if (ev.kind === "tone") playTone(ctx, master, ev)
      else playNoise(ctx, master, ev)
    }
  }

  const setMuted = (next: boolean): void => {
    muted = next
    if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.5, ctx.currentTime, 0.01)
  }

  return { unlock, play, setMuted, isMuted: () => muted }
}
