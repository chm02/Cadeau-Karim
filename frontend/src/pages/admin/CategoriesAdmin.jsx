import { useEffect, useState } from 'react'
import { categoryApi } from '../../services/api.js'
import { Tag, Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react'

const emptyForm = { name: '', icon: '📦' }

const ICONS = ['🛒','🥛','🥤','🧼','🧴','🥖','🥬','🥩','🍫','🍞','🧃','🍯','🧀','🍎','🌿','🍗','🐟','🧂','☕','🍵','🧺','📦']

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const refresh = () => {
    setLoading(true)
    categoryApi.getAll()
      .then(r => setCategories(r.data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }
  useEffect(refresh, [])

  const openAdd = () => { setForm(emptyForm); setErrors({}); setModal({ open: true, editing: null }) }
  const openEdit = (c) => {
    setForm({ name: c.name, icon: c.icon || '📦' })
    setErrors({}); setModal({ open: true, editing: c })
  }
  const close = () => setModal(m => ({ ...m, open: false }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (categories.some(c => c.name.toLowerCase() === form.name.trim().toLowerCase() && c.id !== modal.editing?.id)) {
      e.name = 'Cette catégorie existe déjà'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      icon: form.icon || '📦',
    }
    try {
      if (modal.editing) await categoryApi.update(modal.editing.id, payload)
      else await categoryApi.create(payload)
      close(); refresh()
    } catch { alert("Erreur lors de l'enregistrement") }
  }

  const del = async (c) => {
    if (!confirm(`Supprimer la catégorie "${c.name}" ?`)) return
    try { await categoryApi.delete(c.id); refresh() } catch { alert('Erreur suppression') }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Tag size={22} className="text-brand-600" /> Catégories ({categories.length})
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm active:scale-95 transition"
        >
          <Plus size={18} /> Ajouter une catégorie
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-full p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Tag size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune catégorie</p>
          </div>
        ) : categories.map(c => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 group hover:border-brand-200 transition">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100 flex items-center justify-center text-3xl flex-shrink-0">
              {c.icon || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 truncate">{c.name}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Sparkles size={11} /> {c.icon || 'Aucune icône'}
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => openEdit(c)}
                className="p-2 rounded-lg hover:bg-brand-50 text-brand-600"
                title="Modifier"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => del(c)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 animate-fade-in" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">
                  {modal.editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </h3>
                <button type="button" onClick={close} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.name ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="Ex: Épicerie"
                  />
                  {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Icône (emoji)</label>
                  <div className="grid grid-cols-8 gap-1.5 mb-2">
                    {ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, icon: ic }))}
                        className={`h-10 rounded-lg text-xl flex items-center justify-center transition border-2 ${
                          form.icon === ic ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ou collez un emoji personnalisé"
                  />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition shadow-sm"
                >
                  {modal.editing ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
