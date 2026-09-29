#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const sourcePath = path.join(projectRoot, 'frontend/src/services/api.js')
const outputPath = path.join(projectRoot, 'catalogue-produits-images.csv')
const source = fs.readFileSync(sourcePath, 'utf8')

const slugStart = source.indexOf('const slug =')
const slugEnd = source.indexOf('const store =', slugStart)
const slug = new Function(`${source.slice(slugStart, slugEnd)}; return slug`)()

const productsStart = source.indexOf('products: (() => {')
const productsBodyStart = productsStart + 'products: (() => {'.length
const productsBodyEnd = source.indexOf('return list', productsBodyStart)
const products = new Function(
  'slug',
  `${source.slice(productsBodyStart, productsBodyEnd)}; return list`,
)(slug)

const categories = {
  '1': 'Produits Laitiers & Œufs',
  '2': 'Épicerie Salée & Conserves',
  '3': 'Charcuterie Halal',
  '4': 'Bébé & Puériculture',
  '5': 'Boissons & Eaux',
  '6': 'Biscuits, Chocolats & Snacking',
  '7': 'Petit-déjeuner & Tartinables',
  '8': 'Hygiène Corporelle',
  '9': 'Entretien & Maison',
}

const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`
const rows = [
  ['id', 'categorie', 'produit', 'image'],
  ...products.map((product) => [
    product.id,
    categories[String(product.categoryId)] || product.categoryId,
    product.name,
    product.imageUrl,
  ]),
]

fs.writeFileSync(
  outputPath,
  `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\n')}\n`,
  'utf8',
)

console.log(`Export terminé : ${products.length} lignes -> ${path.relative(projectRoot, outputPath)}`)