import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { getProductImageUrl, orderApi, configApi } from '../../services/api.js'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const {
    items, totalItems, subtotal, deliveryFee, totalAmount,
    amountMissingForFreeDelivery, isFreeDeliveryEligible, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE,
    incrementQuantity, decrementQuantity, removeFromCart, clearCart,
  } = useCart()
  const navigate = useNavigate()
  const [imgErrors, setImgErrors] = useState({})
  const [whatsappNumber, setWhatsappNumber] = useState('0604527252')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    configApi.getWhatsapp().then(r => setWhatsappNumber(r.data.number || whatsappNumber)).catch(() => {})
  }, [])

  const formatPrice = (n) => n.toFixed(2)

  const buildWhatsappMessage = () => {
    const lines = ["Bonjour Cadeau Karim, je souhaite passer cette commande :", ""]
    items.forEach(it => {
      const sub = it.quantity * it.price
      lines.push(`- ${it.quantity}x ${it.name} (${formatPrice(sub)} DH)`)
    })
    lines.push("")
    lines.push(`--- Sous-total produits : ${formatPrice(subtotal)} DH`)
    lines.push(`--- Livraison : ${deliveryFee === 0 ? 'Gratuite' : `${formatPrice(deliveryFee)} DH`}`)
    lines.push(`--- Total final : ${formatPrice(totalAmount)} DH`)
    lines.push("")
    if (isFreeDeliveryEligible) {
      lines.push("✅ Livraison gratuite (>= " + FREE_DELIVERY_THRESHOLD.toFixed(0) + " DH)")
    } else {
      lines.push("⚠️ Frais de livraison fixes de " + DELIVERY_FEE.toFixed(0) + " DH")
    }
    lines.push("")
    lines.push("📍 Merci de nous envoyer votre position géographique (localisation) pour faciliter la livraison.")
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
  // l'onglet immediatement, puis on ecrit le message dedans une fois la
  // commande enregistree cote serveur.
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
    navigate("/")
    if (waWindow) waWindow.focus?.()
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24 px-4">
        <div className="inline-flex p-5 bg-gray-100 rounded-full mb-5">
          <ShoppingCart size={48} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Votre panier est vide</h2>
        <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">
          Ajoutez des produits depuis le catalogue pour passer votre commande.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm active:scale-95 transition"
        >
          <ArrowLeft size={18} /> Voir les produits
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart size={24} className="text-brand-600" />
          Mon panier
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-gray-500 hover:text-red-600 font-medium flex items-center gap-1"
        >
          <Trash2 size={15} /> Vider
        </button>
      </div>

      <div className={`rounded-2xl p-4 mb-4 border-2 flex items-start gap-3 ${
        isFreeDeliveryEligible ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        {isFreeDeliveryEligible ? (
          <>
            <CheckCircle2 size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-green-800 text-sm">Livraison gratuite activée</div>
              <div className="text-green-700/80 text-xs mt-0.5">
                Votre commande a atteint le seuil de {FREE_DELIVERY_THRESHOLD.toFixed(0)} DH
              </div>
            </div>
          </>
        ) : (
          <>
            <AlertCircle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800 text-sm">
                Il manque <span className="text-red-600">{formatPrice(amountMissingForFreeDelivery)} DH</span> pour la livraison gratuite
              </div>
              <div className="text-amber-700/80 text-xs mt-0.5">
                Ajoutez encore {formatPrice(amountMissingForFreeDelivery)} DH de produits pour bénéficier de la livraison offerte.
              </div>
              <Link
                to="/"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline"
              >
                Continuer mes achats →
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="space-y-3 mb-5">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-product p-3 flex gap-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
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
                <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                  {item.name}
                </h3>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-600 p-1 flex-shrink-0"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-auto flex items-end justify-between pt-2">
                <div>
                  <div className="text-[11px] text-gray-500">Prix unitaire</div>
                  <div className="font-semibold text-gray-800">{formatPrice(item.price)} DH</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                    <button
                      onClick={() => decrementQuantity(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-md transition"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => incrementQuantity(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-white bg-brand-600 hover:bg-brand-700 rounded-md transition"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <div className="font-bold text-brand-700 text-lg tracking-tight">
                    {formatPrice(item.quantity * item.price)} <span className="text-xs font-medium">DH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-product p-4 sm:p-5 mb-24">
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total produits ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
            <span>{formatPrice(subtotal)} DH</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Livraison</span>
            <span>{isFreeDeliveryEligible ? <span className="text-green-600 font-semibold">Gratuite (0 DH)</span> : <span className="text-amber-600 font-semibold">{formatPrice(deliveryFee)} DH</span>}</span>
          </div>
          <div className="border-t border-dashed border-gray-200 my-3" />
          <div className="flex items-end justify-between">
            <span className="font-bold text-gray-900 text-base">Total TTC</span>
            <div>
              <span className="text-3xl font-bold text-brand-700 tracking-tight">{formatPrice(totalAmount)}</span>
              <span className="font-semibold text-brand-700 ml-1">DH</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={saving}
          className={`w-full py-4 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all ${
            'bg-gradient-to-r from-green-500 to-emerald-600 text-white active:scale-[0.98] hover:shadow-xl'
          }`}
        >
          <MessageCircle size={22} />
          {saving
            ? 'Envoi en cours...'
            : 'Commander via WhatsApp'
          }
        </button>
        {!isFreeDeliveryEligible && <p className="mt-2 text-center text-xs text-gray-500">Ajoutez encore <strong>{formatPrice(amountMissingForFreeDelivery)} DH</strong> pour la livraison gratuite, ou validez avec {formatPrice(DELIVERY_FEE)} DH de frais.</p>}
      </div>
    </div>
  )
}
