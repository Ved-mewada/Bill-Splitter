'use client'

import { useState } from 'react'
import { addExpense, deleteExpense } from '@/app/dashboard/expenses/actions'
import { Trash2 } from 'lucide-react'

interface Expense {
  id: string
  user_id: string
  amount: number | string
  description: string
  category: string
  expense_date?: string | null
  created_at: string
}

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other']

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatExpenseDate(expense: Expense) {
  const dateValue = expense.expense_date || expense.created_at
  const date = expense.expense_date ? new Date(`${dateValue}T00:00:00`) : new Date(dateValue)
  return date.toLocaleDateString('en-GB')
}

export function AddExpenseForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await addExpense(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      const form = document.getElementById('add-expense-form') as HTMLFormElement
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="dark-card p-6 rounded-lg mb-8">
      <h2 className="text-title-md font-manrope text-blue-300 mb-4 border-b border-blue-400/20 pb-2">Log New Expense</h2>
      
      {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}
      
      <form id="add-expense-form" action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-label-caps text-blue-200/70 mb-1">Description</label>
            <input 
              type="text" 
              name="description" 
              required
              placeholder="E.g., Dinner out"
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
            />
          </div>
          <div>
            <label className="block text-label-caps text-blue-200/70 mb-1">Amount (₹)</label>
            <input 
              type="number" 
              name="amount" 
              required
              min="1"
              step="0.01"
              placeholder="0.00"
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
            />
          </div>
          <div>
            <label className="block text-label-caps text-blue-200/70 mb-1">Category</label>
            <select 
              name="category" 
              required
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-gray-900 text-gray-200">{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-label-caps text-blue-200/70 mb-1">Expense Date</label>
            <input
              type="date"
              name="expenseDate"
              required
              defaultValue={getTodayInputValue()}
              max={getTodayInputValue()}
              className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="boarding-pass-btn dark-btn px-8 py-3 text-label-caps transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function ExpenseItem({ expense }: { expense: Expense }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteExpense(expense.id)
  }

  const date = formatExpenseDate(expense)

  return (
    <div className="expense-item flex items-center justify-between p-4 dark-card rounded-md mb-3 group relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
      <div className="flex items-center gap-4 pl-2">
        <div className="w-10 h-10 bg-blue-500/15 rounded-full flex items-center justify-center text-blue-400 font-bold shadow-inner">
          {expense.category.charAt(0)}
        </div>
        <div>
          <p className="font-manrope font-semibold text-blue-200">{expense.description}</p>
          <div className="flex gap-3 text-xs text-blue-200/50 font-space mt-1">
            <span className="uppercase tracking-wider">{expense.category}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-manrope font-bold text-lg text-blue-300">₹{expense.amount}</span>
        <button 
          onClick={handleDelete}
          disabled={deleting}
          className="text-blue-200/50 hover:text-red-400 transition-all duration-300 p-2 disabled:opacity-50 hover:scale-110 active:scale-90"
          title="Delete expense"
        >
          <Trash2 className={`w-4 h-4 ${deleting ? 'animate-spin-slow' : ''}`} />
        </button>
      </div>
    </div>
  )
}
