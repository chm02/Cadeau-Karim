import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { MINIMUM_ORDER_AMOUNT } from '../services/api.js'

const CartContext = createContext(null)
const STORAGE_KEY = 'karim-market-cart'
export const FREE_DELIVERY_THRESHOLD = MINIMUM_ORDER_AMOUNT
export const DELIVERY_FEE = 10

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const openCart = () => setCartOpen(true)
  const closeCart = () => setCartOpen(false)
  const toggleCart = () => setCartOpen(v => !v)

  const addToCart = (product) => {
    setItems(prev => {
      const existing = prev.find(it => it.id === product.id)
      if (existing) {
        return prev.map(it =>
          it.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setItems(prev => prev.filter(it => it.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems(prev =>
      prev.map(it => it.id === productId ? { ...it, quantity } : it)
    )
  }

  const incrementQuantity = (productId) => {
    setItems(prev =>
      prev.map(it => it.id === productId ? { ...it, quantity: it.quantity + 1 } : it)
    )
  }

  const decrementQuantity = (productId) => {
    setItems(prev => {
      const item = prev.find(it => it.id === productId)
      if (!item) return prev
      if (item.quantity <= 1) return prev.filter(it => it.id !== productId)
      return prev.map(it => it.id === productId ? { ...it, quantity: it.quantity - 1 } : it)
    })
  }

  const clearCart = () => setItems([])

  const { totalItems, subtotal, deliveryFee, totalAmount, amountMissingForFreeDelivery, isFreeDeliveryEligible } = useMemo(() => {
    const totalItems = items.reduce((sum, it) => sum + it.quantity, 0)
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0)
    const isFreeDeliveryEligible = subtotal >= FREE_DELIVERY_THRESHOLD
    const deliveryFee = isFreeDeliveryEligible || subtotal === 0 ? 0 : DELIVERY_FEE
    const totalAmount = subtotal + deliveryFee
    const amountMissingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)
    return { totalItems, subtotal, deliveryFee, totalAmount, amountMissingForFreeDelivery, isFreeDeliveryEligible }
  }, [items])

  const value = {
    items,
    totalItems,
    subtotal,
    deliveryFee,
    totalAmount,
    FREE_DELIVERY_THRESHOLD,
    DELIVERY_FEE,
    amountMissingForFreeDelivery,
    isFreeDeliveryEligible,
    cartOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
