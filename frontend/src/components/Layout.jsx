import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream">
      
      {/* The Sidebar stays on the left */}
      <Sidebar />

      {/* This main tag takes up the rest of the screen */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 sm:p-8">
          
          {/* 👇 THIS IS WHAT MAKES THE PAGES SHOW UP */}
          <Outlet />
          
        </div>
      </main>
      
    </div>
  )
}