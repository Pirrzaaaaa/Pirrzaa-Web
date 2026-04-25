# Pirrzaaa OS v1.5

Portfolio interaktif **Pirrzaaa** — siswa SMK TKJ asal Pekalongan & WhatsApp Bot Developer. Dibangun dengan HTML/CSS/JS murni, tanpa framework, tanpa build step.

## Fitur

- **Dark / Light mode** dengan toggle
- **Domain Expansion mode** (Easter egg gaya JJK — coba ketik `sudo ryoiki` atau `ryoiki` di terminal)
- **Bot UI Playground** — simulasi chat bot dengan command `/menu`, `/owner`, `/skills`, `/hobi`, `/ping`, `/clear`
- **System Console terminal** dengan command `help`, `about`, `skills`, `anime`, `clear`
- **RPG stats card**, language stats, matrix coding activity
- **Music player**, magnetic cursor, glitch effects, marquee
- Project & gallery dengan modal preview
- FAQ accordion, contact form, bento grid social links

## Struktur folder

```
Pirrzaa-Web/
├── index.html          # Markup utama
├── assets/
│   ├── css/
│   │   └── styles.css  # Semua style
│   ├── js/
│   │   └── script.js   # Semua logika UI
│   └── favicon.svg     # Favicon SVG
├── robots.txt          # Petunjuk crawler
├── sitemap.xml         # Peta situs
└── .nojekyll           # Bypass Jekyll di GitHub Pages
```

## Cara jalanin lokal

Cukup buka `index.html` di browser, atau pakai server statis ringan:

```bash
# Python 3
python3 -m http.server 8080

# atau Node.js
npx serve .
```

Buka http://localhost:8080.

## Deploy ke GitHub Pages

1. Buka **Settings → Pages** di repo GitHub.
2. Pilih branch `main` dan folder `/ (root)`.
3. Save. URL situs jadi `https://pirrzaaaaa.github.io/Pirrzaa-Web/`.

## Tech stack

- HTML5 semantic
- CSS3 (custom properties, grid, flexbox, backdrop-filter)
- Vanilla JavaScript (IntersectionObserver, requestAnimationFrame)
- [Phosphor Icons](https://phosphoricons.com/) (CDN)
- Google Fonts: Inter, Fira Code, Caveat

## Optimasi yang sudah diterapkan

- CSS & JS dipisah dari HTML supaya bisa di-cache
- `preconnect` ke Google Fonts, `unpkg`, dan `dns-prefetch` ke CDN gambar
- Semua script pakai `defer` (tidak block render)
- Semua gambar non-hero pakai `loading="lazy"` dan `decoding="async"`
- Hero image pakai `fetchpriority="high"`
- Audio pakai `preload="none"` (tidak download sampai user klik play)
- SEO lengkap: meta description, Open Graph, Twitter Card, canonical, JSON-LD Person schema
- Accessibility: skip link, ARIA label & live region, semantic landmarks (`<main>`, `<nav>`, `<footer>`), `prefers-reduced-motion`, focus-visible

## Kredit

Dibuat oleh [Pirrzaaa](https://github.com/Pirrzaaaaa). &copy; 2026.
