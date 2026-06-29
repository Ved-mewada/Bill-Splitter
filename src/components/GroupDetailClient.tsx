'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, DollarSign, Trash2, Users, Scale, ArrowRight } from 'lucide-react'
import { addLocalMember, deleteLocalMember, addPayment, deletePayment } from '@/app/dashboard/groups/actions'

interface Member {
  id: string
  name: string
  type: 'auth' | 'local'
}

interface Payment {
  id: string
  group_id: string
  payer_type: 'auth' | 'local'
  payer_id: string
  payer_name: string
  amount: number
  description: string
  created_at: string
}

interface Settlement {
  from: string
  fromId: string
  to: string
  toId: string
  amount: number
}

function calcSettlements(members: Member[], payments: Payment[]): Settlement[] {
  if (members.length === 0 || payments.length === 0) return []

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const share = totalPaid / members.length

  const balanceMap: Record<string, { name: string; paid: number }> = {}
  for (const m of members) {
    balanceMap[m.id] = { name: m.name, paid: 0 }
  }

  for (const p of payments) {
    const key = p.payer_type === 'auth' ? p.payer_id : p.payer_id
    if (balanceMap[key]) {
      balanceMap[key].paid += Number(p.amount)
    }
  }

  const net: { id: string; name: string; balance: number }[] = members.map(m => ({
    id: m.id,
    name: m.name,
    balance: (balanceMap[m.id]?.paid || 0) - share,
  }))

  const debtors = net.filter(n => n.balance < 0).sort((a, b) => a.balance - b.balance)
  const creditors = net.filter(n => n.balance > 0).sort((a, b) => b.balance - a.balance)

  const settlements: Settlement[] = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const owe = Math.abs(debtors[i].balance)
    const owed = creditors[j].balance
    const amount = Math.min(owe, owed)
    if (amount > 0.01) {
      settlements.push({
        from: debtors[i].name,
        fromId: debtors[i].id,
        to: creditors[j].name,
        toId: creditors[j].id,
        amount: Math.round(amount * 100) / 100,
      })
    }
    debtors[i].balance += amount
    creditors[j].balance -= amount
    if (Math.abs(debtors[i].balance) < 0.01) i++
    if (Math.abs(creditors[j].balance) < 0.01) j++
  }

  return settlements
}

