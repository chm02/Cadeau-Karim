import axios from 'axios'
import { getAdminToken } from '../context/AuthContext.jsx'

export const MINIMUM_ORDER_AMOUNT = 50
export const DEFAULT_PRODUCT_IMAGE = '/api/images/product-default'
const api = axios.create({ baseURL: '/api', timeout: 8000 })

const addedBeverages = [
  'Eau Minérale Naturelle Sidi Ali 33cl', 'Eau Minérale Naturelle Sidi Ali 50cl', 'Eau Minérale Naturelle Sidi Ali 1.5L', 'Eau Minérale Naturelle Sidi Ali 2L',
  'Eau Minérale Naturelle Sidi Harazem 1.5L', 'Eau Minérale Naturelle Sidi Harazem 5L', 'Eau Minérale Naturelle Aïn Saïss 33cl', 'Eau Minérale Naturelle Aïn Saïss 50cl',
  'Eau Minérale Naturelle Aïn Saïss 1.5L', 'Eau Minérale Naturelle Aïn Saïss 5L', 'Eau Minérale Naturelle Aïn Ifrane 33cl', 'Eau Minérale Naturelle Aïn Ifrane 50cl',
  'Eau Minérale Naturelle Aïn Ifrane 1.5L', 'Eau Minérale Naturelle Aïn Soltane 33cl', 'Eau Minérale Naturelle Aïn Soltane 50cl', 'Eau Minérale Naturelle Aïn Soltane 1.5L',
  'Eau Minérale Naturelle Aïn Atlas 5L', 'Eau Minérale Gazeuse Oulmès 50cl', 'Eau Minérale Gazeuse Oulmès 1L', 'Fanta Orange 25cl', 'Fanta Orange 1L', 'Fanta Orange 1.5L',
  'Fanta Lemon 25cl', 'Fanta Lemon 1L', 'Fanta Pomme 25cl', 'Fanta Pomme 1L', 'Fanta Grenade 25cl', 'Fanta Grenade 1L', 'Hawaï Ananas 25cl', 'Hawaï Ananas 33cl',
  'Hawaï Ananas 50cl', 'Hawaï Ananas 1L', 'Hawaï Ananas 1.5L', 'Hawaï Tropical 25cl', 'Hawaï Tropical 33cl', 'Hawaï Tropical 50cl', 'Hawaï Tropical 1L', 'Hawaï Tropical 1.5L',
  'Hawaï Fruit de la Passion 50cl', 'Hawaï Fruit de la Passion 1L', 'Ice Ananas 33cl', 'Ice Cola Strong 33cl', 'Ice Cola Strong 1.5L', 'Ice Limonade 33cl', 'Ice Orange 33cl',
  'Ice Passion 33cl', 'Ice Passion 1.5L', 'Ice Pomme 33cl', 'Ice Pulpa Citron 33cl', 'Ice Pulpa Orange 33cl', 'Lipton Ice Tea Pêche 33cl', 'Lipton Ice Tea Fruits Rouges 33cl',
  'Jus Bi Frutas Granada 33cl', 'Jus Bi Frutas Mediterraneo 1L', 'Jus Bi Frutas Tropical 33cl', 'Jus Cocktail Multifruits Marrakech 1L', 'Jus Frut Orange Max Marrakech 2L', 'Jus de Mango Juver 1L',
  'Jus de Pêche Juver 25cl', 'Jus Disfruta Naranja Juver 20cl', 'Juver Selección Pineapple 20cl', 'Kidy Ananas', 'Kidy Cocktail', 'Kidy Mangue', 'Kidy Orange', 'Kidy Pomme',
  'Jibi Choco Boom 20cl', 'Mon Jus Orange 25cl', '7UP 1L', 'Limonade Cigogne 25cl', 'Limonade Cigogne 33cl', 'Mirinda Orange 25cl', 'Mirinda Plus Ananas 1L',
  'Mirinda Pomme 25cl', 'Mirinda Pomme 50cl', 'Mirinda Pomme 1L', 'Mirinda Pomme 1.5L', 'Mirinda Tropical 25cl', 'Mirinda Tropical 33cl', 'Mirinda Tropical 50cl',
  'Monster Energy 50cl', 'Rockstar Original 50cl', 'Rockstar Guayaba 50cl', 'Rockstar Kiwi 50cl', 'Rockstar Cañamo 50cl', 'Sting Berry 25cl', 'Sting Gold 25cl',
  'Linx Watermelon 25cl', 'Enjoy Citron 50cl', 'Enjoy Fraise 50cl', 'Enjoy Orange 50cl', 'Enjoy Orange 1.5L', 'Enjoy Tropical 50cl', 'Enjoy Tropical 1.5L',
  'Evervess Tonic 1L', 'Orangina 25cl', 'Orangina 50cl', 'Orangina 1L', 'Orangina Zero 1L', 'Coca-Cola 25cl', 'Coca-Cola 33cl', 'Coca-Cola 50cl', 'Coca-Cola 1L',
  'Coca-Cola 1.5L', 'Coca-Cola Zero 33cl', 'Coca-Cola Zero 50cl', 'Pepsi 33cl', 'Pepsi 50cl', 'Pepsi 1.5L', 'Sprite 33cl', 'Sprite 50cl', 'Sprite 1.5L',
  'Schweppes Tonic 25cl', 'Schweppes Tonic 1L', 'Red Bull Energy Drink 25cl', 'Red Bull Energy Drink 33cl',
]
const uncataloguedBeverages = [
  'Abtal Fraise 20cl', 'Abtal Mangue 20cl', 'Abtal Orange 20cl', 'Abtal Cocktail 20cl', 'Abtal Ananas 20cl',
  'Jaco Pulpa Orange 33cl', 'Fanta Lemon 33cl', 'Sting Blue 25cl', 'Schweppes Citron 25cl',
  'Juver Disfruta Multifruits 20cl', 'Jus Disfruta Peche Juver 1L', 'Eau Minerale Naturelle Ain Atlas 1.5L',
  'Boisson Mandarina Simon Life 1.5L', 'Juver Disfruta Multifruits 1L', 'Juver Disfruta Tropical 20cl',
  'Jus Cocktail Jaouda 25cl', 'Raibi Chergui Orange', 'Raibi Chergui Fraise',
]
const addedHomeHygiene = [
  'Mr Propre Liquide Nettoyant Multi-Surfaces', 'Mr Propre Nettoyant Sol', 'Mr Propre Désinfectant', 'ace Eau de Javel',
  'Ace Javel Parfumée', 'Ace Gel Javel', 'Ariel Lessive', 'OMO Lessive', 'Tide Lessive', 'Pantene Shampoing',
  'Head & Shoulders Shampoing', 'Clear Shampoing', 'Elseve Shampoing', 'Dove Shampoing', 'Garnier Ultra Doux Shampoing',
  'Garnier Fructis Shampoing', 'Sunsilk Shampoing', 'Cadum Shampoing', "Johnson's Shampoing", 'Dove Savon',
  'Le Petit Marseillais Savon', 'Lux Savon', 'Colgate Dentifrice', 'Signal Dentifrice', 'Aquafresh Dentifrice',
  'Brosse à dents Colgate', 'Brosse à dents Signal', 'Bain de bouche', 'Déodorant Dove', 'Déodorant Nivea',
  'Déodorant Rexona', 'Déodorant Fa', 'Déodorant Axe', 'Déodorant homme', 'Déodorant femme', 'Crème hydratante',
  'Lait corporel', 'Vaseline', 'Lingettes humides', 'Coton-tiges', 'Disques démaquillants',
]
const addedSnacks = [
  'Bimo Golden', 'Bimo Pépito', 'Bimo Okey', 'Bimo Sablé', 'Bimo Tango', 'Henry’s Sablé', 'Henry’s Petit Henry’s',
  'Henry’s Princesse', 'Henry’s Cigare', 'Excelo Momo', 'Excelo Bono', 'Excelo Dolcy', 'Excelo Biscotti', 'Oreo Original',
  'Oreo Chocolat', 'Excelo King Cookies', 'Cookies Chocolat', 'Cookies Double Chocolat', 'Cookies Pépites de Chocolat',
  'Cookies Vanille', 'Cookies Noisette', 'Cookies Fourrés Chocolat', 'Bimo Tonik', 'Excelo Genova', 'Excelo Capri',
  'Excelo Eyo’o', 'Excelo Extrem', 'Gaufrette Chocolat', 'Gaufrette Vanille', 'Doritos Nacho Cheese', 'Doritos Sweet Chili',
  'Cheetos Fromage', 'Cheetos Piment', 'Rizzi Nature', 'Rizzi Paprika', 'Rizzi Fromage', 'Rizzi BBQ', 'Rizzi Piment',
  'Crunchips Nature', 'Crunchips Paprika', 'Crunchips Fromage', 'Crunchips BBQ', 'Crunchips Hot & Spicy', 'Lay’s Nature',
  'Lay’s Fromage', 'Lay’s Paprika', 'Lay’s Barbecue', 'Lay’s Poulet', 'Lay’s Piment', 'Lay’s Ketchup', 'Lay’s Salt & Vinegar',
  '🥔 Pringles', 'Pringles Original', 'Pringles Paprika', 'Pringles Sour Cream & Onion', 'Pringles Hot & Spicy', 'Pringles Cheese',
  'Pringles BBQ', 'Pringles Pizza',
]

