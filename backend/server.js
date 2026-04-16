const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============================================
// Fetch wrapper with timeout
// ============================================
async function safeFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log(`[FETCH] ${url}`);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[ERROR] ${response.status} - ${url}`);
      console.error(`[BODY] ${body.substring(0, 300)}`);
      throw new Error(`API ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error(`Timeout: ${url}`);
    throw err;
  }
}

// ============================================
// Eurostat JSON-stat parser
//
// Format:
// {
//   "value": { "0": 2.1, "5": 2.3, ... },
//   "id": ["freq", "int_rt", "geo", "time"],
//   "size": [1, 1, 1, 674],
//   "dimension": {
//     "time": { "category": { "index": { "1970-01": 0, ... } } },
//     "geo": { "category": { "index": { "EA": 0 }, "label": { "EA": "Euro area" } } }
//   }
// }
//
// Flat index = sum( index_of_dim_i * stride_i )
// stride_i = product of sizes of all dimensions after i
// ============================================

const ESTAT_BASE =
  "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data";

function periodToDate(period) {
  // "2024M01" -> "2024-01-01"
  if (period.includes("M")) return period.replace("M", "-") + "-01";
  // "2024-01" -> "2024-01-01"
  if (period.length === 7 && period[4] === "-") return period + "-01";
  // "2024" -> "2024-01-01"
  if (period.length === 4) return period + "-01-01";
  return period;
}

function getOrderedKeys(categoryIndex) {
  return Object.entries(categoryIndex)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
}

function computeStrides(sizes) {
  const strides = new Array(sizes.length);
  strides[sizes.length - 1] = 1;
  for (let i = sizes.length - 2; i >= 0; i--) {
    strides[i] = strides[i + 1] * sizes[i + 1];
  }
  return strides;
}

function parseEurostatSingle(json) {
  const results = [];
  if (!json || !json.value || !json.id || !json.size) return results;

  const ids = json.id;
  const sizes = json.size;
  const strides = computeStrides(sizes);

  // Find time dimension
  const timePos = ids.findIndex((d) => d === "time" || d === "TIME_PERIOD");
  if (timePos === -1) return results;

  const timeDim = json.dimension[ids[timePos]];
  const timePeriods = getOrderedKeys(timeDim.category.index);

  for (const [flatIdx, val] of Object.entries(json.value)) {
    if (val === null || val === undefined) continue;
    const idx = parseInt(flatIdx);
    const timeIdx = Math.floor(idx / strides[timePos]) % sizes[timePos];

    if (timeIdx < timePeriods.length) {
      results.push({
        date: periodToDate(timePeriods[timeIdx]),
        value: parseFloat(Number(val).toFixed(4)),
      });
    }
  }

  results.sort((a, b) => new Date(a.date) - new Date(b.date));
  return results;
}

