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

Integrated Academy experience at `/academy` with course catalogue, enrollment, AI assistant, admin dashboard, and a full Academy Portal for students and instructors.

- Routes: `/academy`, `/academy/verify`, `/academy/portal/login`, `/academy/admin`, `/academy/admin/portal/*`, `/academy/portal/student`, `/academy/portal/instructor`
- APIs: `/api/academy/ratings`, `/enroll`, `/insights`, `/dashboard`, `/auth`, `/assistant`, `/admission`, `/portal`
- Academy Portal: admin approves enrollments, issues usernames/passwords; manages courses, instructors, grades, attendance, fees (40/30/30), certificates
- Certificate verify: public `/academy/verify` (hero CTA) using certificate ID + email
- Admission letters: official template from `public/assets/academy/templates/admission_letter_master.pdf`
- Env: `DATABASE_URL` (required). Optional: `OPENAI_API_KEY`, `RESEND_API_KEY`, `ACADEMY_FROM_EMAIL`. Bootstrap admin with `ACADEMY_ADMIN_EMAIL` + `ACADEMY_ADMIN_PASSWORD`.


## Marketing & Sales lead sync

Consultation and quote submissions are saved to `website_leads` first, then forwarded from the server to the SVL Marketing & Sales API. Browser code never receives the integration secret.

- Leads: `POST {SVL_MANAGEMENT_API_URL}/api/marketing-agents/sync/leads`
- Agent applications: `POST {SVL_MANAGEMENT_API_URL}/api/marketing-agents/sync/applications`
- Header: `x-marketing-sync-key: MARKETING_SYNC_SECRET`
- Lead tracking: `website_leads`; application tracking: `marketing_agent_applications`. Both store `sync_status`, `sync_attempts`, `last_sync_attempt`, `last_sync_error`, `management_sync_timestamp`.
- `SYNCED` and `ALREADY_SYNCED` both close the record. `PENDING` records retry with the original reference; `FAILED` records stay until an admin retries them.
- Referral links (`?ref=SVL-MA-0001`) are sent as `referral_agent_code`. An invalid or inactive agent keeps the lead in the CRM with attribution marked for review.
- Server-only variables: `SVL_MANAGEMENT_API_URL`, `MARKETING_SYNC_SECRET`, `CRON_SECRET`. Never prefix them with `VITE_`.

Retry cron: `/api/leads` runs daily around 03:00 UTC (Hobby may invoke it any time in that hour) and reuses the existing function to stay within Hobby's 12-function limit. Vercel Hobby only allows daily cron jobs. On Pro, change `vercel.json` to `*/10 * * * *` for ten-minute retries, or point an external scheduler at `/api/leads` (or `/api/leads?area=recruitment&action=retry-due`) with `Authorization: Bearer $CRON_SECRET`.

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
