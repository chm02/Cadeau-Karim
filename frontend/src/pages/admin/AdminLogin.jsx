import { useState } from 'react'
import { Store, Lock, AlertCircle, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'
import { configApi } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNavigate, Link } from 'react-router-dom'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await configApi.adminLogin(password)
      if (res.data.success) {
        login(res.data.token)
        navigate('/admin/dashboard')
      } else {
        setError(res.data.message || 'Mot de passe incorrect')
      }
    } catch {
      setError('Erreur de connexion. Vérifiez le backend ou essayez le mot de passe par défaut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-emerald-50" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[56rem] rounded-full bg-gradient-to-br from-brand-300/40 via-orange-200/20 to-accent-300/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-accent-300/40 to-emerald-200/30 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/30 blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-in-up">
        <div className="text-center mb-7">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 text-sm font-semibold mb-7 transition"
          >
            <ArrowLeft size={16} /> Retour au site
          </Link>

          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 rounded-[28px] bg-brand-gradient opacity-10 blur-2xl scale-125" />
            <div className="relative h-20 w-20 rounded-[28px] bg-brand-gradient text-white shadow-2xl shadow-brand-500/30 flex items-center justify-center ring-4 ring-white">
              <Store size={38} strokeWidth={2.1} />
              <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-xl bg-white shadow-lg flex items-center justify-center">
                <ShieldCheck size={16} className="text-accent-600" strokeWidth={2.4} />
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">
            Karim <span className="bg-gradient-to-r from-brand-500 to-orange-600 bg-clip-text text-transparent">Market</span>
          </h1>
          <p className="text-neutral-500 mt-1.5 text-sm font-medium">Espace Administration Sécurisé</p>
        </div>

        <div className="relative overflow-hidden rounded-[28px] shadow-[0_30px_80px_-20px_rgba(249,115,22,0.25)] border border-white/80">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl" />

          <form onSubmit={handleSubmit} className="relative p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-6 p-3 rounded-2xl bg-gradient-to-r from-brand-50 to-orange-50 border border-brand-100">
              <div className="h-9 w-9 rounded-xl bg-white border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
                <Sparkles size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-neutral-900 leading-tight">Connexion</h2>
                <p className="text-xs text-neutral-500 font-medium">Entrez votre mot de passe administrateur</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-start gap-2.5 animate-fade-in">
                <AlertCircle size={17} className="flex-shrink-0 mt-0.5" strokeWidth={2.1} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <label className="block text-xs font-black text-neutral-500 uppercase tracking-wider mb-2 ml-1">
              Mot de passe
            </label>
            <div className="relative mb-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock size={17} className="text-neutral-400" strokeWidth={2.2} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisissez votre mot de passe"
                className="input pl-12 text-base"
                autoFocus
              />
            </div>

            <div className="mb-6" />

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 rounded-2xl font-black text-base text-white bg-brand-gradient shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
