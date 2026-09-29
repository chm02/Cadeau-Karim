const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function get(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'fr-MA,fr;q=0.9' },
    signal: AbortSignal.timeout(12000),
  })
  return r.text()
}

function decodeHtml(str) {
  return str.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ').trim()
}

// Tester plusieurs fiches pour valider les patterns
const testUrls = [
  'https://cima.ma/produit/indomie-gout-crevette-70g/',
  'https://cima.ma/produit/fromage-muscly-96p-jaouda/',
  'https://cima.ma/produit/lait-uht-jaouda-1l/',
  'https://cima.ma/produit/nutella-200g/',
  'https://cima.ma/produit/coca-cola-1-25l/',
]

for (const url of testUrls) {
  console.log('\n' + '─'.repeat(60))
  console.log('URL:', url)
  try {
    const html = await get(url)

    // JSON-LD (source la plus fiable)
    const jsonLdBlocks = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
    let name, image, price, category

    for (const block of jsonLdBlocks) {
      try {
        const d = JSON.parse(block.replace(/<script[^>]+>|<\/script>/gi, '').trim())
        if (d['@type'] === 'Product') {
          name  = d.name
          image = Array.isArray(d.image) ? d.image[0] : d.image
          price = d.offers?.price || d.offers?.[0]?.price
          break
        }
      } catch {}
    }

    // Prix depuis HTML si pas dans JSON-LD
    if (!price) {
      const priceRaw = html.match(/woocommerce-Price-amount amount[^>]*>([\s\S]*?)<\/bdi>/i)
        || html.match(/class="price">([\s\S]*?)<\/span>/i)
      if (priceRaw) {
        const cleaned = priceRaw[1].replace(/<[^>]+>/g, '')
        price = decodeHtml(cleaned).replace(/[^\d.,]/g, '').trim()
      }
    }

    // Catégorie depuis breadcrumb ou meta
    const breadcrumb = html.match(/class="[^"]*breadcrumb[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)
    if (breadcrumb) {
      const cats = [...breadcrumb[1].matchAll(/>([^<]+)</g)]
        .map(m => m[1].trim()).filter(s => s && s !== '/' && s !== 'Accueil')
      category = cats[cats.length - 2] // avant-dernier = catégorie
    }
    // Meta keywords
    if (!category) {
      const metaCat = html.match(/property="product:category"[^>]*content="([^"]+)"/i)
      category = metaCat?.[1]
    }
    // Depuis l'URL du fil d'ariane JSON-LD BreadcrumbList
    for (const block of jsonLdBlocks) {
      try {
        const d = JSON.parse(block.replace(/<script[^>]+>|<\/script>/gi, '').trim())
        if (d['@type'] === 'BreadcrumbList') {
          const items = d.itemListElement || []
          if (items.length >= 2) {
            category = items[items.length - 2]?.item?.name || items[items.length - 2]?.name
          }
          break
        }
      } catch {}
    }

    console.log('✓ name    :', name)
    console.log('  price   :', price)
    console.log('  category:', category)
    console.log('  image   :', image?.substring(0, 80))
  } catch(e) {
    console.log('✗ ERR:', e.message)
  }
  await new Promise(r => setTimeout(r, 600))
}
