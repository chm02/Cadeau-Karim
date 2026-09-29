// Chercher les vraies URLs de produits connus sur cima.ma
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function get(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'fr-MA,fr;q=0.9', 'Referer': 'https://cima.ma/' },
    signal: AbortSignal.timeout(10000),
  })
  return { status: r.status, html: await r.text() }
}

// Chercher via la recherche HTML pour des produits types
const searches = ['lait jaouda', 'nutella', 'coca cola', 'pampers']

for (const q of searches) {
  console.log(`\n=== Recherche: "${q}" ===`)
  const { status, html } = await get(`https://cima.ma/?s=${encodeURIComponent(q)}&post_type=product`)
  console.log('Status:', status, '| Size:', html.length)

  // URLs de produits dans les résultats
  const productUrls = [...new Set(html.match(/https:\/\/cima\.ma\/produit\/[a-z0-9-]+\//gi) || [])]
  console.log('Produits trouvés:', productUrls.length)
  productUrls.slice(0, 5).forEach(u => console.log(' ', u))

  // Images dans les résultats de recherche
  const imgs = html.match(/wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi) || []
  const productImgs = [...new Set(imgs)].filter(i => !i.includes('icon') && !i.includes('logo'))
  console.log('Images:', productImgs.length)
  productImgs.slice(0, 3).forEach(i => console.log('  https://cima.ma/' + i))

  await new Promise(r => setTimeout(r, 400))
}

// Tester les vraies URLs trouvées dans le sitemap
console.log('\n=== Test URL réelle du sitemap ===')
// fromage-muscly-96p-jaouda fonctionnait
const { status: s2, html: h2 } = await get('https://cima.ma/produit/fromage-muscly-96p-jaouda/')
const jsonLd = h2.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
for (const b of jsonLd) {
  try {
    const d = JSON.parse(b.replace(/<script[^>]+>|<\/script>/gi, '').trim())
    if (d['@type'] === 'Product') {
      console.log('name:', d.name)
      console.log('price:', d.offers?.price)
      console.log('sku:', d.sku)
      console.log('image:', d.image)
      console.log('category:', d.category)
    }
    if (d['@type'] === 'BreadcrumbList') {
      const items = d.itemListElement
      console.log('breadcrumb:', items.map(i => i.name || i.item?.name).join(' > '))
    }
  } catch {}
}
