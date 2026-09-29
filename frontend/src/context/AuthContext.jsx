import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'karim-market-admin-auth'
const TOKEN_KEY = 'karim-market-admin-token'

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(localStorage.getItem(TOKEN_KEY)) && localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isAuthenticated))
  }, [isAuthenticated])

  const login = (token) => {
    localStorage.setItem(TOKEN_KEY, token)
    setIsAuthenticated(true)
  }
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function getAdminToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