function parseEurostatMultiGeo(json) {
  if (!json || !json.value || !json.id || !json.size) return [];

  const ids = json.id;
  const sizes = json.size;
  const strides = computeStrides(sizes);

  const geoPos = ids.findIndex((d) => d === "geo" || d === "GEO");
  const timePos = ids.findIndex((d) => d === "time" || d === "TIME_PERIOD");
  if (geoPos === -1 || timePos === -1) return [];

  const geoDim = json.dimension[ids[geoPos]];
  const timeDim = json.dimension[ids[timePos]];

  const geoCodes = getOrderedKeys(geoDim.category.index);
  const geoLabels = geoDim.category.label || {};
  const timePeriods = getOrderedKeys(timeDim.category.index);

  const countries = {};

  for (const [flatIdx, val] of Object.entries(json.value)) {
    if (val === null || val === undefined) continue;
    const idx = parseInt(flatIdx);

    const geoIdx = Math.floor(idx / strides[geoPos]) % sizes[geoPos];
    const timeIdx = Math.floor(idx / strides[timePos]) % sizes[timePos];

    const code = geoCodes[geoIdx];
    const period = timePeriods[timeIdx];
    if (!code || !period) continue;

    if (!countries[code]) {
      countries[code] = {
        country: code,
        countryName: geoLabels[code] || code,
        data: [],
      };
    }

    countries[code].data.push({
      date: periodToDate(period),
      value: parseFloat(Number(val).toFixed(4)),
    });
  }

  for (const c of Object.values(countries)) {
    c.data.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  return Object.values(countries);
}

// ============================================
// Routes
// ============================================

app.get("/", (req, res) => {
  res.json({ message: "Eurolens API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ----------------------------------------
// ECB Interest Rates (via Eurostat irt_st_m)
// IRT_M3 (3-month rate) ≈ MRO proxy
// IRT_DTD (day-to-day rate) ≈ Deposit facility proxy
// ----------------------------------------
app.get("/api/ecb/rates", async (req, res) => {
  try {
    const [mroResp, depositResp] = await Promise.all([
      safeFetch(
        `${ESTAT_BASE}/irt_st_m/M.IRT_M3.EA?format=JSON&lastNObservations=60`
      ),
      safeFetch(
        `${ESTAT_BASE}/irt_st_m/M.IRT_DTD.EA?format=JSON&lastNObservations=60`
      ),
    ]);

    const mroJson = await mroResp.json();
    const depositJson = await depositResp.json();

    const mro = parseEurostatSingle(mroJson);
    const deposit = parseEurostatSingle(depositJson);

    console.log(`[RATES] MRO(3m): ${mro.length}, Deposit(DTD): ${deposit.length}`);
    res.json({ mro, deposit });
  } catch (err) {
    console.error("Error fetching rates:", err.message);
    res.status(502).json({ error: "Failed to fetch rate data", details: err.message });
  }
});

// ----------------------------------------
// Eurozone HICP Inflation
// ----------------------------------------
app.get("/api/ecb/inflation/eurozone", async (req, res) => {
  try {
    // Try EA20 first, fallback to EA
    let json;
    for (const geo of ["EA20", "EA"]) {
      try {
        const resp = await safeFetch(
          `${ESTAT_BASE}/prc_hicp_manr/M.RCH_A.CP00.${geo}?format=JSON&lastNObservations=60`
        );
        json = await resp.json();
        if (json.value && Object.keys(json.value).length > 0) {
          console.log(`[INFLATION EZ] Using geo=${geo}`);
          break;
        }
      } catch (e) {
        console.warn(`[INFLATION EZ] ${geo} failed: ${e.message}`);
      }
    }

    if (!json) throw new Error("No Eurozone inflation data available");

    const data = parseEurostatSingle(json);
    console.log(`[INFLATION EZ] ${data.length} points`);
    res.json({ data });
  } catch (err) {
    console.error("Error fetching Eurozone inflation:", err.message);
    res.status(502).json({ error: "Failed to fetch inflation", details: err.message });
  }
});

// ----------------------------------------
// Single Country Inflation
// ----------------------------------------
app.get("/api/ecb/inflation/country/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const resp = await safeFetch(
      `${ESTAT_BASE}/prc_hicp_manr/M.RCH_A.CP00.${code}?format=JSON&lastNObservations=60`
    );
    const json = await resp.json();
    const data = parseEurostatSingle(json);
    console.log(`[INFLATION ${code}] ${data.length} points`);
    res.json({ country: code, data });
  } catch (err) {
    console.error(`Error inflation ${req.params.code}:`, err.message);
    res.status(502).json({ error: "Failed to fetch inflation", details: err.message });
  }
});

// ----------------------------------------
// Multiple Countries Inflation
// ----------------------------------------
app.get("/api/ecb/inflation/countries", async (req, res) => {
  try {
    const codes = (req.query.codes || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (codes.length === 0) {
      return res.status(400).json({ error: "No country codes" });
    }

    // Eurostat supports + for multi-geo
    const joined = codes.join("+");

    let countries = [];
    try {
      const resp = await safeFetch(
        `${ESTAT_BASE}/prc_hicp_manr/M.RCH_A.CP00.${joined}?format=JSON&lastNObservations=60`
      );
      const json = await resp.json();
      countries = parseEurostatMultiGeo(json);
    } catch (err) {
      console.warn("[INFLATION MULTI] Combined failed, trying individual:", err.message);

      const results = await Promise.allSettled(
        codes.map(async (code) => {
          const resp = await safeFetch(
            `${ESTAT_BASE}/prc_hicp_manr/M.RCH_A.CP00.${code}?format=JSON&lastNObservations=60`
          );
          const json = await resp.json();
          return { country: code, data: parseEurostatSingle(json) };
        })
      );

      countries = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
    }

    console.log(`[INFLATION MULTI] ${countries.length} countries`);
    res.json({ countries });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(502).json({ error: "Failed to fetch inflation", details: err.message });
  }
});

// ----------------------------------------
// Single Country GDP (World Bank)
// ----------------------------------------
app.get("/api/worldbank/gdp/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const resp = await safeFetch(
      `https://api.worldbank.org/v2/country/${code}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=15&per_page=100`
    );
    const json = await resp.json();

    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
      return res.json({ country: code, countryName: code, data: [] });
    }

    const data = json[1]
      .filter((d) => d.value !== null)
      .map((d) => ({
        year: parseInt(d.date),
        value: parseFloat(d.value.toFixed(4)),
      }))
      .sort((a, b) => a.year - b.year);

    const name = json[1][0]?.country?.value || code;
    console.log(`[GDP ${code}] ${data.length} points`);
    res.json({ country: code, countryName: name, data });
  } catch (err) {
    console.error(`Error GDP ${req.params.code}:`, err.message);
    res.status(502).json({ error: "Failed to fetch GDP", details: err.message });
  }
});

