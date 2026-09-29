#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.resolve(projectRoot, 'backend/src/main/resources/static/assets/img/products')
const apiUrl = process.env.API_URL || 'http://localhost:8080/api'
const siteRoot = process.env.CIMA_URL || 'https://cima.ma'
const limit = Number(process.env.LIMIT || 0) || 0
const dryRun = process.env.DRY_RUN === 'true'
const skipExisting = process.env.SKIP_EXISTING !== 'false'
const minScore = Number(process.env.MIN_SCORE || 0.65)
const delayMs = Number(process.env.DELAY_MS || 250)
const urlFilter = String(process.env.URL_FILTER || '').trim().toLowerCase()
const concurrency = Math.max(1, Number(process.env.CONCURRENCY || 4))
const userAgent = 'KarimMarketImageSync/1.0 (+local catalogue importer)'

fs.mkdirSync(outputDir, { recursive: true })

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value, extension = 'jpg') {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'product'}.${extension}`
}

function tokens(value) {
  const ignored = new Set(['cima', 'cimamarket', 'produit', 'product', 'de', 'du', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'pour', 'avec', 'en', 'the', 'piece', 'pieces'])
  return new Set(
    decodeHtml(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter(token => token.length > 1 && !ignored.has(token)),
  )
}

function numericTokens(value) {
  return new Set((String(value || '').match(/\d+(?:[.,]\d+)?/g) || []).map(token => token.replace(',', '.')))
}

function similarity(sourceName, products) {
  const sourceTokens = tokens(sourceName)
  if (!sourceTokens.size) return null

  let best = null
  for (const product of products) {
    const productTokens = tokens(product.name)
    const sourceNumbers = numericTokens(sourceName)
    const productNumbers = numericTokens(product.name)
    if (sourceNumbers.size && productNumbers.size && ![...sourceNumbers].some(number => productNumbers.has(number))) continue
    const intersection = [...sourceTokens].filter(token => productTokens.has(token))
    if (intersection.length < 2) continue
    const union = new Set([...sourceTokens, ...productTokens]).size
    const score = intersection.length / union
    if (!best || score > best.score) best = { product, score, intersection }
  }
  return best
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent, Accept: 'text/html,application/xml,text/xml,*/*' },
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

function urlsFromXml(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(match => decodeHtml(match[1]))
}

async function collectSitemapUrls() {
  const queue = [`${siteRoot}/sitemap.xml`, `${siteRoot}/wp-sitemap.xml`, `${siteRoot}/sitemap_index.xml`]
  const visited = new Set()
  const productUrls = new Set()

  while (queue.length) {
    const url = queue.shift()
    if (visited.has(url)) continue
    visited.add(url)
    try {
      const xml = await fetchText(url)
      for (const child of urlsFromXml(xml)) {
        if (/\.xml(?:\?|$)/i.test(child) || /sitemap/i.test(child)) queue.push(child)
        else if (/\/produit\//i.test(child)) productUrls.add(child)
      }
    } catch (error) {
      console.warn(`Sitemap ignoré: ${url} (${error.message})`)
    }
  }

  return [...productUrls]
}

function parseProductPage(html, url) {
  const meta = (property) => {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return decodeHtml(match[1])
    }
    return ''
  }

  const title = meta('og:title')
    || decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1])
    || decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
  const image = meta('og:image')
    || decodeHtml(html.match(/<img[^>]+(?:data-large_image|data-src|src)=["']([^"']+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^"']*)?)["']/i)?.[1])
  if (!title || !image) return null

  return {
    name: title.replace(/\s+[-|]\s+(?:cima\s*market|cima).*$/i, '').trim(),
    image: new URL(image, url).toString(),
  }
}

async function downloadImage(url, filename) {
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent, Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) throw new Error(`image HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  if (contentType && !contentType.startsWith('image/')) throw new Error(`not an image (${contentType})`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 2000) throw new Error(`image too small (${buffer.length} bytes)`)
  fs.writeFileSync(path.join(outputDir, filename), buffer)
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  const response = await fetch(`${apiUrl}/products`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`API produits inaccessible (${response.status})`)
  const products = await response.json()
  const sitemapUrls = await collectSitemapUrls()
  const filteredUrls = urlFilter
    ? sitemapUrls.filter(url => url.toLowerCase().includes(urlFilter))
    : sitemapUrls
  const sourceUrls = limit ? filteredUrls.slice(0, limit) : filteredUrls

  console.log(`Produits locaux: ${products.length}`)
  console.log(`Pages CIMA: ${sourceUrls.length}${urlFilter ? ` (filtre: ${urlFilter})` : ''}${dryRun ? ' (simulation)' : ''}`)

  let matched = 0
  let downloaded = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  let nextIndex = 0
  async function worker() {
    while (true) {
      const index = nextIndex++
      if (index >= sourceUrls.length) return
      const sourceUrl = sourceUrls[index]
      try {
        const page = parseProductPage(await fetchText(sourceUrl), sourceUrl)
        if (!page) { skipped++; continue }
        const match = similarity(page.name, products)
        if (!match || match.score < minScore) { skipped++; continue }
        matched++

        const current = String(match.product.imageUrl || '')
        const extension = (page.image.match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase()
        const filename = slugify(match.product.name, extension)
        const target = path.join(outputDir, filename)
        if (skipExisting && fs.existsSync(target)) {
          skipped++
          continue
        }

        console.log(`[${index + 1}/${sourceUrls.length}] ${page.name} -> ${match.product.name} (${match.score.toFixed(2)})`)
        if (!dryRun) {
          await downloadImage(page.image, filename)
          downloaded++
          const updatedProduct = { ...match.product, imageUrl: filename }
          const updateResponse = await fetch(`${apiUrl}/products/${encodeURIComponent(match.product.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(updatedProduct),
          })
          if (!updateResponse.ok) throw new Error(`mise à jour API HTTP ${updateResponse.status}`)
          updated++
        } else if (current !== filename) {
          updated++
        }
      } catch (error) {
        failed++
        console.warn(`Échec ${sourceUrl}: ${error.message}`)
      }
      await wait(delayMs)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  console.log('\nRésumé')
  console.log(`- correspondances: ${matched}`)
  console.log(`- images téléchargées: ${downloaded}`)
  console.log(`- produits mis à jour: ${updated}`)
  console.log(`- ignorés: ${skipped}`)
  console.log(`- erreurs: ${failed}`)
  console.log(`- dossier: ${outputDir}`)
}

main().catch(error => {
  console.error(`Erreur fatale: ${error.message}`)
  process.exit(1)
})
