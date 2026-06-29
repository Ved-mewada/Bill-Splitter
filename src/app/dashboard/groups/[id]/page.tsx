import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { GroupDetailClient } from '@/components/GroupDetailClient'

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: group, error } = await supabase
    .from('shared_groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !group) notFound()

  const isCreator = group.created_by === user.id

  const { data: authMembers } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', params.id)

  let authUsers: { id: string; email: string; name: string | null }[] = []
  if (authMembers && authMembers.length > 0) {
    const ids = authMembers.map(m => m.user_id)
    const { data: users } = await supabase.from('users').select('id, email, name').in('id', ids)
    if (users) authUsers = users
  }

  const { data: localMembers } = await supabase
    .from('group_members_local')
    .select('*')
    .eq('group_id', params.id)
    .order('created_at', { ascending: true })

  const { data: payments } = await supabase
    .from('group_expense_payments')
    .select('*')
    .eq('group_id', params.id)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  const members: { id: string; name: string; type: 'auth' | 'local' }[] = [
    ...authUsers.map(u => ({
      id: u.id,
      name: u.name || u.email?.split('@')[0] || 'User',
      type: 'auth' as const,
    })),
    ...(localMembers?.map(m => ({
      id: m.id,
      name: m.name,
      type: 'local' as const,
    })) || []),
  ]

  return (
    <div className="animate-fade-in">
      <GroupDetailClient
        group={group}
        members={members}
        payments={payments || []}
        isCreator={isCreator}
        currentUserId={user.id}
        currentUserName={user.email?.split('@')[0] || 'You'}
      />
    </div>
  )
}
