import { Plus, Minus, Trash2, ShoppingCart, X, MessageCircle, AlertCircle, CheckCircle2, Package } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { getProductImageUrl, orderApi, configApi } from '../../services/api.js'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from '../../context/LocaleContext.jsx'

export default function CartDrawer({ isOpen, onClose }) {
  const {
    items, totalItems, subtotal, deliveryFee, totalAmount,
    amountMissingForFreeDelivery, isFreeDeliveryEligible, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE,
    incrementQuantity, decrementQuantity, removeFromCart, clearCart,
  } = useCart()
  const { t, isArabic } = useLocale()
  const [imgErrors, setImgErrors] = useState({})
  const [whatsappNumber, setWhatsappNumber] = useState('0604527252')
  const [saving, setSaving] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    configApi.getWhatsapp().then(r => setWhatsappNumber(r.data.number || whatsappNumber)).catch(() => {})
  }, [])

  const formatPrice = (n) => n.toFixed(2)

  const buildWhatsappMessage = () => {
    const lines = [isArabic ? 'مرحباً Cadeau Karim، أريد تأكيد طلبي:' : 'Bonjour Cadeau Karim, je souhaite passer cette commande :', '']
    items.forEach(it => {
      const sub = it.quantity * it.price
      lines.push(`- ${it.quantity}x ${it.name} (${formatPrice(sub)} DH)`)
    })
    lines.push("")
    lines.push(`${isArabic ? 'مجموع المنتجات' : 'Sous-total produits'} : ${formatPrice(subtotal)} DH`)
    lines.push(`${isArabic ? 'التوصيل' : 'Livraison'} : ${deliveryFee === 0 ? (isArabic ? 'مجاني' : 'Gratuite') : `${formatPrice(deliveryFee)} DH`}`)
    lines.push(`${isArabic ? 'المجموع النهائي' : 'Total final'} : ${formatPrice(totalAmount)} DH`)
    if (isFreeDeliveryEligible) {
      lines.push(isArabic ? `✅ التوصيل مجاني (ابتداءً من ${FREE_DELIVERY_THRESHOLD.toFixed(0)} DH)` : `✅ Livraison gratuite (>= ${FREE_DELIVERY_THRESHOLD.toFixed(0)} DH)`)
    }
    lines.push("")
    lines.push(isArabic
      ? '📍Merci de nous envoyer votre position géographique (localisation) pour faciliter la livraison.'
      : '📍 Merci de nous envoyer votre position géographique (localisation) pour faciliter la livraison.')
    return encodeURIComponent(lines.join("\n"))
  }

  const saveOrderOnServer = async () => {
    try {
      setSaving(true)
      const orderData = {
        items: items.map(it => ({
          productId: it.id,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.quantity * it.price,
        })),
        subtotalAmount: subtotal,
        deliveryFee,
        totalAmount,
        status: "Validée",
      }
      const res = await orderApi.create(orderData)
      return res?.data?.id || null
    } catch (err) {
      console.warn("Commande non enregistrée côté backend :", err)
      return null
    } finally {
      setSaving(false)
    }
  }

  // Ouvre WhatsApp de facon SYNCHRONE : apres un await, les navigateurs
  //Considerent la fenetre comme un popup et la bloquent. On prepare donc
  // l'onglet immediatement, puis on enregistre la commande en parallele.
  const handleOrder = async () => {
    const message = buildWhatsappMessage()
    const internationalNumber = whatsappNumber.replace(/^0/, '212')
    const url = `https://wa.me/${internationalNumber}?text=${message}`
    const waWindow = window.open(url, "_blank")

    const orderId = await saveOrderOnServer()

    if (!orderId) {
      console.warn("La commande n'a pas pu etre enregistree : le Dashboard admin ne l'affichera pas.")
    }
    clearCart()
    onClose?.()
    if (waWindow) waWindow.focus?.()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] animate-fade-in">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/55 backdrop-blur-sm"
        aria-hidden
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        className="absolute top-0 right-0 h-full w-[92%] sm:w-[440px] max-w-full bg-neutral-50 shadow-drawer flex flex-col animate-slide-in-right"
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-sunset-gradient opacity-95" />
          <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative px-5 sm:px-6 pt-6 pb-7 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
                  <ShoppingCart size={22} strokeWidth={2.3} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">{t('cart')}</h2>
                  <p className="text-white/85 text-xs mt-0.5">
                    {totalItems === 0
                      ? "Aucun article ajouté"
                      : `${totalItems} article${totalItems > 1 ? 's' : ''} sélectionné${totalItems > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer le panier"
                className="h-10 w-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 active:scale-95 transition flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-12">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-brand-100 blur-2xl opacity-60" />
              <div className="relative h-24 w-24 rounded-[28px] bg-white shadow-card border border-neutral-100 flex items-center justify-center">
                <Package size={44} className="text-brand-400" strokeWidth={1.6} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-neutral-900">{t('emptyCart')}</h3>
            <p className="text-neutral-500 mt-1.5 max-w-xs text-sm leading-relaxed">
              Ajoutez des produits depuis le catalogue pour passer votre commande.
            </p>
            <button
              onClick={onClose}
              className="mt-6 btn-primary px-6 py-3 text-sm"
            >
              {t('continueShopping')} →
            </button>
          </div>
        ) : (
          <>
            <div className="px-5 sm:px-6 pt-4">
              <div className={`rounded-2xl p-4 border-2 flex items-start gap-3 ${
                isFreeDeliveryEligible
                  ? 'bg-accent-50 border-accent-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                {isFreeDeliveryEligible ? (
                  <>
                    <div className="h-9 w-9 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={20} className="text-accent-600" />
                    </div>
                    <div>
                      <div className="font-bold text-accent-800 text-sm">{t('deliveryFree')} activée 🎉</div>
                      <div className="text-accent-700/80 text-xs mt-0.5">
                        Seuil de {FREE_DELIVERY_THRESHOLD.toFixed(0)} DH atteint
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={20} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-amber-800 text-sm leading-tight">
                        Il manque <span className="text-rose-600">{formatPrice(amountMissingForFreeDelivery)} DH</span>
                      </div>
                      <div className="text-amber-700/80 text-xs mt-1">
                        {t('missingForFree')}. {t('deliveryPaid')}.
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, 100 - (amountMissingForFreeDelivery / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pt-4 pb-5 space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-card border border-neutral-100 p-3 flex gap-3 hover:shadow-card-hover transition-shadow duration-300"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-1 ring-neutral-100">
                    <img
                      src={imgErrors[item.id]
                        ? getProductImageUrl(null, item.categoryId, item.name)
                        : getProductImageUrl(item.imageUrl, item.categoryId, item.name)}
                      alt={item.name}
                      onError={() => setImgErrors(p => ({ ...p, [item.id]: true }))}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-neutral-800 leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg flex-shrink-0 transition"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div>
                        <div className="text-[11px] text-neutral-500">Unité</div>
                        <div className="font-semibold text-neutral-800 text-[15px]">{formatPrice(item.price)} DH</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center bg-neutral-50 rounded-xl p-1 border border-neutral-200">
                          <button
                            onClick={() => decrementQuantity(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-white hover:shadow-sm rounded-lg transition"
                          >
                            <Minus size={15} strokeWidth={2.4} />
                          </button>
                          <span className="w-8 text-center font-extrabold text-neutral-900 tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => incrementQuantity(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-white bg-brand-gradient rounded-lg shadow-sm hover:brightness-105 transition"
                          >
                            <Plus size={15} strokeWidth={2.4} />
                          </button>
                        </div>
                        <div className="font-black text-brand-700 text-lg tracking-tight tabular-nums">
                          {formatPrice(item.quantity * item.price)} <span className="text-[11px] font-semibold">DH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200/70 bg-white/80 backdrop-blur-xl px-5 sm:px-6 pt-4 pb-5">
              <div className="flex items-center justify-between text-sm text-neutral-600 mb-1.5">
                <span>{t('totalProducts')} ({totalItems} art.)</span>
                <span className="tabular-nums font-medium">{formatPrice(subtotal)} DH</span>
              </div>
              <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
                <span>Livraison</span>
                <span>
                  {isFreeDeliveryEligible ? <span className="text-accent-600 font-bold">{t('deliveryFree')} (0 DH)</span> : <span className="font-bold text-amber-600">{formatPrice(deliveryFee)} DH</span>}
                </span>
              </div>
              <div className="flex items-end justify-between pb-4 border-t border-dashed border-neutral-200 pt-3">
                <span className="font-bold text-neutral-900">Total TTC</span>
                <div>
                  <span className="text-3xl font-black text-brand-700 tracking-tight tabular-nums">{formatPrice(totalAmount)}</span>
                  <span className="font-bold text-brand-700 ml-1">DH</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="btn-ghost px-4 py-3.5 text-sm"
                  aria-label="Vider le panier"
                >
                  <Trash2 size={17} />
                </button>
                <button
                  onClick={handleOrder}
                  disabled={saving}
                  className={`flex-1 py-3.5 rounded-2xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                    'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:brightness-[1.07]'
                  }`}
                >
                  <MessageCircle size={20} />
                  {saving
                    ? 'Envoi en cours...'
                    : 'Commander via WhatsApp'
                  }
                </button>
              </div>
              {!isFreeDeliveryEligible && <p className="mt-2 text-center text-xs text-neutral-500">Ajoutez encore <strong className="text-amber-600">{formatPrice(amountMissingForFreeDelivery)} DH</strong> pour passer à la livraison gratuite, sinon {formatPrice(DELIVERY_FEE)} DH sont ajoutés.</p>}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
