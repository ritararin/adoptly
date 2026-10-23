import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Calendar, BarChart3, Bell, 
  PawPrint, User, FileText, LogOut, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isShelter = user?.role === 'shelter';

  // 1. ADOPTER MENU
  const adopterNav = [
    {
      title: "Main",
      items: [
        { label: "Match Dashboard", path: "/matches", icon: LayoutDashboard },
        { label: "My Profile", path: "/profile", icon: User },
      ]
    },
    {
      title: "Adoption Journey",
      items: [
        { label: "My Applications", path: "/my-applications", icon: FileText },
        { label: "Interview Schedule", path: "/interviews", icon: Calendar },
      ]
    },
    {
      title: "System",
      items: [
        { label: "Notifications", path: "/notifications", icon: Bell },
      ]
    }
  ];

  // 2. SHELTER MENU
  const shelterNav = [
    {
      title: "Shelter Workspace",
      items: [
        { label: "My Pet Listings", path: "/shelter/listings", icon: PawPrint },
        { label: "Review Applications", path: "/shelter/applications", icon: ClipboardList },
        { label: "Analytics", path: "/analytics", icon: BarChart3 },
      ]
    },
    {
      title: "Scheduling",
      items: [
        { label: "Interview Schedule", path: "/interviews", icon: Calendar },
        { label: "Notifications", path: "/notifications", icon: Bell },
      ]
    }
  ];

  // 👇 THIS IS THE STRICT TOGGLE
  const navGroups = isShelter ? shelterNav : adopterNav;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-line bg-white px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-gold">
          <PawPrint size={18} fill="currentColor" />
        </div>
        <span className="font-serif text-xl font-bold tracking-tight text-forest">adoptly</span>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-8 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-whisper">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link to={item.path} className="block relative">
                      {isActive && (
                        <motion.div 
                          layoutId="active-nav"
                          className="absolute inset-0 rounded-xl bg-forest-wash"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? 'text-forest' : 'text-ink-muted hover:text-forest-dark hover:bg-cream-soft'
                      }`}>
                        <item.icon size={18} className={isActive ? 'text-forest' : 'text-ink-faint'} />
                        {item.label}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-line-soft pt-4">
        <button 
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-terracotta-deep transition-colors hover:bg-terracotta/10"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}