import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowRight, Check, Clock3, Leaf, PackageOpen, Search, Sparkles, Truck, Wallet } from 'lucide-react'
import { categoryApi, productApi } from '../../services/api.js'
import ProductCard from '../../components/client/ProductCard.jsx'
import CategoryBar from '../../components/client/CategoryBar.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useLocale } from '../../context/LocaleContext.jsx'

const benefits = [
  { icon: Truck, title: 'Livraison locale', detail: 'Rapide et suivie', color: 'bg-orange-400' },
  { icon: Wallet, title: 'Paiement à la porte', detail: 'Simple et sûr', color: 'bg-teal-600' },
  { icon: Leaf, title: 'Sélection utile', detail: '110+ essentiels', color: 'bg-lime-500' },
  { icon: Clock3, title: 'Ouvert chaque jour', detail: '8h — 22h', color: 'bg-violet-500' },
]

export default function HomePage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const categoryId = params.get('category')
  const search = params.get('search')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { FREE_DELIVERY_THRESHOLD } = useCart()
  const { locale } = useLocale()

  useEffect(() => { categoryApi.getAll().then(response => setCategories(response.data)).catch(() => setCategories([])) }, [])
  useEffect(() => {
    setLoading(true)
    productApi.getAll({ ...(categoryId ? { categoryId } : {}), ...(search ? { search } : {}) })
      .then(response => setProducts(response.data)).catch(() => setProducts([])).finally(() => setLoading(false))
  }, [categoryId, search])

  const activeCategory = useMemo(() => categories.find(category => category.id === categoryId), [categories, categoryId])

  // Le compteur doit reflater le catalogue REEL : on ne peut pas afficher un
  // total en dur, sinon il ment des que l'admin ajoute ou supprime un produit.
  const [totalCount, setTotalCount] = useState(null)
  useEffect(() => {
    productApi.getAll()
      .then(response => setTotalCount(Array.isArray(response.data) ? response.data.length : null))
      .catch(() => setTotalCount(null))
  }, [categoryId, search, products.length])
  const categoryCount = categoryId || search ? products.length : (totalCount ?? products.length)

  return (
    <div className="shop-grid-bg -mx-3 min-h-[calc(100vh-76px)] px-3 pb-20 sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
      <div className="mx-auto max-w-[1440px] space-y-8 pt-5 sm:pt-8">
        <section className="relative isolate overflow-hidden rounded-[34px] bg-[#153b36] text-white shadow-[0_30px_80px_-35px_rgba(21,59,54,.75)]">
          <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_82%_22%,rgba(251,146,60,.55),transparent_17%),radial-gradient(circle_at_58%_100%,rgba(45,212,191,.35),transparent_28%)]" />
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[38px] border-white/5" />
          <div className="absolute bottom-[-130px] left-[42%] h-72 w-72 rounded-full border-[42px] border-orange-300/10" />
          <div className="relative grid min-h-[390px] items-center gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[1.15fr_.85fr] lg:px-14 lg:py-12">
            <div className="max-w-2xl animate-slide-in-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-100 backdrop-blur"><Sparkles size={13} className="text-orange-300" /> Cadeau Karim · édition quotidienne</div>
              <h1 className="max-w-3xl text-4xl font-black leading-[.98] tracking-[-0.06em] sm:text-6xl">Le bon essentiel,<br /><span className="text-orange-300">au bon moment.</span></h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-teal-50/75 sm:text-base">Un marché en ligne pensé pour les courses qui comptent: produits utiles, prix test à 1 DH et livraison offerte dès {FREE_DELIVERY_THRESHOLD} DH.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="#catalogue" className="inline-flex items-center gap-2 rounded-2xl bg-orange-400 px-5 py-3.5 text-sm font-black text-[#153b36] shadow-lg shadow-orange-950/20 transition hover:-translate-y-1 hover:bg-orange-300">Explorer le catalogue <ArrowRight size={17} /></a>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-xs font-bold text-white/80"><Check size={15} className="text-teal-300" /> Sans minimum pour commencer</span>
              </div>
            </div>
            <div className="relative hidden min-h-[280px] lg:block">
              <div className="absolute right-8 top-4 w-64 rotate-3 rounded-[28px] bg-[#f8faf8] p-5 text-[#153b36] shadow-2xl shadow-black/20 transition duration-500 hover:rotate-0 hover:scale-105">
                <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Panier express</span><span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black text-orange-700">1 DH</span></div>
                <div className="mt-7 text-5xl">🥛🍪🥤</div><div className="mt-6 text-xl font-black">Les essentiels du jour</div><div className="mt-1 text-xs font-semibold text-slate-500">Lait · snacks · boissons</div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[74%] rounded-full bg-gradient-to-r from-teal-500 to-orange-400" /></div><div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400"><span>Préparation</span><span>74%</span></div>
              </div>
              <div className="absolute bottom-1 left-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><div className="text-2xl font-black">50 DH</div><div className="text-[10px] font-bold uppercase tracking-widest text-teal-100/70">seuil gratuit</div></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {benefits.map(({ icon: Icon, title, detail, color }, index) => <div key={title} className="group rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_12px_30px_-25px_rgba(21,59,54,.55)] backdrop-blur transition hover:-translate-y-1 hover:bg-white" style={{ animationDelay: `${index * 60}ms` }}><div className={`mb-4 grid h-10 w-10 place-items-center rounded-2xl ${color} text-white shadow-lg`}><Icon size={18} /></div><div className="text-xs font-black text-[#17332e] sm:text-sm">{title}</div><div className="mt-1 text-[10px] font-semibold text-slate-400 sm:text-xs">{detail}</div></div>)}
        </section>

        <section id="catalogue" className="scroll-mt-28">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-teal-700"><span className="h-2 w-2 rounded-full bg-orange-400" /> Sélection Cadeau Karim</div><h2 className="text-2xl font-black tracking-[-.04em] text-[#17332e] sm:text-3xl">Tout ce qu’il vous faut<span className="text-orange-500">.</span></h2></div><div className="rounded-full border border-teal-100 bg-white/70 px-3 py-2 text-xs font-black text-slate-500">{categoryCount} {locale === 'ar' ? 'منتجات' : categoryCount > 1 ? 'produits disponibles' : 'produit disponible'}</div></div>
          {categories.length > 0 && <CategoryBar categories={categories} activeCategory={categoryId} />}
          {(activeCategory || search) && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white bg-white/75 px-4 py-3 shadow-sm"><span className="text-xl">{activeCategory?.icon || <Search size={18} />}</span><span className="text-sm font-black text-[#17332e]">{activeCategory?.name || `Recherche: ${search}`}</span><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700">{products.length}</span></div>}
          {loading ? <div className="product-grid">{Array.from({ length: 10 }).map((_, index) => <div key={index} className="overflow-hidden rounded-[28px] bg-white p-3"><div className="skeleton aspect-[.94] rounded-[22px]" /><div className="mt-4 h-4 w-4/5 skeleton rounded" /><div className="mt-3 h-10 w-full skeleton rounded-2xl" /></div>)}</div> : products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="rounded-[30px] border border-white bg-white/80 px-6 py-20 text-center shadow-sm"><PackageOpen className="mx-auto mb-4 text-teal-600" size={44} /><h3 className="text-xl font-black text-[#17332e]">Aucun produit trouvé</h3><p className="mt-2 text-sm font-medium text-slate-500">Essayez une autre recherche ou sélectionnez un autre rayon.</p></div>}
        </section>
      </div>
    </div>
  )
}
