import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LocaleProvider } from './context/LocaleContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocaleProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </LocaleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
