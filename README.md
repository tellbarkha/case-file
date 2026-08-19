# Case File — Clinical Trial Explorer

A live search tool for [ClinicalTrials.gov](https://clinicaltrials.gov), styled like a stack of case report forms. Type a condition, and it pulls **real, current trial data** — no mock data, no API key, no backend.

![status](https://img.shields.io/badge/status-live%20demo-1F5C52) ![no build step](https://img.shields.io/badge/build%20step-none-A23328)

## What it does

- Search any condition ("melanoma", "type 1 diabetes", "long covid") and get real trials back from the U.S. National Library of Medicine's public registry, in real time.
- Filter by recruitment status (recruiting, not yet recruiting, active, completed).
- Click any result to pull the full case file: eligibility criteria, sponsor, phase, enrollment size, and every listed trial site.
- Paginate through the full result set — some conditions return thousands of trials.

It's a single static site: `index.html`, `style.css`, and `script.js`. No npm install, no build step, no server. Open it and it works.

## Why it looks the way it does

Clinical trials run on paperwork — case report forms, consent forms, carbon-copy triplicates. The design leans into that: perforated card edges, ink stamps for trial status, a redaction-bar loading animation, and a "pull the case file" side panel instead of a modal.

## Running it locally

Because the app fetches data with `fetch()`, most browsers block it if you just double-click `index.html` (the `file://` protocol disables that). Serve it instead:

```bash
# Python (already installed on most systems)
python3 -m http.server 8000

# or, if you have Node
npx serve .
```

Then open `http://localhost:8000`.

## Deploying it for free

This is a static site, so [GitHub Pages](https://pages.github.com/) works out of the box:

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment," set **Source** to `Deploy from a branch`, pick the `main` branch and `/ (root)` folder.
4. Save — your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Data source

All data comes live from the [ClinicalTrials.gov API v2](https://clinicaltrials.gov/data-api/api), a free public API maintained by the National Library of Medicine. No API key is required. Full terms of use are on their site.

This project is not affiliated with the National Library of Medicine or ClinicalTrials.gov, and nothing here is medical advice — always confirm eligibility with a study team or your own physician.

## Project structure

```
case-file/
├── index.html    # page structure
├── style.css     # all visual design
├── script.js     # fetches + renders live data
└── README.md
```

## Ideas for extending it

- Add a small map (e.g. Leaflet + OpenStreetMap, no key needed) plotting trial locations by `geoPoint`.
- Save searched conditions to `localStorage` as a "recent searches" list.
- Add a phase filter alongside the status filter.
- Add a compare view for two trials side by side.

## License

MIT — see [LICENSE](LICENSE).
