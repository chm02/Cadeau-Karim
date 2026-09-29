#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.resolve(projectRoot, 'backend/src/main/resources/static/assets/img/products')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const TARGET_URL = process.env.TARGET_URL || process.env.CIMA_URL || 'https://cima.ma'
const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase()
const LIMIT = Number(process.env.LIMIT || 0) || 0
const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true'
const SKIP_EXISTING = String(process.env.SKIP_EXISTING || '').toLowerCase() === 'true'
const VERBOSE = String(process.env.VERBOSE || '').toLowerCase() === 'true'

const args = new Map()
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--')) {
    const [key, value = 'true'] = arg.slice(2).split('=')
    args.set(key, value)
  }
}

if (args.has('source')) {
  process.env.TARGET_URL = args.get('source')
}
if (args.has('limit')) {
  const n = Number(args.get('limit'))
  if (!Number.isNaN(n) && n > 0) process.env.LIMIT = String(n)
}
if (args.has('dry-run')) {
  process.env.DRY_RUN = 'true'
}
if (args.has('skip-existing')) {
  process.env.SKIP_EXISTING = 'true'
}

const SOURCE = process.env.TARGET_URL || TARGET_URL
const LIMIT_PRODUCTS = Number(process.env.LIMIT || 0) || 0
const SHOULD_DRY_RUN = DRY_RUN || String(args.get('dry-run') || '').toLowerCase() === 'true'
const SHOULD_SKIP_EXISTING = SKIP_EXISTING || String(args.get('skip-existing') || '').toLowerCase() === 'true'

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

function log(message) {
  if (VERBOSE || SHOULD_DRY_RUN) console.log(message)
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
}

function sanitizeText(value) {
  if (!value) return ''
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

function getPriceFromProduct(product) {
  const raw = pickFirst(
    product.price,
    product.sale_price,
    product.regular_price,
    product.price_html,
    product.meta?.display_price,
    product.prices?.price,
    product.prices?.sale_price,
    product.regularPrice,
    product.salePrice,
  )

  if (raw === '' || raw === null || raw === undefined) return 0
  const clean = String(raw).replace(/[^0-9.,-]/g, '').replace(/,/g, '.')
  const n = Number(clean)
  return Number.isFinite(n) ? n : 0
}

function getProductImageSrc(product) {
  const candidates = [
    product.image?.src,
    product.images?.[0]?.src,
    product.images?.[0]?.url,
    product.gallery_images?.[0]?.src,
    product.featured_src,
    product.featured_image,
    product.image_url,
    product.imageUrl,
    product.src,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('http')) return candidate
  }

  if (Array.isArray(product.images)) {
    for (const item of product.images) {
      if (item?.src && item.src.startsWith('http')) return item.src
    }
  }

  return ''
}

function getCategoryId(product) {
  const category = pickFirst(
    product.categories?.[0]?.id,
    product.category_id,
    product.categoryId,
    product.categories?.[0]?.slug,
    product.category
  )

  if (category === '') return '1'
  if (typeof category === 'number') return String(category)
  if (typeof category === 'string') {
    const digits = category.match(/\d+/)
    return digits ? digits[0] : '1'
  }
  return '1'
}

function buildImageName(productName, imageUrl = '') {
  const stem = slugify(productName) || 'product'
  const ext = (imageUrl.match(/\.(jpe?g|png|webp|gif|avif)(?:\?.*)?$/i)?.[1] || 'jpg').toLowerCase()
  return `${stem}.${ext}`
}

async function httpGet(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'fr-MA,fr;q=0.9',
      ...headers,
    },
    signal: AbortSignal.timeout(15000),
  })

  const text = await response.text()
  let body = text
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    // keep raw text for HTML fallback
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    headers: response.headers,
  }
}

function isProbablyWooCommerceProductRecord(item) {
  return !!item && typeof item === 'object' && (typeof item.name === 'string' || typeof item.title === 'string')
}

