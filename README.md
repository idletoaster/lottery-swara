# lottery-swara

Vedic Lunar Lottery Analytics PWA.

Combines:

1. A static PWA front-end that lets you browse past lottery jackpot
   winners and overlay Vedic astrology state at the time of the draw.
2. A small Node.js API (`/api/astro`) that computes the current
   Vedic tithi / nakshatra / rashi / ayana / sankranti using the
   [Swiss Ephemeris](https://www.astro.com/ftp/swisseph/) (`swisseph`).
3. A Python scraper (`scraper.py`) that pulls historical Powerball
   and Mega Millions jackpot winner records from
   `portalseven.com` and stores them in `jackpot_data.json`.

The original use case: cross-reference the moonsign / nakshatra at
each past jackpot win with the state where the ticket was sold, to
find patterns of lunar conditions for "good" lottery windows.

## Stack

- **Frontend:** Plain HTML / JS PWA, served by `pm2 serve` on port `8000`
  (process name `swara-web`).
- **Astro API:** Node.js / Express (`api/server.js`) on port `3000`
  (process name `swara-api`). Uses `swisseph` (node bindings to the
  Swiss Ephemeris C library) and a local `ephe/` directory of ephemeris
  files. Caches one computation per hour bucket.
- **Scraper:** Python 3 script using `requests` + `pandas`. Writes
  `jackpot_data.json` (deduplicated, sorted newest first).

## Project layout

```
lottery-swara/
├── index.html              # PWA shell
├── sw.js                   # Service worker (offline + cache)
├── manifest.json
├── icons/                  # apple-touch, android, ms, favicon PNGs
├── css/, js/
├── ephe/                   # Swiss Ephemeris files (NOT in git, ~763MB)
├── jackpot_data.json       # Cached scrape results (NOT in git)
├── deploy.sh               # Local deploy helper
├── scraper.py              # Python: fetch & dedup jackpot winners
└── api/
    ├── package.json        # express + cors + swisseph
    ├── package-lock.json
    ├── node_modules/       # NOT in git
    └── server.js           # GET /api/astro
```

## API

`GET /api/astro?time=<unix-ms>` (defaults to `Date.now()`) returns:

```json
{
  "status": "success",
  "julian_date": 2460486.5,
  "tithi_index": 12,
  "tithi_end_ms": 1735862400000,
  "nakshatra_end_ms": 1735862400000,
  "rashi_end_ms": 1735862400000,
  "ayana": "Uttarayana",
  "sun_sidereal": 271.4,
  "moon_sidereal": 95.2,
  "sankranti_ms": 1735862400000
}
```

Implementation notes:

- The ayanamsa used is **Samagra Ayanamsa** (Vedic):
  `23.840018 + 1.395521*T + 0.000317*T²` where `T` is Julian centuries
  from J2000.
- Tithi / nakshatra / rashi / sankranti boundaries are found via
  repeated bisection (15–20 iterations) against Swiss Ephemeris.
- Results are cached in-process keyed by `${year}-${month}-${day}-${hour}`.

## Scraper

```bash
cd lottery-swara
python3 scraper.py         # fetches & merges into jackpot_data.json
```

Behavior:

- First run (no existing `jackpot_data.json`): pulls Powerball and Mega
  Millions for all 46 supported jurisdictions in parallel (15 workers).
- Subsequent runs: only pulls the latest draws and merges, deduped on
  `(date, Game, amount)`, sorted descending by date.
- Network calls are simple GETs to
  `portalseven.com/lottery/{powerball|megamillions}_jackpot_winners.jsp`
  with a desktop `User-Agent`.

## Run locally

```bash
# Frontend (PWA)
pm2 serve . 8000 --name swara-web --spa

# Astro API
cd api && npm install && cd ..
pm2 start api/server.js --name swara-api
```

## Deployment / DR notes

- `ephe/` is large (~763MB) and is excluded from git. It contains
  the Swiss Ephemeris source + binary data files. Rehydrate by
  either copying from backup (preferred — same hashes as on the
  source server) or by `apt install libswisseph-dev` plus copying
  ephemeris files from a Swiss Ephemeris release tarball.
- `api/server.js` calls `swisseph.swe_set_ephe_path('/home/pawan/lottery-swara/ephe');`
  on startup — keep the path absolute and writable to your user.
- `jackpot_data.json` is the scrape result cache; it is excluded
  from git but is captured by the daily restic backup so a restore
  resumes with the same dataset.
- On a fresh Ubuntu 24 host, ensure `build-essential` and `python3`
  are present before `npm install` inside `api/` (the `swisseph`
  package uses `node-gyp`).
