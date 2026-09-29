const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function get(url, headers = {}) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'fr-MA,fr;q=0.9', ...headers },
    signal: AbortSignal.timeout(12000),
  })
  return { status: r.status, body: await r.text(), ct: r.headers.get('content-type') || '' }
}

// ── Sitemap principal ─────────────────────────────────────────────
console.log('=== SITEMAP ===')
const sitemap = await get('https://cima.ma/wp-sitemap.xml')
console.log(sitemap.body)

// ── Page recherche "lait" — structure produits ────────────────────
console.log('\n=== SEARCH HTML STRUCTURE ===')
const search = await get('https://cima.ma/?s=lait&post_type=product')
const html = search.body

// Chercher les patterns d'images produit
const imgPatterns = [
  /wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi,
  /data-src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  /srcset="([^"]+)"/gi,
]

console.log('HTML length:', html.length)
for (const pat of imgPatterns) {
  const matches = [...html.matchAll(pat)].map(m => m[0] || m[1]).filter(Boolean)
  const unique = [...new Set(matches)].filter(u => !u.includes('logo') && !u.includes('icon'))
  console.log(`\nPattern ${pat.source.substring(0, 40)}:`)
  unique.slice(0, 5).forEach(u => console.log('  ', u.substring(0, 90)))
}

// Chercher les URLs de produits dans le HTML
const productUrls = html.match(/https?:\/\/cima\.ma\/[a-z0-9-]+\//gi) || []
const uniqueUrls = [...new Set(productUrls)].filter(u =>
  !u.includes('/wp-') && !u.includes('/cart') && !u.includes('/account') &&
  !u.includes('/checkout') && u !== 'https://cima.ma/'
)
console.log('\nProduct URLs found:', uniqueUrls.length)
uniqueUrls.slice(0, 10).forEach(u => console.log(' ', u))

// Chercher les données JSON embarquées (woocommerce embed)
const jsonData = html.match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)
if (jsonData) {
  console.log('\nJSON-LD found:', jsonData.length, 'blocks')
  console.log(jsonData[0]?.substring(0, 400))
}

// Chercher le endpoint AJAX WooCommerce
const ajaxUrl = html.match(/["']([^"']*admin-ajax\.php[^"']*)["']/i)
console.log('\nadjax URL:', ajaxUrl?.[1])

// Nonce WC
const nonce = html.match(/nonce['":\s]+['"]([a-f0-9]+)['"]/i)
console.log('WC nonce:', nonce?.[1])
