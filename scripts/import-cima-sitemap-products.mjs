#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.resolve(projectRoot, 'backend/src/main/resources/static/assets/img/products')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const SITE_ROOT = process.env.TARGET_URL || process.env.CIMA_URL || 'https://cima.ma'
const LIMIT = Number(process.env.LIMIT || 0) || 0
const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true'
const SKIP_EXISTING = String(process.env.SKIP_EXISTING || '').toLowerCase() === 'true'
const VERBOSE = String(process.env.VERBOSE || '').toLowerCase() === 'true'

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

function log(message) {
  if (VERBOSE || DRY_RUN) console.log(message)
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === '') return 0
  const cleaned = String(value)
    .replace(/[\u00A0\s]/g, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/,/g, '.')
  const number = Number(cleaned)
  return Number.isFinite(number) ? number : 0
}

function extractText(node) {
  if (!node) return ''
  return String(node)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function encodeFileName(name, url = '') {
  const base = slugify(name) || 'product'
  const ext = (url.match(/\.(jpe?g|png|webp|gif|avif)(?:\?.*)?$/i)?.[1] || 'jpg').toLowerCase()
  return `${base}.${ext}`
}

function splitByCommaMaybe(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-MA,fr;q=0.9',
      'Referer': SITE_ROOT,
    },
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  return await response.text()
}

function getAbsoluteUrl(base, maybeRelative) {
  if (!maybeRelative) return ''
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return ''
  }
}

function findSitemapUrls(html) {
  const matches = [...html.matchAll(/<loc>(.*?)<\/loc>/gis)]
  const urls = matches.map((m) => m[1].trim()).filter(Boolean)
  const uniq = [...new Set(urls)]
  return uniq
}

async function getSitemapUrls() {
  const urls = []
  const candidates = [
    `${SITE_ROOT}/sitemap.xml`,
    `${SITE_ROOT}/sitemap_index.xml`,
    `${SITE_ROOT}/sitemap-posts.xml`,
    `${SITE_ROOT}/wp-sitemap.xml`,
    `${SITE_ROOT}/robots.txt`,
  ]

  for (const candidate of candidates) {
    try {
      const body = await fetchText(candidate)
      if (candidate.endsWith('robots.txt')) {
        const matches = [...body.matchAll(/Sitemap:\s*(\S+)/gi)]
        const sitemapEntries = matches.map((m) => m[1].trim()).filter(Boolean)
        for (const url of sitemapEntries) urls.push(url)
        continue
      }

      const localUrls = findSitemapUrls(body)
      if (localUrls.length) {
        urls.push(...localUrls)
      }
    } catch {
      // ignore bad sitemap URLs
    }
  }

  const unique = [...new Set(urls)]
  return unique.filter((u) => /product|shop|catalog|sitemap/i.test(u) || u.includes('sitemap'))
}

async function fetchAndParseSitemap(sitemapUrl) {
  const body = await fetchText(sitemapUrl)
  const urls = findSitemapUrls(body)
  return urls
}

