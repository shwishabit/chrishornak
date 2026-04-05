# Project Launch Checklist

**Domain:** [domain.com]
**Stack:** Next.js 15 · React 19 · Tailwind CSS v4

---

## Step 1 — Verify the Build
Run these locally before proceeding:
```bash
npm install
npm run build
```
*Must complete with ZERO errors.*

---

## Step 2 — Missing Assets & Integrations

### A. Favicons
Generate at [realfavicongenerator.net](https://realfavicongenerator.net) and place in `/public`:
- `favicon.ico` (32x32)
- `favicon.svg`
- `apple-touch-icon.png` (180x180)

### B. Inline Forms (Formspree)
If you are using the inline lead capture form in `src/app/page.tsx`:
1. Create a form at Formspree.io and get the ID (`xpwzabcd`).
2. Open `src/app/page.tsx`.
3. Update `<form action="#" method="POST">` to `<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">`.

### C. Google Analytics 4
1. Run: `npm install @next/third-parties`
2. Open `src/app/layout.tsx` and import: `import { GoogleAnalytics } from '@next/third-parties/google'`
3. Place `<GoogleAnalytics gaId="G-XXXXXXXXXX" />` inside the `<body>`.

### D. Verify Schema & Social Links
Check `src/app/layout.tsx` for any schema `.org` objects, replacing placeholder social links with real ones.

---

## Step 3 — Deployment (Vercel)
1. Commit and push to GitHub.
2. In Vercel, import the repo. No build settings need to be overridden.
3. Deploy.
4. Add the Custom Domain via Vercel Settings -> Domains.
   - A Record: `@` -> `76.76.21.21`
   - CNAME: `www` -> `cname.vercel-dns.com`

---

## Step 4 — Post-Launch Verification
- [ ] HTTPS is working correctly.
- [ ] Forms submit properly (test it!).
- [ ] Mobile layout is clean, no horizontal scrolling.
- [ ] PageSpeed Insights score > 90.
- [ ] OG Image and Meta descriptions populate when link is shared in Slack/iMessage.