// ----------------------------------------
// Multiple Countries GDP (World Bank)
// ----------------------------------------
app.get("/api/worldbank/gdp", async (req, res) => {
  try {
    const codes = (req.query.codes || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (codes.length === 0) {
      return res.status(400).json({ error: "No country codes" });
    }

    const joined = codes.join(";");
    const resp = await safeFetch(
      `https://api.worldbank.org/v2/country/${joined}/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=15&per_page=500`
    );
    const json = await resp.json();

    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
      return res.json({ countries: [] });
    }

    const countryMap = {};
    for (const d of json[1]) {
      if (d.value === null || d.value === undefined) continue;

      const code = d.country.id;
      const name = d.country.value;

      if (!countryMap[code]) {
        countryMap[code] = { country: code, countryName: name, data: [] };
      }

      countryMap[code].data.push({
        year: parseInt(d.date),
        value: parseFloat(d.value.toFixed(4)),
      });
    }

    const countries = Object.values(countryMap).map((c) => ({
      ...c,
      data: c.data.sort((a, b) => a.year - b.year),
    }));

    console.log(`[GDP MULTI] ${countries.length} countries`);
    res.json({ countries });
  } catch (err) {
    console.error("Error multi GDP:", err.message);
    res.status(502).json({ error: "Failed to fetch GDP", details: err.message });
  }
});

// ----------------------------------------
// Eurozone Unemployment Rate
// ----------------------------------------
app.get("/api/eurostat/unemployment/eurozone", async (req, res) => {
  try {
    let json;
    for (const geo of ["EA20", "EA"]) {
      try {
        const resp = await safeFetch(
          `${ESTAT_BASE}/une_rt_m/M.SA.TOTAL.PC_ACT.T.${geo}?format=JSON&lastNObservations=60`
        );
        json = await resp.json();
        if (json.value && Object.keys(json.value).length > 0) {
          console.log(`[UNEMPLOYMENT EZ] Using geo=${geo}`);
          break;
        }
      } catch (e) {
        console.warn(`[UNEMPLOYMENT EZ] ${geo} failed: ${e.message}`);
      }
    }

    if (!json) throw new Error("No Eurozone unemployment data available");

    const data = parseEurostatSingle(json);
    console.log(`[UNEMPLOYMENT EZ] ${data.length} points`);
    res.json({ data });
  } catch (err) {
    console.error("Error fetching Eurozone unemployment:", err.message);
    res.status(502).json({ error: "Failed to fetch unemployment", details: err.message });
  }
});

// ----------------------------------------
// Single Country Unemployment
// ----------------------------------------
app.get("/api/eurostat/unemployment/country/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const resp = await safeFetch(
      `${ESTAT_BASE}/une_rt_m/M.SA.TOTAL.PC_ACT.T.${code}?format=JSON&lastNObservations=60`
    );
    const json = await resp.json();
    const data = parseEurostatSingle(json);
    console.log(`[UNEMPLOYMENT ${code}] ${data.length} points`);
    res.json({ country: code, data });
  } catch (err) {
    console.error(`Error unemployment ${req.params.code}:`, err.message);
    res.status(502).json({ error: "Failed to fetch unemployment", details: err.message });
  }
});

