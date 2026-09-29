import { Link, useLocation } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext.jsx'

export default function CategoryBar({ categories, activeCategory }) {
  const location = useLocation()
  const { t, locale } = useLocale()
  const searchParams = new URLSearchParams(location.search)
  const buildUrl = (catId) => {
    const params = new URLSearchParams(searchParams)
    if (catId) params.set('category', catId)
    else params.delete('category')
    params.delete('page')
    return `/?${params.toString()}`
  }
  const active = searchParams.get('category') || activeCategory

  return (
    <div className="relative mb-6 mask-fade-x">
      <div className="-mx-3 sm:-mx-4 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex min-w-max gap-2 px-3 py-2 sm:px-4">
          <Link
            to={buildUrl(null)}
            replace
            className={!active ? 'chip-active' : 'chip-inactive'}
          >
            <span>🛍️</span> {t('all')}
          </Link>
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={buildUrl(cat.id)}
              replace
              className={`${active === cat.id ? 'chip-active' : 'chip-inactive'} animate-fade-in`}
              style={{ animationDelay: `${Math.min(250, i * 40)}ms` }}
            >
              <span className="text-base">{cat.icon || '📦'}</span> {locale === 'ar' ? t('categoryNames')[i] : cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