async function fetchProductsFromCima() {
  const candidates = [
    `${SOURCE}/wp-json/wc/v3/products?per_page=100&page=1`,
    `${SOURCE}/wp-json/wc/v3/products?per_page=100&page=2`,
    `${SOURCE}/wp-json/wc/v2/products?per_page=100&page=1`,
    `${SOURCE}/wp-json/wc/v2/products?per_page=100&page=2`,
    `${SOURCE}/wp-json/wp/v2/products?per_page=100`,
  ]

  for (const url of candidates) {
    try {
      const res = await httpGet(url)
      if (!res.ok) continue
      const body = res.body
      const items = Array.isArray(body) ? body : Array.isArray(body?.products) ? body.products : Array.isArray(body?.data) ? body.data : []
      if (items.length) {
        return items.filter(isProbablyWooCommerceProductRecord)
      }
    } catch (error) {
      log(`Source skip ${url}: ${error.message}`)
    }
  }

  throw new Error(`Impossible de récupérer les produits depuis ${SOURCE}. Vérifie que le site expose une API publique ou remplace la source.`)
}

function mapProductEntry(raw, index) {
  const name = sanitizeText(pickFirst(raw.name, raw.title, raw.product_name))
  const description = sanitizeText(pickFirst(raw.short_description, raw.description, raw.excerpt))
  const imageSrc = getProductImageSrc(raw)
  const price = getPriceFromProduct(raw)
  const categoryId = getCategoryId(raw)

  if (!name) {
    return null
  }

  return {
    id: raw.id ?? `${Date.now()}-${index}`,
    name,
    description,
    price,
    imageSrc,
    categoryId,
  }
}

async function fetchSourceProducts() {
  const entries = await fetchProductsFromCima()
  const clean = entries
    .map((item, index) => mapProductEntry(item, index))
    .filter(Boolean)

  if (LIMIT_PRODUCTS > 0) {
    return clean.slice(0, LIMIT_PRODUCTS)
  }
  return clean
}