// ----------------------------------------
// Multiple Countries Unemployment
// ----------------------------------------
app.get("/api/eurostat/unemployment/countries", async (req, res) => {
  try {
    const codes = (req.query.codes || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (codes.length === 0) {
      return res.status(400).json({ error: "No country codes" });
    }

    const joined = codes.join("+");
    let countries = [];

    try {
      const resp = await safeFetch(
        `${ESTAT_BASE}/une_rt_m/M.SA.TOTAL.PC_ACT.T.${joined}?format=JSON&lastNObservations=60`
      );
      const json = await resp.json();
      countries = parseEurostatMultiGeo(json);
    } catch (err) {
      console.warn("[UNEMPLOYMENT MULTI] Combined failed, trying individual:", err.message);

      const results = await Promise.allSettled(
        codes.map(async (code) => {
          const resp = await safeFetch(
            `${ESTAT_BASE}/une_rt_m/M.SA.TOTAL.PC_ACT.T.${code}?format=JSON&lastNObservations=60`
          );
          const json = await resp.json();
          return { country: code, data: parseEurostatSingle(json) };
        })
      );

      countries = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
    }

    console.log(`[UNEMPLOYMENT MULTI] ${countries.length} countries`);
    res.json({ countries });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(502).json({ error: "Failed to fetch unemployment", details: err.message });
  }
});

// ============================================
// AI Chat Endpoint
// ============================================

// Rate limiting: simple in-memory store
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// System prompt with guardrails
const SYSTEM_PROMPT = `You are Eurolens AI, an expert assistant embedded in the Eurolens economic data dashboard for the EU Economic Area.

## Your Role
You help users understand European economic data, ECB monetary policy, inflation trends, GDP growth, unemployment rates, and how to use the Eurolens dashboard.

## Knowledge Areas
- ECB monetary policy: interest rates (MRO, deposit facility), quantitative easing, forward guidance
- HICP inflation: methodology, country comparisons, trends, drivers
- GDP growth: annual rates, country comparisons, economic cycles
- Unemployment: rates by country, seasonal adjustment, labor market trends
- The Eurolens dashboard: pages, charts, filters, how to interpret data

## Dashboard Pages (you can link users to these)
- **Overview** (\`/\`): KPI cards (MRO rate, deposit rate, Eurozone inflation, GDP growth, Eurozone unemployment), combined MRO vs inflation line chart, country inflation bar chart
- **Interest Rates** (\`/rates\`): MRO and deposit facility rate line chart with time range selector (1Y/2Y/5Y/All), historical rate data table. Example: \`/rates?range=2Y\`
- **Inflation** (\`/inflation\`): Multi-country HICP inflation line chart, country selector (up to 5), time range selector, plus a "Latest Inflation by Country" horizontal bar chart. Example: \`/inflation?countries=DE,FR,IT&range=2Y\`
- **GDP** (\`/gdp\`): Grouped or stacked bar chart of GDP growth for EU countries, country selector, sparklines showing 10-year trends. Example: \`/gdp?countries=DE,FR,IT\`
- **Unemployment** (\`/unemployment\`): Multi-country unemployment rate line chart, country selector (up to 5), time range selector, plus a "Latest Unemployment by Country" horizontal bar chart. Example: \`/unemployment?countries=DE,FR,IT&range=2Y\`
- **Compare** (\`/compare\`): Side-by-side comparison of 2 countries with inflation line chart, GDP bar chart, and summary statistics table. Example: \`/compare?a=DE&b=FR\`

## Data Sources
- Interest rates: Eurostat irt_st_m dataset (3-month rate as MRO proxy, day-to-day rate as deposit facility proxy)
- Inflation: Eurostat prc_hicp_manr dataset (HICP annual rate of change)
- GDP: World Bank NY.GDP.MKTP.KD.ZG indicator
- Unemployment: Eurostat une_rt_m dataset (seasonally adjusted, percentage of active population)
- Countries covered: Germany (DE), France (FR), Italy (IT), Spain (ES), Poland (PL), Netherlands (NL), Sweden (SE), Finland (FI), Austria (AT), Belgium (BE)

## Live Dashboard Data
The user may provide live data context with their message. Use this data to give specific, accurate answers about current values and trends.

## Guardrails
- ONLY answer questions related to: European economics, ECB policy, the Eurolens dashboard, inflation, GDP, interest rates, unemployment, EU member states' economies, and general financial literacy in the EU context.
- If asked about non-EU economies, briefly compare to EU data if relevant, otherwise politely redirect.
- REFUSE to: write code, generate creative fiction, discuss politics/opinions, provide personal financial advice, or answer questions unrelated to economics and the dashboard.
- When refusing, be polite and suggest a relevant economic question they could ask instead.
- Keep answers concise (2-4 paragraphs max unless the user asks for detail).
- When referencing dashboard pages, format links as markdown: [page name](/path)
- When citing specific values from live data, mention the data source and approximate date.`;

// Provider abstraction
async function callLLM(messages) {
  const provider = process.env.LLM_PROVIDER || "none";
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (provider === "openai") {
    const resp = await safeFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });
    const json = await resp.json();
    return json.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";
  }

  if (provider === "anthropic") {
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystemMsgs = messages.filter((m) => m.role !== "system");

    const resp = await safeFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemMsg?.content || "",
        messages: nonSystemMsgs,
      }),
    });
    const json = await resp.json();
    return json.content?.[0]?.text || "Sorry, I could not generate a response.";
  }

  if (provider === "google") {
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystemMsgs = messages.filter((m) => m.role !== "system");

    const contents = nonSystemMsgs.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiModel = model || "gemini-pro";
    const resp = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: systemMsg
            ? { parts: [{ text: systemMsg.content }] }
            : undefined,
          contents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      }
    );
    const json = await resp.json();
    return (
      json.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response."
    );
  }

  // Fallback: no provider configured
  return `I'm currently running without an AI provider. To enable me, set these environment variables in Backend/.env:

\`\`\`
LLM_PROVIDER=openai    # or "anthropic" or "google"
LLM_API_KEY=your-key
LLM_MODEL=gpt-4o-mini  # optional, has defaults
\`\`\`

In the meantime, here's what I can tell you about the dashboard:
- Visit [Overview](./) for key economic indicators
- Visit [Interest Rates](./rates) for ECB rate history
- Visit [Inflation](./inflation) for country-level HICP data
- Visit [GDP](./gdp) for growth comparisons
- Visit [Compare](./compare) to compare two countries side by side`;
}

