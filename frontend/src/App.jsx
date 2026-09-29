import { Routes, Route, Navigate } from 'react-router-dom'
import ClientLayout from './layouts/ClientLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import HomePage from './pages/client/HomePage.jsx'
import CartPage from './pages/client/CartPage.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ProductsAdmin from './pages/admin/ProductsAdmin.jsx'
import CategoriesAdmin from './pages/admin/CategoriesAdmin.jsx'
import OrdersAdmin from './pages/admin/OrdersAdmin.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductsAdmin />} />
        <Route path="categories" element={<CategoriesAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