const categorySeed = [
  ['Produits Laitiers & Œufs', '🥛', ['Lait UHT Demi-Écrémé Centrale Laitier 1L', 'Lait UHT Jaouda 1L', 'Yaourt Vanille Danone', 'Yaourt Frais Activia', 'Fromage en Portions La Vache qui Rit (8 portions)', 'Fromage Sandwich Cheddar Les Enfants', 'Beurre de Table Centrale (Plaquette 250g)', 'Crème Fraîche Président 200ml', 'Lait Fermenté (Lben) Jaouda 1L', 'Petit Suisse Danone (Pack de 6)', 'Yaourt à Boire Raibi Jamila', 'Flan Vanille Sindibad', 'Œufs Frais (Plateau de 30 pièces)', 'Fromage Râpé Mozzarella Président 200g', 'Lait Chocolaté Joy 20cl', 'Yaourt Fruité Purity', 'Beurre Doux Président 200g', 'Fromage Blanc Salé Jben', 'Crème Dessert Danette Chocolat', 'Lait Entier Centrale 1L']],
  ['Biscuits, Gâteaux & Snacks', '🍪', ['Biscuit Fourré Merendina Bimo', 'Gâteau Cake Timeout Bimo', 'Biscuit Pinguin Bimo', 'Gâteau Madeleine Trocadéro', 'Biscuits Sablés Cookies Maryland', 'Gaufrette Tonik Bimo', "Chips Salées Lay's Grand Format", "Chips Go,s Go Go (Go's)", 'Chips Pringles Original 165g', "Chips Crunships Go's", 'Biscuits Roci Bimo', 'Gâteau Swiss Roll Bimo', 'Biscuits Digestive Bolino / Nakat', 'Barre Chocolatée KitKat Nestlé', 'Chocolat Noir Milka 100g', 'Biscuits Golden Ring Bimo', 'Gaufrette Excel Bimo', 'Popcorn Salé prêt à consommer', 'Biscuits Salés Tucs', 'Biscuits Prince Lu', ...addedSnacks]],
  ['Épicerie & Féculents', '🛒', ['Pâtes Spaghettis Rima 500g', 'Pâtes Penne Rima 500g', 'Couscous Fin Dari 1kg', 'Couscous Moyen Dari 1kg', 'Huile de Table Lesieur 2L', 'Huile de Tournesol Cristal 1L', 'Riz Rond Rizi 1kg', 'Riz Basmati Rizi 1kg', 'Concentré de Tomates Aïcha 800g', 'Tomate Pelée en Boîte Aïcha', 'Sel Blanc Fin 1kg', 'Sucre en Morceaux La Ligne Rouge 1kg', 'Farine de Blé Tendre Labelle 1kg', 'Lentilles Nettoyées Rizi 500g', 'Pois Chicots Rizi 500g', 'Haricots Blancs Rizi 500g', 'Mayonnaise Classique Aïcha 225g', 'Ketchup Doux Aïcha 300g', "Thon à l'Huile Vénus / Tom", 'Vinaigrette / Vinaigre Blanc Cristal']],
  ['Entretien & Hygiène de la Maison', '🧼', ['Lessive Liquide Machine OMO 3L', 'Lessive en Poudre Tide 2kg', 'Liquide Vaisselle Express 1L (Citron)', 'Nettoyant Sols Ajax 1L', 'Nettoyant Multi-usages Dettol', 'Gel Douche Palmolive 250ml', 'Savon Liquide pour les Mains Dettol', 'Savon Solide Cadum / Taous', 'Shampoing Head & Shoulders 400ml', 'Dentifrice Colgate Total 75ml', 'Brosse à Dents Colgate (Pack)', 'Déodorant Spray Nivea Men / Women', 'Déodorant Spray AXE', 'Papier Hygiénique Papicolor (Pack de 6)', 'Essuie-tout Sopalin', 'Éponges Grattantes (Paquet de 4)', 'Sacs Poubelle Résistants 30L / 50L', "Désodorisant d'Intérieur Febreze / Glade", 'Lingettes Désinfectantes Nettoyantes', 'Coton-tiges hygiéniques', ...addedHomeHygiene]],
  ['Boissons & Eaux', '🥤', ['Eau Minérale Naturelle Sidi Ali 1.5L', 'Eau Minérale Aïn Soltane 1.5L', 'Eau Minérale Sidi Harzem 1.5L', 'Boisson Gazeuse Coca-Cola 1.5L', 'Boisson Gazeuse Coca-Cola Zéro 1.5L', 'Boisson Gazeuse Hawaï 1L', 'Boisson Gazeuse Pampsin 1L', 'Boisson Gazeuse Check / Orangina 1L', 'Boisson Gazeuse Sprite 1.5L', 'Boisson Gazeuse Schweppes Tonic 1L', 'Jus de Fruits Multifruit Marrakech 1L', "Nectar d'Orange Pampa 1L", 'Boisson Energisante Red Bull 250ml', 'Boisson Energisante Freez', 'Thé Glacé Lipton Pêche 1.5L', 'Lait Aromatisé Fraise Centrale 20cl', 'Sirop de Grenadine Leader Price / Top', "Eau Gazeuse Oulmès 1L", 'Boisson Lactée Yaourt à boire', 'Jus de Pomme Pressé local', ...addedBeverages, ...uncataloguedBeverages]],
  ['Accessoires Multimédia & Électronique', '🔌', ['Câble Chargeur Rapide USB Type-C', 'Câble Chargeur iPhone Lightning', 'Chargeur Secteur Mural Rapide (USB + Type-C)', 'Écouteurs Filaires Jack 3.5mm / Type-C', 'Écouteurs Sans Fil Bluetooth (AirPods style)', 'Support Téléphone Voiture Magnétique', 'Batterie Externe (Power Bank) 10000mAh', 'Clé USB 32GB SanDisk', 'Mini Enceinte Bluetooth Portable', "Verre Trempé Protection d'écran Universel"]],
]

