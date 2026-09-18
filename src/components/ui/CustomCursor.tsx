'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** Elements where a reader is likely to be selecting text rather than clicking. */
const TEXT_SELECTOR =
  'p, li, dd, dt, blockquote, figcaption, code, pre, td, th, h1, h2, h3, h4, h5, h6, time, small'

export function CustomCursor() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [overText, setOverText] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const springX = useSpring(cursorX, { damping: 20, stiffness: 200 })
  const springY = useSpring(cursorY, { damping: 20, stiffness: 200 })

  useEffect(() => {
    const hasPointer = window.matchMedia('(pointer: fine)').matches
    if (!hasPointer) return

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest('a, button, input, textarea, summary, label, [role="button"]')
      setHovering(!!isInteractive)
      // Interactive wins. A link inside a paragraph is a link first.
      setOverText(!isInteractive && !!target.closest(TEXT_SELECTOR))
    }

    const handleLeave = () => setVisible(false)
    const handleEnter = () => setVisible(true)

    // While a selection is being dragged, get out of the way completely.
    const handleSelectionChange = () => {
      const sel = document.getSelection()
      setSelecting(!!sel && !sel.isCollapsed)
    }
    const handleMouseUp = () => {
      const sel = document.getSelection()
      if (!sel || sel.isCollapsed) setSelecting(false)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', handleOver)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', handleOver)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
    }
  }, [cursorX, cursorY, visible])

  if (!visible) return null
  if (pathname?.startsWith('/paige')) return null

  // Mid-selection the native I-beam and the highlight are all you need.
  if (selecting) return null

  // Over text: the ring goes, the dot shrinks and fades, so the words stay legible
  // and the native I-beam does the pointing.
  const ringSize = hovering ? 64 : 44
  const dotSize = overText ? 5 : 9

  return (
    <>
      {!overText && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 z-9999 rounded-full bg-primary/15 backdrop-blur-[1px]"
          style={{ x: springX, y: springY }}
          animate={{
            width: ringSize,
            height: ringSize,
            translateX: -ringSize / 2,
            translateY: -ringSize / 2,
            backgroundColor: hovering
              ? 'rgba(45, 212, 168, 0.25)'
              : 'rgba(45, 212, 168, 0.12)',
          }}
          transition={{ duration: 0.25 }}
        />
      )}

      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-9999 rounded-full bg-primary"
        style={{ x: cursorX, y: cursorY }}
        animate={{
          width: dotSize,
          height: dotSize,
          translateX: -dotSize / 2,
          translateY: -dotSize / 2,
          opacity: overText ? 0.45 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  )
}
