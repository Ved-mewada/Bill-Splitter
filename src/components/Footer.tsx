'use client'

import { useEffect, useState } from 'react'

export function Footer() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      document.body.classList.remove('love-mode')
    }
  }, [])

  function onLove() {
    document.body.classList.add('love-mode')
  }

  function offLove() {
    document.body.classList.remove('love-mode')
  }

  if (!mounted) return null

  return (
    <footer className="text-center py-5 mt-auto border-t border-blue-400/15">
      <p className="text-sm md:text-base text-blue-200/50 font-space transition-all duration-500 hover:text-blue-200/80">
        Made with{' '}
        <span
          onMouseEnter={onLove}
          onMouseLeave={offLove}
          onFocus={onLove}
          onBlur={offLove}
          tabIndex={0}
          role="button"
          aria-label="Activate love background"
          className="inline-block cursor-pointer animate-heartbeat transition-all duration-300 hover:scale-[1.8] hover:drop-shadow-[0_0_12px_rgba(255,53,132,0.75)] focus:scale-[1.8] focus:outline-none"
          style={{animationDuration: '1.5s'}}
        >
          💖
        </span>
      </p>
    </footer>
  )
}
