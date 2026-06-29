import { createClient } from '@/utils/supabase/server'
import { CreateGroupForm, GroupCard } from '@/components/GroupsClient'

export default async function GroupsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch groups where the user is a member or creator
  // Note: we can fetch member count easily via Supabase relations if set up properly.
  // We'll use a straightforward query for the current schema.
  
  const { data: createdGroups } = await supabase
    .from('shared_groups')
    .select('*, group_members(count)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  // For joined groups, we need to find groups where the user is a member, but NOT the creator.
  const { data: memberEntries } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = memberEntries?.map(m => m.group_id) || []

  let joinedGroups: typeof createdGroups = []
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('shared_groups')
      .select('*, group_members(count)')
      .in('id', groupIds)
      .neq('created_by', user.id)
      .order('created_at', { ascending: false })
    
    if (data) joinedGroups = data
  }

  const createdCount = createdGroups?.length || 0
  const joinedCount = joinedGroups.length
  const totalCount = createdCount + joinedCount

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="animate-slide-up">
        <h1 className="text-headline-lg font-manrope text-blue-300 mb-1">My Groups</h1>
        <p className="text-label-caps text-blue-200/60">Manage shared expenses</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card bg-blue-600/30 p-5 rounded-lg animate-slide-up animate-stagger-1 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/80 mb-1">Total Groups</p>
          <p className="text-title-md font-manrope font-bold text-blue-200">{totalCount}</p>
        </div>
        <div className="stat-card dark-stat p-5 rounded-lg animate-slide-up animate-stagger-2 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/60 mb-1">Created By Me</p>
          <p className="text-title-md font-manrope font-bold text-blue-300">{createdCount}</p>
        </div>
        <div className="stat-card dark-stat p-5 rounded-lg animate-slide-up animate-stagger-3 opacity-0" style={{animationFillMode: 'forwards'}}>
          <p className="text-label-caps text-blue-200/60 mb-1">Joined Groups</p>
          <p className="text-title-md font-manrope font-bold text-blue-300">{joinedCount}</p>
        </div>
      </div>

      <div className="animate-slide-up animate-stagger-2 opacity-0" style={{animationFillMode: 'forwards'}}>
        <CreateGroupForm />
      </div>

      <div className="space-y-8">
        <div className="animate-slide-up animate-stagger-3 opacity-0" style={{animationFillMode: 'forwards'}}>
          <h3 className="text-label-caps text-blue-200/60 mb-4">Groups I Created</h3>
          {createdGroups?.length === 0 ? (
            <div className="text-center p-8 dark-card rounded-lg animate-scale-in">
              <p className="text-journal-note text-blue-200/70 mb-1">No groups created yet.</p>
              <p className="text-sm font-manrope text-blue-200/50">Create one above to start sharing expenses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {createdGroups?.map(group => (
                <GroupCard key={group.id} group={group} isCreator={true} />
              ))}
            </div>
          )}
        </div>

        <div className="animate-slide-up animate-stagger-4 opacity-0" style={{animationFillMode: 'forwards'}}>
          <h3 className="text-label-caps text-blue-200/60 mb-4">Groups I Joined</h3>
          {joinedGroups.length === 0 ? (
            <div className="text-center p-8 dark-card rounded-lg animate-scale-in">
              <p className="text-journal-note text-blue-200/70 mb-1">No groups joined yet.</p>
              <p className="text-sm font-manrope text-blue-200/50">When friends invite you, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {joinedGroups.map(group => (
                <GroupCard key={group.id} group={group} isCreator={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
