'use client'

import { useEffect, useRef, useState } from 'react'

export function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const duration = 1200
    const steps = 30
    const stepTime = duration / steps
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(increment * step, value)
      setDisplay(current)
      if (step >= steps) {
        setDisplay(value)
        clearInterval(timer)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  )
}
