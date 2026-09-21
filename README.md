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
npm run dev:api
npm run dev
```

The Vite app runs at [http://localhost:5000](http://localhost:5000).  
`npm run dev:api` starts the local feedback API on port `3001` (proxied via Vite).

Copy `.env.example` to `.env.local` and set `DATABASE_URL` (Neon connection string).

## Client Feedback (live reviews)

Visitors can submit ratings and reviews on the homepage. Submissions are stored in Neon Postgres and appear on the site automatically (polled about every 15 seconds).

- API: `GET/POST /api/feedback`
- Table: `client_feedback`

## SVL Training Academy

Integrated Academy experience at `/academy` with course catalogue, course detail pages, multi-course enrollment, live course ratings, analytics tracking, and an admin dashboard.

- Routes: `/academy`, `/academy/courses/:slug`, `/academy/enroll`, `/academy/login`, `/academy/admin`
- APIs: `/api/academy/ratings`, `/api/academy/enroll`, `/api/academy/insights`, `/api/academy/dashboard`, `/api/academy/auth`
- Assets: `public/assets/academy/` (logo, information sheet PDF, hero slides, course placeholders)
- Env: `DATABASE_URL` (required). Bootstrap admin with `ACADEMY_ADMIN_EMAIL` + `ACADEMY_ADMIN_PASSWORD` if no admin row exists.
- Admin login: email/password → session token. Reset password under Admin → Settings.

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
- **Environment variable required:** `DATABASE_URL` (Neon Postgres connection string)

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