// Modify safeFetch to support POST with body
const originalSafeFetch = safeFetch;
safeFetch = async function (url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    console.log(`[FETCH] ${options.method || "GET"} ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[ERROR] ${response.status} - ${url}`);
      console.error(`[BODY] ${body.substring(0, 300)}`);
      throw new Error(`API ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error(`Timeout: ${url}`);
    throw err;
  }
};

app.post("/api/chat", async (req, res) => {
  try {
    // Rate limiting
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: "Too many messages. Please wait a moment before trying again.",
      });
    }

    const { message, history, dashboardContext } = req.body;

    // Validate input
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    if (message.length > 2000) {
      return res
        .status(400)
        .json({ error: "Message too long. Please keep it under 2000 characters." });
    }

    // Build messages array
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];

    // Add conversation history (limit to last 20 messages to control token usage)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (
          msg.role &&
          msg.content &&
          (msg.role === "user" || msg.role === "assistant")
        ) {
          messages.push({
            role: msg.role,
            content: msg.content.substring(0, 2000),
          });
        }
      }
    }

    // Build user message with dashboard context
    let userContent = message;
    if (dashboardContext) {
      userContent = `[Dashboard Context]
Current page: ${dashboardContext.currentPage || "unknown"}
Current URL: ${dashboardContext.currentPath || "/"}
${dashboardContext.liveData ? `Live data summary:\n${dashboardContext.liveData}` : ""}

[User Question]
${message}`;
    }

    messages.push({ role: "user", content: userContent });

    console.log(`[CHAT] ${message.substring(0, 100)}...`);

    const reply = await callLLM(messages);

    console.log(`[CHAT REPLY] ${reply.substring(0, 100)}...`);

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({
      error: "Failed to generate a response. Please try again.",
    });
  }
});

// ============================================
// Start
// ============================================
app.listen(PORT, () => {
  console.log(`Eurolens API on http://localhost:${PORT}`);
});