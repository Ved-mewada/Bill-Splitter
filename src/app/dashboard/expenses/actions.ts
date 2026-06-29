'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function ensureUser(supabase: ReturnType<typeof createClient>, user: { id: string; email?: string; user_metadata?: { name?: string } }) {
  const { error } = await supabase.from('users').upsert({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  }, { onConflict: 'id' })
  if (error && error.code !== '23505') {
    console.error('Failed to ensure user:', error)
  }
}

export async function addExpense(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await ensureUser(supabase, user)

  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const expenseDate = formData.get('expenseDate') as string

  if (!amount || amount <= 0) return { error: 'Invalid amount' }
  if (!description) return { error: 'Description is required' }
  if (!expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) return { error: 'Expense date is required' }

  const selectedDate = new Date(`${expenseDate}T00:00:00`)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (Number.isNaN(selectedDate.getTime()) || selectedDate > today) {
    return { error: 'Expense date cannot be in the future' }
  }

  const { error } = await supabase.from('personal_expenses').insert({
    user_id: user.id,
    amount,
    description,
    category,
    expense_date: expenseDate,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/expenses')
  return { success: true }
}

export async function deleteExpense(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('personal_expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/expenses')
  return { success: true }
}
