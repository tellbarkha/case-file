# Case File

A search tool for clinical trials, built on the public ClinicalTrials.gov API. You type in a condition, and it shows real, current trial listings — status, phase, eligibility, and locations. No fake data, no backend.

Live demo: https://tellbarkha.github.io/case-file/

## What it does

You search a condition (like "diabetes") and get back real trials happening right now. Each result shows as a card, styled to look like a case report form. Click a card to open a detail panel with the full record — eligibility criteria, sponsor, dates, and trial sites.

It's a plain static site: HTML, CSS, and JavaScript. No frameworks, no build step, nothing to install.

## Files

- `index.html` — the page layout
- `style.css` — all the styling
- `script.js` — fetches data from the API and builds the results

## What I learned

This was my first time working with a real external API instead of a fixed dataset. A few things I picked up:

- The API uses tokens for pagination instead of page numbers
- Building a slide-out detail panel from scratch, without a framework
- Handling loading and error states while waiting on a live request

## Known limitations

- Not fully tested on every screen size
- Doesn't handle bad or empty search input very gracefully
- Filters reset if you reload the page
- A map showing trial locations would be a good next addition

## Running it locally

Opening `index.html` directly doesn't work, because browsers block live requests from local files. Run this instead:
