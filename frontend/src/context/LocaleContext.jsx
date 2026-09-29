import { createContext, useContext, useEffect, useState } from 'react'

const LocaleContext = createContext(null)

const translations = {
  fr: {
    categoryNames: ['Produits Laitiers & Œufs', 'Biscuits, Gâteaux & Snacks', 'Épicerie & Féculents', 'Entretien & Hygiène de la Maison', 'Boissons & Eaux', 'Accessoires Multimédia & Électronique'],
    language: 'FR',
    switchLanguage: 'العربية',
    brandTagline: 'Le marché pratique, livré chez vous',
    searchPlaceholder: 'Rechercher un produit...',
    allCategories: 'Tout le catalogue',
    cart: 'Panier',
    admin: 'Administration',
    freeDeliveryFrom: 'Livraison offerte dès',
    deliveryFree: 'Livraison gratuite',
    deliveryPaid: 'Livraison : 10 DH',
    deliveryFee: 'Frais de livraison',
    totalProducts: 'Sous-total produits',
    missingForFree: 'encore pour la livraison gratuite',
    orderWhatsapp: 'Commander sur WhatsApp',
    emptyCart: 'Votre panier est vide',
    continueShopping: 'Continuer mes achats',
    temporaryPrice: 'Prix test',
    products: 'produits',
    product: 'produit',
    all: 'Tous',
  },
  ar: {
    categoryNames: ['منتجات الحليب والبيض', 'بسكويت وحلويات ومقبلات', 'مواد غذائية أساسية', 'منظفات ونظافة المنزل', 'مشروبات ومياه', 'إكسسوارات وإلكترونيات'],
    language: 'AR',
    switchLanguage: 'Français',
    brandTagline: 'سوقك القريب، يوصل حتى لباب دارك',
    searchPlaceholder: 'ابحث عن منتج...',
    allCategories: 'جميع المنتجات',
    cart: 'السلة',
    admin: 'الإدارة',
    freeDeliveryFrom: 'التوصيل المجاني ابتداءً من',
    deliveryFree: 'التوصيل مجاني',
    deliveryPaid: 'التوصيل: 10 دراهم',
    deliveryFee: 'مصاريف التوصيل',
    totalProducts: 'مجموع المنتجات',
    missingForFree: 'للتوصيل المجاني',
    orderWhatsapp: 'اطلب عبر واتساب',
    emptyCart: 'السلة فارغة',
    continueShopping: 'واصل التسوق',
    temporaryPrice: 'ثمن تجريبي',
    products: 'منتجات',
    product: 'منتج',
    all: 'الكل',
  },
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('cadeau-karim-locale') || 'fr')

  useEffect(() => {
    localStorage.setItem('cadeau-karim-locale', locale)
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const value = {
    locale,
    isArabic: locale === 'ar',
    t: (key) => translations[locale][key] || translations.fr[key] || key,
    toggleLocale: () => setLocale(current => current === 'fr' ? 'ar' : 'fr'),
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}