const slugify = (name) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.jpg'
const IMAGE_ALIASES = {
  'gel-douche-palmolive-250ml.jpg': 'gel-douche-palmolive-fleur-d-oranger-250ml.png',
  'shampoing-head-shoulders-400ml.jpg': 'head-shoulders-shampoing.jpg',
  'brosse-a-dents-colgate-pack.jpg': 'brosse-a-dents-colgate.jpg',
  'deodorant-spray-axe.jpg': 'deodorant-axe.jpg',
  'papier-hygienique-papicolor-pack-de-6.jpg': 'papier-toilette-opal-pack-de-6-rouleaux.jpg',
  'lingettes-desinfectantes-nettoyantes.jpg': 'lingettes-humides.jpg',
  'coton-tiges-hygieniques.jpg': 'coton-tiges.jpg',
  'juver-disfruta-multifruits-20cl.jpg': 'juver-disfruta-multifruits-20cl.webp',
  'jus-disfruta-peche-juver-1l.jpg': 'jus-disfruta-peche-juver-1l.webp',
  'eau-minerale-naturelle-ain-atlas-1-5l.jpg': 'eau-minerale-naturelle-ain-atlas-1-5l.webp',
  'boisson-mandarina-simon-life-1-5l.jpg': 'boisson-mandarina-simon-life-1-5l.webp',
  'juver-disfruta-multifruits-1l.jpg': 'juver-disfruta-multifruits-1l.webp',
  'juver-disfruta-tropical-20cl.jpg': 'juver-disfruta-tropical-20cl.webp',
  'jus-cocktail-jaouda-25cl.jpg': 'jus-cocktail-jaouda-25cl.webp',
  'raibi-chergui-orange.jpg': 'raibi-chergui-orange.webp',
  'raibi-chergui-fraise.jpg': 'raibi-chergui-fraise.webp',
  'orangina-50cl.jpg': 'orangina-50cl.webp',
  'eau-minerale-naturelle-sidi-ali-33cl.jpg': 'eau-minerale-naturelle-sidi-ali-33cl.webp',
  'eau-minerale-naturelle-sidi-ali-50cl.jpg': 'eau-minerale-naturelle-sidi-ali-50cl.webp',
  'eau-minerale-naturelle-sidi-ali-1-5l.jpg': 'eau-minerale-naturelle-sidi-ali-1-5l.webp',
  'eau-minerale-naturelle-sidi-ali-2l.jpg': 'eau-minerale-naturelle-sidi-ali-2l.webp',
  'eau-minerale-naturelle-ain-atlas-5l.jpg': 'eau-minerale-naturelle-ain-atlas-5l.webp',
  'eau-minerale-naturelle-ain-ifrane-1-5l.jpg': 'eau-minerale-naturelle-ain-ifrane-1-5l.webp',
  'eau-minerale-naturelle-ain-saiss-1-5l.jpg': 'eau-minerale-naturelle-ain-saiss-1-5l.webp',
  'eau-minerale-naturelle-ain-saiss-5l.jpg': 'eau-minerale-naturelle-ain-saiss-5l.webp',
  'eau-minerale-naturelle-ain-soltane-33cl.jpg': 'eau-minerale-naturelle-ain-soltane-33cl.webp',
  'hawai-tropical-1-5l.jpg': 'hawai-tropical-1-5l.webp',
  'boisson-gazeuse-hawai-1l.jpg': 'hawai-ananas-1l.jpg',
  'boisson-gazeuse-schweppes-tonic-1l.jpg': 'schweppes-tonic-1l.jpg',
  'lait-uht-demi-ecreme-centrale-laitier-1l.jpg': 'lait-uht-demi-ecreme-centrale-1l.jpg',
  'fromage-en-portions-la-vache-qui-rit-8-portions.jpg': 'fromage-la-vache-qui-rit-8-portions.jpg',
  'beurre-de-table-centrale-plaquette-250g.jpg': 'beurre-de-table-centrale-250g.jpg (2).jpg',
  'creme-fraiche-president-200ml.jpg': 'creme-fraiche-president-20cl.jpg',
  'fromage-rape-mozzarella-president-200g.jpg': 'fromage-mozzarella-rapee-president-200g.jpg.jpg',
  'lait-chocolate-joy-20cl.jpg': 'lait-uht-chocolat-centrale-20cl-briquette.jpg',
  'fromage-blanc-sale-jben.jpg': 'jben-traditionnel-marocain-250g.jpg',
  'yaourt-vanille-danone.jpg': 'yaourt-danone-vanille-pack-125g.jpg',
  'yaourt-fruite-purity.jpg': 'yaourt-danone-fraise-pack-125g.jpg',
  'biscuit-pinguin-bimo.jpg': 'biscuit-fourre-merendina-bimo.jpg',
  'gateau-madeleine-trocadero.jpg': 'gateau-cake-timeout-bimo.jpg',
  'chips-go-s-go-go-go-s.jpg': 'chips-crunships-go-s.jpg',
  'couscous-fin-dari-1kg.jpg': 'couscous-moyen-dari-1kg.jpg',
  'huile-de-table-lesieur-2l.jpg': 'huile-de-tournesol-cristal-5l.jpg',
  'huile-de-tournesol-cristal-1l.jpg': 'huile-de-tournesol-cristal-5l.jpg',
  'riz-rond-rizi-1kg.jpg': 'riz-basmati-sunrice-1kg.jpg',
  'riz-basmati-rizi-1kg.jpg': 'riz-basmati-sunrice-1kg.jpg',
  'tomate-pelee-en-boite-aicha.jpg': 'concentre-de-tomates-aicha-800g.jpg',
  'sel-blanc-fin-1kg.jpg': 'sucre-morceaux-enasu-2kg.jpg',
  'sucre-en-morceaux-la-ligne-rouge-1kg.jpg': 'sucre-morceaux-enasu-2kg.jpg',
  'farine-de-ble-tendre-labelle-1kg.jpg': 'farine-de-ble-tendre-fandy-5kg.jpg',
  'lentilles-nettoyees-rizi-500g.jpg': 'lentilles-vertes-selection-1kg.jpg',
  'haricots-blancs-rizi-500g.jpg': 'lentilles-vertes-selection-1kg.jpg',
  'ketchup-doux-aicha-300g.jpg': 'concentre-de-tomates-aicha-800g.jpg',
  'vinaigrette-vinaigre-blanc-cristal.jpg': 'concentre-de-tomates-aicha-800g.jpg',
  'lessive-liquide-machine-omo-3l.jpg': 'lessive-liquide-machine-tide-2l.jpg',
  'lessive-en-poudre-tide-2kg.jpg': 'lessive-en-poudre-omo-3kg.jpg',
  'liquide-vaisselle-express-1l-citron.jpg': 'liquide-vaisselle-extra-1l.jpg',
  'nettoyant-sols-ajax-1l.jpg': 'nettoyant-sol-express-1l.jpg',
  'nettoyant-multi-usages-dettol.jpg': 'nettoyant-sol-express-1l.jpg',
  'eponges-grattantes-paquet-de-4.jpg': 'eponge-grattante-pack-de-3.jpg',
  'essuie-tout-sopalin.jpg': 'essuie-tout-papier-compact.jpg',
  'sacs-poubelle-resistants-30l-50l.jpg': 'sacs-poubelle-30l-avec-liens.jpg',
  'eau-minerale-naturelle-sidi-ali-1-5l.jpg': 'eau-minerale-sidi-ali-1-5l.jpg',
  'eau-gazeuse-oulmes-1l.jpg': 'eau-minerale-oulmes-gazifiee-1l.jpg',
  'jus-de-fruits-multifruit-marrakech-1l.jpg': 'jus-multifruits-marrakech-1l.jpg',
  'nectar-d-orange-pampa-1l.jpg': 'jus-d-orange-pampa-1l.jpg',
  'boisson-gazeuse-coca-cola-zero-1-5l.jpg': 'boisson-gazeuse-coca-cola-1-5l.jpg',
  'boisson-gazeuse-hawai-1l.jpg': 'boisson-gazeuse-fanta-orange-1-5l.jpg',
  'boisson-gazeuse-pampsin-1l.jpg': 'boisson-gazeuse-fanta-orange-1-5l.jpg',
  'boisson-gazeuse-check-orangina-1l.jpg': 'boisson-gazeuse-fanta-orange-1-5l.jpg',
  'boisson-energisante-freez.jpg': 'boisson-energisante-red-bull-250ml.jpg',
  'the-glace-lipton-peche-1-5l.jpg': 'boisson-gazeuse-fanta-orange-1-5l.jpg',
}
const categories = categorySeed.map(([name, icon], index) => ({ id: String(index + 1), name, icon }))
let nextProductId = 1
const products = categorySeed.flatMap(([, , names], categoryIndex) => names.map(name => ({ id: String(nextProductId++), name, price: 1, categoryId: String(categoryIndex + 1), imageUrl: slugify(name) })))
const store = { categories, products, orders: [], whatsapp: { number: '0604527252', minimumOrderAmount: MINIMUM_ORDER_AMOUNT, defaultProductImage: DEFAULT_PRODUCT_IMAGE } }
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
const response = (data, config, status = 200) => Promise.resolve({ data, status, statusText: status < 400 ? 'OK' : 'Bad Request', headers: {}, config })
const isMockable = (url = '') => {
  const u = String(url || '')
  // Les routes d'upload ne passent pas par le mock (multipart reel).
  if (u.startsWith('/products/images')) return false
  return ['/categories', '/products', '/orders', '/config'].some(path => u.includes(path))
}

