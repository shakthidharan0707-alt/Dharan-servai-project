# GreenLoop — Smart RVM Kiosk Demo

A jury-facing demo of the Smart Reverse Vending Machine concept: a recycling kiosk
where a user picks a material, the machine "weighs" the item and calculates a
reward automatically, plus a city-wide dashboard showing every machine's
collection totals.

This is a front-end-only prototype (no backend/database) — all data lives in
the browser session, and other city machines' activity is simulated in the
background so the dashboard looks alive.

## Tech stack
- [Vite](https://vitejs.dev/) + React 18
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for the dashboard chart
- [lucide-react](https://lucide.dev/) for icons

## Project structure
```
.
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── main.jsx      # React entry point
    ├── App.jsx        # the entire kiosk + dashboard app
    └── index.css      # Tailwind imports
```

## Run locally
```bash
npm install
npm run dev
```
Then open the URL Vite prints (usually http://localhost:5173).

## Build for production
```bash
npm run build
npm run preview   # optional: preview the production build locally
```

## Deploy to Vercel

**Option A — via GitHub (recommended):**
1. Push this folder to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — GreenLoop RVM kiosk demo"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the repository.
3. Vercel auto-detects Vite — no configuration needed. Click **Deploy**.

**Option B — via Vercel CLI:**
```bash
npm install -g vercel
vercel
```
Follow the prompts; Vercel will detect the Vite framework automatically.

## Customizing
- Material types and reward rates: `MATERIALS` object near the top of `src/App.jsx`.
- Simulated city machines: `MACHINES` array in the same file.
- Colors/typography: the `T` design-tokens object at the top of `src/App.jsx`.

## Notes for judges / reviewers
This prototype demonstrates the reward-calculation logic and the shape of a
city-wide monitoring dashboard. It intentionally does **not** connect to real
hardware — the companion ESP32 firmware and full system architecture (cloud
backend, database schema, API spec) are documented separately in the project's
`docs/` folder.
