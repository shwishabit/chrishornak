/* Soft dashboard sounds (2026-10-15). Chris: no sharp sounds. Sine notes only, a slow
 * 20ms attack and a long fade, low volume. One mute switch for every sound on the page,
 * remembered in this browser. */

// A major pentatonic run: every step sounds good, nothing clashes.
export const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]

const MUTE_KEY = 'dash-wins-muted'
let ctx: AudioContext | null = null

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(m: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  } catch {}
}

/** Play notes one after another. Skips silently when muted or when audio is not available. */
export function chime(freqs: number[], gap = 0.09, force = false) {
  if (!force && isMuted()) return
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const t0 = ctx.currentTime + 0.01
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t = t0 + i * gap
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.07, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      o.connect(g).connect(ctx!.destination)
      o.start(t)
      o.stop(t + 0.65)
    })
  } catch {
    /* no audio: everything still works silently */
  }
}
