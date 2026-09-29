/**
 * Génère les 9 images SVG fallback par catégorie.
 * Chaque SVG est un visuel propre, coloré, avec icône et nom de catégorie.
 * Exécuter une seule fois : node generate-fallbacks.mjs
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'backend/src/main/resources/static/assets/img/products')

fs.mkdirSync(OUT, { recursive: true })

// Palette cohérente avec Tailwind orange (brand) + nuances par catégorie
const categories = [
  {
    id: '1',
    file: 'fallback-cat-1.svg',
    label: 'Produits Laitiers & Œufs',
    bg1: '#fff7ed', bg2: '#ffedd5',
    accent: '#f97316',
    icon: `
      <!-- milk carton -->
      <rect x="68" y="72" width="64" height="76" rx="6" fill="#f97316" opacity=".9"/>
      <polygon points="68,72 100,52 132,72" fill="#fb923c"/>
      <rect x="80" y="88" width="40" height="22" rx="4" fill="white" opacity=".9"/>
      <text x="100" y="104" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="#c2410c">LAIT</text>
      <!-- egg -->
      <ellipse cx="148" cy="115" rx="14" ry="17" fill="#fef3c7"/>
      <ellipse cx="148" cy="115" rx="14" ry="17" fill="none" stroke="#fbbf24" stroke-width="2"/>`,
  },
  {
    id: '2',
    file: 'fallback-cat-2.svg',
    label: 'Épicerie Salée & Conserves',
    bg1: '#fefce8', bg2: '#fef9c3',
    accent: '#ca8a04',
    icon: `
      <!-- jar -->
      <rect x="72" y="88" width="56" height="52" rx="8" fill="#ca8a04" opacity=".85"/>
      <rect x="78" y="80" width="44" height="14" rx="4" fill="#a16207"/>
      <rect x="84" y="96" width="32" height="10" rx="3" fill="white" opacity=".7"/>
      <!-- can -->
      <ellipse cx="148" cy="96" rx="20" ry="8" fill="#d97706"/>
      <rect x="128" y="96" width="40" height="40" fill="#f59e0b"/>
      <ellipse cx="148" cy="136" rx="20" ry="8" fill="#d97706"/>
      <rect x="136" y="105" width="24" height="14" rx="2" fill="white" opacity=".8"/>`,
  },
  {
    id: '3',
    file: 'fallback-cat-3.svg',
    label: 'Charcuterie Halal',
    bg1: '#fff1f2', bg2: '#ffe4e6',
    accent: '#e11d48',
    icon: `
      <!-- sausage link -->
      <ellipse cx="78" cy="115" rx="22" ry="14" fill="#f43f5e" opacity=".9"/>
      <ellipse cx="108" cy="108" rx="22" ry="14" fill="#e11d48"/>
      <ellipse cx="136" cy="115" rx="22" ry="14" fill="#f43f5e" opacity=".9"/>
      <!-- halal star -->
      <circle cx="122" cy="90" r="12" fill="#be123c"/>
      <text x="122" y="95" font-family="Arial" font-size="13" font-weight="bold" text-anchor="middle" fill="white">ح</text>`,
  },
  {
    id: '4',
    file: 'fallback-cat-4.svg',
    label: 'Bébé & Puériculture',
    bg1: '#f0f9ff', bg2: '#e0f2fe',
    accent: '#0284c7',
    icon: `
      <!-- baby bottle -->
      <rect x="86" y="72" width="28" height="52" rx="10" fill="#0ea5e9" opacity=".9"/>
      <rect x="90" y="60" width="20" height="16" rx="4" fill="#7dd3fc"/>
      <ellipse cx="100" cy="60" rx="10" ry="5" fill="#bae6fd"/>
      <rect x="90" y="88" width="20" height="4" rx="2" fill="white" opacity=".5"/>
      <!-- duck -->
      <ellipse cx="148" cy="118" rx="18" ry="14" fill="#fbbf24"/>
      <ellipse cx="158" cy="108" rx="12" ry="10" fill="#fbbf24"/>
      <ellipse cx="164" cy="107" rx="4" ry="3" fill="#f97316"/>
      <circle cx="161" cy="105" r="2" fill="#1e293b"/>`,
  },
  {
    id: '5',
    file: 'fallback-cat-5.svg',
    label: 'Boissons & Eaux',
    bg1: '#f0fdfa', bg2: '#ccfbf1',
    accent: '#0d9488',
    icon: `
      <!-- water bottle -->
      <rect x="78" y="78" width="30" height="66" rx="8" fill="#0d9488" opacity=".9"/>
      <rect x="83" y="68" width="20" height="14" rx="4" fill="#0f766e"/>
      <rect x="84" y="95" width="18" height="12" rx="3" fill="white" opacity=".7"/>
      <rect x="87" y="112" width="12" height="5" rx="2" fill="white" opacity=".4"/>
      <!-- glass with bubbles -->
      <polygon points="130,78 150,78 145,142 135,142" fill="#2dd4bf" opacity=".8"/>
      <circle cx="136" cy="95"  r="3" fill="white" opacity=".6"/>
      <circle cx="143" cy="108" r="2" fill="white" opacity=".6"/>
      <circle cx="138" cy="120" r="2.5" fill="white" opacity=".5"/>`,
  },
  {
    id: '6',
    file: 'fallback-cat-6.svg',
    label: 'Biscuits, Chocolats & Snacking',
    bg1: '#fdf4ff', bg2: '#fae8ff',
    accent: '#9333ea',
    icon: `
      <!-- chocolate bar -->
      <rect x="64" y="82" width="72" height="52" rx="8" fill="#7c3aed"/>
      <line x1="88"  y1="82" x2="88"  y2="134" stroke="#6d28d9" stroke-width="2"/>
      <line x1="112" y1="82" x2="112" y2="134" stroke="#6d28d9" stroke-width="2"/>
      <line x1="64"  y1="108" x2="136" y2="108" stroke="#6d28d9" stroke-width="2"/>
      <!-- cookie -->
      <circle cx="152" cy="104" r="22" fill="#c084fc" opacity=".85"/>
      <circle cx="144" cy="97"  r="4" fill="#7c3aed" opacity=".7"/>
      <circle cx="157" cy="103" r="4" fill="#7c3aed" opacity=".7"/>
      <circle cx="148" cy="113" r="4" fill="#7c3aed" opacity=".7"/>`,
  },
  {
    id: '7',
    file: 'fallback-cat-7.svg',
    label: 'Petit-déjeuner & Tartinables',
    bg1: '#fffbeb', bg2: '#fef3c7',
    accent: '#d97706',
    icon: `
      <!-- coffee cup -->
      <rect x="72" y="90" width="52" height="46" rx="8" fill="#d97706"/>
      <path d="M124,104 Q140,104 140,118 Q140,132 124,132" fill="none" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="98" cy="90" rx="26" ry="6" fill="#b45309"/>
      <!-- steam -->
      <path d="M88,80 Q90,72 88,65" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
      <path d="M98,78 Q100,70 98,63" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
      <path d="M108,80 Q110,72 108,65" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
      <!-- toast -->
      <rect x="136" y="86" width="32" height="38" rx="4" fill="#fbbf24"/>
      <rect x="140" y="90" width="24" height="6"  rx="2" fill="#f59e0b"/>`,
  },
  {
    id: '8',
    file: 'fallback-cat-8.svg',
    label: 'Hygiène Corporelle',
    bg1: '#f0fdf4', bg2: '#dcfce7',
    accent: '#16a34a',
    icon: `
      <!-- shampoo bottle -->
      <rect x="70" y="80" width="36" height="64" rx="10" fill="#16a34a"/>
      <rect x="76" y="68" width="24" height="16" rx="5" fill="#15803d"/>
      <rect x="78" y="72" width="20" height="6"  rx="3" fill="#bbf7d0"/>
      <rect x="76" y="98" width="24" height="16" rx="3" fill="white" opacity=".8"/>
      <!-- soap bubble -->
      <circle cx="142" cy="90"  r="18" fill="#4ade80" opacity=".5"/>
      <circle cx="155" cy="108" r="14" fill="#86efac" opacity=".5"/>
      <circle cx="138" cy="112" r="10" fill="#bbf7d0" opacity=".6"/>
      <circle cx="148" cy="95"  r="5"  fill="white"   opacity=".6"/>`,
  },
  {
    id: '9',
    file: 'fallback-cat-9.svg',
    label: 'Entretien & Maison',
    bg1: '#eff6ff', bg2: '#dbeafe',
    accent: '#2563eb',
    icon: `
      <!-- cleaning bottle -->
      <rect x="74" y="86" width="34" height="58" rx="8" fill="#2563eb"/>
      <rect x="79" y="74" width="24" height="16" rx="5" fill="#1d4ed8"/>
      <!-- spray nozzle -->
      <path d="M108,82 L122,78 L122,90 L108,90 Z" fill="#3b82f6"/>
      <path d="M122,80 Q134,76 136,86" fill="none" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
      <rect x="80" y="98" width="22" height="12" rx="3" fill="white" opacity=".8"/>
      <!-- bubbles -->
      <circle cx="150" cy="100" r="10" fill="#93c5fd" opacity=".6"/>
      <circle cx="163" cy="112" r="8"  fill="#bfdbfe" opacity=".6"/>
      <circle cx="152" cy="120" r="6"  fill="#dbeafe" opacity=".7"/>`,
  },
]

for (const cat of categories) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg${cat.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${cat.bg1}"/>
      <stop offset="100%" stop-color="${cat.bg2}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="200" height="200" fill="url(#bg${cat.id})" rx="16"/>

  <!-- Border -->
  <rect x="2" y="2" width="196" height="196" fill="none" stroke="${cat.accent}" stroke-width="1.5" stroke-opacity="0.2" rx="15"/>

  <!-- Icon group -->
  <g>${cat.icon}
  </g>

  <!-- Category label band -->
  <rect x="0" y="158" width="200" height="42" rx="0" fill="${cat.accent}" opacity=".92"/>
  <rect x="0" y="158" width="200" height="42" rx="0" fill="url(#bg${cat.id})" opacity=".1"/>

  <!-- Category name (auto-wrap via 2 lines max) -->
  <text
    x="100" y="175"
    font-family="'Segoe UI', Arial, sans-serif"
    font-size="10"
    font-weight="600"
    text-anchor="middle"
    fill="white"
    opacity=".95"
  >${cat.label.length > 22 ? cat.label.substring(0, 22) : cat.label}</text>
  ${cat.label.length > 22 ? `<text x="100" y="189" font-family="'Segoe UI', Arial, sans-serif" font-size="10" font-weight="600" text-anchor="middle" fill="white" opacity=".95">${cat.label.substring(22)}</text>` : ''}
</svg>`

  const dest = path.join(OUT, cat.file)
  fs.writeFileSync(dest, svg, 'utf8')
  console.log(`✓ ${cat.file}  —  ${cat.label}`)
}

console.log(`\n✅ ${categories.length} SVG générés dans :\n   ${OUT}\n`)
