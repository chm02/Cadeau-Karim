// Analyser finement le HTML d'une fiche qui renvoie undefined
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const r = await fetch('https://cima.ma/produit/nutella-200g/', {
  headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'fr-MA,fr;q=0.9' },
  signal: AbortSignal.timeout(12000),
})
const html = await r.text()
console.log('Status:', r.status, '| Size:', html.length)

// Extraire tous les blocs JSON-LD
const jsonLdBlocks = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
console.log(`JSON-LD blocks: ${jsonLdBlocks.length}`)
for (const b of jsonLdBlocks) {
  const content = b.replace(/<script[^>]+>|<\/script>/gi, '').trim()
  try {
    const d = JSON.parse(content)
    console.log('  @type:', d['@type'])
    if (d['@type'] === 'Product') {
      console.log('  PRODUCT FOUND:', JSON.stringify(d).substring(0, 300))
    }
    if (d['@graph']) {
      d['@graph'].forEach(x => {
        console.log('    graph @type:', x['@type'])
        if (x['@type'] === 'Product') console.log('    PRODUCT:', JSON.stringify(x).substring(0, 300))
      })
    }
  } catch(e) { console.log('  parse error:', e.message, content.substring(0, 100)) }
}

// Chercher img principale du produit
const imgPatterns = [
  /wp-post-image[^>]+src="([^"]+)"/i,
  /woocommerce-product-gallery__image[^>]+>\s*<img[^>]+src="([^"]+)"/is,
  /id="[^"]*product-image[^"]*"[^>]*src="([^"]+)"/i,
  /"full":\["([^"]+)"/i,
  /wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/i,
]
console.log('\nImage patterns:')
for (const pat of imgPatterns) {
  const m = html.match(pat)
  if (m) console.log(`  ${pat.source.substring(0,40)}: ${(m[1]||m[0]).substring(0,80)}`)
}

// Prix avec différents patterns
const pricePatterns = [
  /woocommerce-Price-amount[^>]*>([\s\S]*?)<\/span>/gi,
  /"price":"([^"]+)"/gi,
  /class="amount"[^>]*>([\s\S]*?)<\/span>/gi,
  /"price_html":"([^"]+)"/gi,
]
console.log('\nPrice patterns:')
for (const pat of pricePatterns) {
  const m = html.match(new RegExp(pat.source, pat.flags.replace('g','')))
  if (m) console.log(`  ${pat.source.substring(0,40)}: ${(m[1]||m[0]).replace(/<[^>]+>/g,'').substring(0,40)}`)
}

// H1
const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)
console.log('\nH1 tags:')
h1?.slice(0,3).forEach(h => console.log(' ', h.replace(/<[^>]+>/g,'').trim().substring(0,80)))

// Vérifier si c'est un redirect ou page différente
const canonical = html.match(/rel="canonical"\s+href="([^"]+)"/i)
console.log('\nCanonical:', canonical?.[1])

// Est-ce que la page demande un login ?
const loginRequired = html.includes('Connectez-vous') || html.includes('woocommerce-account')
console.log('Login required:', loginRequired)
