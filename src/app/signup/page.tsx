'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions'
import { Map } from 'lucide-react'
import { Footer } from '@/components/Footer'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')

  const getPasswordStrength = () => {
    if (password.length === 0) return ''
    if (password.length < 6) return 'Weak'
    if (password.length < 10) return 'Medium'
    return 'Strong'
  }

  async function handleSubmit(formData: FormData) {
    const confirm = formData.get('confirm_password')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const strength = getPasswordStrength()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-transparent relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-full dashed-route-line -z-10"></div>
      
      <div className="w-full max-w-md dark-card p-8 rounded-xl relative z-10 animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-400/30 animate-float">
            <Map className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-headline-lg text-blue-300 font-manrope text-center leading-tight animate-fade-in">Create your<br/>Passport</h1>
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-300 p-4 rounded-md mb-6 text-sm flex items-center border border-red-500/40">
            <span>{error}</span>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div className="animate-slide-up animate-stagger-1 opacity-0" style={{animationFillMode: 'forwards'}}>
            <label className="block text-label-caps text-blue-200/70 mb-2">Full Name</label>
            <input 
              type="text" 
              name="name"
              required
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
              placeholder="Amelia Earhart"
            />
          </div>

          <div className="animate-slide-up animate-stagger-2 opacity-0" style={{animationFillMode: 'forwards'}}>
            <label className="block text-label-caps text-blue-200/70 mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
              placeholder="amelia@sky.com"
            />
          </div>

          <div className="animate-slide-up animate-stagger-3 opacity-0" style={{animationFillMode: 'forwards'}}>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-label-caps text-blue-200/70">Password</label>
              <span className={`text-xs font-bold ${strength === 'Weak' ? 'text-red-400' : strength === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                {strength}
              </span>
            </div>
            <input 
              type="password" 
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
              placeholder="••••••••"
            />
          </div>

          <div className="animate-slide-up animate-stagger-4 opacity-0" style={{animationFillMode: 'forwards'}}>
            <label className="block text-label-caps text-blue-200/70 mb-2">Confirm Password</label>
            <input 
              type="password" 
              name="confirm_password"
              required
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="boarding-pass-btn w-full dark-btn py-4 text-label-caps transition-all duration-300 flex justify-center items-center mt-8 disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98] animate-slide-up animate-stagger-5 opacity-0"
            style={{animationFillMode: 'forwards'}}
          >
            {loading ? 'Issuing...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-blue-400/20 pt-6">
          <p className="text-blue-200/60 text-sm font-manrope">
            Already have a passport?{' '}
            <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
