import { useEffect, useState } from 'react'
import { orderApi } from '../../services/api.js'
import { ClipboardList, CheckCircle, XCircle, Trash2, Download, Eye, X, Calendar } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [reportDate, setReportDate] = useState(todayStr())

  const downloadReport = async () => {
    try {
      const response = await orderApi.getDailyPdf(reportDate)
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-${reportDate}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      const reportOrders = orders.filter((order) => String(order.date || '').slice(0, 10) === reportDate)
      const document = new jsPDF()
      const dateLabel = new Date(`${reportDate}T00:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      document.setFontSize(20)
      document.text('CADEAU KARIM', 105, 20, { align: 'center' })
      document.setFontSize(11)
      document.text(`Rapport des commandes - ${dateLabel}`, 105, 29, { align: 'center' })
      document.text(`Nombre de commandes : ${reportOrders.length}`, 14, 42)
      document.text(
        `Chiffre d'affaires : ${reportOrders.reduce((total, order) => total + Number(order.totalAmount || 0), 0).toFixed(2)} DH`,
        14,
        50,
      )
      autoTable(document, {
        startY: 60,
        head: [['Date', 'Articles', 'Statut', 'Total']],
        body: reportOrders.map((order) => [
          new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          order.items?.map((item) => `${item.quantity}x ${item.name}`).join(', ') || '-',
          order.status || 'Validée',
          `${Number(order.totalAmount || 0).toFixed(2)} DH`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 9 },
      })
      document.save(`rapport-${reportDate}.pdf`)
    }
  }

  const refresh = () => {
    setLoading(true)
    orderApi.getAll()
      .then(r => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }
  useEffect(refresh, [])

  // Rafraichissement automatique : les nouvelles commandes WhatsApp doivent
  // apparaitre ici sans rechargement manuel de la page.
  useEffect(() => {
    const timer = setInterval(() => {
      orderApi.getAll().then(r => setOrders(r.data)).catch(() => {})
    }, 20000)
    return () => clearInterval(timer)
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await orderApi.updateStatus(id, status)
      refresh()
    } catch { alert('Erreur') }
  }

  const del = async (o) => {
    if (!confirm(`Supprimer la commande du ${new Date(o.date).toLocaleString('fr-FR')} ?`)) return
    try { await orderApi.delete(o.id); if (selected?.id === o.id) setSelected(null); refresh() } catch { alert('Erreur') }
  }

  const statusClass = (s) => {
    switch (s) {
      case 'Livrée': return 'bg-green-100 text-green-700 border-green-200'
      case 'Annulée': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList size={22} className="text-brand-600" /> Toutes les commandes ({orders.length})
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="sr-only" htmlFor="orders-report-date">Date du rapport</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
            <Calendar size={16} className="text-gray-400" />
            <input
              id="orders-report-date"
              type="date"
              value={reportDate}
              max={todayStr()}
              onChange={(event) => setReportDate(event.target.value)}
              className="text-sm font-semibold text-gray-700 outline-none"
            />
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition"
          >
            <Download size={16} /> PDF daté
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune commande enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Articles</th>
                  <th className="text-left px-4 py-3 font-semibold">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o, idx) => (
                  <tr key={o.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      <div className="font-semibold text-sm">
                        {new Date(o.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(o.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="text-xs font-semibold text-gray-500 mb-0.5">{o.items?.length || 0} produit(s)</div>
                      <div className="text-xs text-gray-600 truncate max-w-xs">
                        {o.items?.map(i => `${i.quantity}x ${i.name}`).join(' • ') || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status || 'Validée'}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer outline-none ${statusClass(o.status || 'Validée')}`}
                      >
                        <option value="Validée">Validée</option>
                        <option value="Livrée">Livrée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {(o.totalAmount || 0).toFixed(2)} DH
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(o)}
                          className="p-2 rounded-lg hover:bg-brand-50 text-brand-600 transition"
                          title="Détails"
                        >
                          <Eye size={16} />
                        </button>
                        {(o.status || 'Validée') !== 'Livrée' && (
                          <button
                            onClick={() => updateStatus(o.id, 'Livrée')}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition"
                            title="Marquer livrée"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {(o.status || 'Validée') !== 'Annulée' && (
                          <button
                            onClick={() => updateStatus(o.id, 'Annulée')}
                            className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                            title="Annuler"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => del(o)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 animate-fade-in" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900">Détails de la commande</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-medium">Date & heure</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(selected.date).toLocaleString('fr-FR')}
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusClass(selected.status || 'Validée')}`}>
                  {selected.status || 'Validée'}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">Produits</div>
                <div className="space-y-2">
                  {selected.items?.map((it, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{it.name}</div>
                        <div className="text-xs text-gray-500">
                          {it.quantity} × {(it.price || 0).toFixed(2)} DH
                        </div>
                      </div>
                      <div className="font-bold text-gray-900 ml-2">
                        {((it.subtotal != null) ? it.subtotal : it.quantity * it.price).toFixed(2)} DH
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-end justify-between">
                <span className="text-sm text-gray-600 font-semibold">Total TTC</span>
                <div>
                  <span className="text-2xl font-bold text-brand-700">{(selected.totalAmount || 0).toFixed(2)}</span>
                  <span className="font-semibold text-brand-700 ml-1">DH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
