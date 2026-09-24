# Busy Bee Lawn — commercial grounds concept

A second homepage concept for Busy Bee Lawn, aimed at commercial property managers,
HOA and community managers, and organizations coordinating several properties.
The page is a proposal builder that steps through slides left to right —
01 Property → 02 Services → 03 Schedule → 04 Proposal → PDF output — with an animated
property plan, a live draft beside the slides on wide screens, and a Back / Next
stepper on phones. Built with React and Vite.

Intended URL: https://productoffer2.jamesmcgonigal.com

> **The proposal request is a preview.** It validates contact details and property
> addresses, but it never sends or stores anything. The page says so next to the form,
> and the completion message says the request was a demo.

## Proposal builder

- `src/builderStore.jsx` is the single source of truth: property, services, visit
  frequency, per-service schedules, agreement term, renewal, desired start, notes,
  contact details, and request stage. Everything else renders from it.
- `src/draft.js` turns that state into the draft proposal (scope sentence, services
  with sample zones, schedule differences, term, renewal, start). It is pure and
  deterministic: no AI, no network, no measurements.
- `src/estimate.js` adds an illustrative estimate (per visit, visits per year, annual,
  average monthly, and term totals as ±15% ranges). It uses **placeholder sample
  rates**, labeled as such everywhere they appear; replace `RATES` and
  `VISITS_PER_YEAR` with Busy Bee Lawn's own figures. Improvements are estimated
  separately.
- Per-service schedules follow the visit frequency or override it. Suggested defaults
  (mowing and edging follow the frequency, beds one-time, shrubs and cleanup seasonal,
  improvements scoped separately) are marked and editable. No discounts are implied.
- The proposal card separates the sample demonstration, the requested scope with its
  illustrative estimate, and a company-approved quote, and states "Final pricing follows
  property and scope review." There are no accept, book, or sign actions.
- Contact details are requested only after the draft exists. The fictional example
  addresses are rejected as the visitor's property.
- The final slide shows the proposal as a two-page document (`ProposalDocument.jsx`).
  "Print / Save as PDF" prints exactly that document: the completed plan and scope,
  then the details and estimate, labeled as sample geometry and a preliminary draft.
  `examples/Busy-Bee-Example-Proposal-Christiana.pdf` is a prepared example (also
  served from `public/examples/` as a download on the final slide).

## Run locally

Requires Node.js 18.18 or newer.

```sh
npm install
npm run dev        # http://localhost:5192
npm run build      # production build → dist/
npm run preview    # serve the build → http://localhost:5193
```

Copy, service groups, checklist, and team details live in `src/content.js`.

## Connect a GitHub repository

After creating an empty repository on GitHub (no README, license, or .gitignore):

```sh
git init
git add .
git commit -m "Initial commit: Busy Bee Lawn commercial concept"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

## Publish with GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
   `.github/workflows/deploy.yml` builds and deploys on every push to `main`,
   and can be run manually from the **Actions** tab.
3. Under **Custom domain**, enter `productoffer2.jamesmcgonigal.com` and save.
   The domain is also committed in `public/CNAME`.

### DNS

| Type  | Name            | Target / value        |
| ----- | --------------- | --------------------- |
| CNAME | `productoffer2` | `jamesmac3.github.io` |

### HTTPS

When GitHub shows the domain check as successful on **Settings → Pages**, tick
**Enforce HTTPS**. The certificate can take a few minutes after verification.

## Property-plan engine

The animated, illustrative site plan behind the builder.

- `src/plan/fixtures.js` holds three **fictional** sample properties (Murfreesboro
  office campus, Smyrna retail property, Christiana shared community). Each has its
  own buildings, paving, walks, lawns, beds, shrubs, trees, edges, access routes, and
  proposed improvements. The addresses are labeled as fictional demo addresses.
- `src/plan/provider.js` is the data boundary. It only resolves the three demo
  addresses; any other address returns "live lookup unavailable" and offers the
  examples. Nothing is geocoded and no parcel is invented.
- `src/plan/routes.js` + `geometry.js` generate every service route from the
  geometry: mowing passes clipped to each lawn (avoiding trees, shrubs, and beds),
  edge runs, bed coverage, pruning stops, leaf cleanup, and proposed plantings.
  Travel between areas follows each property's access loop.
- `src/components/PlanCanvas.jsx` renders the plan and runs all selected services
  concurrently on one shared clock (paused off-screen, in background tabs, and
  for reduced motion, which shows a static completed plan).

**Simulated today:** the three property geometries, the address lookup, and all
quantities (counts are illustrative, from the fictional examples).

**Ready for a live GIS integration later:** replace `lookupAddress` / `getProperty`
in `provider.js` with a geocoder + parcel/GIS source that returns the same
PropertyGeometry shape (documented in `fixtures.js`), projected into the plan's
640 × 440 space. Route generation, animation, and the draft proposal consume only that shape and need no changes. No API keys or paid
services are used in this preview.

## Proposed brand system

This concept uses an original, proposed logo for "Busy Bee Lawn & Landscape"
(not an adopted company identity). The original company logo files are kept,
unchanged, in `public/images/`.

- `src/brand/BrandLogo.jsx` renders every variant:
  `layout` = `horizontal` | `stacked` | `emblem`,
  `tone` = `color` | `reverse` | `mono-light` | `mono-dark`.
- Standalone SVGs for each combination are in `public/brand/`;
  the favicon is `public/favicon.svg` with PNG fallbacks.
- Preview every variant at http://localhost:5192/brand.html while `npm run dev`
  is running (dev-only; not part of the production build).
- Lettering is outlined from Archivo (SIL Open Font License). To regenerate after
  editing the geometry: `pip install fonttools uharfbuzz`, then
  `python tools/brand/generate_logo.py path/to/Archivo[wdth,wght].ttf`.

## Content and assets

- Verified: business name, phone, email, service towns (Murfreesboro, Smyrna,
  Christiana), and John Fricke (Owner) and Jared Fricke (Operations Manager).
  The father-and-son description was supplied for the concept; confirm with the client.
- Logo and portraits come from busybeelawn.net; confirm approval before launch.
- The builder no longer uses grounds photography. The earlier Unsplash images remain
  in `public/images/grounds-*` unused and can be deleted.
- The property plan is an original, stylized illustration, labeled
  "Illustrative service plan". It is not a client site or a measured map.
- Schedule, term, and renewal options are presented as requests subject to company
  review; confirm the offered options with the client.
