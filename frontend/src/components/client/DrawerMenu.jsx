import { X, Store, LayoutDashboard, ClipboardList, LogIn, Truck, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { categoryApi } from '../../services/api.js'

export default function DrawerMenu({ isOpen, onClose }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      categoryApi.getAll()
        .then(r => setCategories(r.data))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] animate-fade-in">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/55 backdrop-blur-sm"
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className="absolute top-0 left-0 h-full w-[88%] sm:w-[420px] max-w-full bg-white shadow-drawer flex flex-col animate-slide-in-right"
        style={{ animationName: 'slide-in-left' }}
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gradient opacity-95" />
          <div className="absolute -right-10 -top-12 w-56 h-56 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute left-10 bottom-0 w-40 h-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative px-5 sm:px-6 pt-6 pb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur shadow-inner">
                  <Store size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-lg font-extrabold tracking-tight leading-none">
                    Karim <span className="text-white/95">Market</span>
                  </div>
                  <p className="text-white/80 text-[11px] mt-1">Supermarché de proximité</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer le menu"
                className="h-10 w-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 active:scale-95 transition flex items-center justify-center"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/15 border border-white/20 px-3 py-2.5 flex flex-col items-center text-center">
                <Truck size={17} />
                <span className="text-[10px] font-bold mt-1 leading-tight">Livraison<br/>gratuit</span>
              </div>
              <div className="rounded-2xl bg-white/15 border border-white/20 px-3 py-2.5 flex flex-col items-center text-center">
                <ShieldCheck size={17} />
                <span className="text-[10px] font-bold mt-1 leading-tight">Paiement<br/>livraison</span>
              </div>
              <div className="rounded-2xl bg-white/15 border border-white/20 px-3 py-2.5 flex flex-col items-center text-center">
                <Star size={17} />
                <span className="text-[10px] font-bold mt-1 leading-tight">Qualité<br/>garantie</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 pt-3">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition text-neutral-900 font-bold"
          >
            <div className="h-9 w-9 rounded-xl bg-white border border-brand-100 flex items-center justify-center text-brand-600">
              <LayoutDashboard size={18} strokeWidth={2.3} />
            </div>
            Tous les produits
            <span className="ml-auto text-xs font-semibold text-brand-600">Accueil →</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
          <h3 className="px-2 py-2 text-[11px] font-black text-neutral-500 uppercase tracking-widest">
            🏷️ Rayons
          </h3>
          <div className="space-y-1">
            {loading ? (
              <div className="p-4 text-center text-neutral-400 text-sm">Chargement...</div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-center text-neutral-400 text-sm">Aucune catégorie</div>
            ) : (
              categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/?category=${encodeURIComponent(cat.id)}`}
                  onClick={onClose}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition text-neutral-800 animate-fade-in"
                  style={{ animationDelay: `${Math.min(400, i * 30)}ms` }}
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand-50 to-orange-50 border border-brand-100/70 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    {cat.icon || '📦'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{cat.name}</div>
                    <div className="text-[11px] text-neutral-400">Tous les articles →</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-neutral-100 bg-neutral-50">
          <Link
            to="/admin/login"
            onClick={onClose}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-extrabold text-white bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 shadow-xl shadow-neutral-900/20 hover:brightness-110 active:scale-[0.98] transition"
          >
            <LogIn size={18} strokeWidth={2.3} />
            Espace Admin
          </Link>
        </div>
      </aside>

      <style>{`@keyframes slide-in-left { from { transform: translateX(-110%); } to { transform: translateX(0); } }`}</style>
    </div>
  )
}
