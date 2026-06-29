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
  amount: number | string
  description: string
  category?: string | null
  payment_date?: string | null
  created_at: string
}

interface Settlement {
  from: string
  fromId: string
  to: string
  toId: string
  amount: number
}

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other']

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPaymentDate(payment: Payment) {
  return payment.payment_date ? new Date(`${payment.payment_date}T00:00:00`) : new Date(payment.created_at)
}

function getPaymentDateKey(payment: Payment) {
  return payment.payment_date || getDateKey(new Date(payment.created_at))
}

function formatPaymentDate(payment: Payment) {
  return getPaymentDate(payment).toLocaleDateString('en-GB')
}

function formatAmount(amount: number) {
  return `₹${amount.toFixed(2)}`
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
  const [category, setCategory] = useState(CATEGORIES[0])
  const [paymentDate, setPaymentDate] = useState(getTodayInputValue())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const settlements = calcSettlements(members, payments)

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const share = members.length > 0 ? totalPaid / members.length : 0

  const now = new Date()
  const categoryTotals = CATEGORIES
    .map(item => ({
      category: item,
      total: payments
        .filter(payment => (payment.category || 'Other') === item)
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
  const topCategory = categoryTotals[0]
  const maxCategoryTotal = topCategory?.total || 0

  const payerTotals = members
    .map(member => ({
      name: member.name,
      total: payments
        .filter(payment => payment.payer_id === member.id)
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
  const topPayer = payerTotals[0]
  const maxPayerTotal = topPayer?.total || 0

  const weeklyTotals = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index))
    const key = getDateKey(date)
    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: payments
        .filter(payment => getPaymentDateKey(payment) === key)
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    }
  })
  const maxWeeklyTotal = Math.max(...weeklyTotals.map(item => item.total), 0)
  const biggestDay = weeklyTotals.reduce((best, item) => item.total > best.total ? item : best, weeklyTotals[0])

  const monthlyTotals = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      month: date.getMonth(),
      year: date.getFullYear(),
      total: payments
        .filter(payment => {
          const paymentDate = getPaymentDate(payment)
          return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    }
  })
  const maxMonthlyTotal = Math.max(...monthlyTotals.map(item => item.total), 0)

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
    if (!category) {
      showError('Category is required')
      return
    }
    if (!paymentDate) {
      showError('Payment date is required')
      return
    }
    setLoading(true)
    setError(null)
    const result = await addPayment(group.id, payerType, payerId, payerName, numAmount, desc.trim(), category, paymentDate)
    if (result.error) showError(result.error)
    else {
      setAmount('')
      setDesc('')
      setCategory(CATEGORIES[0])
      setPaymentDate(getTodayInputValue())
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
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
                <div>
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
                <div>
                  <label className="block text-label-caps text-blue-200/70 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full dark-input py-1.5 text-sm font-manrope"
                  >
                    {CATEGORIES.map(item => (
                      <option key={item} value={item} className="bg-gray-900 text-gray-200">{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-caps text-blue-200/70 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    max={getTodayInputValue()}
                    className="w-full dark-input py-1.5 text-sm font-manrope transition-all duration-300 focus:scale-[1.02]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddPayment}
                    disabled={loading || !amount || !desc.trim() || !paymentDate}
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

          <section className="dark-card p-5 rounded-lg animate-slide-up">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-blue-400/20 pb-4 mb-5">
              <div>
                <h2 className="text-title-md font-manrope text-blue-300">Analyze Group Expense</h2>
                <p className="text-sm font-manrope text-blue-200/50 mt-1">Compare categories, payers, weekly spending, and monthly totals.</p>
              </div>
              {topCategory ? (
                <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-manrope text-blue-200">
                  Mostly spent on <span className="font-bold text-blue-300">{topCategory.category}</span>
                </div>
              ) : null}
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-journal-note text-blue-200/70 mb-1">No group analysis yet.</p>
                <p className="text-sm font-manrope text-blue-200/50">Log group payments to see trends and comparisons.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="dark-stat rounded-lg p-4">
                  <p className="text-label-caps text-blue-200/60 mb-4">Category Breakdown</p>
                  <div className="space-y-4">
                    {categoryTotals.map(item => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between text-sm font-manrope mb-2">
                          <span className="text-blue-200">{item.category}</span>
                          <span className="text-blue-300 font-bold">{formatAmount(item.total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-blue-950/80 overflow-hidden border border-blue-400/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                            style={{ width: `${Math.max((item.total / maxCategoryTotal) * 100, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dark-stat rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-label-caps text-blue-200/60">Paid By Member</p>
                    {topPayer ? <p className="text-xs font-space text-blue-200/40">Top: {topPayer.name}</p> : null}
                  </div>
                  <div className="space-y-4">
                    {payerTotals.map(item => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm font-manrope mb-2">
                          <span className="text-blue-200">{item.name}</span>
                          <span className="text-blue-300 font-bold">{formatAmount(item.total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-blue-950/80 overflow-hidden border border-blue-400/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-300"
                            style={{ width: `${Math.max((item.total / maxPayerTotal) * 100, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dark-stat rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-label-caps text-blue-200/60">Last 7 Days</p>
                    <p className="text-xs font-space text-blue-200/40">Peak: {biggestDay.label}</p>
                  </div>
                  <div className="flex h-40 items-end gap-3 border-b border-blue-400/20 pb-3">
                    {weeklyTotals.map(item => (
                      <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <div className="flex h-28 w-full items-end justify-center">
                          <div
                            className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-300 shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                            style={{ height: maxWeeklyTotal ? `${Math.max((item.total / maxWeeklyTotal) * 100, 8)}%` : '8%' }}
                            title={`${item.label}: ${formatAmount(item.total)}`}
                          />
                        </div>
                        <span className="text-xs font-space text-blue-200/50">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dark-stat rounded-lg p-4">
                  <p className="text-label-caps text-blue-200/60 mb-4">Monthly Comparison</p>
                  <div className="space-y-3">
                    {monthlyTotals.map(item => (
                      <div key={`${item.year}-${item.month}`} className="grid grid-cols-[3rem_1fr_5rem] items-center gap-3">
                        <span className="text-xs font-space text-blue-200/50">{item.label}</span>
                        <div className="h-3 rounded-full bg-blue-950/80 overflow-hidden border border-blue-400/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-300"
                            style={{ width: maxMonthlyTotal ? `${Math.max((item.total / maxMonthlyTotal) * 100, 6)}%` : '6%' }}
                          />
                        </div>
                        <span className="text-right text-xs font-space text-blue-200/70">₹{Math.round(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

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
                        <div className="flex flex-wrap gap-2 text-xs text-blue-200/50 font-space">
                          <span>{p.description}</span>
                          <span>•</span>
                          <span>{p.category || 'Other'}</span>
                          <span>•</span>
                          <span>{formatPaymentDate(p)}</span>
                        </div>
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
