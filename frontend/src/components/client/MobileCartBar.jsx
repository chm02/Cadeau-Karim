import { ShoppingCart, AlertTriangle, PartyPopper, ChevronRight } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useLocation } from 'react-router-dom'

export default function MobileCartBar() {
  const {
    totalItems, totalAmount, amountMissingForFreeDelivery, isFreeDeliveryEligible,
    FREE_DELIVERY_THRESHOLD, openCart, cartOpen,
  } = useCart()
  const location = useLocation()
  const isCartRoute = location.pathname === '/cart'

  if (totalItems === 0 || isCartRoute) return null

  const progress = Math.min(100, 100 - (amountMissingForFreeDelivery / FREE_DELIVERY_THRESHOLD) * 100)

  return (
    <div
      className={`fixed left-0 right-0 z-30 pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-0 md:max-w-6xl md:mx-auto md:bottom-5 md:left-0 md:right-0 md:px-6 transition-transform duration-300 ${
        cartOpen ? 'translate-y-24 opacity-0 md:translate-y-0 md:opacity-40 md:pointer-events-none' : ''
      }`}
    >
      <div className="mx-3 md:mx-0 animate-slide-in-up">
        <div className="relative overflow-hidden rounded-[22px] shadow-drawer">
          <div className={`absolute inset-0 ${
            isFreeDeliveryEligible
              ? 'bg-accent-gradient'
              : 'bg-sunset-gradient'
          }`} />
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute left-0 bottom-0 w-40 h-40 rounded-full bg-black/10 blur-2xl" />

          <div className="relative text-white">
            <div className="px-4 pt-3 flex items-center justify-between text-[11px] sm:text-xs font-bold">
              {isFreeDeliveryEligible ? (
                <span className="flex items-center gap-1.5">
                  <PartyPopper size={13} />
                  Livraison gratuite activée
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  Il manque <strong className="text-white">{amountMissingForFreeDelivery.toFixed(2)} DH</strong>
                </span>
              )}
              <span className="opacity-90 bg-white/15 px-2 py-0.5 rounded-full border border-white/20">
                {totalItems} article{totalItems > 1 ? 's' : ''}
              </span>
            </div>

            <div className="px-4 pt-2">
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-12 w-12 flex-shrink-0 rounded-2xl bg-white/20 border border-white/30 backdrop-blur flex items-center justify-center shadow-inner">
                  <ShoppingCart size={22} strokeWidth={2.2} />
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-white text-brand-700 text-[10px] font-black shadow px-1">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs text-white/85 font-semibold">Total panier</div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums leading-none">
                      {totalAmount.toFixed(2)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold opacity-85">DH</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openCart}
                className="ml-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-white text-neutral-900 rounded-2xl font-extrabold text-sm sm:text-base shadow-xl active:scale-[0.97] hover:bg-neutral-50 transition flex items-center gap-1.5 flex-shrink-0"
              >
                Voir
                <ChevronRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
