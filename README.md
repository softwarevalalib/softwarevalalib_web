# softwarevala-website

Official website for **Software Vala Liberia** — a full-stack software development agency based in Monrovia, Liberia.

## Tech Stack

- React 18 + Vite 8
- React Router 7
- Tailwind CSS 4
- Framer Motion

## Local Development

```bash
npm install
npm run dev
```

The dev server runs at [http://localhost:5000](http://localhost:5000).

## Production Build

```bash
npm run build
npm run preview
```

## Deploy on Vercel

This project is configured for Vercel deployment. Connect the GitHub repository and Vercel will auto-detect the Vite framework.

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

SPA routing is handled via `vercel.json` rewrites for client-side routes (`/about`, `/services`, `/projects`, etc.).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/about` | About Us |
| `/services` | Services |
| `/projects` | Systems & Solutions Portfolio |
| `/contact` | Contact Form |
| `/team` | Team |
