import { createClient } from '@/utils/supabase/server'
import { AddExpenseForm, ExpenseItem } from '@/components/ExpensesClient'

type Expense = {
  id: string
  user_id: string
  amount: number | string
  description: string
  category: string
  expense_date?: string | null
  created_at: string
}

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other']

function getExpenseDate(expense: Expense) {
  return expense.expense_date ? new Date(`${expense.expense_date}T00:00:00`) : new Date(expense.created_at)
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getExpenseDateKey(expense: Expense) {
  return expense.expense_date || getDateKey(new Date(expense.created_at))
}

function formatAmount(amount: number) {
  return `₹${amount.toFixed(2)}`
}

export default async function ExpensesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: expenses, error } = await supabase
    .from('personal_expenses')
    .select('*')
    .eq('user_id', user?.id)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  const safeExpenses = (expenses || []) as Expense[]

  // Calculate Stats
  const total = safeExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const count = safeExpenses.length
  const avg = count > 0 ? (total / count).toFixed(2) : 0
   
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const thisMonthTotal = safeExpenses
    .filter(exp => {
      const date = getExpenseDate(exp)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, exp) => sum + Number(exp.amount), 0)

  const categoryTotals = CATEGORIES
    .map(category => ({
      category,
      total: safeExpenses
        .filter(exp => exp.category === category)
        .reduce((sum, exp) => sum + Number(exp.amount), 0),
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
  const topCategory = categoryTotals[0]
  const maxCategoryTotal = topCategory?.total || 0

  const weeklyTotals = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index))
    const key = getDateKey(date)
    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: safeExpenses
        .filter(exp => getExpenseDateKey(exp) === key)
        .reduce((sum, exp) => sum + Number(exp.amount), 0),
    }
  })
  const maxWeeklyTotal = Math.max(...weeklyTotals.map(item => item.total), 0)

  const monthlyTotals = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      month: date.getMonth(),
      year: date.getFullYear(),
      total: safeExpenses
        .filter(exp => {
          const expenseDate = getExpenseDate(exp)
          return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum, exp) => sum + Number(exp.amount), 0),
    }
  })
  const maxMonthlyTotal = Math.max(...monthlyTotals.map(item => item.total), 0)
  const biggestDay = weeklyTotals.reduce((best, item) => item.total > best.total ? item : best, weeklyTotals[0])

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-up">
        <h1 className="text-headline-lg font-manrope text-blue-300 mb-1">My Expenses</h1>
        <p className="text-label-caps text-blue-200/60">Track your personal expenses</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-blue-600/30 p-5 rounded-lg animate-slide-up animate-stagger-1 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/80 mb-1">Total Spent</p>
          <p className="text-title-md font-manrope font-bold text-blue-200">₹{total.toFixed(2)}</p>
        </div>
        <div className="stat-card dark-stat p-5 rounded-lg animate-slide-up animate-stagger-2 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/60 mb-1">This Month</p>
          <p className="text-title-md font-manrope font-bold text-blue-300">₹{thisMonthTotal.toFixed(2)}</p>
        </div>
        <div className="stat-card dark-stat p-5 rounded-lg animate-slide-up animate-stagger-3 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/60 mb-1">Total Entries</p>
          <p className="text-title-md font-manrope font-bold text-blue-300">{count}</p>
        </div>
        <div className="stat-card dark-stat p-5 rounded-lg animate-slide-up animate-stagger-4 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/60 mb-1">Avg. Expense</p>
          <p className="text-title-md font-manrope font-bold text-blue-300">₹{avg}</p>
        </div>
      </div>

      <section className="dark-card p-6 rounded-lg animate-slide-up animate-stagger-2 opacity-0" style={{animationFillMode: 'forwards'}}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-blue-400/20 pb-4 mb-6">
          <div>
            <h2 className="text-title-md font-manrope text-blue-300">Analyze Your Expense</h2>
            <p className="text-sm font-manrope text-blue-200/50 mt-1">See where your money goes by category, week, and month.</p>
          </div>
          {topCategory ? (
            <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-manrope text-blue-200">
              Mostly spent on <span className="font-bold text-blue-300">{topCategory.category}</span>
            </div>
          ) : null}
        </div>

        {safeExpenses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-journal-note text-blue-200/70 mb-2">Not enough data yet.</p>
            <p className="text-sm font-manrope text-blue-200/50">Add a few expenses to unlock category and trend insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="dark-stat rounded-lg p-5">
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

            <div className="dark-stat rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-label-caps text-blue-200/60">Last 7 Days</p>
                <p className="text-xs font-space text-blue-200/40">Peak: {biggestDay.label}</p>
              </div>
              <div className="flex h-44 items-end gap-3 border-b border-blue-400/20 pb-3">
                {weeklyTotals.map(item => (
                  <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end justify-center">
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
              <p className="text-xs font-manrope text-blue-200/45 mt-3">Daily bars help spot high-spend days this week.</p>
            </div>

            <div className="dark-stat rounded-lg p-5">
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

      <div className="animate-slide-up animate-stagger-3 opacity-0" style={{animationFillMode: 'forwards'}}>
        <AddExpenseForm />
      </div>

      <div className="animate-slide-up animate-stagger-4 opacity-0" style={{animationFillMode: 'forwards'}}>
        <h3 className="text-label-caps text-blue-200/60 mb-4">Recent Entries</h3>
        {error ? (
          <p className="text-red-400">Failed to load expenses.</p>
        ) : !expenses || expenses.length === 0 ? (
          <div className="text-center p-12 dark-card rounded-lg animate-scale-in">
            <p className="text-journal-note text-blue-200/70 mb-2">No expenses yet.</p>
            <p className="text-sm font-manrope text-blue-200/50">Log your first expense above to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {safeExpenses.map(expense => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