async function parseProductHtml(html, pageUrl) {
  const $ = (selector) => {
    const match = html.match(new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i'))
    return match ? match[1] : ''
  }

  const title = (() => {
    const candidates = [
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<title>([\s\S]*?)<\/title>/i,
    ]
    for (const regex of candidates) {
      const match = html.match(regex)
      if (match) {
        const text = extractText(match[1] || match[0])
        if (text) return text
      }
    }
    return ''
  })()

  const name = extractText(title).replace(/\s*-\s*.*$/, '').trim() || new URL(pageUrl).pathname.split('/').filter(Boolean).slice(-1)[0].replace(/[-_]/g, ' ')

  const priceMatch = html.match(/(?:price|prix)[^0-9]{0,20}([0-9][0-9\s.,]{2,9})/i)
  const priceText = priceMatch ? priceMatch[1] : ''
  const price = normalizePrice(priceText)

  const descriptionCandidates = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<div[^>]+class=["'][^"']*(?:description|summary|product-short-description|woocommerce-product-details__short-description)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class=["'][^"']*(?:description|summary|product-short-description|woocommerce-product-details__short-description)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+itemprop=["']description["'][^>]*>([\s\S]*?)<\/div>/i,
  ]

  let description = ''
  for (const regex of descriptionCandidates) {
    const match = html.match(regex)
    if (match) {
      description = extractText(match[1] || match[0])
      if (description) break
    }
  }

  const imageCandidates = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp|gif|avif))["'][^>]*>/gi,
    /<source[^>]+srcset=["']([^"']+\.(?:jpe?g|png|webp|gif|avif))["'][^>]*>/gi,
  ]

  let imageUrl = ''
  for (const regex of imageCandidates) {
    const match = html.match(regex)
    if (match) {
      if (regex.global) {
        const all = [...html.matchAll(regex)]
        for (const entry of all) {
          const value = entry[1] || entry[0]
          if (value && value.includes('http')) {
            imageUrl = getAbsoluteUrl(pageUrl, value.split(/[\s,]+/)[0])
            break
          }
        }
      } else {
        const value = match[1]
        imageUrl = getAbsoluteUrl(pageUrl, value)
      }
      if (imageUrl) break
    }
  }

  if (!title && !name) {
    return null
  }

  return {
    name: name || title,
    description: description || 'Produit de la marque Cima',
    price,
    imageUrl,
    sourceUrl: pageUrl,
  }
}

async function downloadImage(url, productName) {
  if (!url || !url.startsWith('http')) return ''

  const fileName = encodeFileName(productName, url)
  const target = path.join(OUTPUT_DIR, fileName)

  if (fs.existsSync(target) && SKIP_EXISTING) return fileName

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': SITE_ROOT,
    },
    signal: AbortSignal.timeout(25000),
  })

  if (!response.ok) {
    throw new Error(`image unavailable: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error(`not an image: ${contentType}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  if (buffer.length < 2000) {
    throw new Error(`image too small: ${buffer.length} bytes`)
  }

  fs.writeFileSync(target, buffer)
  return fileName
}

async function fetchProductsFromCima() {
  const sitemapUrls = await getSitemapUrls()
  const finalUrlList = new Set()

  for (const sitemapUrl of sitemapUrls) {
    try {
      const urls = await fetchAndParseSitemap(sitemapUrl)
      for (const u of urls) finalUrlList.add(u)
    } catch (error) {
      log(`Sitemap skipped: ${sitemapUrl} -> ${error.message}`)
    }
  }

  if (finalUrlList.size === 0) {
    throw new Error('Aucun produit trouvé dans les sitemaps Cima. Vérifie la source ou la configuration TARGET_URL.')
  }

  const productUrls = [...finalUrlList]
    .filter((u) => /product|produit|shop|catalog/i.test(u) || /\/(?:p|product)\//i.test(u))
    .slice(0, LIMIT || undefined)

  const products = []
  for (const [index, url] of productUrls.entries()) {
    try {
      const html = await fetchText(url)
      const product = await parseProductHtml(html, url)
      if (product) {
        products.push(product)
        log(`Parsed: ${product.name} (${index + 1}/${productUrls.length})`)
      }
    } catch (error) {
      log(`Skip product ${url}: ${error.message}`)
    }
  }

  return products
}

async function getDbDriver() {
  const type = (process.env.DB_TYPE || 'mysql').toLowerCase()

  if (type === 'postgres') {
    const { Client } = await import('pg')
    const client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
    await client.connect()
    return {
      type,
      client,
      async query(sql, params = []) {
        return client.query(sql, params)
      },
      async close() {
        await client.end()
      },
    }
  }

  const mysql = await import('mysql2/promise')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  })

  return {
    type,
    client: connection,
    async query(sql, params = []) {
      return connection.execute(sql, params)
    },
    async close() {
      await connection.end()
    },
  }
}

async function tableHasColumn(db, columnName) {
  if (db.type === 'postgres') {
    const result = await db.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'products' AND column_name = $1 LIMIT 1`,
      [columnName]
    )
    return result.rows.length > 0
  }

  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = ? LIMIT 1`,
    [columnName]
  )

  return Array.isArray(rows) && rows.length > 0
}

