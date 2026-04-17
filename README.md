# Eurolens

A web-based macroeconomic dashboard for the EU economic area — visualising ECB interest rates, HICP inflation, GDP growth, and unemployment across EU member states. Built with React and a Node.js proxy backend.

> **Live demo:** [Deployed on Vercel](https://eurolens-savo.vercel.app/) · Backend hosted on Render (may take a moment to boot after inactivity)

> **Management README** A high level version of this README is also available as an HTML page [Deployed on GitHub-Pages](#). But this file remains the official and more technical documentation


---

## Problem

Understanding European macroeconomic trends requires navigating multiple data sources with inconsistent formats. Eurolens aggregates data from Eurostat and the World Bank into a single, interactive interface with an AI assistant for contextual analysis. The project originated from an Economics module at our German university.

---

## Architecture

```
Eurostat API (SDMX)  ──┐
World Bank API       ──┼──▶  Express Proxy (Render)  ──▶  React SPA (Vercel)  ──▶  Browser
LLM Provider         ──┘         backend/server.js           frontend/src
```

- The **React SPA** makes all requests to the Express proxy — no direct external calls from the browser
- The **Express proxy** normalises Eurostat SDMX JSON-stat responses (custom flat-index/strides parser), fetches World Bank data, and routes AI chat to a configurable LLM provider
- **TanStack Query v5** handles all client-side data fetching, caching, and background refetching
- URL search params persist all filters (country selection, time range) so views are shareable

---

## Project Structure

```
.
├── backend/
│   ├── .env                  # PORT, LLM_PROVIDER, LLM_API_KEY, LLM_MODEL
│   ├── package.json          # express, cors, dotenv, pg
│   └── server.js             # All API routes + LLM abstraction layer
└── frontend/
    ├── .env                  # VITE_API_BASE_URL
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── main.tsx           # QueryClient · BrowserRouter · routes
        ├── index.css          # Tailwind v4 + CSS custom properties (light/dark)
        ├── pages/
        │   ├── Overview.tsx      # KPI cards + combined charts
        │   ├── InterestRates.tsx # ECB rate history + data table
        │   ├── Inflation.tsx     # HICP line + latest bar chart
        │   ├── GDP.tsx           # GDP growth bar/line charts
        │   ├── Unemployment.tsx  # Unemployment line + latest bar chart
        │   └── Compare.tsx       # Side-by-side 2-country comparison
        ├── components/
        │   ├── charts/           # BaseAreaChart · BaseBarChart · BaseLineChart · SparkLine · CustomTooltip
        │   ├── dashboard/        # ECBRatesPanel · InflationPanel · GDPPanel · ComparisonPanel
        │   ├── layout/           # AppShell · Sidebar · TopBar
        │   └── ui/               # KPICard · ChatPanel · ChartWrapper · MultiSelect · Skeleton · …
        ├── hooks/
        │   ├── useECBRates.ts         # MRO + deposit rate — Eurostat irtstm
        │   ├── useInflation.ts        # HICP — Eurostat prc_hicp_manr
        │   ├── useGDP.ts              # GDP growth — World Bank NY.GDP.MKTP.KD.ZG
        │   ├── useUnemployment.ts     # Eurostat une_rt_m
        │   ├── useCountryComparison.ts
        │   └── useChat.ts             # Multi-turn chat + POST /api/chat
        ├── lib/
        │   ├── api.ts
        │   ├── constants.ts      # EU country list + flags
        │   └── formatters.ts
        └── types/
            ├── ecb.ts
            ├── worldbank.ts
            └── chart.ts
```

---

## Pages

| Page | Route | Description |
|---|---|---|
| Overview | `/` | KPI cards (MRO rate, deposit rate, EZ inflation, GDP, unemployment) + combined charts |
| Interest Rates | `/rates` | MRO & deposit rate line chart + historical rate table. Filter: time range (1Y / 2Y / 5Y / All) |
| Inflation | `/inflation` | Multi-country HICP line chart + latest inflation bar chart. Filters: up to 5 countries + time range |
| GDP | `/gdp` | Annual GDP growth bar chart + 10-year sparklines per country. Filter: country select |
| Unemployment | `/unemployment` | Multi-country unemployment line chart + latest rates bar chart. Filters: up to 5 countries + time range |
| Compare | `/compare` | Side-by-side inflation + GDP charts and summary stats table for 2 countries. URL: `?a=DE&b=FR` |

---

## Data Sources

| Source | Dataset / Indicator | Used for |
|---|---|---|
| **Eurostat** (SDMX REST) | `irtstm` | ECB 3-month & day-to-day rates (MRO & deposit facility proxies) |
| **Eurostat** (SDMX REST) | `prc_hicp_manr` | HICP inflation — annual rate of change |
| **Eurostat** (SDMX REST) | `une_rt_m` | Unemployment — seasonally adjusted, % of active population |
| **World Bank** (REST JSON) | `NY.GDP.MKTP.KD.ZG` | Annual GDP growth rate |
| **LLM Provider** | OpenAI / Anthropic / Gemini | AI chat assistant (configurable via env) |

**Countries covered:** Germany (DE), France (FR), Italy (IT), Spain (ES), Poland (PL), Netherlands (NL), Sweden (SE), Finland (FI), Austria (AT), Belgium (BE)

---

## Tech Stack

**Frontend:** React 19 · TypeScript 5.6 · Vite 6 · Tailwind CSS v4 · TanStack Query v5 · React Router v6 · Recharts 2 · date-fns 4 · lucide-react

**Backend:** Node.js · Express 5 · cors · dotenv · pg (PostgreSQL client)

**Tooling:** ESLint · TypeScript strict mode

---

## Setup

### Backend

```bash
cd backend
npm install
# create .env (see below)
node server.js
```

`backend/.env`:
```
PORT=3000
LLM_PROVIDER=openai        # openai | anthropic | google
LLM_API_KEY=your-key-here
LLM_MODEL=gpt-4o-mini      # optional, has defaults per provider
```

### Frontend

```bash
cd frontend
npm install
# create .env (see below)
npm run dev
```

`frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:3000
```

---

## Deployment

- **Frontend** → Vercel. Set `VITE_API_BASE_URL` to your Render backend URL in Vercel environment variables.
- **Backend** → Render (Node.js web service). Set `LLM_PROVIDER`, `LLM_API_KEY`, and optionally `LLM_MODEL`. Free tier instances cold-start after inactivity.

---

## AI Chat

The AI assistant (`POST /api/chat`) is scoped to EU economics and the Eurolens dashboard only. It will decline to answer unrelated questions. Features:

- Multi-provider: swap between OpenAI, Anthropic, or Google Gemini with a single env variable
- Rate limited: 10 requests per minute per IP (in-memory)
- Context injection: the current dashboard page and live data summary are passed with each message
- 20-message history window to control token usage

---

## AI Usage Disclosure

AI tools were used as coding agents during development. Requirements engineering, architecture decisions, and feature choices were made by the team.

**Tools used:** Claude (Anthropic) · Gemini (in-app chatbot) · Cursor · Figma Make · Base44

**What was generated:** Code snippets, component scaffolding, initial implementations

**What was manually modified:** UI styling and adjustments, requirements engineering, prompt optimisation, customisation to meet project requirements

---

## Further Improvements

- Mobile optimisation for small-screen devices
- Additional data sources for more comprehensive analysis
- Single-country overview dashboard page
- Advanced cross-page linking (e.g. click a country on Overview → goes to filtered Inflation page)
- Improved onboarding documentation
