'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createGroup, deleteGroup } from '@/app/dashboard/groups/actions'
import { Trash2, Users, ArrowRight } from 'lucide-react'

interface Group {
  id: string
  group_name: string
  created_by: string
  created_at: string
  group_members?: { count: number }[]
}

export function CreateGroupForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createGroup(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      const form = document.getElementById('create-group-form') as HTMLFormElement
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="dark-card p-6 rounded-lg mb-8">
      <h2 className="text-title-md font-manrope text-blue-300 mb-4 border-b border-blue-400/20 pb-2">Create a New Group</h2>
      
      {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}
      
      <form id="create-group-form" action={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-label-caps text-blue-200/70 mb-1">Group Name</label>
          <input 
            type="text" 
            name="groupName" 
            required
            minLength={3}
            placeholder="E.g., Roommates Q3"
            className="w-full dark-input py-2 font-manrope transition-all duration-300 focus:scale-[1.02]"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="boarding-pass-btn dark-btn px-8 py-3 text-label-caps transition-all duration-300 disabled:opacity-50 w-full md:w-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  )
}

export function GroupCard({ group, isCreator }: { group: Group, isCreator: boolean }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteGroup(group.id)
  }

  const date = new Date(group.created_at).toLocaleDateString()
  const memberCount = group.group_members?.[0]?.count || 1

  return (
    <Link href={`/dashboard/groups/${group.id}`} className="block group/card">
      <div className="group-card dark-card p-5 rounded-lg relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-manrope font-bold text-blue-300 text-lg truncate pr-4">{group.group_name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-blue-200/50 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4" />
            </span>
            {isCreator && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                disabled={deleting}
                className="text-blue-200/50 hover:text-red-400 transition-all duration-300 disabled:opacity-50 hover:scale-110 active:scale-90"
                title="Delete group"
              >
                <Trash2 className={`w-4 h-4 ${deleting ? 'animate-spin-slow' : ''}`} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-4 pt-4 border-t border-blue-400/20">
          <div className="flex items-center gap-2 text-blue-200/60 text-sm font-manrope">
            <Users className="w-4 h-4 text-blue-400" />
            <span>{memberCount} Member{memberCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-xs text-blue-200/40 font-space uppercase">
            EST. {date}
          </div>
        </div>
      </div>
    </Link>
  )
}