async function existsProduct(db, name) {
  const normalized = String(name).trim()
  if (!normalized) return null

  if (db.type === 'postgres') {
    const result = await db.query(`SELECT id FROM products WHERE lower(name) = lower($1) LIMIT 1`, [normalized])
    return result.rows[0]?.id ?? null
  }

  const [rows] = await db.query(`SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1`, [normalized])
  return rows?.[0]?.id ?? null
}

async function upsertProduct(db, product) {
  const name = String(product.name || '').trim()
  if (!name) return { inserted: false, updated: false }

  if (DRY_RUN) {
    console.log(`[DRY RUN] ${name} | ${product.price} DH | ${product.imageUrl || 'no image'}`)
    return { inserted: false, updated: false }
  }

  const hasDescription = await tableHasColumn(db, 'description')
  const existingId = await existsProduct(db, name)

  const imageName = product.imageName || ''
  const description = String(product.description || '').trim()
  const categoryId = String(product.categoryId || '1')

  if (db.type === 'postgres') {
    if (existingId) {
      const sql = hasDescription
        ? `UPDATE products SET name = $1, price = $2, image_url = $3, category_id = $4, description = $5 WHERE id = $6`
        : `UPDATE products SET name = $1, price = $2, image_url = $3, category_id = $4 WHERE id = $5`
      const params = hasDescription
        ? [name, Number(product.price || 0), imageName, categoryId, description, existingId]
        : [name, Number(product.price || 0), imageName, categoryId, existingId]
      await db.query(sql, params)
      return { inserted: false, updated: true, id: existingId }
    }

    const sql = hasDescription
      ? `INSERT INTO products (name, price, image_url, category_id, description) VALUES ($1, $2, $3, $4, $5)`
      : `INSERT INTO products (name, price, image_url, category_id) VALUES ($1, $2, $3, $4)`
    const params = hasDescription
      ? [name, Number(product.price || 0), imageName, categoryId, description]
      : [name, Number(product.price || 0), imageName, categoryId]
    await db.query(sql, params)
    return { inserted: true, updated: false }
  }

  if (existingId) {
    const sql = hasDescription
      ? `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ?, description = ? WHERE id = ?`
      : `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?`
    const params = hasDescription
      ? [name, Number(product.price || 0), imageName, categoryId, description, existingId]
      : [name, Number(product.price || 0), imageName, categoryId, existingId]
    await db.query(sql, params)
    return { inserted: false, updated: true, id: existingId }
  }

  const sql = hasDescription
    ? `INSERT INTO products (name, price, image_url, category_id, description) VALUES (?, ?, ?, ?, ?)`
    : `INSERT INTO products (name, price, image_url, category_id) VALUES (?, ?, ?, ?)`
  const params = hasDescription
    ? [name, Number(product.price || 0), imageName, categoryId, description]
    : [name, Number(product.price || 0), imageName, categoryId]
  await db.query(sql, params)
  return { inserted: true, updated: false }
}

async function main() {
  const products = await fetchProductsFromCima()
  console.log(`Produits collectés depuis les sitemaps Cima : ${products.length}`)

  const db = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD
    ? await getDbDriver()
    : null

  let inserted = 0
  let updated = 0
  let skipped = 0

  try {
    for (const product of products) {
      try {
        const imageName = product.imageUrl ? await downloadImage(product.imageUrl, product.name) : ''
        const categoryId = product.categoryId || '1'

        if (db) {
          const result = await upsertProduct(db, {
            ...product,
            imageName,
            categoryId,
          })
          if (result.inserted) inserted += 1
          if (result.updated) updated += 1
        } else {
          skipped += 1
          console.log(`[SIMULATION] ${product.name} | image=${imageName || 'none'}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${product.name}: ${error.message}`)
      }
    }
  } finally {
    await db?.close()
  }

  console.log('\nRésumé:')
  console.log(`- produits analysés: ${products.length}`)
  console.log(`- ajoutés: ${inserted}`)
  console.log(`- mis à jour: ${updated}`)
  console.log(`- simulés: ${skipped}`)
  console.log(`- dossier images: ${OUTPUT_DIR}`)
  console.log(`- source: ${SITE_ROOT}`)
}

main().catch((error) => {
  console.error('Erreur fatale :')
  console.error(error)
  process.exit(1)
})
