import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { getPlaceholderUrl, getProductImageUrl } from '../../services/api.js'
import { useCart } from '../../context/CartContext.jsx'
import { useState } from 'react'

const CATEGORY_ACCENTS = {
  '1': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  '2': 'bg-orange-50 text-orange-700 border-orange-100',
  '3': 'bg-amber-50 text-amber-700 border-amber-100',
  '4': 'bg-blue-50 text-blue-700 border-blue-100',
  '5': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  '6': 'bg-violet-50 text-violet-700 border-violet-100',
}

export default function ProductCard({ product, index = 0 }) {
  const { items, addToCart, incrementQuantity, decrementQuantity, removeFromCart } = useCart()
  const [imageFailed, setImageFailed] = useState(false)
  const cartItem = items.find(item => item.id === product.id)
  const quantity = cartItem?.quantity || 0
  const source = imageFailed ? getPlaceholderUrl(product.name, product.categoryId) : getProductImageUrl(product.imageUrl, product.categoryId, product.name)
  const price = Number(product.price || 1).toFixed(2).replace('.', ',')

  return (
    <article
      className="group relative min-w-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_14px_35px_-24px_rgba(20,58,50,.5)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_26px_55px_-25px_rgba(20,58,50,.42)]"
      style={{ animationDelay: `${Math.min(360, index * 35)}ms` }}
    >
      <div className="relative aspect-[0.94] overflow-hidden bg-[#eef5f1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(255,255,255,.9),transparent_32%),linear-gradient(145deg,rgba(15,118,110,.05),rgba(251,146,60,.08))]" />
        <img
          src={source}
          alt={product.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="relative z-10 h-full w-full object-contain p-5 transition duration-700 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-teal-800 shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" /> Prix test
        </div>
        {quantity > 0 && (
          <div className="absolute right-3 top-3 z-20 flex h-8 min-w-8 items-center justify-center rounded-xl bg-[#153b36] px-2 text-xs font-black text-white shadow-lg">
            {quantity}
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex translate-y-3 items-center justify-between opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${CATEGORY_ACCENTS[String(product.categoryId)] || 'bg-white text-slate-700 border-white'}`}>1 DH</span>
          {quantity > 0 && <button onClick={() => removeFromCart(product.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-white/90 text-rose-500 shadow-md backdrop-blur" aria-label="Retirer du panier"><Trash2 size={14} /></button>}
        </div>
      </div>

      <div className="flex min-h-[164px] flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-[#17332e]">{product.name}</h3>
          <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-500" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Unité</span>
            <span className="text-2xl font-black tracking-tight text-[#0f766e]">{price}<small className="ml-1 text-xs">DH</small></span>
          </div>
          {quantity === 0 ? (
            <button onClick={() => addToCart(product)} className="grid h-11 w-11 place-items-center rounded-2xl bg-[#153b36] text-white shadow-lg shadow-teal-900/20 transition hover:scale-105 hover:bg-[#0f766e]" aria-label={`Ajouter ${product.name}`}>
              <ShoppingBag size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-2xl bg-[#edf5f1] p-1">
              <button onClick={() => decrementQuantity(product.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[#153b36] shadow-sm" aria-label="Diminuer"><Minus size={14} /></button>
              <span className="w-5 text-center text-sm font-black text-[#153b36]">{quantity}</span>
              <button onClick={() => incrementQuantity(product.id)} className="grid h-8 w-8 place-items-center rounded-xl bg-[#153b36] text-white" aria-label="Augmenter"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
