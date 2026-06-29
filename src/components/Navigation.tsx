'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, CreditCard, Users, LogOut, Menu, X } from 'lucide-react'
import { logout } from '@/app/actions'
import { useState } from 'react'

const navLinks = [
  { name: 'My Expenses', href: '/dashboard/expenses', icon: CreditCard },
  { name: 'My Groups', href: '/dashboard/groups', icon: Users },
]

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()
  
  return (
    <div className="w-64 bg-[#070b18]/85 backdrop-blur-2xl border-r border-blue-500/15 h-screen flex flex-col hidden md:flex shadow-[18px_0_70px_rgba(0,0,0,0.32)] z-20 animate-slide-up">
      <div className="p-6 border-b border-blue-400/15">
        <h1 className="text-title-md text-blue-300 font-manrope font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 animate-float text-blue-400" /> ExpenseHub
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 relative">
        <div className="absolute left-8 top-8 bottom-8 w-px border-l border-dashed border-blue-400/20 -z-10"></div>
        
        {navLinks.map((link, i) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          const delay = `animate-stagger-${i + 1}`
          
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`nav-link flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 font-manrope text-sm opacity-0 animate-slide-up ${delay}
                ${isActive 
                  ? 'bg-blue-500/15 text-blue-300 font-semibold nav-link-active' 
                  : 'text-blue-200/60 hover:bg-blue-500/10 hover:text-blue-300 hover:translate-x-1'
                }`}
              style={{animationFillMode: 'forwards'}}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-blue-400' : 'text-blue-200/40 group-hover:scale-110'}`} />
              {link.name}
            </Link>
          )
        })}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-400/15 opacity-0 animate-slide-up animate-stagger-4" style={{animationFillMode: 'forwards'}}>
          <div className="mb-4 px-4">
            <p className="text-xs text-blue-200/40 font-space truncate">{email}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-4 px-4 py-2 w-full text-left text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-md transition-all duration-300 font-manrope hover:translate-x-1">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </div>
      </nav>
    </div>
  )
}

export function MobileNav({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden flex flex-col w-full">
      <div className="flex items-center justify-between p-4 bg-[#070b18]/85 backdrop-blur-2xl border-b border-blue-400/15 shadow-sm z-30">
        <h1 className="text-title-md text-blue-300 font-manrope font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-400" /> ExpenseHub
        </h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-blue-300 p-2 transition-transform duration-300 hover:scale-110 active:scale-90">
          <span className={`inline-block transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-[73px] left-0 right-0 bg-[#070b18]/92 backdrop-blur-2xl border-b border-blue-400/15 shadow-lg z-20 flex flex-col p-4 animate-slide-down">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            const delay = `animate-stagger-${i + 1}`
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`nav-link flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 font-manrope text-sm mb-2 opacity-0 animate-slide-up ${delay}
                  ${isActive 
                    ? 'bg-blue-500/15 text-blue-300 font-semibold nav-link-active' 
                    : 'text-blue-200/60 hover:bg-blue-500/10 hover:text-blue-300 hover:translate-x-1'
                  }`}
                style={{animationFillMode: 'forwards'}}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-blue-200/40'}`} />
                {link.name}
              </Link>
            )
          })}
          
          <div className="border-t border-blue-400/15 mt-2 pt-4 pb-2 px-4 opacity-0 animate-slide-up animate-stagger-4" style={{animationFillMode: 'forwards'}}>
            <p className="text-xs text-blue-200/40 font-space truncate mb-4">{email}</p>
            <form action={logout}>
              <button type="submit" className="flex items-center gap-4 w-full text-left text-sm text-red-400 font-manrope transition-all duration-300 hover:translate-x-1">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
