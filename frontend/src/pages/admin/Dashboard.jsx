import { useEffect, useState, useMemo } from 'react'
import { orderApi, productApi, categoryApi } from '../../services/api.js'
import {
  ClipboardList, Package, Tag, TrendingUp, Calendar, Download,
  ArrowUpRight, Sparkles, ShoppingBag, Coins, Receipt
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Date locale (et non UTC) : sinon une commande passee en fin de journee peut
// disparaitre du Dashboard du jour, et la generation du PDF affiche la
// mauvaise date.
function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const KPIS = [
  {
    key: 'ordersCount', label: 'Commandes', Icon: ClipboardList,
    hue: 'from-brand-500 to-orange-500', soft: 'bg-brand-50 text-brand-600',
    ring: 'ring-brand-100',
  },
  {
    key: 'revenue', label: "Chiffre d'affaires", Icon: Coins,
    hue: 'from-emerald-500 to-teal-500', soft: 'bg-emerald-50 text-emerald-600',
    ring: 'ring-emerald-100', format: (v) => `${v.toFixed(2)} DH`,
  },
  {
    key: 'itemsSold', label: 'Articles vendus', Icon: ShoppingBag,
    hue: 'from-violet-500 to-purple-500', soft: 'bg-violet-50 text-violet-600',
    ring: 'ring-violet-100',
  },
  {
    key: 'avgTicket', label: 'Panier moyen', Icon: Receipt,
    hue: 'from-sky-500 to-indigo-500', soft: 'bg-sky-50 text-sky-600',
    ring: 'ring-sky-100', format: (v) => `${v.toFixed(2)} DH`,
  },
]

export default function Dashboard() {
  const [date, setDate] = useState(todayStr())
  const [summary, setSummary] = useState({ ordersCount: 0, revenue: 0, orders: [] })
  const [stats, setStats] = useState({ products: 0, categories: 0 })
  const [loading, setLoading] = useState(true)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      orderApi.getByDaySummary(date)
        .then(r => setSummary({
          ordersCount: Number(r.data?.ordersCount || 0),
          revenue: Number(r.data?.revenue || 0),
          orders: Array.isArray(r.data?.orders) ? r.data.orders : [],
        }))
        .catch(() => setSummary({ ordersCount: 0, revenue: 0, orders: [] })),
      productApi.getAll().then(r => setStats(s => ({ ...s, products: r.data.length }))).catch(() => {}),
      categoryApi.getAll().then(r => setStats(s => ({ ...s, categories: r.data.length }))).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [date])

  // Rafraichissement automatique : une commande passee via WhatsApp doit
  // apparaitre dans le Dashboard sans rechargement manuel de la page.
  useEffect(() => {
    if (date !== todayStr()) return undefined
    const timer = setInterval(() => {
      orderApi.getByDaySummary(date)
        .then(r => setSummary({
          ordersCount: Number(r.data?.ordersCount || 0),
          revenue: Number(r.data?.revenue || 0),
          orders: Array.isArray(r.data?.orders) ? r.data.orders : [],
        }))
        .catch(() => {})
    }, 20000)
    return () => clearInterval(timer)
  }, [date])

  const avgTicket = summary.ordersCount > 0 ? summary.revenue / summary.ordersCount : 0
  const itemsSold = (Array.isArray(summary.orders) ? summary.orders : []).reduce((acc, o) => acc + (o.items?.reduce((a, i) => a + (i.quantity || 0), 0) || 0), 0)

  const metrics = useMemo(() => ({
    ordersCount: summary.ordersCount,
    revenue: summary.revenue,
    itemsSold,
    avgTicket,
  }), [summary, itemsSold, avgTicket])

  const exportPdfFrontend = () => {
    try {
      const doc = new jsPDF()
      const dateObj = new Date(date)
      const dateFr = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
      doc.setFontSize(22)
      doc.setTextColor(234, 88, 12)
      doc.text('CADEAU KARIM', 105, 20, { align: 'center' })
      doc.setFontSize(11)
      doc.setTextColor(120)
      doc.text(`Rapport Journalier - ${dateFr}`, 105, 29, { align: 'center' })

      doc.setFontSize(11)
      doc.setTextColor(30)
      doc.text(`Nombre de commandes : ${summary.ordersCount}`, 14, 42)
      doc.text(`Chiffre d'affaires : ${summary.revenue.toFixed(2)} DH`, 14, 50)

      let y = 60
      summary.orders.forEach((order, idx) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFontSize(12)
        doc.setTextColor(5, 150, 105)
        doc.text(`Commande N°${idx + 1}  [${order.status || 'Validée'}]`, 14, y)
        y += 6
        doc.setFontSize(9)
        doc.setTextColor(90)
        const d = order.date ? new Date(order.date) : null
        doc.text(`Heure : ${d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}`, 14, y)
        y += 6

        const rows = order.items?.map(it => [
          it.name || '',
          it.quantity || 0,
          `${Number(it.price || 0).toFixed(2)} DH`,
          `${Number(it.subtotal || (it.quantity || 0) * (it.price || 0)).toFixed(2)} DH`,
        ]) || []

        autoTable(doc, {
          startY: y,
          head: [['Produit', 'Qté', 'Prix U.', 'Sous-total']],
          body: rows,
          headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9 },
          styles: { fontSize: 9, cellPadding: 2 },
          margin: { left: 14, right: 14 },
          theme: 'grid',
        })
        y = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || (doc.autoTable && doc.autoTable.previous && doc.autoTable.previous.finalY) || y) + 4
        doc.setFontSize(10)
        doc.setTextColor(0)
        doc.text(`Total : ${Number(order.totalAmount || 0).toFixed(2)} DH`, 195, y, { align: 'right' })
        y += 10
      })

      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text('-- Généré par Cadeau Karim --', 105, 290, { align: 'center' })
      doc.save(`rapport-${date}.pdf`)
    } catch (e) {
      alert("Erreur lors de la génération du PDF : " + e.message)
    }
  }

  const exportPdfBackend = async () => {
    try {
      const res = await orderApi.getDailyPdf(date)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport-${date}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      // Le backend peut etre indisponible : on genere le PDF en local plutot
      // que d'echouer silencieusement ou d'afficher un rapport vide.
      console.warn("PDF backend indisponible, generation locale :", e)
      exportPdfFrontend()
    }
  }

  const totalRevenue = summary.revenue

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white border border-neutral-200 shadow-soft">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
            <Calendar size={18} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label className="text-xs font-black text-neutral-500 uppercase tracking-wider sm:hidden">
              Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-800 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition"
              />
              <button
                onClick={fetchAll}
                className="h-[42px] w-[42px] rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-white hover:border-brand-300 hover:text-brand-600 active:scale-95 transition flex items-center justify-center"
                title="Actualiser"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={exportPdfBackend}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-white bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <Download size={18} strokeWidth={2.3} />
          Exporter le rapport PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {KPIS.map((k, i) => {
          const raw = metrics[k.key]
          const value = loading ? '…' : (k.format ? k.format(raw) : raw)
          return (
            <div
              key={k.key}
              className="relative group rounded-[26px] bg-white border border-neutral-100 shadow-card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-slide-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${k.hue} pointer-events-none`} style={{ opacity: 0.03 }} />
              <div className="relative p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className={`h-11 w-11 rounded-2xl ${k.soft} flex items-center justify-center ring-4 ${k.ring} shadow-sm`}>
                    <k.Icon size={20} strokeWidth={2.2} />
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <ArrowUpRight size={11} /> Journée
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 tabular-nums">
                    {value}
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-500 mt-1 font-semibold">{k.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="relative overflow-hidden rounded-[26px] bg-white border border-neutral-100 shadow-card p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-brand-300/30 to-orange-200/30 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/30">
              <Package size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-xs font-black text-neutral-500 uppercase tracking-wider">Catalogue</div>
              <div className="text-3xl font-black tracking-tight text-neutral-900 tabular-nums">{stats.products}</div>
              <div className="text-sm font-medium text-neutral-500">Produits référencés</div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[26px] bg-white border border-neutral-100 shadow-card p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-sky-300/30 to-indigo-200/30 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-sky-500/30">
              <Tag size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-xs font-black text-neutral-500 uppercase tracking-wider">Rayons</div>
              <div className="text-3xl font-black tracking-tight text-neutral-900 tabular-nums">{stats.categories}</div>
              <div className="text-sm font-medium text-neutral-500">Catégories actives</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] bg-white border border-neutral-100 shadow-card">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-black text-neutral-900 flex items-center gap-2 text-lg">
            <span className="relative inline-flex items-center justify-center h-9 w-9 rounded-xl bg-brand-50 text-brand-600">
              <ClipboardList size={18} strokeWidth={2.3} />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent-500 ring-2 ring-white animate-pulse" />
            </span>
            Commandes du jour
            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
              {summary.orders.length}
            </span>
          </h3>
          {totalRevenue > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200">
              <TrendingUp size={16} className="text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Total du jour</span>
              <span className="font-black text-emerald-800 tabular-nums">{totalRevenue.toFixed(2)} DH</span>
            </div>
          )}
        </div>

        {summary.orders.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="relative mx-auto inline-flex mb-4">
              <div className="absolute inset-0 rounded-full bg-neutral-100 blur-2xl scale-125" />
              <div className="relative inline-flex p-5 bg-white rounded-[28px] shadow-card border border-neutral-100">
                <ClipboardList size={42} className="text-neutral-300" strokeWidth={1.6} />
              </div>
            </div>
            <h3 className="text-lg font-black text-neutral-900">Aucune commande pour cette journée</h3>
            <p className="text-neutral-500 mt-1.5 max-w-md mx-auto text-sm font-medium">
              Changez la date plus haut pour consulter l'historique, ou patientez les premières commandes.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-50 to-orange-50 border border-brand-100 text-brand-700 font-bold text-xs">
              <Sparkles size={13} /> Rapport PDF disponible dès la 1ère commande
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-neutral-50 to-orange-50/40 text-neutral-700">
                  <th className="text-left px-5 py-3 font-black text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 font-black text-xs uppercase tracking-wider">Heure</th>
                  <th className="text-left px-5 py-3 font-black text-xs uppercase tracking-wider">Articles</th>
                  <th className="text-left px-5 py-3 font-black text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-right px-5 py-3 font-black text-xs uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {summary.orders.map((o, i) => {
                  const status = o.status || 'Validée'
                  const statusStyle =
                    status === 'Livrée' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : status === 'Annulée' ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                  return (
                    <tr key={o.id || i} className="hover:bg-gradient-to-r from-brand-50/30 via-white to-white transition-colors">
                      <td className="px-5 py-3.5 font-black text-neutral-400 tabular-nums">{String(i + 1).padStart(3, '0')}</td>
                      <td className="px-5 py-3.5 text-neutral-700 font-semibold">
                        {o.date
                          ? new Date(o.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-700">
                        {o.items?.slice(0, 2).map(it => (
                          <div key={it.productId} className="text-xs font-semibold">
                            <span className="text-brand-600 font-black mr-1">{it.quantity}x</span>{it.name}
                          </div>
                        ))}
                        {(o.items?.length || 0) > 2 && (
                          <div className="text-[11px] text-neutral-400 mt-0.5 font-bold">
                            +{(o.items.length - 2)} article(s) supplémentaire(s)
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border ${statusStyle}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            status === 'Livrée' ? 'bg-emerald-500'
                              : status === 'Annulée' ? 'bg-rose-500'
                                : 'bg-sky-500 animate-pulse'
                          }`} />
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-baseline gap-0.5 tabular-nums">
                          <span className="text-xl font-black tracking-tight text-neutral-900">
                            {Number(o.totalAmount || 0).toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-neutral-500 ml-0.5">DH</span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
