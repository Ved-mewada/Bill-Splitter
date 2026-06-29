'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other']

export async function createGroup(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  await supabase.from('users').upsert({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  }, { onConflict: 'id' })

  const groupName = formData.get('groupName') as string
  if (!groupName || groupName.length < 3) return { error: 'Group name must be at least 3 characters' }

  const { data: group, error: groupError } = await supabase
    .from('shared_groups')
    .insert({ group_name: groupName, created_by: user.id })
    .select()
    .single()

  if (groupError) return { error: groupError.message }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (memberError) {
    await supabase.from('shared_groups').delete().eq('id', group.id)
    return { error: 'Failed to join the created group' }
  }

  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function deleteGroup(groupId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('shared_groups')
    .delete()
    .eq('id', groupId)
    .eq('created_by', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function addLocalMember(groupId: string, name: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!name || name.length < 1) return { error: 'Name is required' }

  const { error } = await supabase.from('group_members_local').insert({
    group_id: groupId,
    name,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true }
}

export async function deleteLocalMember(groupId: string, memberId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('group_members_local').delete().eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true }
}

export async function addPayment(groupId: string, payerType: 'auth' | 'local', payerId: string, payerName: string, amount: number, description: string, category: string, paymentDate: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!amount || amount <= 0) return { error: 'Invalid amount' }
  if (!description) return { error: 'Description is required' }
  if (!CATEGORIES.includes(category)) return { error: 'Invalid category' }
  if (!paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return { error: 'Payment date is required' }

  const selectedDate = new Date(`${paymentDate}T00:00:00`)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (Number.isNaN(selectedDate.getTime()) || selectedDate > today) {
    return { error: 'Payment date cannot be in the future' }
  }

  const { error } = await supabase.from('group_expense_payments').insert({
    group_id: groupId,
    payer_type: payerType,
    payer_id: payerId,
    payer_name: payerName,
    amount,
    description,
    category,
    payment_date: paymentDate,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true }
}

export async function deletePayment(groupId: string, paymentId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('group_expense_payments').delete().eq('id', paymentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true }
}
