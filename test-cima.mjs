/**
 * Exploration de la structure de cima.ma
 * pour identifier les endpoints utilisables
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function get(label, url, opts = {}) {
  process.stdout.write(`[${label}] GET ${url.substring(0, 80)} ... `)
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'fr-MA,fr;q=0.9',
        'Referer': 'https://cima.ma/',
        ...opts.headers,
      },
      signal: AbortSignal.timeout(10000),
    })
    const ct = r.headers.get('content-type') || ''
    const body = await r.text()
    console.log(`HTTP ${r.status} | ${ct.split(';')[0]} | ${body.length} chars`)
    return { status: r.status, body, ct }
  } catch(e) {
    console.log(`ERR: ${e.message}`)
    return null
  }
}

// 1. Page d'accueil — structure générale
const home = await get('home', 'https://cima.ma/')
if (home?.body) {
  // Chercher des indices sur l'API ou les catégories
  const apiHints = home.body.match(/api[\/\w-]+/gi)?.slice(0, 5)
  const wpJson   = home.body.includes('wp-json')
  const woocom   = home.body.includes('woocommerce')
  console.log('  → wp-json:', wpJson, '| woocommerce:', woocom)
  console.log('  → API hints:', apiHints?.join(', ') || 'aucun')
}

// 2. Tester l'API REST WordPress (WooCommerce)
await get('wp-products', 'https://cima.ma/wp-json/wc/v3/products?per_page=5&consumer_key=&consumer_secret=')
await get('wp-products2', 'https://cima.ma/wp-json/wc/v2/products?per_page=5')
await get('wp-posts',    'https://cima.ma/wp-json/wp/v2/posts?per_page=3')

// 3. Tester la recherche
await get('search',  'https://cima.ma/?s=lait')
await get('search2', 'https://cima.ma/recherche/?q=lait')

// 4. Tester les catégories
await get('categories', 'https://cima.ma/wp-json/wc/v3/products/categories?per_page=20')
await get('cat-produits','https://cima.ma/produits/')
await get('cat-epicerie','https://cima.ma/epicerie/')
await get('cat-laitiers','https://cima.ma/produits-laitiers/')

// 5. Sitemap pour découvrir la structure
await get('sitemap', 'https://cima.ma/sitemap.xml')
await get('sitemap2','https://cima.ma/sitemap_index.xml')

// 6. Robots.txt — souvent révélateur
const robots = await get('robots', 'https://cima.ma/robots.txt')
if (robots?.body) console.log('  robots.txt:\n', robots.body.substring(0, 500))
