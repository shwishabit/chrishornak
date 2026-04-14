'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

const GREETING = [
  { text: 'hi.', delay: 600, hold: 1800 },
  { text: "i'm paige.", delay: 400, hold: 2000 },
  { text: 'the blog hands mark.', delay: 300, hold: 2800 },
  { text: 'nice to meet you.', delay: 400, hold: 2800 },
]

const REACTIONS = {
  poke: ['!', 'oh!', 'hey!', 'ow'],
  dodge: [':P', 'nope!', 'missed', 'haha', 'nuh-uh'],
  tickle: ['hehe', 'haha', 'eee', 'heeee'],
  pet: ['mmm', 'ahhh', 'nice', 'oof'],
  hug: ['aww', '<3', 'warm', 'hold me'],
  dizzy: ['whoaaa', 'oof', 'stop!', 'dizzy', 'wobbly'],
  wave: ['hi!', 'hey :)', 'heyyy', 'oh hi'],
  dance: ['la la', 'yeah!', 'woo', 'boogie'],
  sing: ['♪', '♫', 'la la la', 'ahhh ♪'],
  sleep: ['zzz', 'mmm...', 'shhh', 'nini'],
} as const

const BUTTON_ACTIONS = ['poke', 'tickle', 'wave', 'dance', 'sing', 'pet', 'hug', 'sleep'] as const
type ButtonAction = (typeof BUTTON_ACTIONS)[number]

type Reaction = keyof typeof REACTIONS | null
type Micro = 'none' | 'hop' | 'lean-l' | 'lean-r' | 'settle' | 'sad' | 'excited-hop'
type Flavor = { mag: number; speed: number; bonus: boolean }

const LONG_PRESS_MS = 700
const MOVE_PET_PX = 12
const TAP_MAX_MS = 240
const TICKLE_WINDOW_MS = 1500
const TICKLE_COUNT = 3
const DODGE_CHANCE = 0.35
const SHAKE_ACCEL_THRESHOLD = 22

const COBALT = '#525AFF'
const CREAM = '#FBFAF6'
const INK = '#0A0A0A'

// Each reaction has a distinct motion signature — no two feel alike.
// Values are in SVG user-space; multiplied by flavor.mag at render.
type MotionSpec = {
  x?: number[]
  y?: number[]
  rotate?: number[]
  scale?: number[]
  scaleY?: number[] // overrides blink during a reaction if provided
  duration: number
  easeX?: any
  easeY?: any
  easeRot?: any
  easeScale?: any
}
// Wall-E-flavored motion — precision, anticipation, tilts over flow.
// Each reaction has its own signature; no two feel alike.
const MOTION: Record<string, MotionSpec> = {
  poke: {
    // startle: compress, tilt away, then cautious peek back
    scale: [1, 0.82, 0.95, 1.04, 1],
    rotate: [0, -2, -7, 3, 0],
    y: [0, -0.3, 0.3, 0.1, 0],
    duration: 0.6,
    easeScale: [0.34, 1.56, 0.64, 1],
  },
  dodge: {
    // quick lateral duck with tilt
    x: [0, 3.5, 2.4, 0],
    rotate: [0, -8, -4, 0],
    scale: [1, 0.92, 1.02, 1],
    duration: 0.55,
  },
  tickle: {
    // rapid shimmer-laugh
    x: [-1.2, 1.2, -0.9, 0.7, -0.3, 0],
    rotate: [-5, 5, -3, 3, -1, 0],
    scale: [1, 1.08, 0.94, 1.06, 0.97, 1],
    duration: 0.9,
  },
  pet: {
    // dog-style: lean into the hand, head tilts, eye squeezes shut, settles
    rotate: [0, 4, 5, 5],
    y: [0, 0.3, 0.45, 0.45],
    scale: [1, 0.98, 0.96, 0.96],
    scaleY: [1, 0.45, 0.22, 0.2], // circle = eye closing
    duration: 1.0,
  },
  hug: {
    // slow warm bloom outward
    scale: [1, 1.06, 1.1, 1.07],
    rotate: [-1.5, 1.5, 0.5, 0],
    y: [0, -0.4, -0.2, 0],
    duration: 1.1,
    easeScale: [0.34, 1.56, 0.64, 1],
  },
  dizzy: {
    x: [-1.5, 1.5, -1, 1, 0],
    rotate: [0, 180, 360, 540, 720],
    scale: [1, 0.94, 1.04, 0.97, 1],
    duration: 1.2,
    easeRot: 'linear',
  },
  wave: {
    // anticipation: small pullback then a big greeting sweep
    rotate: [0, 5, -13, 11, -9, 5, -2, 0],
    y: [0, -0.3, 0, -0.2, 0, 0, 0, 0],
    duration: 1.3,
  },
  dance: {
    // staccato step rhythm — precise beats, Wall-E grooving
    x: [0, -0.7, 0.7, -0.5, 0.5, 0],
    y: [0, -1.3, 0.2, -1.3, 0.2, 0],
    rotate: [0, -6, 6, -5, 5, 0],
    scale: [1, 1.04, 0.98, 1.04, 1, 1],
    duration: 1.4,
  },
  sing: {
    // stretch tall with vibrato warble
    scaleY: [1, 1.28, 1.12, 1.28, 1.1, 1.2, 1],
    rotate: [0, -3, 3, -2, 1, 0],
    y: [0, -0.5, -0.2, -0.4, 0],
    duration: 1.2,
  },
  sleep: {
    // Wall-E power-down: methodical shrink, lid drops, slight side rest
    scale: [1, 0.98, 0.93, 0.88],
    y: [0, 0.4, 1.0, 1.4],
    rotate: [0, -2, 2, 1],
    scaleY: [1, 0.6, 0.25, 0.1],
    duration: 1.8,
  },
}

