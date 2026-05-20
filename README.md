# ✨ GlowIQ — Skincare Intelligence Dashboard

A multi-page React analytics dashboard for the Indonesian skincare market with an AI-powered chatbot.

---

## 📁 Project Structure

```
glowiq/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Shared.jsx        # Card, SectionTitle, StatCard, Badge, Tooltip
│   │   └── Sidebar.jsx       # Navigation sidebar
│   ├── data/
│   │   ├── dashboardData.js  # All chart/analytics data
│   │   └── products.js       # Product catalogue (add more here)
│   ├── pages/
│   │   ├── OverviewPage.jsx
│   │   ├── GenderPage.jsx
│   │   ├── ReviewsPage.jsx
│   │   ├── JourneyPage.jsx
│   │   ├── RevenuePage.jsx
│   │   ├── OpportunityPage.jsx
│   │   ├── CataloguePage.jsx
│   │   ├── BrandsPage.jsx
│   │   ├── EffectsPage.jsx
│   │   ├── PricingPage.jsx
│   │   ├── SkinTypesPage.jsx
│   │   └── ChatbotPage.jsx
│   ├── theme/
│   │   ├── colors.js         # Color palette + formatters
│   │   └── nav.js            # Navigation items config
│   ├── App.jsx               # Root component + routing
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles + scrollbar
├── .env                      # 🔑 Your API keys (never commit this)
├── .env.example              # Template for .env
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd glowiq
npm install
```

### 2. Set up your API key

Open `.env` and replace the placeholder:

```env
# For Groq (free tier available — https://console.groq.com)
VITE_GROQ_API_KEY=gsk_your_actual_key_here

# OR for OpenAI — also update ChatbotPage.jsx (see below)
VITE_OPENAI_API_KEY=sk-your_actual_key_here
```

> ⚠️ Never commit `.env` to git. It's already in `.gitignore`.

### 3. Start the dev server

```bash
npm run dev
```

Opens at **http://localhost:3000**

---

## 🤖 Switching AI Providers

### Using OpenAI instead of Groq

In `src/pages/ChatbotPage.jsx`, change these two lines:

```js
// FROM (Groq)
const API_URL  = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY  = import.meta.env.VITE_GROQ_API_KEY;
const AI_MODEL = "llama-3.3-70b-versatile";

// TO (OpenAI)
const API_URL  = "https://api.openai.com/v1/chat/completions";
const API_KEY  = import.meta.env.VITE_OPENAI_API_KEY;
const AI_MODEL = "gpt-4o-mini";  // or "gpt-4o"
```

And add your key to `.env`:
```env
VITE_OPENAI_API_KEY=sk-your_key_here
```

---

## 📦 Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

> **Important:** Set your environment variables in your hosting platform's dashboard — not in the deployed files.

---

## ➕ Adding More Products

Open `src/data/products.js` and add to the `ALL_PRODUCTS` array:

```js
{
  name:    "Your Product Name",
  brand:   "BRAND NAME",
  type:    "Serum",          // Serum | Toner | Moisturizer | Sunscreen | Face Wash
  effects: "Brightening, Anti-Aging",
  skin:    "Oily, Combination",
  price:   "Rp 150.000",
  tier:    "Mid-Range",      // Budget | Mid-Range | Premium | Luxury
},
```

---

## 🎨 Customising the Theme

Edit `src/theme/colors.js` to change the colour palette:

```js
export const C = {
  bg:      "#0f0e17",   // page background
  card:    "#201e30",   // card background
  accent:  "#e8b4d0",   // pink accent
  accent2: "#c084fc",   // purple accent
  // ...
};
```

---

## 📊 Pages

| Page | Route Key | Description |
|------|-----------|-------------|
| Overview | `overview` | KPI stats + product type & effects charts |
| Gender Analysis | `gender` | Female / Male / Unisex breakdown |
| Review Analysis | `reviews` | Brand ratings + sentiment by effect |
| Customer Journey | `journey` | Funnel drop-off + gender journey area chart |
| Revenue Simulator | `revenue` | Interactive growth rate slider |
| Opportunity Finder | `opportunity` | Market gap matrix + scatter plot |
| Catalogue | `catalogue` | Searchable + filterable product grid |
| Brands | `brands` | Bar chart + competitive radar |
| Effects | `effects` | Effect frequency ranking |
| Pricing | `pricing` | Price tier pie + bar chart |
| Skin Types | `skintypes` | Coverage per skin type |
| AI Assistant | `chatbot` | Chat with your data via LLM |
