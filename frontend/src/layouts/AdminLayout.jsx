import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Store, LayoutDashboard, Package, Tag, ClipboardList,
  LogOut, Menu, X, ChevronRight, Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { path: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, hue: 'from-brand-500 to-orange-500', hueSoft: 'bg-brand-50 text-brand-600' },
  { path: '/admin/products', label: 'Produits', icon: Package, hue: 'from-violet-500 to-purple-500', hueSoft: 'bg-violet-50 text-violet-600' },
  { path: '/admin/categories', label: 'Catégories', icon: Tag, hue: 'from-sky-500 to-indigo-500', hueSoft: 'bg-sky-50 text-sky-600' },
  { path: '/admin/orders', label: 'Commandes', icon: ClipboardList, hue: 'from-emerald-500 to-teal-500', hueSoft: 'bg-emerald-50 text-emerald-600' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }
  const current = navItems.find(n => n.path === location.pathname)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/20 to-neutral-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 md:translate-x-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full bg-white border-r border-neutral-200/80 shadow-[0_0_40px_-20px_rgba(0,0,0,0.15)]">
          <div className="pointer-events-none absolute top-0 right-0 w-60 h-60 rounded-full bg-brand-gradient opacity-[0.08] blur-3xl" />

          <div className="relative flex flex-col h-full">
            <div className="p-5 border-b border-neutral-100">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative h-12 w-12 rounded-2xl bg-brand-gradient shadow-lg shadow-brand-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Store size={22} className="text-white" strokeWidth={2.2} />
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-lg tracking-tight text-neutral-900 leading-none">
                    Cadeau <span className="bg-gradient-to-r from-brand-500 to-orange-600 bg-clip-text text-transparent">Karim</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-semibold mt-1 flex items-center gap-1">
                    <Sparkles size={10} /> Espace Administration
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
              <div className="px-2 pb-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                Navigation
              </div>
              {navItems.map((item, i) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => [
                    'group relative flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold transition-all duration-200 animate-fade-in',
                    isActive
                      ? `text-white shadow-lg`
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  ].join(' ')}
                  style={({ isActive }) => ({
                    background: isActive
                      ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                      : undefined,
                    animationDelay: `${i * 30}ms`,
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.hue} ${isActive ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden
                      />
                      <span className={`relative h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : item.hueSoft}`}>
                        <item.icon size={18} strokeWidth={2.2} />
                      </span>
                      <span className="relative flex-1">{item.label}</span>
                      <ChevronRight size={15} className={`relative opacity-40 ${isActive ? 'text-white' : ''}`} />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="p-3.5 border-t border-neutral-100 bg-neutral-50/60 backdrop-blur">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-sm font-bold text-neutral-600 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <span className="h-9 w-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-rose-500">
                  <LogOut size={18} strokeWidth={2.2} />
                </span>
                Déconnexion
              </button>
              <Link
                to="/"
                className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-2xl text-xs font-bold bg-white border border-neutral-200 text-neutral-700 hover:border-brand-300 hover:text-brand-700 transition shadow-sm"
              >
                ← Retour au site client
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-neutral-900/55 backdrop-blur-sm z-30 md:hidden animate-fade-in"
        />
      )}

      <div className="md:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-neutral-200/70">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-soft hover:border-brand-300 active:scale-95 transition"
                aria-label="Ouvrir le menu"
              >
                <Menu size={19} strokeWidth={2.2} />
              </button>
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Administration
                </div>
                <h1 className="text-base sm:text-xl font-black tracking-tight text-neutral-900 truncate">
                  {current?.label || 'Accueil'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-100 text-[12px] font-bold text-brand-700">
                <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
                {new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button
                onClick={handleLogout}
                className="sm:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-soft hover:border-rose-300 hover:text-rose-600 active:scale-95 transition"
                aria-label="Déconnexion"
              >
                <X size={19} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