function makeFlavor(): Flavor {
  return {
    mag: 0.85 + Math.random() * 0.3,  // 0.85 – 1.15
    speed: 0.9 + Math.random() * 0.25, // 0.9 – 1.15
    bonus: Math.random() < 0.2,        // ~20% chance of secondary delight
  }
}

function scale(arr: number[] | undefined, mul: number) {
  if (!arr) return undefined
  return arr.map(n => n * mul)
}

export default function PaigeMascot() {
  const stageRef = useRef<HTMLDivElement>(null)
  const voiceIdRef = useRef(0)
  const lastReactionRef = useRef<string | null>(null)

  const dragPointerRef = useRef<number | null>(null)
  const pressStartRef = useRef<{ t: number; x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTimesRef = useRef<number[]>([])
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dodgeDirRef = useRef<1 | -1>(1)
  const motionArmedRef = useRef(false)
  const lastShakeRef = useRef<number>(0)
  const lastInteractionRef = useRef<number>(0)
  const hasBeenTouchedRef = useRef(false)

  const [voice, setVoice] = useState<{ id: number; text: string } | null>(null)
  const [greetingDone, setGreetingDone] = useState(false)
  const [micro, setMicro] = useState<Micro>('none')
  const [reaction, setReaction] = useState<Reaction>(null)
  const [flavor, setFlavor] = useState<Flavor>({ mag: 1, speed: 1, bonus: false })
  const [blink, setBlink] = useState(false)
  const [awake, setAwake] = useState(false)

  // Logo reveal: full lockup centered → shrinks to corner → stage fades in
  const [mounted, setMounted] = useState(false)
  const [separated, setSeparated] = useState(false)
  const [stageVisible, setStageVisible] = useState(false)
  const [centerXY, setCenterXY] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const dragSpringX = useSpring(dragX, { stiffness: 220, damping: 22 })
  const dragSpringY = useSpring(dragY, { stiffness: 220, damping: 22 })

  const say = useCallback((text: string, hold = 1800) => {
    const id = ++voiceIdRef.current
    setVoice({ id, text })
    setTimeout(() => setVoice(v => (v && v.id === id ? null : v)), hold)
  }, [])

  const pickReactionWord = (kind: keyof typeof REACTIONS) => {
    const pool = REACTIONS[kind].filter(w => w !== lastReactionRef.current)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    lastReactionRef.current = pick
    return pick
  }

  const triggerReaction = useCallback(
    (kind: keyof typeof REACTIONS, holdMs = 900) => {
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current)
      setFlavor(makeFlavor())
      setReaction(kind)
      if (awake) say(pickReactionWord(kind), Math.max(1400, holdMs + 500))
      reactionTimerRef.current = setTimeout(() => setReaction(null), holdMs)
    },
    [awake, say],
  )

  const holdReaction = (kind: keyof typeof REACTIONS) => {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current)
    setFlavor(makeFlavor())
    setReaction(kind)
    if (awake) say(pickReactionWord(kind), 2400)
  }
  const endHoldReaction = () => {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current)
    reactionTimerRef.current = setTimeout(() => setReaction(null), 250)
  }

  // Compute lockup centering and kick off the reveal choreography.
  // Scale is capped so the lockup always fits within ~85% of viewport width,
  // so narrow phones don't push the centered lockup off-screen.
  const [revealScale, setRevealScale] = useState(2.6)
  useEffect(() => {
    const CORNER_W = 190
    const CORNER_H = 44
    const PAD = 24
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxScale = Math.min(2.6, (vw * 0.85) / CORNER_W)
    const scale = Math.max(1, maxScale)
    setRevealScale(scale)
    setCenterXY({
      x: vw / 2 - (CORNER_W * scale) / 2 - PAD,
      y: vh / 2 - (CORNER_H * scale) / 2 - PAD,
    })
    setMounted(true)
    const t1 = setTimeout(() => setSeparated(true), 3600)
    const t2 = setTimeout(() => setStageVisible(true), 3900)
    const t3 = setTimeout(() => setAwake(true), 4200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  useEffect(() => {
    if (!awake) return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    let acc = 0
    GREETING.forEach(line => {
      acc += line.delay
      timers.push(setTimeout(() => { if (!cancelled) say(line.text, line.hold) }, acc))
      acc += line.hold
    })
    timers.push(setTimeout(() => { if (!cancelled) setGreetingDone(true) }, acc + 200))
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [say, awake])

  // Invitation after greeting
  useEffect(() => {
    if (!greetingDone) return
    lastInteractionRef.current = performance.now()
    let cancelled = false
    let step = -1
    const tick = () => {
      if (cancelled) return
      const idle = performance.now() - lastInteractionRef.current
      if (idle < 1500) { step = -1; return }
      if (reaction) return
      const t1 = hasBeenTouchedRef.current ? 7000 : 5000
      const t2 = hasBeenTouchedRef.current ? 14000 : 11000
      const t3 = hasBeenTouchedRef.current ? 24000 : 20000
      let next = step
      if (idle > t1) next = Math.max(next, 0)
      if (idle > t2) next = Math.max(next, 1)
      if (idle > t3) next = Math.max(next, 2)
      if (next !== step) {
        step = next
        if (step === 0) { setMicro('excited-hop'); say('?', 1400); setTimeout(() => setMicro('none'), 900) }
        else if (step === 1) { setMicro('excited-hop'); say(hasBeenTouchedRef.current ? 'again?' : 'hello?', 1800); setTimeout(() => setMicro('none'), 900) }
        else if (step === 2) { setMicro('sad'); say(hasBeenTouchedRef.current ? 'come back?' : 'play?', 2200); setTimeout(() => setMicro('none'), 1400) }
      }
    }
    const interval = setInterval(tick, 700)
    return () => { cancelled = true; clearInterval(interval) }
  }, [greetingDone, reaction, say])

  // Spontaneous micro-life
  useEffect(() => {
    if (!greetingDone) return
    let cancelled = false
    const pool: Micro[] = ['hop', 'lean-l', 'lean-r', 'settle', 'settle']
    const schedule = () => {
      const next = 2600 + Math.random() * 3800
      setTimeout(() => {
        if (cancelled) return
        if (dragPointerRef.current !== null || reaction) { schedule(); return }
        const pick = pool[Math.floor(Math.random() * pool.length)]
        setMicro(pick)
        const holdMs = 700 + Math.random() * 1100
        setTimeout(() => {
          if (cancelled) return
          setMicro('none')
          schedule()
        }, holdMs)
      }, next)
    }
    schedule()
    return () => { cancelled = true }
  }, [greetingDone, reaction])

  // Blink (suppressed during pet/sleep)
  useEffect(() => {
    let cancelled = false
    const schedule = () => {
      const next = 5500 + Math.random() * 5000
      setTimeout(() => {
        if (cancelled) return
        setBlink(true)
        setTimeout(() => { if (cancelled) return; setBlink(false); schedule() }, 130)
      }, next)
    }
    schedule()
    return () => { cancelled = true }
  }, [])

  // Shake detection
  const armMotionSensors = useCallback(() => {
    if (motionArmedRef.current) return
    motionArmedRef.current = true
    const DME = (window as any).DeviceMotionEvent
    const attach = () => {
      const onMotion = (ev: DeviceMotionEvent) => {
        const a = ev.accelerationIncludingGravity || ev.acceleration
        if (!a) return
        const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0)
        if (mag > SHAKE_ACCEL_THRESHOLD) {
          const now = performance.now()
          if (now - lastShakeRef.current > 900) {
            lastShakeRef.current = now
            triggerReaction('dizzy', 1300)
          }
        }
      }
      window.addEventListener('devicemotion', onMotion)
    }
    if (DME?.requestPermission) {
      DME.requestPermission().then((r: string) => { if (r === 'granted') attach() }).catch(() => {})
    } else { attach() }
  }, [triggerReaction])

  const registerInteraction = () => {
    lastInteractionRef.current = performance.now()
    hasBeenTouchedRef.current = true
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!awake) return
    registerInteraction()
    armMotionSensors()
    dragPointerRef.current = e.pointerId
    pressStartRef.current = { t: performance.now(), x: e.clientX, y: e.clientY }
    movedRef.current = false
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      if (!movedRef.current && dragPointerRef.current !== null) holdReaction('hug')
    }, LONG_PRESS_MS)
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragPointerRef.current !== e.pointerId) return
      const start = pressStartRef.current
      if (!start || !stageRef.current) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      const dist = Math.hypot(dx, dy)
      if (dist > MOVE_PET_PX && !movedRef.current) {
        movedRef.current = true
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
        holdReaction('pet')
      }
      const rect = stageRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const ox = (e.clientX - cx) / rect.width * 24 * 0.35
      const oy = (e.clientY - cy) / rect.height * 24 * 0.3
      dragX.set(Math.max(-4, Math.min(4, ox)))
      dragY.set(Math.max(-3, Math.min(3, oy)))
    }
    const end = (e: PointerEvent) => {
      if (dragPointerRef.current !== e.pointerId) return
      const start = pressStartRef.current
      const now = performance.now()
      dragPointerRef.current = null
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      dragX.set(0); dragY.set(0)
      if (start) {
        const duration = now - start.t
        if (!movedRef.current && duration < TAP_MAX_MS) {
          tapTimesRef.current = [...tapTimesRef.current.filter(t => now - t < TICKLE_WINDOW_MS), now]
          if (tapTimesRef.current.length >= TICKLE_COUNT) {
            tapTimesRef.current = []
            triggerReaction('tickle', 1200)
          } else if (Math.random() < DODGE_CHANCE) {
            if (stageRef.current) {
              const rect = stageRef.current.getBoundingClientRect()
              const cx = rect.left + rect.width / 2
              dodgeDirRef.current = start.x < cx ? 1 : -1
            }
            triggerReaction('dodge', 750)
          } else {
            triggerReaction('poke', 700)
          }
        } else {
          endHoldReaction()
        }
      }
      pressStartRef.current = null
      movedRef.current = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragX, dragY, triggerReaction])

  // Button mapping — each sustained long enough to see its signature
  const buttonAction = (kind: ButtonAction) => {
    if (!awake) return
    registerInteraction()
    const holds: Record<ButtonAction, number> = {
      poke: 700, tickle: 1200, wave: 1200, dance: 1400,
      sing: 1300, pet: 1400, hug: 1400, sleep: 1800,
    }
    triggerReaction(kind, holds[kind])
  }

  // ---------- resolve visual state ----------
  const spec = reaction ? MOTION[reaction] : null
  const mag = flavor.mag
  const speed = flavor.speed

  // Idle: soft breath-lift and gentle sway — warm and welcoming, not a pulse
  const idleBase = awake && micro === 'none'
  const idleAnimate = {
    x: 0,
    y:
      micro === 'hop' ? [-1.5, 0] :
      micro === 'excited-hop' ? [0, -2.5, 0, -1.5, 0] :
      micro === 'sad' ? [0, 1.2] :
      idleBase ? [0, -0.22, 0] : 0,
    rotate:
      micro === 'settle' ? [-1.5, 1.5, 0] :
      micro === 'lean-l' ? [-3, 0] :
      micro === 'lean-r' ? [3, 0] :
      micro === 'sad' ? [0, -3, 0] :
      idleBase ? [-0.4, 0.4, 0] : 0,
    scale: 1,
  }

  const creatureAnimate = spec
    ? {
        x: scale(spec.x, mag) ?? 0,
        y: scale(spec.y, mag) ?? 0,
        rotate: scale(spec.rotate, mag) ?? 0,
        scale: spec.scale ?? 1,
      }
    : idleAnimate

  const creatureTransition = spec
    ? {
        x: { duration: spec.duration / speed, ease: spec.easeX ?? 'easeInOut' },
        y: { duration: spec.duration / speed, ease: spec.easeY ?? [0.34, 1.56, 0.64, 1] },
        rotate: { duration: spec.duration / speed, ease: spec.easeRot ?? 'easeInOut' },
        scale: { duration: spec.duration / speed, ease: spec.easeScale ?? [0.34, 1.56, 0.64, 1] },
      }
    : idleBase
      ? {
          // Soft breathing + sway — infinite, welcoming
          y: { duration: 5.0, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' as const },
          rotate: { duration: 7.0, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' as const },
          scale: { duration: 0.3 },
        }
      : {
          // Micro-life bursts — one-shot
          y: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
          rotate: { duration: 0.9, ease: 'easeInOut' },
          scale: { duration: 0.3 },
        }

  // Circle (face/core) — stays inside the bookmark ALWAYS. Only blinks or sings.
  const isSleeping = reaction === 'sleep'
  const isPetting = reaction === 'pet'
  const circleScaleY = isSleeping ? 0.1 : isPetting ? 0.5 : blink ? 0.12 : spec?.scaleY?.[0] ?? 1
  const circleScaleYAnim = spec?.scaleY ?? (isSleeping ? [1, 0.1] : isPetting ? [1, 0.5] : blink ? [1, 0.12, 1] : [1, 1])
  const circleTransition = spec?.scaleY
    ? { duration: spec.duration / speed, ease: 'easeInOut' as const }
    : { duration: blink ? 0.14 : 0.3, ease: 'easeInOut' as const }

  const frameStroke = reaction ? 2.2 : 2

  return (
    <main
      className="paige-root relative flex w-full flex-col items-center justify-center overflow-hidden"
      style={{
        background: CREAM,
        height: '100dvh',
        minHeight: '100vh',
        touchAction: 'none',
        overscrollBehavior: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        fontFamily: 'var(--font-paige), Manrope, system-ui, sans-serif',
      }}
    >
      <style>{`
        .paige-root, .paige-root * { cursor: auto !important; }
        .paige-stage, .paige-stage * { cursor: grab !important; }
        .paige-stage:active, .paige-stage:active * { cursor: grabbing !important; }
        .paige-btn { cursor: pointer !important; }
      `}</style>

      {/* Blog Hands lockup: starts centered big, lands in the top-left corner.
          Only rendered once mounted so centerXY/revealScale are computed — otherwise
          the first paint would place the lockup at top-left with scale 2.6 and
          framer-motion would animate it into the center visibly. */}
      {mounted && (
      <motion.div
        className="pointer-events-none select-none"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          transformOrigin: 'top left',
          zIndex: 20,
        }}
        initial={separated ? { x: 0, y: 0, scale: 1 } : { x: centerXY.x, y: centerXY.y, scale: revealScale }}
        animate={
          separated
            ? { x: 0, y: 0, scale: 1 }
            : { x: centerXY.x, y: centerXY.y, scale: revealScale }
        }
        transition={{ type: 'spring', stiffness: 65, damping: 15, mass: 1 }}
      >
        <svg width={190} height={44} viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(40, 28) scale(6)">
            <path
              d="M20 21l-8-5-8 5V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16z"
              fill="none"
              stroke={COBALT}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={12} cy={9.5} r={3} fill={COBALT} />
          </g>
          <text
            x={210}
            y={125}
            fontFamily="Manrope, system-ui, sans-serif"
            fontWeight={600}
            fontSize={72}
            letterSpacing={-2}
            fill={INK}
          >
            Blog Hands
          </text>
        </svg>
      </motion.div>
      )}

      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(82,90,255,0.10), transparent 60%)',
        }}
      />

      {/* Stage — fades in after the lockup has moved to the corner */}
      <motion.div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onContextMenu={e => e.preventDefault()}
        className="paige-stage relative"
        style={{
          width: 'min(48vmin, 340px)',
          aspectRatio: '1 / 1',
          touchAction: 'none',
          WebkitTouchCallout: 'none' as any,
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        initial={false}
        animate={{ opacity: stageVisible ? 1 : 0, scale: stageVisible ? 1 : 0.9 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        >
          {/* Drag offset wrapper */}
          <motion.g style={{ x: dragSpringX, y: dragSpringY }}>
            {/* Creature wrapper — bookmark + circle move together */}
            <motion.g
              style={{ transformOrigin: '12px 12px' }}
              animate={creatureAnimate}
              transition={creatureTransition as any}
            >
              {/* Bookmark body */}
              <motion.path
                d="M20 21l-8-5-8 5V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16z"
                stroke={COBALT}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ strokeWidth: frameStroke }}
                transition={{ duration: 0.5 }}
              />

              {/* Circle — always inside the bookmark */}
              <motion.g
                initial={false}
                animate={{ scaleY: circleScaleYAnim }}
                transition={circleTransition}
                style={{ transformOrigin: '12px 9.5px' }}
              >
                <circle cx={12} cy={9.5} r={3} fill={COBALT} />
              </motion.g>
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>

      {/* Voice — between her and the buttons */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: '56px', marginTop: '20px' }}
      >
        <AnimatePresence mode="wait">
          {voice && (
            <motion.p
              key={voice.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.92, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                fontWeight: 500,
                fontSize: 'clamp(18px, 2.2vw, 22px)',
                letterSpacing: '-0.01em',
                color: INK,
                margin: 0,
                textAlign: 'center',
              }}
            >
              {voice.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons — 8 actions, wraps to 2 rows on narrow screens */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 px-4"
        style={{ maxWidth: '94vw', marginTop: '8px' }}
      >
        {BUTTON_ACTIONS.map(kind => (
          <button
            key={kind}
            type="button"
            className="paige-btn"
            onClick={() => buttonAction(kind)}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: `1.5px solid ${COBALT}`,
              background: 'transparent',
              color: COBALT,
              fontWeight: 500,
              fontSize: '13px',
              letterSpacing: '0.01em',
              transition: 'background 180ms ease, color 180ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = COBALT
              e.currentTarget.style.color = CREAM
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = COBALT
            }}
          >
            {kind}
          </button>
        ))}
      </div>

      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: INK,
          opacity: 0.3,
        }}
      >
        paige · v1.8
      </div>
    </main>
  )
}
