import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar, MobileNav } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black/20">
      {/* Desktop Sidebar */}
      <Sidebar email={user.email || 'User'} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black/10">
        {/* Mobile Navigation */}
        <MobileNav email={user.email || 'User'} />
        
        {/* Main Content Area */}
        <main className="dashboard-scroll flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto w-full flex flex-col min-h-full">
            {children}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}
