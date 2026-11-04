import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#faf8f4] selection:bg-forest/15 selection:text-forest">
      {/* Decorative ambient lighting meshes */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[25%] left-[25%] size-[600px] rounded-full bg-forest/[0.04] blur-[140px]" />
        <div className="absolute top-[35%] -right-[10%] size-[500px] rounded-full bg-amber-500/[0.035] blur-[130px]" />
        <div className="absolute -bottom-[20%] left-[20%] size-[550px] rounded-full bg-emerald-600/[0.035] blur-[140px]" />
      </div>

      {/* The Sidebar stays on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}