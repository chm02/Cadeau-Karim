/**
 * download-images.mjs — Karim Market
 * ════════════════════════════════════════════════════════════════
 * Télécharge de vrais packshots produit (fond blanc, style catalogue)
 * depuis Jumia Maroc — gratuit, sans clé, sans quota.
 *
 * Usage :
 *   node download-images.mjs                   → tout télécharger
 *   node download-images.mjs --skip-existing   → reprendre (saute les existants)
 *   node download-images.mjs --limit=50        → tester sur 50 produits
 *   node download-images.mjs --dry-run         → simuler sans écrire
 *
 * Dossier de sortie :
 *   backend/src/main/resources/static/assets/img/products/
 * ════════════════════════════════════════════════════════════════
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OUTPUT_DIR = path.join(
  __dirname,
  'backend/src/main/resources/static/assets/img/products'
)

const UA       = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const DELAY_MS = 900   // pause entre produits — poli avec Jumia
const TIMEOUT  = 12000

// ── CLI args ──────────────────────────────────────────────────────
const args  = process.argv.slice(2)
const SKIP  = args.includes('--skip-existing')
const DRY   = args.includes('--dry-run')
const LIMIT = Number(args.find(a => a.startsWith('--limit='))?.split('=')[1] ?? Infinity)

// ── Slug (identique à Java + api.js) ─────────────────────────────
const slug = n =>
  n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.jpg'

// ── Recherche Jumia Maroc ─────────────────────────────────────────
async function searchJumia(query) {
  const url = `https://www.jumia.ma/catalog/?q=${encodeURIComponent(query)}`
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'fr-MA,fr;q=0.9' },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!r.ok) throw new Error(`Jumia HTTP ${r.status}`)
  const html = await r.text()

  // Jumia encode les données produits dans des attributs data-src / data-jid
  // Format : ma.jumia.is/unsafe/fit-in/NxN/filters:fill(white)/product/XX/XXXXXX/1.jpg
  const paths = html.match(/ma\.jumia\.is\/unsafe\/fit-in\/\d+x\d+\/filters:[^"'\s<>]+\/1\.(jpg|png)/g) || []

  // Si pas de format /1.jpg, essayer le pattern plus large
  const fallbackPaths = paths.length ? paths
    : (html.match(/ma\.jumia\.is\/unsafe\/fit-in\/\d+x\d+\/filters:[^"'\s<>]+/g) || [])

  if (!fallbackPaths.length) return null

  // Dédupliquer et upscaler à 500×500
  const unique = [...new Set(fallbackPaths)]
  const best = unique[0].replace(/fit-in\/\d+x\d+/, 'fit-in/500x500')
  const imgUrl = `https://${best}`

  // S'assurer que l'URL finit sur une image
  if (imgUrl.match(/\.(jpg|png|webp)$/i)) return imgUrl
  return imgUrl.replace(/\/$/, '') + '/1.jpg'
}

// ── Open Food Facts (backup quand Jumia ne trouve rien) ───────────
async function searchOFF(query) {
  const endpoints = [
    `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&page_size=3&fields=product_name,image_front_url`,
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true&page_size=3&fields=product_name,image_front_url&action=process`,
  ]
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
      if (!r.ok) continue
      const d = await r.json()
      for (const p of (d.products || [])) {
        const img = p.image_front_url
        if (img && img.startsWith('https://') && !img.includes('_thumb')) return img
      }
    } catch { continue }
  }
  return null
}

// ── Hashes MD5 d'images "génériques" Jumia à rejeter ─────────────
// Jumia retourne parfois ces images par défaut quand un produit n'est pas trouvé.
// On les détecte par leur hash MD5 pour éviter de sauvegarder des doublons inutiles.
const REJECTED_HASHES = new Set([
  '0c1866994fef25d8a76b85c5e156f019', // image générique Jumia identifiée
])

// ── Calcul MD5 d'un Buffer ────────────────────────────────────────
import { createHash } from 'crypto'
function md5(buffer) {
  return createHash('md5').update(buffer).digest('hex')
}

// ── Téléchargement ────────────────────────────────────────────────
async function download(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const ct = r.headers.get('content-type') || ''
  if (!ct.startsWith('image/')) throw new Error(`Content-Type: ${ct.slice(0, 30)}`)
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 5000) throw new Error(`Trop petite (${buf.length}B)`)

  // Rejeter les images génériques/placeholder connues
  const hash = md5(buf)
  if (REJECTED_HASHES.has(hash)) throw new Error('Image générique Jumia (rejetée)')

  return buf
}

// ── Catalogue complet (1849 produits) ────────────────────────────
// Chaque entrée : { name, search }
//  - name   : nom exact du produit (détermine le nom du fichier via slug)
//  - search : terme optimisé pour Jumia (plus court = meilleur résultat)
function buildCatalog() {
  const list = []

  // Helper : si search est omis, utilise le début du name
  function add(name, search) {
    list.push({ name, filename: slug(name), search: search || name })
  }

  // ── 1. Produits Laitiers & Œufs ──────────────────────────────
  add('Lait UHT Demi-Écrémé Centrale 1L',         'Lait Centrale Demi Ecrémé 1L')
  add('Lait UHT Entier Centrale 1L',               'Lait Centrale Entier 1L')
  add('Lait UHT Écrémé Centrale 1L',               'Lait Centrale Ecrémé')
  add('Lait UHT Demi-Écrémé Centrale 6x1L (Pack)', 'Lait Centrale Pack 6')
  add('Lait UHT Entier Centrale 6x1L (Pack)',       'Lait Centrale Entier Pack')
  add('Lait UHT Demi-Écrémé Jaouda 1L',            'Lait Jaouda Demi Ecrémé')
  add('Lait UHT Entier Jaouda 1L',                  'Lait Jaouda UHT Entier')
  add('Lait UHT Demi-Écrémé Jaouda 6x1L (Pack)',   'Lait Jaouda Pack 6')
  add('Lait Fermenté Lben Centrale 500ml',          'Lben Centrale 500ml')
  add('Lait Fermenté Lben Centrale 1L',             'Lben Centrale 1L')
  add('Lait Fermenté Lben Jaouda 500ml',            'Lben Jaouda 500ml')
  add('Lait Fermenté Lben Jaouda 1L',               'Lben Jaouda 1L')
  add('Lait UHT Chocolaté Centrale 1L',             'Lait Chocolat Centrale')
  add('Lait UHT Chocolaté Jaouda 1L',               'Lait Chocolat Jaouda')
  add('Lait UHT Vanille Centrale 20cl',             'Lait Vanille Centrale briquette')
  add('Lait UHT Fraise Centrale 20cl',              'Lait Fraise Centrale briquette')
  add('Lait UHT Vanille Centrale 500ml',            'Lait Vanille Centrale 500ml')
  add('Lait UHT Fraise Centrale 500ml',             'Lait Fraise Centrale 500ml')
  add('Lait UHT Chocolat Centrale 20cl (Briquette)','Lait Chocolat Centrale briquette')
  add('Lait en Poudre Gloria 400g',    'Gloria lait poudre 400g')
  add('Lait en Poudre Gloria 900g',    'Gloria lait poudre 900g')
  add('Lait en Poudre Gloria 2.25kg',  'Gloria lait poudre 2kg')
  add('Lait en Poudre Nido 400g',      'Nido 400g')
  add('Lait en Poudre Nido 900g',      'Nido 900g')
  add('Lait en Poudre Nido 2.25kg',    'Nido 2kg')
  for (const s of ['Vanille','Fraise','Pêche','Abricot','Nature','Coco','Miel']) {
    add(`Yaourt Danone ${s} (Pot 125g)`,  `Yaourt Danone ${s}`)
    add(`Yaourt Centrale ${s} (Pot 125g)`, `Yaourt Centrale ${s}`)
  }
  add('Yaourt Danone Vanille Pack 4x125g',   'Danone Vanille pack 4')
  add('Yaourt Danone Fraise Pack 4x125g',    'Danone Fraise pack 4')
  add('Yaourt à Grecque Centrale Nature 150g','Yaourt Grecque Centrale')
  add('Yaourt à Grecque Centrale Miel 150g',  'Yaourt Grecque Miel')
  add('Petit Suisse Danone 6x60g',            'Petit Suisse Danone')
  add('Beurre de Table Centrale 250g',  'Beurre Centrale 250g')
  add('Beurre de Table Centrale 500g',  'Beurre Centrale 500g')
  add('Beurre de Table Centrale 1kg',   'Beurre Centrale 1kg')
  add('Beurre Beldi 250g',              'Beurre Beldi 250g')
  add('Beurre Beldi 500g',              'Beurre Beldi 500g')
  add('Beurre Beldi 1kg',               'Beurre Beldi 1kg')
  add('Beurre de Cuisine Président 250g',  'Beurre President 250g')
  add('Beurre de Cuisine Centurion 250g',  'Beurre Centurion 250g')
  add('Beurre de Cuisine Président 500g',  'Beurre President 500g')
  add('Beurre de Cuisine Centurion 500g',  'Beurre Centurion 500g')
  add('Beurre Clarifié (Smen) 500g',    'Smen beurre 500g')
  add('Beurre Clarifié (Smen) 1kg',     'Smen beurre 1kg')
  add('Crème Fraîche Cuisine Centrale 20cl',   'Crème Centrale 20cl')
  add('Crème Fraîche Cuisine Centrale 50cl',   'Crème Centrale 50cl')
  add('Crème Fraîche Liquide Entière 20cl',    'Crème Fraîche liquide')
  add('Crème Fraîche Liquide Entière 50cl',    'Crème Fraîche 50cl')
  add('Crème Fleurette 20cl',                  'Crème Fleurette')
  add('Chantilly Spray Président 250g',        'Chantilly Président spray')
  add('Fromage La Vache qui Rit 8 Portions',   'Vache qui Rit 8')
  add('Fromage La Vache qui Rit 16 Portions',  'Vache qui Rit 16')
  add('Fromage La Vache qui Rit 24 Portions',  'Vache qui Rit 24')
  add('Fromage La Vache qui Rit 32 Portions',  'Vache qui Rit 32')
  add('Fromage Les Enfants 8 Portions',        'Fromage Enfants 8')
  add('Fromage Les Enfants 16 Portions',       'Fromage Enfants 16')
  add('Fromage Président 8 Portions',          'Fromage Président portions')
  add('Fromage Président 16 Portions',         'Fromage Président 16')
  add('Fromage Kiri 6 Portions',               'Kiri fromage 6')
  add('Fromage Kiri 12 Portions',              'Kiri fromage 12')
  add('Fromage Kiri 24 Portions',              'Kiri fromage 24')
  add('Fromage Carré Frais 6 Portions',        'Carré Frais fromage')
  add('Fromage Carré Frais 12 Portions',       'Carré Frais 12')
  add('Fromage Gouda Tafilelt Bloc 250g',      'Gouda Tafilelt')
  add('Fromage Gouda Tafilelt Bloc 400g',      'Gouda Tafilelt 400g')
  add('Fromage Gouda Président Bloc 200g',     'Gouda Président')
  add('Fromage Edam Graindorge 200g',          'Edam Graindorge')
  add('Fromage Edam Graindorge 400g',          'Edam 400g')
  add('Fromage Gouda Tranches Tafilelt 200g',  'Gouda tranches')
  add('Fromage Mozzarella Râpée Galbani 200g', 'Mozzarella Galbani rapée')
  add('Fromage Mozzarella Râpée Galbani 400g', 'Mozzarella rapée 400g')
  add('Fromage Mozzarella Râpée Président 200g','Mozzarella Président')
  add('Fromage Mozzarella Râpée Safilait 200g','Mozzarella Safilait')
  add('Fromage Mozzarella Râpée Safilait 1kg', 'Mozzarella Safilait 1kg')
  add('Fromage Emmental Râpé Président 200g',  'Emmental Président rapé')
  add('Fromage Emmental Râpé 400g',            'Emmental rapé 400g')
  add('Fromage Cheddar Tranches Sandwich 200g','Cheddar Sandwich tranches')
  add('Fromage Cheddar Tranches Sandwich 400g','Cheddar 400g')
  add('Boîte de 6 Œufs Frais Calibre M',      'Oeufs frais boite 6')
  add('Boîte de 12 Œufs Frais Calibre M',     'Oeufs frais 12')
  add('Boîte de 12 Œufs Frais Calibre L',     'Oeufs calibre L 12')
  add('Plateau de 30 Œufs Frais Calibre S',   'Oeufs plateau 30')
  add('Plateau de 30 Œufs Frais Calibre M',   'Oeufs plateau 30 M')
  add('Plateau de 30 Œufs Frais Calibre L',   'Oeufs plateau 30 L')
  add('Plateau de 30 Œufs Label Rouge',        'Oeufs Label Rouge')

  // ── 2. Épicerie Salée & Conserves ────────────────────────────
  for (const m of ['Rima','Dari','Fandy','Tria'])
    for (const t of ['Spaghettis','Macaroni','Penne','Coquillettes','Tagliatelles','Lasagnes','Vermicelles'])
      for (const f of ['500g','1kg']) {
        add(`Pâtes ${m} ${t} ${f}`, `Pates ${m} ${t} ${f}`)
      }
  for (const m of ['Rima','Dari','Fandy'])
    add(`Pâtes ${m} Vermicelles 250g`, `Vermicelles ${m} 250g`)
  for (const m of ['Dari','Fandy'])
    for (const t of ['Fin','Moyen','Complet','Maïs'])
      for (const f of ['1kg','2kg','5kg'])
        add(`Couscous ${t} ${m} ${f}`, `Couscous ${t} ${m}`)
  add('Pâte à Pizza Hida 300g (Frais)',         'Pate Pizza Hida')
  add('Pâte à Pizza Carrefour 300g (Frais)',    'Pate Pizza fraiche')
  add('Pâte à Pizza Artisanale 400g',           'Pate Pizza artisanale')
  add('Pâte Feuilletée Rouleau 270g',           'Pate Feuilletée rouleau')
  add('Pâte Feuilletée Rouleau Pur Beurre 270g','Pate Feuilletée beurre')
  add('Pâte Brisée Rouleau 280g',               'Pate Brisée rouleau')
  add('Pâte à Pizza Surgelée 400g',             'Pate Pizza surgelée')
  add('Pâte Brisée Surgelée 400g',              'Pate Brisée surgelée')
  add('Riz Rond Rima 1kg',         'Riz Rima 1kg')
  add('Riz Rond Rima 5kg',         'Riz Rima 5kg')
  add('Riz Rond Dari 1kg',         'Riz Dari 1kg')
  add('Riz Rond Dari 5kg',         'Riz Dari 5kg')
  add('Riz Basmati 1kg',           'Riz Basmati 1kg')
  add('Riz Basmati 5kg',           'Riz Basmati 5kg')
  add('Riz Long Parfumé 1kg',      'Riz Long Parfumé')
  add('Riz Long Parfumé 5kg',      'Riz Long 5kg')
  add('Riz Thaï 1kg',              'Riz Thai')
  add('Riz Camolino 1kg',          'Riz Camolino')
  add('Pois Chiches Secs 1kg',     'Pois Chiches 1kg')
  add('Pois Chiches Secs 5kg',     'Pois Chiches 5kg')
  add('Lentilles Vertes 1kg',      'Lentilles Vertes 1kg')
  add('Lentilles Corail 1kg',      'Lentilles Corail')
  add('Lentilles Vertes 5kg',      'Lentilles 5kg')
  add('Haricots Blancs 1kg',       'Haricots Blancs')
  add('Haricots Rouges 1kg',       'Haricots Rouges')
  add('Fèves Sèches 1kg',          'Feves Seches 1kg')
  add('Fèves Sèches 5kg',          'Feves 5kg')
  for (const m of ['Fandy','Maymouna','Tria']) {
    for (const f of ['1kg','2kg','5kg','10kg']) add(`Farine de Blé Tendre ${m} ${f}`, `Farine ${m} ${f}`)
    add(`Semoule Fine Blé Dur ${m} 1kg`,    `Semoule fine ${m}`)
    add(`Semoule Moyenne Blé Dur ${m} 1kg`, `Semoule ${m}`)
  }
  add('Semoule de Maïs 1kg',   'Semoule Mais')
  add('Farine de Maïs 1kg',    'Farine Mais')
  add('Maïzena (Fécule) 500g', 'Maizena 500g')
  add('Maïzena (Fécule) 1kg',  'Maizena 1kg')
  for (const f of ['1L','2L','3L','5L']) {
    add(`Huile de Table Lesieur ${f}`,    `Huile Lesieur ${f}`)
    add(`Huile Afia ${f}`,                `Huile Afia ${f}`)
    add(`Huile Tournesol Hala ${f}`,      `Huile Hala ${f}`)
    add(`Huile Tournesol Cristal ${f}`,   `Huile Cristal ${f}`)
  }
  add("Huile d'Olive Extra Vierge Lesieur 1L",  "Huile Olive Lesieur 1L")
  add("Huile d'Olive Extra Vierge Lesieur 2L",  "Huile Olive Lesieur 2L")
  add("Huile d'Olive Oued Souss 1L",            "Huile Olive Oued Souss")
  add("Huile d'Olive Oued Souss 2L",            "Huile Olive Oued Souss 2L")
  add("Huile d'Olive Terroir du Maroc 1L",      "Huile Olive Maroc")
  add("Huile d'Olive Vierge 75cl",              "Huile Olive Vierge")
  add("Huile d'Argan Alimentaire 250ml",        "Huile Argan alimentaire")
  add('Vinaigre Blanc Cristal 50cl',  'Vinaigre Blanc 50cl')
  add('Vinaigre Blanc Cristal 1L',    'Vinaigre Blanc 1L')
  add('Vinaigre de Cidre 50cl',       'Vinaigre Cidre 50cl')
  add('Vinaigre de Cidre 1L',         'Vinaigre Cidre 1L')
  add('Vinaigre Balsamique 50cl',     'Vinaigre Balsamique')
  add('Sel Fin Blanc Lesieur 1kg',    'Sel Lesieur 1kg')
  add('Sel Fin Blanc Lesieur 2kg',    'Sel Lesieur 2kg')
  add('Sel Gros Cristallin 1kg',      'Sel Gros Cristallin')
  add('Sel Gris de Mer 1kg',          'Sel Gris Mer')
  add('Poivre Noir Moulu 100g',       'Poivre Noir Moulu')
  add('Poivre Noir en Grains 100g',   'Poivre Noir Grains')
  add('Concentré de Tomates Aïcha Tube 200g',   'Concentré Tomates Aicha tube')
  add('Concentré de Tomates Aïcha Boîte 400g',  'Concentré Tomates Aicha 400g')
  add('Concentré de Tomates Aïcha Boîte 800g',  'Concentré Tomates Aicha 800g')
  add('Concentré de Tomates Aïcha Boîte 2.5kg', 'Concentré Tomates Aicha 2kg')
  add('Concentré de Tomates Koutoubia 400g',     'Concentré Koutoubia 400g')
  add('Concentré de Tomates Koutoubia 800g',     'Concentré Koutoubia 800g')
  add('Concentré de Tomates Double Concentré 400g','Concentré Double 400g')
  add('Sauce Tomate Cuisinée Aïcha Brique 500g', 'Sauce Tomate Aicha brique')
  add('Sauce Tomate Cuisinée Rima Brique 500g',  'Sauce Tomate Rima')
  add('Sauce Tomate Bolognese Préparée 500g',    'Sauce Bolognese 500g')
  add('Sauce Tomate Napolitaine Préparée 500g',  'Sauce Napolitaine')
  add('Ketchup Heinz Flacon 300g',          'Ketchup Heinz 300g')
  add('Ketchup Heinz Flacon 500g',          'Ketchup Heinz 500g')
  add('Ketchup Aïcha Flacon 300g',          'Ketchup Aicha 300g')
  add('Ketchup Aïcha Flacon 500g',          'Ketchup Aicha 500g')
  add('Mayonnaise Lesieur Flacon 300g',     'Mayonnaise Lesieur 300g')
  add('Mayonnaise Lesieur Flacon 500g',     'Mayonnaise Lesieur 500g')
  add('Mayonnaise Aïcha Flacon 300g',       'Mayonnaise Aicha 300g')
  add('Mayonnaise Aïcha Flacon 500g',       'Mayonnaise Aicha 500g')
  add('Mayonnaise Dijonnaise Flacon 300g',  'Mayonnaise Dijonnaise')
  add('Moutarde Forte Flacon 250g',         'Moutarde Forte')
  add('Moutarde Douce Flacon 250g',         'Moutarde Douce')
  add('Moutarde de Dijon Flacon 250g',      'Moutarde Dijon')
  add('Sauce Barbecue Flacon 300g',         'Sauce Barbecue')
  add('Sauce Algérienne Flacon 300g',       'Sauce Algerienne')
  add('Harissa Le Phare du Cap Bon Tube 70g',   'Harissa Cap Bon tube')
  add('Harissa Le Phare du Cap Bon Boîte 380g', 'Harissa Cap Bon boite')
  add('Harissa Aïcha Tube 70g',   'Harissa Aicha tube')
  add('Harissa Aïcha Boîte 380g', 'Harissa Aicha 380g')
  add('Harissa Aïcha Boîte 760g', 'Harissa Aicha 760g')
  for (const e of ['Cumin','Paprika','Gingembre','Curcuma','Cannelle','Coriandre','Noix de Muscade','Ras el Hanout','Mélange Couscous','Zaatar','Mélange Grillades','Ail en Poudre','Oignon en Poudre']) {
    add(`Épice ${e} (Sachet 100g)`, `Epice ${e} sachet`)
    add(`Épice ${e} (Bocal 250g)`,  `Epice ${e} bocal`)
  }
  for (const v of ["À l'huile de tournesol","À l'huile d'olive",'Au naturel','Piments']) {
    add(`Thon Tom Ton ${v} 80g`,          `Thon Tom Ton 80g`)
    add(`Thon Tom Ton ${v} 160g`,         `Thon Tom Ton 160g`)
    add(`Thon Aloes ${v} 80g`,            `Thon Aloes 80g`)
    add(`Thon Aloes ${v} 160g`,           `Thon Aloes 160g`)
    add(`Thon Anny ${v} 80g (Lot de 3)`,  `Thon Anny 80g`)
    add(`Thon Anny ${v} 160g (Lot de 3)`, `Thon Anny 160g`)
  }
  add("Sardines Anny à l'huile 120g",       'Sardines Anny huile')
  add('Sardines Anny au piment 120g',        'Sardines Anny piment')
  add('Sardines Anny à la tomate 120g',      'Sardines Anny tomate')
  add("Sardines Walima à l'huile 120g",      'Sardines Walima')
  add('Sardines Walima au piment 120g',      'Sardines Walima piment')
  add("Sardines Titus à l'huile 120g",       'Sardines Titus')
  add('Sardines Anny Grillées 120g (Lot de 3)','Sardines Anny grillées')
  add('Maquereaux à la Sauce Tomate 120g',   'Maquereaux sauce tomate')
  add('Crevettes Roses Décortiquées Surgelées 200g','Crevettes surgelées')
  add('Champignons de Paris Entiers Boîte 400g',  'Champignons Paris boite')
  add('Champignons de Paris Émincés Boîte 400g',  'Champignons Emincés')
  add('Maïs Doux Géant Boîte 300g (Lot de 2)',    'Mais Doux Géant boite')
  add('Maïs Doux Bonduelle Boîte 300g (Lot de 3)','Mais Bonduelle')
  add('Petits Pois et Carottes Bonduelle 400g',    'Petits Pois Carottes Bonduelle')
  add('Petits Pois Fins Bonduelle 400g',           'Petits Pois Bonduelle')
  add('Haricots Verts Beurre Bonduelle 400g',      'Haricots Verts Bonduelle')
  add('Haricots Verts Mince Bonduelle 400g',       'Haricots Verts Mince')
  add('Coeurs de Palmier Boîte 400g',              'Coeurs Palmier boite')
  add('Coeurs de Palmier Miniatures Boîte 230g',   'Coeurs Palmier miniatures')
  add('Olives Vertes Dénoyautées Bocal 700g',      'Olives Vertes bocal')
  add('Olives Noires Dénoyautées Bocal 700g',      'Olives Noires bocal')
  add('Olives Violettes Farcies Poivron Bocal 700g','Olives Violettes farcies')
  add('Câpres Bocal 200g',              'Capres bocal')
  add('Cornichons Aigres-Doux Bocal 370g','Cornichons bocal')
  add('Onions au Vinaigre Bocal 370g',  'Oignons vinaigre bocal')
  add('Lentilles Préparées Boîte 500g', 'Lentilles préparées boite')
  add('Pois Chiches Préparés Boîte 500g','Pois chiches boite')
  add('Artichauts demi-fonds Bocal 380g','Artichauts bocal')
  add("Poivrons Grillés à l'huile Bocal 480g",'Poivrons grillés bocal')
  add('Tahini (Crème de Sésame) 500g',  'Tahini sésame 500g')
  add('Tahini (Crème de Sésame) 1kg',   'Tahini 1kg')
  add('Pâte de Sésame Noire 500g',      'Sésame Noire pâte')
  add('Mloukhia en Feuilles Séchées 200g','Mloukhia feuilles')
  add('Safran en Poudre (1g)',           'Safran poudre')
  add("Eau de Fleur d'Oranger Bocal 250ml",'Eau Fleur Oranger')
  add('Eau de Rose Bocal 250ml',         'Eau Rose bocal')
  add('Bicarbonate Alimentaire 200g',    'Bicarbonate alimentaire')
  add('Levure Chimique Sachet 10g',      'Levure Chimique')
  add('Levure de Boulanger Séchée 500g', 'Levure Boulanger')
  add('Gélatine Alimentaire Sachet 10g', 'Gélatine alimentaire')

  // ── 3. Charcuterie Halal ──────────────────────────────────────
  for (const m of ['Koutoubia','Alfassia','Dinar','Isla Mondial']) {
    for (const f of ['200g','400g','1kg']) {
      add(`Cacher (Jambon) de Dinde ${m} ${f}`, `Jambon Dinde ${m} ${f}`)
      add(`Cacher de Bœuf ${m} ${f}`,           `Cacher Boeuf ${m} ${f}`)
      add(`Cacher aux Olives Dinde ${m} ${f}`,  `Cacher Olives ${m}`)
      add(`Cacher aux Poivrons Dinde ${m} ${f}`,`Cacher Poivrons ${m}`)
    }
    add(`Salami de Dinde Tranché ${m} 200g`,          `Salami Dinde ${m}`)
    add(`Salami de Bœuf Tranché ${m} 200g`,           `Salami Boeuf ${m}`)
    add(`Mortadelle Supérieure Classique ${m} 200g`,  `Mortadelle ${m}`)
    add(`Mortadelle aux Olives ${m} 200g`,            `Mortadelle Olives ${m}`)
    add(`Mortadelle aux Piments ${m} 200g`,           `Mortadelle Piments ${m}`)
    add(`Mortadelle aux Pistaches ${m} 200g`,         `Mortadelle Pistaches ${m}`)
    add(`Blanc de Dinde Fumé Tranché ${m} 200g`,      `Blanc Dinde Fumé ${m}`)
    add(`Bacon de Dinde Fumé Tranché ${m} 200g`,      `Bacon Dinde ${m}`)
  }
  add('Merguez de Bœuf Barquette 500g',       'Merguez Boeuf 500g')
  add('Merguez de Bœuf Barquette 1kg',        'Merguez Boeuf 1kg')
  add('Saucisses de Dinde Barquette 500g',    'Saucisses Dinde')
  add('Kefta de Bœuf Préparé Barquette 500g', 'Kefta Boeuf')
  add('Rôti de Dinde Cuit Entier 1kg',        'Rôti Dinde cuit')
  add('Pâté de Dinde Cuisiné 200g',           'Pâté Dinde')
  add('Terrine Campagnarde 200g',             'Terrine Campagnarde')

  // ── 4. Bébé & Puériculture ────────────────────────────────────
  for (const t of ['1','2','3','4','5','6']) {
    add(`Couches Pampers Active Baby Taille ${t} (Paquet x44)`, `Pampers Active Baby taille ${t}`)
    add(`Couches Pampers Active Baby Taille ${t} (Méga Pack x88)`, `Pampers Active Baby mega ${t}`)
    add(`Couches Pampers Baby-Dry Taille ${t} (Paquet x46)`, `Pampers Baby Dry taille ${t}`)
    add(`Couches Huggies Ultra Taille ${t} (Paquet x42)`, `Huggies Ultra taille ${t}`)
    add(`Couches Dalaa Taille ${t} (Paquet x48)`, `Couches Dalaa taille ${t}`)
    add(`Couches Molped Taille ${t} (Paquet x48)`, `Molped taille ${t}`)
    add(`Couches Babylino Taille ${t} (Paquet x48)`, `Babylino taille ${t}`)
  }
  add('Couches de Bain Pampers Splashers Taille 3-4 (Paquet x12)','Pampers Splashers')
  add('Couches de Bain Huggies Little Swimmers Taille 3-4 (x12)', 'Huggies Little Swimmers')
  add('Lingettes Bébé Douceur Paquet x56',        'Lingettes Bébé Douceur 56')
  add('Lingettes Bébé Douceur Paquet x72',        'Lingettes Bébé Douceur 72')
  add('Lingettes Pampers Sensitive Paquet x56',   'Pampers Sensitive lingettes 56')
  add('Lingettes Pampers Sensitive Paquet x72',   'Pampers Sensitive lingettes 72')
  add('Lingettes Pampers Paquet x72 (Lot de 3)',  'Pampers lingettes lot 3')
  add('Lingettes Huggies Natural Paquet x56',     'Huggies Natural lingettes')
  add('Lingettes Bébé Eau Pure Paquet x64',       'Lingettes Eau Pure bébé')
  add('Lait 1er Âge Guigoz 800g',    'Guigoz 1er Age 800g')
  add('Lait 2ème Âge Guigoz 800g',   'Guigoz 2ème Age 800g')
  add('Lait 3ème Âge Guigoz 800g',   'Guigoz 3ème Age')
  add('Lait 1er Âge Novalac 800g',   'Novalac 1er Age')
  add('Lait 2ème Âge Novalac 800g',  'Novalac 2ème Age')
  add('Lait 1er Âge NAN Optipro 800g','NAN Optipro 1er Age')
  add('Lait 2ème Âge NAN Optipro 800g','NAN Optipro 2ème Age')
  add('Lait 3ème Âge NAN 800g',      'NAN 3ème Age')
  add('Lait 1er Âge Gallia 800g',    'Gallia 1er Age')
  add('Lait 2ème Âge Gallia 800g',   'Gallia 2ème Age')
  add('Lait Anti-Régurgitation Novalac AR 800g','Novalac AR anti régurgitation')
  add('Lait Confort Novalac Coliques 800g','Novalac Confort coliques')
  for (const p of ['Biscuit','Miel','Blé','5 Céréales','Fruits']) {
    add(`Farine Lactée Nestlé Cerelac ${p} 400g`, `Cerelac ${p} 400g`)
    add(`Farine Lactée Nestlé Cerelac ${p} 1kg`,  `Cerelac ${p} 1kg`)
  }
  for (const p of ['Pomme','Poire','Pêche','Carottes','Petits Pois','Poulet Légumes','Bœuf Légumes']) {
    add(`Petit Pot Bébé Nestlé ${p} 130g`, `Nestlé bébé ${p}`)
    add(`Petit Pot Bébé Guigoz ${p} 130g`, `Guigoz bébé ${p}`)
  }
  add("Lait de Toilette Bébé Johnson's 500ml", "Johnson Baby lait toilette")
  add("Shampooing Doux Bébé Johnson's 500ml",  "Johnson Baby shampooing")
  add("Gel Lavant Corps & Cheveux Johnson's 500ml","Johnson Baby gel lavant")
  add('Shampooing Doux Mustela Bébé 500ml',    'Mustela shampooing bébé')
  add("Gel Lavant Mustela à l'Avocat 500ml",   'Mustela gel avocat')
  add('Crème Change Mustela 123 100ml',         'Mustela crème change')
  add('Crème Change Bébé 1-2-3 100g',           'Crème change 1-2-3')
  add("Talc Bébé Johnson's 400g",              'Johnson talc bébé')
  add('Talc Bébé Naturel 400g',                'Talc bébé naturel')
  add('Huile de Massage Bébé 250ml',            'Huile massage bébé')
  add('Biberon Nuk Anti-Colique 250ml',         'Nuk biberon 250ml')
  add('Biberon Nuk Anti-Colique 300ml',         'Nuk biberon 300ml')
  add('Tétine Nuk Taille 1 (Lot de 2)',         'Nuk tétine taille 1')
  add('Tétine Nuk Taille 2 (Lot de 2)',         'Nuk tétine taille 2')
  add('Aspirateur Nasal pour Bébé',             'Aspirateur nasal bébé')
  add('Thermomètre Baignoire Bébé',             'Thermomètre baignoire bébé')
  add('Thermomètre Frontal Infrarouge Bébé',    'Thermomètre frontal infrarouge')
  add('Brosse à Cheveux et Peigne Bébé',        'Brosse peigne bébé')
  add('Cotons-Tiges Bébé (Boîte x200)',         'Cotons tiges bébé')
  add('Carrés de Coton Bébé (Paquet x100)',     'Carrés coton bébé')
  add('Compresses Stériles x20',                'Compresses stériles')
  add('Sucette Orthodontique (Lot de 2)',        'Sucette orthodontique')
  add('Anneau de Dentition Réfrigérant',        'Anneau dentition bébé')

  // ── 5. Boissons & Eaux ────────────────────────────────────────
  for (const m of ['Sidi Ali','Aïn Saïss','Bahia'])
    for (const f of ['33cl (Pack x24)','50cl (Pack x24)','1.5L (Pack x6)','5L'])
      add(`Eau Minérale ${m} ${f}`, `Eau ${m}`)
  add('Eau Minérale Sidi Ali 1.5L (Unité)',   'Sidi Ali 1.5L')
  add('Eau Minérale Aïn Saïss 1.5L (Unité)',  'Ain Saiss 1.5L')
  add('Eau Minérale Bahia 1.5L (Unité)',       'Bahia eau 1.5L')
  add('Eau Gazeuse Oulmès 50cl',     'Oulmès gazeuse 50cl')
  add('Eau Gazeuse Oulmès 1L',       'Oulmès 1L')
  add('Eau Gazeuse Oulmès 1L (Pack x6)', 'Oulmès pack 6')
  add('Eau Gazeuse San Pellegrino 50cl', 'San Pellegrino')
  add('Eau Pétillante Naturelle Badoit 50cl','Badoit')
  for (const s of ['Original','Zero','Light']) {
    add(`Coca-Cola ${s} Canette 33cl (Lot de 6)`,  `Coca Cola ${s} canette`)
    add(`Coca-Cola ${s} Canette 33cl (Pack x24)`,  `Coca Cola ${s} pack 24`)
  }
  for (const f of ['1L','1.5L','2L']) {
    add(`Coca-Cola Original Bouteille ${f}`, `Coca Cola Original ${f}`)
    add(`Coca-Cola Zero Bouteille ${f}`,     `Coca Cola Zero ${f}`)
    add(`Fanta Orange Bouteille ${f}`,       `Fanta Orange ${f}`)
    add(`Fanta Citron Bouteille ${f}`,       `Fanta Citron ${f}`)
    add(`Sprite Bouteille ${f}`,             `Sprite ${f}`)
    add(`Orangina Bouteille ${f}`,           `Orangina ${f}`)
    add(`Schweppes Agrum' Bouteille ${f}`,   `Schweppes Agrum ${f}`)
    add(`Schweppes Tonic Bouteille ${f}`,    `Schweppes Tonic ${f}`)
    add(`Schweppes Lemon Bouteille ${f}`,    `Schweppes Lemon ${f}`)
    add(`Hawaï Ananas Bouteille ${f}`,       `Hawaii Ananas ${f}`)
    add(`Pampsin Pamplemousse Bouteille ${f}`,'Pampsin Pamplemousse')
    add(`Mountain Dew Bouteille ${f}`,       `Mountain Dew ${f}`)
  }
  add('Fayrouz Ananas Bouteille 33cl', 'Fayrouz Ananas')
  add('Fayrouz Pêche Bouteille 33cl',  'Fayrouz Pêche')
  add('Fayrouz Ananas 1L',             'Fayrouz Ananas 1L')
  add('Fayrouz Pêche 1L',              'Fayrouz Pêche 1L')
  add('Boisson Tropicale Teisseire 1L','Teisseire Tropical')
  for (const s of ['Orange','Pomme','Multivitaminé','Ananas','Pamplemousse','Raisin','Abricot','Pêche','Tomate']) {
    add(`Jus Marrakech 100% Pressé ${s} 1L`, `Jus Marrakech ${s}`)
    add(`Nectar Marrakech ${s} 1L`,           `Nectar Marrakech ${s}`)
    add(`Jus Oasis ${s} 1L`,                  `Oasis jus ${s}`)
    add(`Jus Top Fruit ${s} 1L`,              `Top Fruit ${s}`)
  }
  for (const s of ['Orange','Pomme','Multivitaminé'])
    add(`Jus Marrakech ${s} Briquette 20cl (Pack x6)`, `Marrakech ${s} briquette`)
  add('Lait UHT Chocolat Centrale Briquette 20cl (Pack x6)', 'Lait Chocolat Centrale briquette pack')
  add('Lait UHT Chocolat Jaouda Briquette 20cl (Pack x6)',   'Lait Chocolat Jaouda briquette')
  add('Lait UHT Fraise Jaouda Briquette 20cl (Pack x6)',     'Lait Fraise Jaouda briquette')
  add('Sirop de Menthe Teisseire 75cl',          'Sirop Menthe Teisseire')
  add('Sirop de Grenadine Teisseire 75cl',       'Sirop Grenadine Teisseire')
  add("Sirop d'Orange Teisseire 75cl",           'Sirop Orange Teisseire')
  add('Sirop Fraise Teisseire 75cl',             'Sirop Fraise Teisseire')
  add('Sirop Pamplemousse Rose Teisseire 75cl',  'Sirop Pamplemousse Teisseire')
  add('Sirop de Chicorée Liquide 75cl',          'Sirop Chicorée')
  add('Limonade Lorina Citron 1L',               'Lorina Limonade')
  add('Ice Thé Pêche Lipton 1L',                 'Lipton Ice Tea Pêche')
  add('Ice Thé Citron Lipton 1L',                'Lipton Ice Tea Citron')
  add('Ice Thé Pêche Fuze Tea 1L',               'Fuze Tea Pêche')
  add('Boisson Énergisante Red Bull 250ml',       'Red Bull 250ml')
  add('Boisson Énergisante Red Bull 250ml (Lot de 4)','Red Bull pack 4')
  add('Boisson Énergisante Monster 500ml',        'Monster Energy 500ml')
  add('Boisson Énergisante Burn 500ml',           'Burn Energy 500ml')
  add('Starbucks Frappuccino Mocha 280ml',        'Starbucks Frappuccino Mocha')
  add('Starbucks Frappuccino Caramel 280ml',      'Starbucks Frappuccino Caramel')

  // ── 6. Biscuits, Chocolats & Snacking ────────────────────────
  for (const b of ['Merendina Chocolat','Merendina Fraise','Merendina Vanille','Timeout','Tonik','Krakatou','Golden','Pacha','Panini','Tagger','Mirienda','Petit Beurre','Maria','Spéculoos','Chocolatine']) {
    add(`Biscuit Bimo ${b} (Paquet individuel)`,    `Bimo ${b}`)
    add(`Biscuit Bimo ${b} (Paquet familial 250g)`, `Bimo ${b} 250g`)
    add(`Biscuit Bimo ${b} (Grand format 500g)`,    `Bimo ${b} 500g`)
  }
  add('Cookies Casino Pépites de Chocolat 120g', 'Casino Cookies pépites chocolat')
  add('Cookies Casino Double Chocolat 120g',     'Casino Cookies double chocolat')
  add('Cookies Casino Pépites de Chocolat 300g', 'Casino Cookies 300g')
  add('Sablés Pur Beurre St Michel 200g',        'St Michel Sablés beurre')
  add('Sablés Pur Beurre Bimo 200g',             'Bimo Sablés beurre')
  add('Sablés aux Pépites de Chocolat 200g',     'Sablés pépites chocolat')
  add('Madeleines St Michel Paquet x8',          'St Michel Madeleines')
  add('Madeleines Mino Paquet x8',               'Mino Madeleines')
  add('Madeleines Coquilles St Michel Paquet x6','St Michel Madeleines Coquilles')
  add('Financiers Noisettes Paquet x6',          'Financiers noisettes')
  add('Cakes aux Fruits St Michel 300g',         'St Michel Cake Fruits')
  add('Cake Marbré Chocolat 300g',               'Cake Marbré chocolat')
  add('Gaufrettes Loacker Vanille Sachet 90g',   'Loacker Vanille')
  add('Gaufrettes Loacker Noisette Sachet 90g',  'Loacker Noisette')
  add('Gaufrettes Loacker Cacao Sachet 90g',     'Loacker Cacao')
  add('Gaufrettes Ulker Chocolat Sachet 90g',    'Ulker Gaufrettes chocolat')
  add('Gaufrettes Ulker Vanille Sachet 90g',     'Ulker Gaufrettes vanille')
  add('Gaufrettes Fourrés Chocolat Bimo Sachet 150g','Bimo Gaufrettes chocolat')
  for (const b of ['Chocolat Noir','Noisettes','Fruits Secs','Miel','Pomme-Cannelle','Cacao Cru']) {
    add(`Barre Céréale Saine ${b} (x1)`,      `Barre céréale ${b}`)
    add(`Barre Céréale Saine ${b} (Paquet x6)`,`Barre céréale ${b} pack`)
  }
  add('Barres de Muesli au Chocolat (Lot x10)','Muesli barre chocolat')
  for (const v of ['Noir 70%','Lait','Lait Noisettes','Lait Caramel','Oreo','Daim','Lait Fraise','Triple Chocolat','Amandes','Yaourt']) {
    add(`Chocolat Milka ${v} 100g`,                  `Milka ${v} 100g`)
    add(`Chocolat Milka ${v} 250g (Format familial)`,`Milka ${v} 250g`)
  }
  for (const v of ['Noir 70%','Noir 85%','Lait Noisettes','Lait Caramel','Blanc','Noir Amandes']) {
    add(`Chocolat Patisdecor ${v} 100g`, `Patisdecor ${v}`)
    add(`Chocolat Bellçaj ${v} 100g`,    `Bellcaj ${v}`)
    add(`Chocolat Côte d'Or ${v} 100g`,  `Cote Or ${v}`)
  }
  add('Chocolat Nestlé Noir Dessert 70% 100g', 'Nestlé Noir Dessert 70')
  add('Barre Kinder Bueno (Pack de 2)',   'Kinder Bueno 2')
  add('Barre Kinder Bueno (Individuelle)','Kinder Bueno individuel')
  add('Kinder Chocolate (Barre de 4)',   'Kinder Chocolate 4')
  add('Kinder Chocolate (Barre de 8)',   'Kinder Chocolate 8')
  add('Kinder Délice Paquet x4',         'Kinder Délice')
  add('Kinder Schoko-bons Boîte 200g',   'Kinder Schoko bons')
  add('Kinder Joy (x1 Oeuf)',            'Kinder Joy oeuf')
  for (const b of ['Mars','Snickers','Twix','Bounty','Milky Way',"M&M's",'Galaxy','Lion']) {
    add(`Barre Chocolatée ${b} (Individuelle)`,  `${b} barre chocolat`)
    add(`Barre Chocolatée ${b} (Multi-pack x4)`, `${b} multipack`)
  }
  add('Ferrero Rocher Boîte T8 (x8)',   'Ferrero Rocher T8')
  add('Ferrero Rocher Boîte T16 (x16)', 'Ferrero Rocher T16')
  add('Ferrero Rocher Boîte T24 (x24)', 'Ferrero Rocher T24')
  add('Raffaello Boîte x10',            'Raffaello boite')
  add('Nutella B-ready Paquet x4',      'Nutella B-ready')
  add('Nutella Biscuits Paquet x8',     'Nutella Biscuits')
  add('Bonbons Haribo Or Pik Sachet 200g','Haribo Or Pik')
  add('Bonbons Haribo Tagada Sachet 200g','Haribo Tagada')
  add('Bonbons Haribo Croco Sachet 200g', 'Haribo Croco')
  add('Bonbons Jelly Belly Sachet 100g',  'Jelly Belly')
  add('Dragées Chocolat Cémoi 200g',      'Cemoi dragées chocolat')
  add('Billes Crocantes Chocolat 100g',   'Billes chocolat croustillantes')
  for (const s of ['Nature Sel','Fromage','Barbecue','Ketchup','Crème & Oignons','Poulet Rôti','Piment','Vinaigre & Sel']) {
    add(`Chips Lay's ${s} Petit Format 80g`,    `Lays ${s} 80g`)
    add(`Chips Lay's ${s} Format Standard 150g`,`Lays ${s} 150g`)
    add(`Chips Lay's ${s} Grand Format 270g`,   `Lays ${s} 270g`)
    add(`Chips Mega ${s} 150g`,   `Mega chips ${s}`)
    add(`Chips Maison ${s} 150g`, `Chips maison ${s}`)
  }
  add('Chips Doritos Nachos Cheese 150g',      'Doritos Nachos Cheese')
  add('Chips Doritos Cool Original 150g',      'Doritos Cool Original')
  add('Chips Doritos Sweet Chili Pepper 150g', 'Doritos Sweet Chili')
  add('Chips Doritos Nachos Cheese 300g',      'Doritos Nachos 300g')
  add('Tortillas Chips Sel de Mer 200g',       'Tortillas chips sel mer')
  add('Biscuits Apéritifs Curly Sachet 180g',  'Curly apéritifs')
  add('Biscuits Apéritifs Cacahuètes enrobées 200g','Cacahuètes enrobées biscuits')
  add('Cacahuètes Salées Sachet 200g',  'Cacahuètes salées 200g')
  add('Cacahuètes Salées Sachet 500g',  'Cacahuètes salées 500g')
  add('Fruits Secs Mélange Apéritif 200g','Fruits secs mélange apéro')
  add('Noix de Cajou Grillées 200g',    'Cajou grillées')
  add('Amandes Grillées & Salées 200g', 'Amandes grillées salées')
  add('Olives Noires Apéritifs Dénoyautées Sachet 200g','Olives noires apéro')
  add('Feuilletés apéritifs Fromage Sachet 250g','Feuilletés fromage apéritif')
  add('Chips de Pommes de Terre Fines 200g',   'Chips pommes terre fines')
  add('Palets Bretons Apéritifs 200g',          'Palets Bretons')
  add('Pop-corn Ready Microwave Salé x3',        'Popcorn micro-ondes salé')
  add('Pop-corn Ready Microwave Caramel x3',     'Popcorn micro-ondes caramel')
  add('Pop-corn Butterkist Prêt à manger 200g',  'Butterkist popcorn')
  for (const g of ['Vanille','Chocolat','Fraise','Café','Pistache','Noix de Coco','Cookies & Cream','Caramel Beurre Salé']) {
    add(`Glace Pot Familial ${g} 1L`,  `Glace pot 1L ${g}`)
    add(`Cornet Glace ${g} (x1)`,      `Cornet glace ${g}`)
    add(`Bâtonnet Glace ${g} (x1)`,    `Bâtonnet glace ${g}`)
  }
  add('Glace Magnum Classic (x1)',          'Magnum Classic')
  add('Glace Magnum Classic (Boîte x6)',    'Magnum Classic boite 6')
  add('Glace Cornetto Classique (x1)',      'Cornetto classique')
  add('Glace Cornetto Classique (Boîte x6)','Cornetto boite 6')
  add('Glace Sorbets 100% Fruits 750ml',    'Sorbet fruits 750ml')

  // ── 7. Petit-déjeuner & Tartinables ──────────────────────────
  add('Café Nescafé Classic Pot 50g',  'Nescafe Classic 50g')
  add('Café Nescafé Classic Pot 100g', 'Nescafe Classic 100g')
  add('Café Nescafé Classic Pot 200g', 'Nescafe Classic 200g')
  add('Café Nescafé Classic Pot 400g', 'Nescafe Classic 400g')
  add('Café Nescafé Gold Pot 100g',    'Nescafe Gold 100g')
  add('Café Nescafé Gold Pot 200g',    'Nescafe Gold 200g')
  add('Café Nescafé Express Stick (x25)','Nescafe sticks x25')
  add('Café Carte Noire Pot 100g',     'Carte Noire 100g')
  add('Café Carte Noire Pot 200g',     'Carte Noire 200g')
  add('Café Moulu Mokador 250g',       'Mokador 250g')
  add('Café Moulu Mokador 500g',       'Mokador 500g')
  add('Café Moulu Dahbi 250g',         'Dahbi café 250g')
  add('Café Moulu Dahbi 500g',         'Dahbi café 500g')
  add('Café Grains 1kg',               'Café grains 1kg')
  add('Café Grains Arabica 500g',      'Café Arabica 500g')
  add('Café Nespresso Compatibles Capsules x10','Nespresso capsules x10')
  add('Café Nespresso Compatibles Capsules x30','Nespresso capsules x30')
  add('Café en dosettes Senseo x36',   'Senseo dosettes')
  add('Thé Vert Sultan Boîte 100g',    'Sultan thé vert 100g')
  add('Thé Vert Sultan Boîte 200g',    'Sultan thé vert 200g')
  add('Thé Vert Sultan Boîte 500g',    'Sultan thé vert 500g')
  add('Thé Vert Sultan Boîte 1kg',     'Sultan thé vert 1kg')
  add('Thé Vert Sultan Vrac 2kg',      'Sultan thé vert 2kg vrac')
  add('Thé Vert Alwazah 500g',         'Alwazah thé vert 500g')
  add('Thé Vert Alwazah 1kg',          'Alwazah thé vert 1kg')
  add('Thé Noir 555 Boîte 100g',       '555 thé noir')
  add('Thé Noir 555 Boîte 500g',       '555 thé noir 500g')
  add('Thé Noir Lipton Yellow Label Boîte 100g','Lipton Yellow Label')
  add('Thé Infusions 4 Saveurs x20 sachets',    'Infusions 4 saveurs sachets')
  for (const t of ['Menthe','Verbena','Tilleul','Thym','Romarin',"Fleur d'Oranger",'Camomille','Gingembre-Citron','Rooibos']) {
    add(`Tisane / Infusion ${t} (x20 sachets)`, `Tisane ${t}`)
    add(`Infusion Bio ${t} (x20 sachets)`,       `Infusion Bio ${t}`)
  }
  add('Maté en Poudre 500g', 'Maté poudre 500g')
  for (const s of ['Fraise','Abricot','Figue','Groseille','Framboise','Pêche','Orange Amère','Marmelade','Pruneau','Fruits Rouges','Coing','Pomme']) {
    add(`Confiture Aïcha ${s} Bocal 500g`,       `Aicha confiture ${s} 500g`)
    add(`Confiture Aïcha ${s} Bocal 1kg`,         `Aicha confiture ${s} 1kg`)
    add(`Confiture Extra Taillefine ${s} 375g`,   `Taillefine confiture ${s}`)
  }
  add('Pâte à Tartiner Nocilla 200g',          'Nocilla 200g')
  add('Pâte à Tartiner Nocilla 400g',          'Nocilla 400g')
  add('Pâte à Tartiner Nocilla 750g',          'Nocilla 750g')
  add('Pâte à Tartiner Choco 200g',            'Choco pâte tartiner 200g')
  add('Pâte à Tartiner Choco 400g',            'Choco pâte tartiner 400g')
  add('Pâte à Tartiner Nutella Ferrero 200g',  'Nutella 200g')
  add('Pâte à Tartiner Nutella Ferrero 400g',  'Nutella 400g')
  add('Pâte à Tartiner Nutella Ferrero 750g',  'Nutella 750g')
  add('Pâte à Tartiner Nutella Ferrero 1kg',   'Nutella 1kg')
  add('Pâte à Tartiner Bimo Choco Noisettes 400g','Bimo Choco Noisettes pâte')
  add('Miel de Fleurs Naturel 250g',   'Miel fleurs naturel 250g')
  add('Miel de Fleurs Naturel 500g',   'Miel fleurs 500g')
  add('Miel de Fleurs Naturel 1kg',    'Miel fleurs 1kg')
  add('Miel de Thym Pur 250g',         'Miel thym 250g')
  add('Miel de Thym Pur 500g',         'Miel thym 500g')
  add("Miel d'Eucalyptus 250g",        'Miel eucalyptus 250g')
  add("Miel d'Oranger Amer 250g",      'Miel oranger 250g')
  add('Miel de Jujubier (Sidr) 500g',  'Miel Sidr jujubier')
  add('Crème de Miel à Tartiner 500g', 'Crème miel tartiner')
  for (const c of ['Chocapic','Nesquik','Lion','Corn Flakes','Lucky Charms','Frosties','Cini Minis','Honey Stars','Miel Pops','Special K','Fitness','Bran Flakes','Muesli 5 Fruits','Rice Krispies','All Bran']) {
    add(`Céréales Nestlé ${c} Boîte 375g`,          `Nestlé ${c} 375g`)
    add(`Céréales Nestlé ${c} Boîte 500g`,          `Nestlé ${c} 500g`)
    add(`Céréales Nestlé ${c} Format Familial 750g`,`Nestlé ${c} 750g`)
  }
  add('Sucre en Morceaux Paquet 1kg',  'Sucre morceaux 1kg')
  add('Sucre en Morceaux Paquet 2kg',  'Sucre morceaux 2kg')
  add('Sucre Semoule Sachet 1kg',      'Sucre semoule 1kg')
  add('Sucre Semoule Sachet 2kg',      'Sucre semoule 2kg')
  add('Sucre Semoule Sachet 5kg',      'Sucre semoule 5kg')
  add('Sucre Glace 500g',              'Sucre glace 500g')
  add('Sucre Roux / Cassonade 1kg',    'Cassonade sucre roux')
  add('Sucre Vergeoise 500g',          'Vergeoise sucre')
  add('Édulcorant Canderel Boîte x1000 comprimés','Canderel edulcorant')
  add('Sucre Stick (x100)',            'Sucre stick x100')
  add('Pain de Mie Crépière Nature 500g','Pain mie Crépière nature')
  add('Pain de Mie Grande Tranches 500g','Pain mie grandes tranches')
  add('Pain de Mie Brioché 400g',       'Pain mie brioché')
  add('Pain au Chocolat Bimo Paquet x4','Bimo pain chocolat')
  add('Croissants Beurre Bimo Paquet x4','Bimo croissants beurre')
  add('Brioche Tressée St Michel 400g', 'St Michel brioche tressée')
  add('Brioche Butchy Paquet x10',      'Butchy brioche')
  add('Pâte de Noisettes Torréfiées 350g','Noisettes torréfiées pâte')
  add('Crème de Marron 500g',           'Crème marron 500g')
  add('Crêpes Prêtes à Garnir Paquet x8','Crêpes prêtes garnir')
  add('Gaufres Sucrees Paquet x8',      'Gaufres sucrées')
  add("Crêpes Fines Prêtes à l'Emporter x10",'Crêpes fines à emporter')

  // ── 8. Hygiène Corporelle ─────────────────────────────────────
  for (const p of ["Lait d'Avoine",'Aloe Vera','Fleur de Jasmin','Rose','Lavande','Miel',"Lait d'Amande",'Coco']) {
    add(`Savon Liquide Mains Palmolive ${p} 500ml`,   `Palmolive savon liquide ${p} 500ml`)
    add(`Savon Liquide Mains Palmolive ${p} Recharge 1L`,`Palmolive savon recharge ${p}`)
    add(`Savon Liquide Mains Dettol ${p} 500ml`,      `Dettol savon ${p} 500ml`)
  }
  add('Savon Liquide Antibactérien Dettol Original 500ml','Dettol antibactérien 500ml')
  add('Savon Moussant Flacon Pompe 500ml',               'Savon moussant pompe')
  for (const s of ['Taous','Lux','Dove Original','Dove Pivoine','Dove Noix de Coco','Palmolive Classique','Palmolive Aloe','Fa','Lifebuoy','Mydal']) {
    add(`Savon Solide ${s} (Unité 125g)`, `Savon ${s} 125g`)
    add(`Savon Solide ${s} (Lot de 4)`,   `Savon ${s} lot 4`)
    add(`Savon Solide ${s} (Lot de 8)`,   `Savon ${s} lot 8`)
  }
  for (const p of ["Lait d'Avoine",'Original','Jasmin',"Fleur d'Oranger",'Coco','Grenade','Lavande','Noisette','Café','Fraîcheur Marine']) {
    add(`Gel Douche Palmolive ${p} 250ml`, `Palmolive gel douche ${p} 250ml`)
    add(`Gel Douche Palmolive ${p} 500ml`, `Palmolive gel douche ${p} 500ml`)
    add(`Gel Douche Palmolive ${p} 1L`,    `Palmolive gel douche ${p} 1L`)
  }
  for (const p of ['Aqua Pure','Fresh','Active','Aloe Vera','Coton','Océan']) {
    add(`Gel Douche Fa ${p} 250ml`, `Fa gel douche ${p} 250ml`)
    add(`Gel Douche Fa ${p} 500ml`, `Fa gel douche ${p} 500ml`)
  }
  for (const p of ['Original','Pivoine','Rêve Indulgent','Beurre de Karité','Aloe','Miel']) {
    add(`Gel Douche Dove ${p} 250ml`, `Dove gel douche ${p} 250ml`)
    add(`Gel Douche Dove ${p} 500ml`, `Dove gel douche ${p} 500ml`)
  }
  for (const p of ['Noix de Coco','Cocoa Butter','Fleurs de Coton',"Lait d'Avoine",'Minéral','Fraîcheur Extrême','Coco & Jacaranda']) {
    add(`Gel Douche Nivea ${p} 250ml`,           `Nivea gel douche ${p} 250ml`)
    add(`Gel Douche Nivea ${p} 500ml`,           `Nivea gel douche ${p} 500ml`)
    add(`Gel Douche Nivea ${p} Format Familial 1L`,`Nivea gel douche ${p} 1L`)
  }
  add('Gel Douche Gommant Exfoliant 200ml', 'Gel douche gommant exfoliant')
  add('Savon Noir Beldi 250g',              'Savon noir Beldi 250g')
  add('Gant de Hammam Kessa x1',            'Gant kessa hammam')
  add('Luffa Éponge Végétale x1',           'Luffa éponge végétale')
  for (const p of ['Lait Hydratant','Cacao et Karité','Pivoine','Aloe Vera',"Huile d'Argan",'Beurre de Karité','Oléo-Calcaire']) {
    add(`Lait Hydratant Corps Palmolive ${p} 250ml`, `Palmolive lait corps ${p} 250ml`)
    add(`Lait Hydratant Corps Palmolive ${p} 400ml`, `Palmolive lait corps ${p} 400ml`)
    add(`Crème Corps Nivea ${p} 250ml`,              `Nivea crème corps ${p} 250ml`)
    add(`Crème Corps Nivea ${p} 400ml`,              `Nivea crème corps ${p} 400ml`)
    add(`Crème Corps Dove ${p} 250ml`,               `Dove crème corps ${p} 250ml`)
  }
  add('Vaseline Pure Jelly 100ml',             'Vaseline Pure Jelly 100ml')
  add('Vaseline Pure Jelly 250ml',             'Vaseline Pure Jelly 250ml')
  add("Huile d'Argan Corps & Cheveux 250ml",   "Huile Argan corps cheveux 250ml")
  add("Huile d'Amande Douce 250ml",            'Huile amande douce 250ml')
  for (const d of ['Original Blanc','Total','Whitenings Blancheur','Gencives Sensibles','Expert Gencives','Charbon Actif','Fluor Intense','Enfants Fraise','Enfants Bubble Gum']) {
    add(`Dentifrice Colgate ${d} 75ml`,  `Colgate ${d} 75ml`)
    add(`Dentifrice Colgate ${d} 125ml`, `Colgate ${d} 125ml`)
    add(`Dentifrice Signal ${d} 75ml`,   `Signal ${d} 75ml`)
    add(`Dentifrice Signal ${d} 125ml`,  `Signal ${d} 125ml`)
  }
  add('Dentifrice Fluocaril Bi-Fluoré 250 75ml', 'Fluocaril 250 75ml')
  add('Dentifrice Fluocaril Bi-Fluoré 250 125ml','Fluocaril 250 125ml')
  add('Dentifrice Elmex Caries Protection 75ml', 'Elmex caries 75ml')
  for (const t of ['Brosse à Dents Classique Souple','Brosse à Dents Classique Medium','Brosse à Dents Medium','Brosse à Dents Junior 6-12 ans','Brosse à Dents Enfants 3-6 ans']) {
    add(`${t} (Colgate x1)`,       `Colgate ${t}`)
    add(`${t} (Colgate Lot de 4)`, `Colgate ${t} lot 4`)
    add(`${t} (Signal x1)`,        `Signal ${t}`)
  }
  add('Bain de Bouche Listerine Total Care 500ml',       'Listerine Total Care 500ml')
  add('Bain de Bouche Listerine Fraîcheur Glacier 500ml','Listerine Fraîcheur Glacier')
  add('Bain de Bouche Colgate Plax 500ml',               'Colgate Plax 500ml')
  add('Bain de Bouche Diarh 500ml',                      'Diarh bain bouche 500ml')
  add('Fil Dentaire Colgate x50m',                       'Colgate fil dentaire')
  for (const c of ['Réparation Longs Cheveux','Nutrition Intense','Brillance et Volume','Lissage','Kératine',"Huile d'Argan",'Anti-Chute','Huile de Ricin']) {
    add(`Shampooing Elsève L'Oréal ${c} 250ml`, `Elsève ${c} 250ml`)
    add(`Shampooing Elsève L'Oréal ${c} 400ml`, `Elsève ${c} 400ml`)
    add(`Après-Shampooing Elsève L'Oréal ${c} 250ml`, `Elsève après-shampooing ${c}`)
  }
  for (const c of ['Classic Clean','Argan Oil','Smooth & Silky','Anti-Pelliculaire','Strenght & Length','Detox & Hydratation','Hair Fall Resist']) {
    add(`Shampooing Head & Shoulders ${c} 250ml`, `Head Shoulders ${c} 250ml`)
    add(`Shampooing Head & Shoulders ${c} 400ml`, `Head Shoulders ${c} 400ml`)
  }
  for (const c of ['Brillance & Lisse','Anti-Casse Volume','Nutrition Profonde','Réparation Ultime']) {
    add(`Shampooing Pantene Pro-V ${c} 250ml`, `Pantene Pro-V ${c} 250ml`)
    add(`Shampooing Pantene Pro-V ${c} 400ml`, `Pantene Pro-V ${c} 400ml`)
  }
  for (const c of ['Bain de Shampoing Grenade',"Bain de Shampoing Huile d'Olive",'Shampoing Karité','Shampoing Nourricier Coco','Shampoing Ultra Doux Bébé',"Shampoing Miel & Fleur d'Oranger"]) {
    add(`Shampooing Garnier Ultra Doux ${c} 250ml`, `Garnier Ultra Doux ${c} 250ml`)
    add(`Shampooing Garnier Ultra Doux ${c} 400ml`, `Garnier Ultra Doux ${c} 400ml`)
  }
  add('Shampoing Sec Batiste Original 200ml',      'Batiste shampoing sec')
  add('Masque Réparateur Cheveux 250ml',            'Masque réparateur cheveux')
  add("Huile de Cheveux Huile Prodige Elsève 100ml",'Elsève Huile Prodige')
  add('Crème Visage Nivea Soft Pot 100ml',          'Nivea Soft 100ml')
  add('Crème Visage Nivea Creme Original Pot 100ml','Nivea Creme Original 100ml')
  add('Crème Visage Hydratante Nivea Aqua 24h 50ml','Nivea Aqua 24h 50ml')
  add('Crème Visage Mixa Peaux Sensibles 50ml',     'Mixa peaux sensibles')
  add('Crème Solaire Visage Nivea SPF 30 50ml',     'Nivea solaire visage SPF30')
  add('Crème Solaire Corps Nivea SPF 30 200ml',     'Nivea solaire corps SPF30')
  add('Crème Solaire Indice 50 200ml',              'Crème solaire indice 50 200ml')
  add('Brume Solaire Sèche SPF 30 200ml',           'Brume solaire sèche SPF30')
  add('Après-Soleil Réparateur 200ml',              'Après-soleil réparateur')
  add('Eau Micellaire Démaquillante 400ml',         'Eau micellaire démaquillante')
  add('Lait Démaquillant 400ml',                    'Lait démaquillant 400ml')
  add('Lingettes Démaquillantes x25',               'Lingettes démaquillantes')
  add('Baume à Lèvres Nivea Cherry (x1)',           'Nivea Cherry baume lèvres')
  add('Baume à Lèvres Nivea Original (x1)',         'Nivea Original baume lèvres')
  add('Baume à Lèvres Nivea Aloe Vera (x1)',        'Nivea Aloe Vera baume lèvres')
  add('Stick Solaire Lèvres SPF 30',                'Stick solaire lèvres SPF30')
  for (const d of ['Men Invisible Dry','Men Cool Kick','Pearl & Beauty','Natural Coconut','Fresh Active','Whitening','NIVEA Men Dry Impact']) {
    add(`Déodorant Spray Nivea ${d} 150ml`, `Nivea déodorant spray ${d}`)
    add(`Déodorant Bille Nivea ${d} 50ml`,  `Nivea déodorant bille ${d}`)
  }
  for (const d of ['Classic','Cobalt','Men Aqua','Women Dry','Aloe Vera']) {
    add(`Déodorant Spray Rexona ${d} 150ml`, `Rexona déodorant ${d} spray`)
    add(`Déodorant Bille Rexona ${d} 50ml`,  `Rexona déodorant ${d} bille`)
  }
  for (const d of ['Africa','Anarchy','Temptation','Marine','Clique','Sport Blast']) {
    add(`Déodorant Spray Axe ${d} 150ml`, `Axe déodorant ${d}`)
    add(`Déodorant Bille Axe ${d} 50ml`,  `Axe bille ${d}`)
  }
  for (const d of ['Aqua','Fresh','Ocean','Mousse']) {
    add(`Déodorant Spray Fa ${d} 150ml`, `Fa déodorant ${d} spray`)
    add(`Déodorant Bille Fa ${d} 50ml`,  `Fa déodorant ${d} bille`)
  }
  for (const s of ['Normal','Extra Long','Nuit','Ultra','Slim','Ailes Normales','Ailes Longues']) {
    add(`Serviettes Hygiéniques Always ${s} Paquet x10`, `Always ${s} x10`)
    add(`Serviettes Hygiéniques Always ${s} Paquet x14`, `Always ${s} x14`)
    add(`Serviettes Hygiéniques Nana ${s} Paquet x10`,   `Nana ${s} x10`)
    add(`Serviettes Hygiéniques Libresse ${s} Paquet x10`,`Libresse ${s} x10`)
  }
  add('Protections Journalistes Nana Paquet x30',         'Nana protège-slip x30')
  add('Protections Journalistes Always Dailies Paquet x30','Always Dailies x30')
  add('Tampons Natracare x16',         'Natracare tampons')
  add('Coupe Menstruelle Taille S',    'Coupe menstruelle taille S')
  add('Coupe Menstruelle Taille M',    'Coupe menstruelle taille M')
  for (const r of ['Gillette Blue II Jetables x5','Gillette Blue II Plus Jetables x5','Gillette Mach3 Jetables x2','Gillette Venus Breeze Jetables x2','Gillette Venus Smooth Jetables x3','Gillette Fusion5 Jetables x2','Bic Jambes Jetables x5']) {
    add(`Rasoir Jetable ${r}`, `Rasoir ${r}`)
  }
  add('Recharges Gillette Mach3 x4',     'Gillette Mach3 recharges x4')
  add('Recharges Gillette Fusion5 x4',   'Gillette Fusion5 recharges x4')
  add('Recharges Gillette Venus x4',     'Gillette Venus recharges x4')
  add('Mousse à Raser Gillette Classic 200ml','Gillette mousse raser Classic')
  add('Gel de Rasage Gillette Sensitive 200ml','Gillette gel rasage Sensitive')
  add('Crème Epilatoire Nair Corps 200ml','Nair crème épilatoire corps')
  add('Bandes de Cire Froide x20 (Jambes)','Cire froide bandes jambes')
  add('Cire Orientale 400g (Pot)',        'Cire orientale pot')
  add('Cotons Démaquillants x100',        'Cotons démaquillants x100')
  add('Cotons Démaquillants x200',        'Cotons démaquillants x200')
  add('Cotons Ronds x80',                 'Cotons ronds x80')
  add('Gel Toilette Intime Femme 250ml',  'Gel toilette intime femme')
  add('Lingettes Intimes x20',            'Lingettes intimes x20')

  // ── 9. Entretien & Maison ─────────────────────────────────────
  for (const p of ['Original','Sensitive Peaux Sensibles','Fraîcheur Océan','Lavande','Jasmin','Color (Protéger Couleurs)','Noir (Noirs & foncés)','2 en 1 Adoucissant','Pro-Expert']) {
    add(`Lessive Liquide OMO ${p} 1.5L (30 lavages)`, `OMO lessive ${p} 1.5L`)
    add(`Lessive Liquide OMO ${p} 3L (60 lavages)`,   `OMO lessive ${p} 3L`)
    add(`Lessive Liquide OMO ${p} 4.5L (90 lavages)`, `OMO lessive ${p} 4.5L`)
  }
  for (const p of ['Classic','Fresh Scent','Lily of the Valley','Ultra White']) {
    add(`Lessive Liquide Tide ${p} 1.5L`, `Tide lessive ${p} 1.5L`)
    add(`Lessive Liquide Tide ${p} 3L`,   `Tide lessive ${p} 3L`)
  }
  for (const p of ['Original','Peaux Sensibles','Blancheur +++','Couleurs']) {
    add(`Lessive Liquide Ariel ${p} 1.5L`, `Ariel lessive ${p} 1.5L`)
    add(`Lessive Liquide Ariel ${p} 3L`,   `Ariel lessive ${p} 3L`)
  }
  add('Lessive en Poudre Ariel Classique 2kg', 'Ariel poudre 2kg')
  add('Lessive en Poudre Ariel Classique 5kg', 'Ariel poudre 5kg')
  add('Lessive en Poudre OMO Classique 2kg',   'OMO poudre 2kg')
  add('Lessive en Poudre OMO Classique 5kg',   'OMO poudre 5kg')
  add('Lessive en Poudre Max Classique 2kg',   'Max poudre 2kg')
  add('Lessive en Poudre Max Classique 5kg',   'Max poudre 5kg')
  add('Lessive en Poudre Dat Classique 2kg',   'Dat poudre 2kg')
  add('Lessive en Poudre Dat Classique 5kg',   'Dat poudre 5kg')
  add('Lessive Capsules Ariel All in 1 x25 pods','Ariel capsules x25')
  add('Lessive Capsules Ariel All in 1 x50 pods','Ariel capsules x50')
  add('Lessive Capsules OMO Ultimate x25 pods', 'OMO Ultimate capsules x25')
  add('Lessive Capsules Tide PODS x25',          'Tide PODS x25')
  for (const p of ['Bleu Classique','Rose','Vanille','Lavande','Fleurs Blanches','Océan','Coton']) {
    add(`Adoucissant Soupline ${p} 750ml`, `Soupline ${p} 750ml`)
    add(`Adoucissant Soupline ${p} 1.5L`,  `Soupline ${p} 1.5L`)
    add(`Adoucissant Soupline ${p} 2.5L`,  `Soupline ${p} 2.5L`)
  }
  add('Détachant en Poudre Vanish Oxi Action 500g', 'Vanish Oxi Action 500g')
  add('Détachant en Poudre Vanish Oxi Action 1kg',  'Vanish Oxi Action 1kg')
  add('Détachant Spray Vanish Blanc 500ml',           'Vanish spray blanc')
  add('Détachant Spray Vanish Couleurs 500ml',        'Vanish spray couleurs')
  add('Détachant Stick Dr Beckmann 100ml',            'Dr Beckmann stick détachant')
  for (const p of ['Citron','Pamplemousse','Menthe','Original','Jasmin','Agrumes']) {
    add(`Liquide Vaisselle Express ${p} 1L`, `Express vaisselle ${p} 1L`)
    add(`Liquide Vaisselle Express ${p} 2L`, `Express vaisselle ${p} 2L`)
    add(`Liquide Vaisselle Express ${p} 5L`, `Express vaisselle ${p} 5L`)
    add(`Liquide Vaisselle Dix ${p} 1L`,     `Dix vaisselle ${p} 1L`)
    add(`Liquide Vaisselle Dix ${p} 2L`,     `Dix vaisselle ${p} 2L`)
    add(`Liquide Vaisselle Jar ${p} 500ml`,  `Jar vaisselle ${p} 500ml`)
    add(`Liquide Vaisselle Jar ${p} 1L`,     `Jar vaisselle ${p} 1L`)
    add(`Liquide Vaisselle Fairy ${p} 500ml`,`Fairy ${p} 500ml`)
    add(`Liquide Vaisselle Fairy ${p} 1L`,   `Fairy ${p} 1L`)
    add(`Liquide Vaisselle Sonnu ${p} 750ml`,`Sonnu vaisselle ${p}`)
  }
  add('Capsules Lave-Vaisselle Finish All in 1 x30','Finish All in 1 x30')
  add('Capsules Lave-Vaisselle Finish All in 1 x60','Finish All in 1 x60')
  add('Poudre Lave-Vaisselle Finish 2kg',            'Finish poudre lave-vaisselle')
  add('Pastilles Lave-Vaisselle Calgonit x30',       'Calgonit pastilles x30')
  add('Sel Lave-Vaisselle 2kg',                       'Sel lave-vaisselle 2kg')
  add('Liquide Rinçage Lave-Vaisselle Finish 800ml',  'Finish rinçage 800ml')
  add('Anti-Calcaire Lave-Vaisselle',                 'Anti-calcaire lave-vaisselle')
  add('Javel Sanizor Classique 1L', 'Javel Sanizor 1L')
  add('Javel Sanizor Classique 2L', 'Javel Sanizor 2L')
  add('Javel Sanizor Classique 5L', 'Javel Sanizor 5L')
  add('Javel Kriz Classique 1L',    'Javel Kriz 1L')
  add('Javel Kriz Classique 2L',    'Javel Kriz 2L')
  add('Javel Ace Classique 1L',     'Javel Ace 1L')
  add('Javel Ace Classique 2L',     'Javel Ace 2L')
  add('Javel Sanytol Désinfectant Multi-Surface 1L','Sanytol désinfectant')
  for (const p of ['Pin','Lavande','Citron','Fleurs Fraîches','Agrumes']) {
    add(`Nettoyant Sols Ecover ${p} 1L`,             `Ecover sols ${p}`)
    add(`Nettoyant Sols Classique ${p} 1L`,          `Nettoyant sols ${p} 1L`)
    add(`Nettoyant Sols Ultra Détergent ${p} 2L`,    `Ultra détergent ${p} 2L`)
  }
  add('Nettoyant Multi-Usage Ajax Citron 1L',       'Ajax Citron 1L')
  add('Nettoyant Multi-Usage Ajax Fleurs Blanches 1L','Ajax Fleurs Blanches')
  add('Nettoyant Multi-Usage Ajax 2L',               'Ajax multi-usage 2L')
  add('Nettoyant Multi-Surface St Marc 1L',          'St Marc multi-surface')
  add('Dégraissant Cif Original Crème 500ml',        'Cif Original crème')
  add('Dégraissant Cif Original Spray 750ml',        'Cif Original spray')
  add('Nettoyant Vitres & Écrans Cif Spray 500ml',   'Cif vitres spray')
  add('Nettoyant Vitres Windex 500ml',               'Windex vitres')
  add('Nettoyant Vitres et Fenêtres 1L',             'Nettoyant vitres 1L')
  add("Crème à Récurer (Pierre d'argile) 500g",      'Pierre argile récurer')
  add('Bicarbonate Alimentaire & Nettoyage 1kg',     'Bicarbonate nettoyage 1kg')
  add('Vinaigre Blanc Ménager 1L',  'Vinaigre blanc ménager 1L')
  add('Vinaigre Blanc Ménager 2L',  'Vinaigre blanc ménager 2L')
  add('Savon Noir Ménager 1L',      'Savon noir ménager 1L')
  add('Terre de Sommières 500g',    'Terre Sommières 500g')
  add('Gel WC Nettoyant Domestos Classique 750ml', 'Domestos classique 750ml')
  add('Gel WC Nettoyant Domestos Bleu 750ml',      'Domestos bleu 750ml')
  add('Gel WC Cillit Bang Désinfectant 750ml',      'Cillit Bang WC désinfectant')
  add('Bloc WC Culligan x1 (pendentif)',             'Bloc WC Culligan')
  add('Brosse WC + Support',                         'Brosse WC support')
  add('Nettoyant pour Lait & Calcaire Cillit Bang 750ml','Cillit Bang anti-calcaire')
  add('Détartrant Machine à Laver 250ml',            'Détartrant machine laver')
  add('Détartrant Bouilloire et Cafetière 250ml',    'Détartrant bouilloire cafetière')
  for (const m of ['Papicolor','Floral','Sofia','OK','Lotus','Kleenex'])
    for (const f of ['4','6','12','24'])
      add(`Papier Toilette ${m} (Pack de ${f} rouleaux)`, `Papier Toilette ${m} ${f}`)
  for (const m of ['Essuie-tout Papicolor','Essuie-tout OK','Essuie-tout Lotus','Essuie-tout Maxi','Essuie-tout Sofia'])
    for (const f of ['2','4','6'])
      add(`${m} (Pack de ${f})`, `${m} pack ${f}`)
  add('Mouchoirs Kleenex Boîte x100', 'Kleenex mouchoirs x100')
  add('Mouchoirs Kleenex Boîte x200', 'Kleenex mouchoirs x200')
  add('Mouchoirs Pochette x10',       'Mouchoirs pochette x10')
  for (const t of ['30L','50L','100L','120L']) {
    add(`Sacs Poubelle ${t} (Rouleau x20)`,            `Sacs poubelle ${t}`)
    add(`Sacs Poubelle ${t} Extra Résistant (x20)`,    `Sacs poubelle résistant ${t}`)
    add(`Sacs Poubelle ${t} Tri Sélectif (x30)`,       `Sacs tri sélectif ${t}`)
  }
  add('Sacs à Ordures Punaisés x100 (Petits)',     'Sacs ordures punaisés')
  add('Éponges Grattantes (Pack de 2)',             'Éponges grattantes x2')
  add('Éponges Grattantes (Pack de 5)',             'Éponges grattantes x5')
  add('Éponges Grattantes (Pack de 10)',            'Éponges grattantes x10')
  add('Éponge Spéciale Anti-Rayure x3',             'Éponge anti-rayure x3')
  add('Chiffons Microfibres x5 (Sols/Vitres)',      'Chiffons microfibres x5')
  add('Chiffons Microfibres x10',                   'Chiffons microfibres x10')
  add('Lave-Vaisselle en Fibre x10',                'Lave-vaisselle fibre x10')
  add('Gants de Ménage Latex (Lot de 2)',           'Gants ménage latex x2')
  add('Gants de Ménage Latex (Lot de 6)',           'Gants ménage latex x6')
  add('Balai + Balayette (Kit)',                     'Balai balayette kit')
  add('Balai Microfibre Plat',                       'Balai microfibre plat')
  add('Serpillière 100% Coton (Lot de 2)',           'Serpillière coton lot 2')
  add('Seau avec Essoreuse 10L',                     'Seau essoreuse 10L')
  add('Pelle à Poussière + Brosse',                  'Pelle poussière brosse')
  add('Pince Linge (Lot de 24)',                     'Pince linge lot 24')
  add('Étendoir à Linge Tubulaire',                  'Étendoir linge tubulaire')
  add('Filet de Lavage Linge Délicat x3',            'Filet lavage délicat x3')
  add('Désodorisant Maison Glade Lavande 300ml',     'Glade lavande 300ml')
  add('Désodorisant Maison Glade Vanille 300ml',     'Glade vanille 300ml')
  add('Désodorisant Spray Air Wick Océan 300ml',     'Air Wick océan 300ml')
  add("Diffuseur Parfums d'Ambiance Febreze",        'Febreze diffuseur ambiance')
  add('Bougie Parfumée Vanille 180g',                'Bougie vanille 180g')
  add('Bougie Parfumée Lavande 180g',                'Bougie lavande 180g')
  add('Bougie Parfumée Fleur de Coton 180g',         'Bougie fleur coton 180g')
  add('Bougie Parfumée Ylang 180g',                  'Bougie ylang 180g')
  add('Encens Bâtonnets (Paquet x50)',               'Encens bâtonnets x50')
  add('Bâtonnets Parfumés Diffuseur Rose 100ml',     'Diffuseur rose bâtonnets')
  add('Raid Spray Anti-Moustiques 400ml',            'Raid anti-moustiques spray')
  add('Raid Diffuseur Électrique Anti-Moustiques',   'Raid diffuseur électrique')
  add('Spirales Anti-Moustiques (Boîte x30)',        'Spirales anti-moustiques x30')
  add('Anti-Cafards Gel Injectable',                 'Anti-cafards gel')
  add('Anti-Fourmis Granulés 500g',                  'Anti-fourmis granulés')
  add('Naphthalène 500g',                            'Naphthalène 500g')
  add('Pastilles Anti-Mites x40',                    'Pastilles anti-mites x40')
  add('Poubelle Cuisine à Pédale 30L',               'Poubelle pédale cuisine 30L')
  add('Poubelle Tri Sélectif 3 Compartiments 40L',   'Poubelle tri sélectif 40L')
  add('Boîtes de Rangement (Lot de 5) 4L',           'Boîtes rangement lot 5')
  add('Boîte de Rangement Hermétique 20L',           'Boîte hermétique 20L')
  add('Boîte de Rangement Hermétique 45L',           'Boîte hermétique 45L')
  add('Cling Film Rouleau 30m',                       'Cling film rouleau 30m')
  add('Papier Aluminium Rouleau 10m',                 'Papier aluminium 10m')
  add('Papier Cuisson / Parchemin Rouleau 10m',       'Papier cuisson parchemin')
  add('Sachets Congélation Zip (Lot x20)',            'Sachets congélation zip x20')
  add('Boîtes Repas Préparés Micro-Ondables x5',      'Boîtes micro-ondes x5')
  add('Ampoule LED E27 10W (Pack de 3)',              'Ampoule LED E27 10W x3')
  add('Ampoule LED E27 15W (Pack de 3)',              'Ampoule LED E27 15W x3')
  add('Ampoule LED GU10 5W (Lot de 5)',               'Ampoule LED GU10 5W x5')
  add('Bougie électrique LED (Lot de 6)',             'Bougie électrique LED x6')
  add('Piles AA Duracell (Lot de 4)',                 'Duracell AA x4')
  add('Piles AAA Duracell (Lot de 4)',                'Duracell AAA x4')
  add('Piles 9V x1',                                  'Pile 9V')
  add('Chargeur USB Double Prise Secteur',            'Chargeur USB double prise')
  add('Kit Couture Complet (Aiguilles, fils, épingles)','Kit couture aiguilles fils')
  add('Rouleau de Colle Néoprène',                   'Colle néoprène rouleau')
  add('Scotch Transparent Grand Format',              'Scotch transparent grand')
  add('Scotch Double Face 5m',                        'Scotch double face 5m')
  add('Ruban Adhésif Toilé 50mm',                    'Ruban adhésif toilé 50mm')
  add('Cutter + Lames x10',                           'Cutter lames x10')
  add('Ciseaux Multi-usages Paire',                   'Ciseaux multi-usages')

  return list
}

// ── Terminal colors ───────────────────────────────────────────────
const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  gray:   s => `\x1b[90m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
}
const sleep = ms => new Promise(r => setTimeout(r, ms))
const kb    = b  => `${(b / 1024).toFixed(0)}KB`

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const catalog = buildCatalog()
  const total   = Math.min(catalog.length, LIMIT)

  console.log(c.bold('\n🛒 Karim Market — Téléchargement packshots'))
  console.log(c.gray(`   Produits : ${total} | Sources : Jumia.ma → Open Food Facts`))
  console.log(c.gray(`   Dossier  : ${OUTPUT_DIR}`))
  if (SKIP) console.log(c.yellow('   Mode     : --skip-existing (reprend là où ça s\'est arrêté)'))
  if (DRY)  console.log(c.yellow('   Mode     : --dry-run (aucun fichier écrit)'))
  console.log()

  let ok = 0, skipped = 0, failed = 0
  const stats    = { Jumia: 0, OFF: 0 }
  const failures = []

  for (let i = 0; i < total; i++) {
    const { name, filename, search } = catalog[i]
    const dest   = path.join(OUTPUT_DIR, filename)
    const prefix = c.gray(`[${String(i + 1).padStart(4)}/${total}]`)
    const label  = (name.length > 48 ? name.slice(0, 45) + '…' : name).padEnd(48)

    if (SKIP && fs.existsSync(dest)) {
      console.log(`${prefix} ${c.gray('⏭')} ${c.gray(filename)}`)
      skipped++
      continue
    }

    process.stdout.write(`${prefix} ${c.cyan('⬇')} ${label} `)
    if (DRY) { console.log(c.yellow('[dry-run]')); ok++; continue }

    let done = false
    for (let attempt = 1; attempt <= 2 && !done; attempt++) {
      try {
        // Source 1 : Jumia Maroc
        let imgUrl = await searchJumia(search)
        let source = 'Jumia'

        // Source 2 : Open Food Facts (backup)
        if (!imgUrl) {
          imgUrl = await searchOFF(search)
          source = 'OFF'
        }

        if (!imgUrl) throw new Error('Aucune source disponible')

        const buf = await download(imgUrl)
        fs.writeFileSync(dest, buf)
        stats[source] = (stats[source] || 0) + 1
        console.log(`${c.green('✓')} ${c.gray(`[${source}]`)} ${c.gray(kb(buf.length))}`)
        ok++
        done = true
      } catch (err) {
        if (attempt < 2) {
          process.stdout.write(c.yellow(' ↺ '))
          await sleep(2000)
        } else {
          console.log(c.red(`✗ ${err.message.slice(0, 55)}`))
          failures.push({ name, filename, search, error: err.message })
          failed++
        }
      }
    }

    if (i < total - 1) await sleep(DELAY_MS)
  }

  // Rapport
  console.log(c.bold(`\n${'─'.repeat(62)}`))
  console.log(c.bold('📊 Rapport'))
  console.log(`   ${c.green(`✓ Téléchargés : ${ok}`)}`)
  if (skipped) console.log(`   ${c.gray(`⏭  Ignorés    : ${skipped}`)}`)
  if (failed)  console.log(`   ${c.red(`✗ Échoués    : ${failed}`)}`)
  if (stats.Jumia) console.log(`   ${c.cyan('Jumia')} → ${stats.Jumia} images`)
  if (stats.OFF)   console.log(`   ${c.cyan('OFF  ')} → ${stats.OFF} images`)
  console.log(c.bold('─'.repeat(62)))

  if (failures.length) {
    const log = path.join(path.dirname(OUTPUT_DIR), '../../../../../download-failures.json')
      .replace(/\\/g, '/')
    const logPath = path.join(__dirname, 'download-failures.json')
    fs.writeFileSync(logPath, JSON.stringify(failures, null, 2), 'utf8')
    console.log(c.yellow(`\n⚠  ${failed} échecs → download-failures.json`))
    console.log(c.gray('   Relance : node download-images.mjs --skip-existing'))
  }
  console.log()
}

main().catch(e => { console.error(c.red('💥'), e.message); process.exit(1) })
