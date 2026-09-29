const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function get(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'fr-MA,fr;q=0.9' },
    signal: AbortSignal.timeout(12000),
  })
  return r.text()
}

// ── Compter le total produits via les sitemaps ────────────────────
let totalUrls = []
for (let i = 1; i <= 4; i++) {
  const xml = await get(`https://cima.ma/wp-sitemap-posts-product-${i}.xml`)
  const urls = xml.match(/<loc>(https:\/\/cima\.ma\/[^<]+)<\/loc>/g) || []
  const parsed = urls.map(u => u.replace(/<\/?loc>/g, ''))
  console.log(`sitemap product-${i}: ${parsed.length} URLs`)
  totalUrls.push(...parsed)
  await new Promise(r => setTimeout(r, 300))
}
console.log(`\nTotal produits cima.ma : ${totalUrls.length}`)
console.log('Premiers exemples :')
totalUrls.slice(0, 5).forEach(u => console.log(' ', u))

// ── Scraper une fiche produit ─────────────────────────────────────
console.log('\n=== TEST FICHE PRODUIT ===')
const testUrl = totalUrls[0]
console.log('URL testée :', testUrl)
const html = await get(testUrl)
console.log('HTML size :', html.length)

// Nom du produit
const nameMatch = html.match(/<h1[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)
  || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
console.log('\nNom (h1):', nameMatch?.[1]?.replace(/<[^>]+>/g, '').trim().substring(0, 80))

// Prix
const priceMatch = html.match(/<span[^>]*class="[^"]*woocommerce-Price-amount[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
  || html.match(/class="price"[^>]*>([\s\S]*?)<\/[^>]+>/i)
console.log('Prix:', priceMatch?.[1]?.replace(/<[^>]+>/g, '').trim().substring(0, 30))

// Image principale
const imgMatch = html.match(/class="wp-post-image"[^>]*src="([^"]+)"/i)
  || html.match(/<img[^>]+class="[^"]*woocommerce-product-gallery[^"]*"[^>]*src="([^"]+)"/i)
  || html.match(/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/i)
console.log('Image:', imgMatch?.[1] || imgMatch?.[0])

// JSON-LD product schema
const jsonLd = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
if (jsonLd) {
  for (const block of jsonLd) {
    const content = block.replace(/<script[^>]+>|<\/script>/gi, '').trim()
    try {
      const data = JSON.parse(content)
      if (data['@type'] === 'Product' || data?.['@graph']?.find?.(x => x['@type'] === 'Product')) {
        console.log('\nJSON-LD Product trouvé :')
        const product = data['@type'] === 'Product' ? data : data['@graph'].find(x => x['@type'] === 'Product')
        console.log('  name:', product.name)
        console.log('  price:', product.offers?.price || product.offers?.[0]?.price)
        console.log('  image:', JSON.stringify(product.image)?.substring(0, 100))
        break
      }
    } catch {}
  }
}

// Catégorie dans les breadcrumbs
const catMatch = html.match(/product_cat[^"]*"[^>]*>([^<]+)<\/a>/i)
  || html.match(/class="[^"]*breadcrumb[^"]*"[\s\S]{0,500}product_cat[^"]*"[^>]*>([^<]+)<\/a>/i)
console.log('\nCatégorie breadcrumb:', catMatch?.[1]?.trim())
