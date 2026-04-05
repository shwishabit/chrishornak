'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
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
      const isInteractive = target.closest('a, button, input, textarea, [role="button"]')
      setHovering(!!isInteractive)
    }

    const handleLeave = () => setVisible(false)
    const handleEnter = () => setVisible(true)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', handleOver)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', handleOver)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
    }
  }, [cursorX, cursorY, visible])

  if (!visible) return null

  return (
    <>
      {/* Outer circle — large, semi-transparent */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-9999 rounded-full bg-primary/15 backdrop-blur-[1px]"
        style={{
          x: springX,
          y: springY,
        }}
        animate={{
          width: hovering ? 64 : 44,
          height: hovering ? 64 : 44,
          translateX: hovering ? -32 : -22,
          translateY: hovering ? -32 : -22,
          backgroundColor: hovering
            ? 'rgba(45, 212, 168, 0.25)'
            : 'rgba(45, 212, 168, 0.12)',
        }}
        transition={{ duration: 0.25 }}
      />
      {/* Inner dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-9999 rounded-full bg-primary"
        style={{
          x: cursorX,
          y: cursorY,
          width: 9,
          height: 9,
          translateX: -4.5,
          translateY: -4.5,
        }}
      />
    </>
  )
}