export function GroupDetailClient({
  group, members, payments, isCreator, currentUserId, currentUserName,
}: {
  group: { id: string; group_name: string; created_by: string; created_at: string }
  members: Member[]
  payments: Payment[]
  isCreator: boolean
  currentUserId: string
  currentUserName: string
}) {
  const [newMemberName, setNewMemberName] = useState('')
  const [payerId, setPayerId] = useState(currentUserId)
  const [payerType, setPayerType] = useState<'auth' | 'local'>('auth')
  const [payerName, setPayerName] = useState(currentUserName)
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const settlements = calcSettlements(members, payments)

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const share = members.length > 0 ? totalPaid / members.length : 0

  function showError(msg: string) {
    setError(msg)
    setSuccess(null)
    setTimeout(() => setError(null), 3000)
  }

  function showSuccess(msg: string) {
    setSuccess(msg)
    setError(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return
    setLoading(true)
    setError(null)
    const result = await addLocalMember(group.id, newMemberName.trim())
    if (result.error) showError(result.error)
    else {
      setNewMemberName('')
      showSuccess(`${newMemberName.trim()} added!`)
    }
    setLoading(false)
  }

  async function handleRemoveMember(memberId: string) {
    await deleteLocalMember(group.id, memberId)
  }

  async function handleAddPayment() {
    if (!amount || !desc.trim()) {
      showError('Amount and description are required')
      return
    }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      showError('Invalid amount')
      return
    }
    setLoading(true)
    setError(null)
    const result = await addPayment(group.id, payerType, payerId, payerName, numAmount, desc.trim())
    if (result.error) showError(result.error)
    else {
      setAmount('')
      setDesc('')
      showSuccess('Payment added!')
    }
    setLoading(false)
  }

  async function handleDeletePayment(paymentId: string) {
    await deletePayment(group.id, paymentId)
  }

  function handlePayerChange(id: string) {
    setPayerId(id)
    const m = members.find(m => m.id === id)
    if (m) {
      setPayerType(m.type)
      setPayerName(m.name)
    }
  }

  const dateStr = new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/groups" className="text-blue-200/60 hover:text-blue-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-headline-lg font-manrope text-blue-300">{group.group_name}</h1>
          <p className="text-label-caps text-blue-200/50">Started {dateStr}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 text-red-300 p-3 rounded-md text-sm border border-red-500/40 animate-slide-down">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/40 text-green-300 p-3 rounded-md text-sm border border-green-500/40 animate-slide-down">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Members */}
        <div className="lg:col-span-1 space-y-4">
          <div className="dark-card p-5 rounded-lg">
            <h2 className="text-title-md font-manrope text-blue-300 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Members ({members.length})
            </h2>
            <div className="space-y-2 mb-4">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-black/40 rounded-md group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-manrope text-blue-200">{m.name}</p>
                      <p className="text-xs text-blue-200/50 font-space">{m.type === 'auth' ? 'User' : 'Guest'}</p>
                    </div>
                  </div>
                  {isCreator && m.type === 'local' && (
                    <button onClick={() => handleRemoveMember(m.id)} className="text-blue-200/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isCreator && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                  placeholder="Add friend name..."
                  className="flex-1 dark-input py-1.5 text-sm font-manrope transition-all duration-300 focus:scale-[1.02]"
                />
                <button onClick={handleAddMember} disabled={loading || !newMemberName.trim()} className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40">
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="dark-card p-5 rounded-lg">
            <h2 className="text-title-md font-manrope text-blue-300 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" /> Summary
            </h2>
            <div className="space-y-1 text-sm font-manrope text-blue-200">
              <div className="flex justify-between">
                <span className="text-blue-200/60">Total Spent</span>
                <span className="font-bold">₹{totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200/60">Per Person</span>
                <span className="font-bold">₹{share.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200/60">Members</span>
                <span className="font-bold">{members.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payments + Settlements */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Payment */}
          {members.length >= 2 && (
            <div className="dark-card p-5 rounded-lg">
              <h2 className="text-title-md font-manrope text-blue-300 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" /> Log Payment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-label-caps text-blue-200/70 mb-1">Who paid?</label>
                  <select
                    value={payerId}
                    onChange={e => handlePayerChange(e.target.value)}
                    className="w-full dark-input py-1.5 text-sm font-manrope"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id} className="bg-gray-900 text-gray-200">{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-caps text-blue-200/70 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full dark-input py-1.5 text-sm font-manrope transition-all duration-300 focus:scale-[1.02]"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-label-caps text-blue-200/70 mb-1">For what?</label>
                  <input
                    type="text"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPayment()}
                    placeholder="Dinner, taxi..."
                    className="w-full dark-input py-1.5 text-sm font-manrope transition-all duration-300 focus:scale-[1.02]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddPayment}
                    disabled={loading || !amount || !desc.trim()}
                    className="boarding-pass-btn dark-btn px-5 py-2 text-label-caps transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] w-full text-sm"
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {members.length < 2 && (
            <div className="dark-card p-5 rounded-lg text-center border border-dashed border-blue-400/30">
              <p className="text-journal-note text-blue-200/70 mb-1">Add at least 2 members to start splitting.</p>
              <p className="text-sm font-manrope text-blue-200/50">Use the members panel to add friends.</p>
            </div>
          )}

          {/* Settlements */}
          {settlements.length > 0 && (
            <div className="dark-card p-5 rounded-lg animate-scale-in">
              <h2 className="text-title-md font-manrope text-blue-300 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-400" /> Settlements
              </h2>
              <div className="space-y-2">
                {settlements.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 bg-black/40 rounded-md animate-slide-up animate-stagger-1 opacity-0" style={{animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards'}}>
                    <div className="flex items-center gap-3 text-sm font-manrope">
                      <span className="font-semibold text-red-400">{s.from}</span>
                      <span className="text-blue-200/60">pays</span>
                      <span className="font-semibold text-green-400">{s.to}</span>
                    </div>
                    <span className="font-bold text-blue-300 text-lg">₹{s.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settlements.length === 0 && payments.length > 0 && (
            <div className="dark-card p-5 rounded-lg text-center border border-dashed border-blue-400/30">
              <p className="text-journal-note text-blue-200/70">All settled up! No one owes anyone.</p>
            </div>
          )}

          {/* Payments List */}
          {payments.length > 0 && (
            <div>
              <h3 className="text-label-caps text-blue-200/60 mb-3">Payment Log</h3>
              <div className="space-y-1">
                {payments.map(p => (
                  <div key={p.id} className="expense-item flex items-center justify-between p-3 dark-card rounded-md group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 pl-2">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {p.payer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-manrope font-semibold text-sm text-blue-200">{p.payer_name}</p>
                        <p className="text-xs text-blue-200/50 font-space">{p.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-manrope font-bold text-blue-300">₹{Number(p.amount).toFixed(2)}</span>
                      {isCreator && (
                        <button onClick={() => handleDeletePayment(p.id)} className="text-blue-200/50 hover:text-red-400 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payments.length === 0 && members.length >= 2 && (
            <div className="text-center p-10 dark-card rounded-lg animate-scale-in">
              <p className="text-journal-note text-blue-200/70 mb-1">No payments logged yet.</p>
              <p className="text-sm font-manrope text-blue-200/50">Add your first payment above to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
