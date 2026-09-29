import { Outlet } from 'react-router-dom'
import Header from '../components/client/Header.jsx'
import DrawerMenu from '../components/client/DrawerMenu.jsx'
import MobileCartBar from '../components/client/MobileCartBar.jsx'
import CartDrawer from '../components/client/CartDrawer.jsx'
import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'

export default function ClientLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { cartOpen, closeCart } = useCart()

  return (
    <div className="shop-shell relative min-h-screen">
      <div className="relative">
        <Header onMenuClick={() => setDrawerOpen(true)} />
        <main className="relative mx-auto max-w-[1440px] px-3 py-4 sm:px-7 sm:py-6 lg:px-10">
          <Outlet />
        </main>
        <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <CartDrawer isOpen={cartOpen} onClose={closeCart} />
        <MobileCartBar />
      </div>
    </div>
  )
}
