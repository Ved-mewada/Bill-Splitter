import { createClient } from '@/utils/supabase/server'
import { AddExpenseForm, ExpenseItem } from '@/components/ExpensesClient'

export default async function ExpensesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: expenses, error } = await supabase
    .from('personal_expenses')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  // Calculate Stats
  const total = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const count = expenses?.length || 0
  const avg = count > 0 ? (total / count).toFixed(2) : 0
  
  const currentMonth = new Date().getMonth()
  const thisMonthTotal = expenses
    ?.filter(exp => new Date(exp.created_at).getMonth() === currentMonth)
    .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-up">
        <h1 className="text-headline-lg font-manrope text-blue-300 mb-1">My Expenses</h1>
        <p className="text-label-caps text-blue-200/60">Track your personal journey</p>
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

      <div className="animate-slide-up animate-stagger-3 opacity-0" style={{animationFillMode: 'forwards'}}>
        <AddExpenseForm />
      </div>

      <div className="animate-slide-up animate-stagger-4 opacity-0" style={{animationFillMode: 'forwards'}}>
        <h3 className="text-label-caps text-blue-200/60 mb-4">Recent Entries</h3>
        {error ? (
          <p className="text-red-400">Failed to load expenses.</p>
        ) : !expenses || expenses.length === 0 ? (
          <div className="text-center p-12 dark-card rounded-lg animate-scale-in">
            <p className="text-journal-note text-blue-200/70 mb-2">Your journal is empty.</p>
            <p className="text-sm font-manrope text-blue-200/50">Log your first expense above to start tracking.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {expenses.map(expense => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