async function downloadImageToLocal(imageUrl, productName) {
  const finalUrl = String(imageUrl || '').trim()
  if (!finalUrl) {
    return ''
  }

  const fileName = buildImageName(productName, finalUrl)
  const targetFile = path.join(OUTPUT_DIR, fileName)

  if (fs.existsSync(targetFile) && SHOULD_SKIP_EXISTING) {
    return fileName
  }

  const response = await fetch(finalUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    throw new Error(`Téléchargement image impossible (${response.status}) pour ${productName}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error(`La ressource n'est pas une image : ${contentType} pour ${productName}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 2000) {
    throw new Error(`Image trop petite (${buffer.length} bytes) pour ${productName}`)
  }

  fs.writeFileSync(targetFile, buffer)
  return fileName
}

async function getDbDriver() {
  if (DB_TYPE === 'postgres') {
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
      type: 'postgres',
      client,
      query: (sql, params = []) => client.query(sql, params),
      close: () => client.end(),
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
    type: 'mysql',
    client: connection,
    query: (sql, params = []) => connection.execute(sql, params),
    close: () => connection.end(),
  }
}

async function hasColumn(db, columnName) {
  if (db.type === 'postgres') {
    const result = await db.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'products' AND column_name = $1 LIMIT 1`,
      [columnName]
    )
    return result.rows && result.rows.length > 0
  }

  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = ? LIMIT 1`,
    [columnName]
  )
  return Array.isArray(rows) && rows.length > 0
}

async function upsertProduct(db, product) {
  const trimmedName = String(product.name || '').trim()
  const price = Number(product.price || 0)
  const categoryId = String(product.categoryId || '1')

  if (!trimmedName) {
    return { inserted: false, updated: false, reason: 'empty-name' }
  }

  if (SHOULD_DRY_RUN) {
    console.log(`[DRY RUN] ${trimmedName} | ${price} MAD | category=${categoryId}`)
    return { inserted: false, updated: false, reason: 'dry-run' }
  }

  const imageName = product.imageName || ''
  const descriptionExists = await hasColumn(db, 'description')

  if (db.type === 'postgres') {
    const existing = await db.query(
      `SELECT id FROM products WHERE lower(name) = lower($1) LIMIT 1`,
      [trimmedName]
    )

    if (existing.rows && existing.rows.length > 0) {
      const id = existing.rows[0].id
      const updateSql = descriptionExists
        ? `UPDATE products SET name = $1, price = $2, image_url = $3, category_id = $4, description = $5 WHERE id = $6`
        : `UPDATE products SET name = $1, price = $2, image_url = $3, category_id = $4 WHERE id = $5`
      const params = descriptionExists
        ? [trimmedName, price, imageName, categoryId, product.description || '', id]
        : [trimmedName, price, imageName, categoryId, id]
      await db.query(updateSql, params)
      return { inserted: false, updated: true, id }
    }

    const insertSql = descriptionExists
      ? `INSERT INTO products (name, price, image_url, category_id, description) VALUES ($1, $2, $3, $4, $5)`
      : `INSERT INTO products (name, price, image_url, category_id) VALUES ($1, $2, $3, $4)`
    const params = descriptionExists
      ? [trimmedName, price, imageName, categoryId, product.description || '']
      : [trimmedName, price, imageName, categoryId]
    const result = await db.query(insertSql, params)
    return { inserted: true, updated: false, id: result.rows?.[0]?.id ?? null }
  }

  const [existingRows] = await db.query(
    `SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    [trimmedName]
  )

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    const id = existingRows[0].id
    const updateSql = descriptionExists
      ? `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ?, description = ? WHERE id = ?`
      : `UPDATE products SET name = ?, price = ?, image_url = ?, category_id = ? WHERE id = ?`
    const params = descriptionExists
      ? [trimmedName, price, imageName, categoryId, product.description || '', id]
      : [trimmedName, price, imageName, categoryId, id]
    await db.query(updateSql, params)
    return { inserted: false, updated: true, id }
  }

  const insertSql = descriptionExists
    ? `INSERT INTO products (name, price, image_url, category_id, description) VALUES (?, ?, ?, ?, ?)`
    : `INSERT INTO products (name, price, image_url, category_id) VALUES (?, ?, ?, ?)`
  const params = descriptionExists
    ? [trimmedName, price, imageName, categoryId, product.description || '']
    : [trimmedName, price, imageName, categoryId]
  const [result] = await db.query(insertSql, params)
  return { inserted: true, updated: false, id: result.insertId ?? null }
}

async function main() {
  const sourceProducts = await fetchSourceProducts()
  console.log(`Produit(s) source récupéré(s): ${sourceProducts.length}`)

  if (sourceProducts.length === 0) {
    console.log('Aucune donnée disponible. Vérifiez l’URL source ou la réponse API.')
    return
  }

  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.warn('⚠️ Variables DB manquantes. Exemple: DB_TYPE=mysql DB_HOST=localhost DB_PORT=3306 DB_NAME=karim_market DB_USER=root DB_PASSWORD=...')
    console.warn('Le script continuera en mode simulation si vous utilisez --dry-run.')
  }

  const db = process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD
    ? await getDbDriver()
    : null

  try {
    for (const product of sourceProducts) {
      try {
        const imageName = await downloadImageToLocal(product.imageSrc, product.name)
        const enriched = {
          ...product,
          imageName,
          description: product.description || '',
        }

        if (db) {
          const outcome = await upsertProduct(db, enriched)
          console.log(`${outcome.inserted ? 'INSERT' : outcome.updated ? 'UPDATE' : 'SKIP'} -> ${product.name}`)
        } else {
          console.log(`SIMULATED -> ${product.name} | image=${imageName || 'none'}`)
        }
      } catch (error) {
        console.warn(`⚠️ ${product.name}: ${error.message}`)
      }
    }
  } finally {
    await db?.close()
  }

  console.log(`
✅ Terminé.
Dossier images : ${OUTPUT_DIR}
Source cible : ${SOURCE}
`)
}

main().catch((error) => {
  console.error('Erreur fatale :')
  console.error(error)
  process.exit(1)
})