function runMock(config) {
  const url = config.url.replace('/api', '')
  const method = String(config.method || 'get').toLowerCase()
  const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
  if (url === '/categories' && method === 'get') return response(store.categories, config)
  if (url === '/config/whatsapp' && method === 'get') return response({ ...store.whatsapp, whatsappNumber: store.whatsapp.number }, config)
  if (url === '/orders/validate' && method === 'post') {
    const total = Number(data.totalAmount || 0)
    return response({ valid: total >= MINIMUM_ORDER_AMOUNT, currentTotal: total, minimumOrderAmount: MINIMUM_ORDER_AMOUNT, missing: Math.max(0, MINIMUM_ORDER_AMOUNT - total), deliveryFree: total >= MINIMUM_ORDER_AMOUNT }, config, total >= MINIMUM_ORDER_AMOUNT ? 200 : 400)
  }
  if (url.startsWith('/products') && method === 'get') {
    const categoryId = config.params?.categoryId
    const search = config.params?.search?.toLowerCase()
    return response(store.products.filter(product => (!categoryId || product.categoryId === String(categoryId)) && (!search || product.name.toLowerCase().includes(search))), config)
  }  if (url === '/products' && method === 'post') {
    const product = { ...data, id: String(store.products.length + 1), price: 1 }
    store.products.push(product)
    return response(product, config, 201)
  }
  if (url.startsWith('/products/') && method === 'put') {
    const id = url.split('/').pop()
    const index = store.products.findIndex(product => product.id === id)
    if (index >= 0) store.products[index] = { ...store.products[index], ...data, price: 1 }
    return response(store.products[index], config)
  }
  if (url.startsWith('/products/') && method === 'delete') {
    const id = url.split('/').pop()
    store.products.splice(store.products.findIndex(product => product.id === id), 1)
    return response(null, config, 204)
  }
  if (url === '/orders' && method === 'post') {
    const order = { ...data, id: String(store.orders.length + 1), date: new Date().toISOString() }
    store.orders.push(order)
    return response(order, config, 201)
  }
  if (url.startsWith('/orders') && method === 'get') return response(store.orders, config)
  // Upload d'image simule : renvoie une URL d'image locale (data URL) afin que
  // l'apercu et la fiche produit restent coherents en mode mock.
  if (url === '/products/images' && method === 'post') {
    const raw = config.data instanceof FormData ? config.data.get('file') : null
    return response({ imageUrl: raw instanceof File ? URL.createObjectURL(raw) : null }, config, 201)
  }
  if (url.startsWith('/products/images/') && method === 'delete') return response(null, config, 204)
  return null
}

