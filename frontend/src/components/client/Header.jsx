import { Link, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, ShieldCheck, X, Languages, Sparkles } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useLocale } from '../../context/LocaleContext.jsx'
import { useEffect, useRef, useState } from 'react'

export default function Header({ onMenuClick }) {
  const { totalItems, openCart } = useCart()
  const { t, locale, toggleLocale } = useLocale()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { if (searching) inputRef.current?.focus() }, [searching])

  const submitSearch = event => {
    event.preventDefault()
    if (query.trim()) navigate(`/?search=${encodeURIComponent(query.trim())}`)
    setSearching(false)
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'nav-blur border-b border-white/70' : 'bg-[#f3f7f5]/70'}`}>
      <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-7 lg:px-10">
        <div className="flex items-center gap-3 lg:gap-5">
          <button onClick={onMenuClick} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white bg-white/80 text-[#153b36] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:hidden" aria-label="Menu"><Menu size={20} /></button>
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative grid h-12 w-12 shrink-0 rotate-[-4deg] place-items-center rounded-[18px] bg-[#153b36] text-white shadow-xl shadow-teal-950/15 transition duration-500 group-hover:rotate-0 group-hover:scale-105">
              <ShoppingBag size={23} strokeWidth={2.2} />
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#f3f7f5] bg-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[18px] font-black tracking-[-0.04em] text-[#153b36] sm:text-[21px]">Cadeau <span className="text-orange-500">Karim</span></div>
              <div className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:block">{t('brandTagline')}</div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-teal-800"><Sparkles size={13} /> Offre du jour</span>
            <span className="text-xs font-bold text-slate-500">110 essentiels · 1 DH seulement</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {searching ? (
              <form onSubmit={submitSearch} className="absolute left-4 right-4 top-[76px] flex rounded-2xl border border-white bg-white p-1.5 shadow-2xl lg:static lg:w-[270px] lg:shadow-sm">
                <Search size={17} className="m-2.5 shrink-0 text-slate-400" />
                <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
                <button type="button" onClick={() => { setSearching(false); setQuery('') }} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X size={16} /></button>
              </form>
            ) : (
              <button onClick={() => setSearching(true)} className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white/80 text-[#153b36] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" aria-label="Rechercher"><Search size={19} /></button>
            )}
            <button onClick={toggleLocale} className="hidden h-11 items-center gap-1.5 rounded-2xl border border-white bg-white/80 px-3 text-xs font-black text-[#153b36] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex" aria-label={t('switchLanguage')}><Languages size={16} /> {locale === 'fr' ? 'العربية' : 'FR'}</button>
            <Link to="/admin/login" className="hidden h-11 w-11 place-items-center rounded-2xl border border-white bg-white/80 text-slate-500 shadow-sm transition hover:text-[#153b36] sm:grid" aria-label={t('admin')}><ShieldCheck size={18} /></Link>
            <button onClick={openCart} className="relative flex h-11 items-center gap-2 rounded-2xl bg-[#153b36] px-3.5 text-white shadow-xl shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-[#0f766e]" aria-label={t('cart')}><ShoppingBag size={18} /><span className="hidden text-xs font-black sm:inline">{t('cart')}</span>{totalItems > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-[#f3f7f5] bg-orange-500 px-1 text-[10px] font-black">{totalItems}</span>}</button>
          </div>
        </div>
      </div>
    </header>
  )
}
