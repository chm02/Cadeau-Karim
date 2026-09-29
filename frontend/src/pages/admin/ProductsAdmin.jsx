import { useEffect, useState, useRef } from 'react'
import { productApi, categoryApi, getProductImageUrl } from '../../services/api.js'
import { Package, Plus, Pencil, Trash2, X, Search, Upload, ImageIcon, Loader2 } from 'lucide-react'

const emptyForm = { name: '', price: '', categoryId: '', imageUrl: '' }

export default function ProductsAdmin() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const refresh = () => {
    setLoading(true)
    Promise.all([
      productApi.getAll().then(r => setProducts(r.data)).catch(() => setProducts([])),
      categoryApi.getAll().then(r => setCategories(r.data)).catch(() => setCategories([])),
    ]).finally(() => setLoading(false))
  }
  useEffect(refresh, [])

  const openAdd = () => {
    setForm(emptyForm); setErrors({}); setFile(null); setPreview(null); setUploadError('')
    setModal({ open: true, editing: null })
  }
  const openEdit = (p) => {
    setForm({ name: p.name, price: String(p.price), categoryId: p.categoryId, imageUrl: p.imageUrl || '' })
    setErrors({}); setFile(null); setPreview(null); setUploadError('')
    setModal({ open: true, editing: p })
  }
  const close = () => setModal(m => ({ ...m, open: false }))

  // L'admin choisit une vraie image sur son PC ou son telephone : on lit le
  // fichier en memoire pour l'afficher avant l'envoi au serveur.
  const onFilePicked = (e) => {
    const picked = e.target.files?.[0]
    if (!picked) return
    if (!picked.type.startsWith('image/')) {
      setUploadError('Veuillez choisir un fichier image (JPEG, PNG, GIF ou WebP).')
      e.target.value = ''
      return
    }
    if (picked.size > 12 * 1024 * 1024) {
      setUploadError("L'image doit peser au maximum 12 Mo.")
      e.target.value = ''
      return
    }
    setUploadError('')
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const clearImage = () => {
    setFile(null)
    setPreview(null)
    setForm(f => ({ ...f, imageUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.price || isNaN(+form.price) || +form.price <= 0) e.price = 'Prix valide requis'
    if (!form.categoryId) e.categoryId = 'Catégorie requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setUploading(true)
    try {
      let imageUrl = form.imageUrl.trim() || null
      if (file) {
        const res = await productApi.uploadImage(file)
        imageUrl = res.data?.imageUrl || null
        if (!imageUrl) throw new Error("Le serveur n'a pas renvoyé d'URL d'image.")
      }
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        categoryId: form.categoryId,
        imageUrl,
      }
      if (modal.editing) await productApi.update(modal.editing.id, payload)
      else await productApi.create(payload)
      close(); refresh()
    } catch (err) {
      const msg = err?.response?.data?.message
        || err?.message
        || "Erreur lors de l'enregistrement"
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  const del = async (p) => {
    if (!confirm(`Supprimer "${p.name}" ?`)) return
    try { await productApi.delete(p.id); refresh() } catch { alert('Erreur suppression') }
  }

  // Supprime l'image uploadee du serveur (droits admin complets sur les images)
  const delImage = async (p) => {
    if (!p.imageUrl) return
    if (!confirm(`Supprimer l'image de "${p.name}" ?`)) return
    const filename = p.imageUrl.split('/').pop()
    try {
      await productApi.deleteImage(filename)
      await productApi.update(p.id, { ...p, imageUrl: null })
      refresh()
    } catch {
      alert("Erreur suppression de l'image")
    }
  }

  const displayedImage = preview || getProductImageUrl(
    file ? '' : form.imageUrl,
    form.categoryId,
    form.name
  )

  const catName = (id) => categories.find(c => c.id === id)?.name || '-'
  const catIcon = (id) => categories.find(c => c.id === id)?.icon || '📦'

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || p.categoryId === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package size={22} className="text-brand-600" /> Produits ({products.length})
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-sm active:scale-95 transition"
        >
          <Plus size={18} /> Ajouter un produit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="sm:col-span-2 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Package size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun produit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Produit</th>
                  <th className="text-left px-4 py-3 font-semibold">Catégorie</th>
                  <th className="text-right px-4 py-3 font-semibold">Prix</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                          <img
                            src={getProductImageUrl(p.imageUrl, p.categoryId, p.name)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = getProductImageUrl(null, p.categoryId, p.name) }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate max-w-xs">{p.name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{p.imageUrl ? 'image personnalisée' : 'image: défaut'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {catIcon(p.categoryId)} {catName(p.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-700">
                      {p.price.toFixed(2)} DH
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.imageUrl && (
                          <button
                            onClick={() => delImage(p)}
                            className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                            title="Supprimer l'image"
                          >
                            <ImageIcon size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg hover:bg-brand-50 text-brand-600 transition"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => del(p)}
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

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 animate-fade-in" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">
                  {modal.editing ? 'Modifier le produit' : 'Nouveau produit'}
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
                    placeholder="Ex: Lait Jaouda 1L"
                  />
                  {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prix (DH) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.price ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="Ex: 19.00"
                  />
                  {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catégorie *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white ${
                      errors.categoryId ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">-- Choisir --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  {errors.categoryId && <div className="text-xs text-red-500 mt-1">{errors.categoryId}</div>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image du produit</label>
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0">
                      {preview || file || form.imageUrl ? (
                        <img
                          src={displayedImage}
                          alt="Aperçu"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageIcon size={26} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFilePicked}
                        className="block w-full text-xs text-gray-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold file:cursor-pointer hover:file:bg-brand-100"
                      />
                      <div className="text-xs text-gray-400 mt-1.5">
                        Choisissez une photo depuis votre téléphone ou votre PC (JPEG, PNG, GIF, WebP — 12 Mo max).
                      </div>
                      {(file || form.imageUrl) && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="mt-2 text-xs font-semibold text-red-500 hover:underline"
                        >
                          Retirer l'image
                        </button>
                      )}
                    </div>
                  </div>
                  {uploadError && <div className="text-xs text-red-500 mt-1.5">{uploadError}</div>}
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
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> {file ? 'Envoi de l\'image...' : 'Enregistrement...'}
                    </>
                  ) : (
                    <>{modal.editing ? 'Enregistrer' : 'Ajouter'} <Upload size={15} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