api.interceptors.request.use(config => {
  const token = getAdminToken()
  if (token && ['post', 'put', 'patch', 'delete'].includes(String(config.method || 'get').toLowerCase())) {
    config.headers['X-Admin-Token'] = token
  }
  if (USE_MOCK_API && isMockable(config.url)) {
    const mocked = runMock(config)
    if (mocked) return { ...config, adapter: () => mocked }
  }
  return config
})

export const categoryApi = { getAll: () => api.get('/categories'), create: (category) => api.post('/categories', category), update: (id, category) => api.put(`/categories/${id}`, category), delete: (id) => api.delete(`/categories/${id}`) }
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (file) => {
    const body = new FormData()
    body.append('file', file)
    // Content-Type DOIT rester undefined : c'est le navigateur qui ajoute la
    // frontiere multipart. Forcer "application/json" ferait echouer l'upload.
    return api.post('/products/images', body, { headers: { 'Content-Type': undefined } })
  },
  deleteImage: (filename) => api.delete(`/products/images/${encodeURIComponent(filename)}`),
}
export const orderApi = { getAll: () => api.get('/orders'), getById: (id) => api.get(`/orders/${id}`), create: (order) => api.post('/orders', order), validate: (totalAmount) => api.post('/orders/validate', { totalAmount }), updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }), delete: (id) => api.delete(`/orders/${id}`), getByDay: (date) => api.get('/orders/by-day', { params: { date } }), getByDaySummary: (date) => api.get('/orders/by-day/summary', { params: { date } }), getDailyPdf: (date) => api.get('/orders/by-day/pdf', { params: { date }, responseType: 'blob' }) }
export const configApi = { get: () => api.get('/config'), getWhatsapp: () => api.get('/config/whatsapp'), adminLogin: (password) => api.post('/config/admin/login', { password }) }

