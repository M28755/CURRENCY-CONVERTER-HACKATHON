# FX Checker � Currency Converter

A sleek, dark-themed currency converter web app built for a hackathon. It fetches real-time and historical exchange rates from the **Frankfurter API** and presents them in a modern, minimal UI.

---

## ?? Features

- **Real-Time Currency Conversion**  Fetches live exchange rates on the fly
- **Bidirectional Input**  Type in either the Send or Receive field and the other updates automatically
- **Currency Swap**  One-click button to swap the From / To currency pair
- **30-Day Historical Chart**  Interactive line chart (Chart.js) showing the past 30 days of rate data
- **Currency Search Dropdown**  Searchable, scrollable list of all supported currencies grouped into Popular and Other
- **Flag Emojis**  Country flags auto-generated from currency codes
- **Favorites System**  Save currency pairs to LocalStorage
- **Conversion Log**  Records recent conversions in LocalStorage
- **Live Markets Ticker**  Header ticker strip showing live market label
- **ECB Data Badge**  Shows the European Central Bank as the data source
- **Dark Theme**  Deep neutral palette (`#0A0A0A` background) with lime-green (`#CEF739`) accents
- **Responsive Layout**  Separate `Responsive.css` file ready for breakpoints

---

## ?? Project Structure

```
CURRENCY-CONVERTER/
+-- index.html        # App markup  header, converter card, tabs, history chart
+-- script.js         # All JS logic  API calls, DOM manipulation, chart rendering
+-- styles.css        # Design system (CSS variables, all component styles)
+-- Responsive.css    # Responsive/mobile overrides (in progress)
+-- Algorithm.md      # Pseudocode walkthrough of the JS logic
+-- README.md         # This file
```

---

## ?? App Layout

### Header
- **FX_CHECKER** logo with lime-green block icon
- Total currency count (e.g. `55 CURRENCY`)
- EOD (End-of-Day) and ECB (European Central Bank) badges
- Live Markets ticker strip

### Converter Card (`CHECK THE RATE`)
- **SEND** input amount + From currency selector button
- **? Swap Button**  swaps currency pair and refreshes rate
- **RECEIVE** input  converted amount + To currency selector button
- **Rate subtext**  e.g. `1 USD = 0.85300 EUR`
- **Action buttons**  `? Favorite` (saves pair) and `+ Log Conversion`

### Currency Dropdown
- Triggered by clicking the From or To currency button
- Live search filter (by code or name)
- Grouped into **POPULAR** (USD, EUR, GBP, CHF, AUD, JPY) and **OTHER CURRENCIES**
- Selected currency gets a `?` checkmark

### Navigation Tabs

| Tab      | Description                             |
|----------|-----------------------------------------|
| HISTORY  | 30-day line chart + stats grid          |
| COMPARE  | Pair comparison (planned)               |
| FAVORITE | Saved currency pairs with badge count   |
| LOG      | Recent conversion log with badge count  |

### History View (Active Tab)
- **Stats Grid:** OPEN � LAST � CHANGE � % CHANGE (color-coded green/red)
- **Line Chart:** 30-day rate history using Chart.js

---

## ?? Tech Stack

| Layer    | Technology                                                             |
|----------|------------------------------------------------------------------------|
| Markup   | HTML5                                                                  |
| Styling  | Vanilla CSS (CSS custom properties)                                    |
| Logic    | Vanilla JavaScript (ES6+, async/await)                                 |
| Charts   | [Chart.js](https://www.chartjs.org/) (CDN)                            |
| Icons    | [Font Awesome 7](https://fontawesome.com/) (CDN)                      |
| Fonts    | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Google Fonts) |
| Data     | [Frankfurter API](https://www.frankfurter.dev/) via CORS proxy         |

---

## ?? API Reference

**Base URL:** `https://corsproxy.io/?url=https://api.frankfurter.dev/v2`

| Endpoint                                              | Usage                                      |
|-------------------------------------------------------|--------------------------------------------|
| `GET /currencies`                                     | Fetch all supported currencies             |
| `GET /rate/{FROM}/{TO}`                               | Get the current exchange rate for a pair   |
| `GET /rates?from=DATE&to=DATE&base=X&quotes=Y`        | Get 30-day historical rate data            |

> Data is provided by the **European Central Bank (ECB)**.
> Full API docs: [frankfurter.app/docs](https://www.frankfurter.app/docs)

---

## ?? Design System

Defined in `styles.css` using CSS custom properties:

### Color Palette

| Token           | Value     | Use                        |
|-----------------|-----------|----------------------------|
| `--neutral-900` | `#0A0A0A` | Page background            |
| `--neutral-700` | `#171719` | Card / container bg        |
| `--neutral-600` | `#202022` | Input background           |
| `--neutral-50`  | `#FFFFFF` | Primary text               |
| `--lime-500`    | `#CEF739` | Accents, active states     |
| `--green-500`   | `#42EB05` | Positive change indicator  |
| `--red-500`     | `#FF4141` | Negative change indicator  |

### Typography
- **Font:** JetBrains Mono (monospace)
- **Letter spacing:** Used throughout for a terminal / data-terminal aesthetic

---

## ?? State & Storage

### In-memory state (`script.js`)

| Variable              | Default  | Description                                   |
|-----------------------|----------|-----------------------------------------------|
| `currentFromCurrency` | `'USD'`  | The base currency                             |
| `currentToCurrency`   | `'EUR'`  | The target currency                           |
| `currentExchangeRate` | `0`      | Latest fetched rate                           |
| `activePickerTarget`  | `null`   | `'from'` or `'to'` � which dropdown is open  |
| `historyChart`        | `null`   | Chart.js instance reference                   |

### LocalStorage keys

| Key                  | Content                              |
|----------------------|--------------------------------------|
| `favoriteCurrencies` | JSON array of saved currency pairs   |
| `logs`               | JSON array of logged conversions     |

---

## ?? Four-Phase Roadmap

| Phase | Status          | Description                              |
|-------|-----------------|------------------------------------------|
| 1     | ? Done         | Planning & design system mapping         |
| 2     | ? Done         | Core frontend (HTML + CSS)               |
| 3     | ? Done         | JavaScript logic & API integration       |
| 4     | ?? In Progress  | Polish, animations & testing             |

---

## ?? Running Locally

No build step required  pure HTML/CSS/JS.

1. Clone or download the repo
2. Open `index.html` in any modern browser

> **Note:** The app uses `corsproxy.io` to bypass CORS restrictions on the Frankfurter API. An internet connection is required.

---

## ?? Algorithm Reference

See [`Algorithm.md`](./Algorithm.md) for a full pseudocode walkthrough of:
- App state initialisation
- API fetch flow
- Currency dropdown rendering & selection
- Live rate fetching & conversion calculation
- Statistics update logic
- 30-day history fetch & Chart.js rendering
- Swap functionality
- Flag emoji generation