const CATEGORY_THEME = { '1': { bg: '#ecfdf5', accent: '#0f766e', light: '#ccfbf1', emoji: '🥛', label: 'Laitiers & Œufs' }, '2': { bg: '#fff7ed', accent: '#ea580c', light: '#fed7aa', emoji: '🍪', label: 'Biscuits & Snacks' }, '3': { bg: '#fffbeb', accent: '#b45309', light: '#fef3c7', emoji: '🛒', label: 'Épicerie' }, '4': { bg: '#eff6ff', accent: '#2563eb', light: '#dbeafe', emoji: '🧼', label: 'Maison & Hygiène' }, '5': { bg: '#ecfeff', accent: '#0891b2', light: '#cffafe', emoji: '🥤', label: 'Boissons' }, '6': { bg: '#f5f3ff', accent: '#7c3aed', light: '#ede9fe', emoji: '🔌', label: 'Multimédia' } }
const DEFAULT_THEME = { bg: '#f8fafc', accent: '#0f766e', light: '#ccfbf1', emoji: '🛍️', label: 'Cadeau Karim' }
const escSvg = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export function getPlaceholderUrl(productName, categoryId = null) {
  const theme = CATEGORY_THEME[String(categoryId)] || DEFAULT_THEME
  const name = String(productName || 'Produit').slice(0, 34)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="${theme.bg}"/><circle cx="250" cy="205" r="118" fill="${theme.light}"/><text x="250" y="235" text-anchor="middle" font-size="106">${theme.emoji}</text><text x="250" y="370" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#172033">${escSvg(name)}</text><rect y="455" width="500" height="45" fill="${theme.accent}"/><text x="250" y="484" text-anchor="middle" font-family="Arial" font-size="16" fill="white">${escSvg(theme.label)} • 1 DH</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
export function getProductImageUrl(imageName, categoryId = null, productName = null) {
  if (!imageName) return getPlaceholderUrl(productName, categoryId)
  // URLs deja absolues (blob: en mode mock, data:) : on les renvoie telles quelles.
  if (/^(blob:|data:|https?:)/.test(imageName)) return imageName
  if (imageName.startsWith('/api/images/')) return imageName
  const resolvedName = IMAGE_ALIASES[imageName] || imageName
  return `/images/${encodeURIComponent(resolvedName)}`
}
export function slugifyProductName(name) { return slugify(name || 'product') }
export default api
