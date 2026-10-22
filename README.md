# CityCornerDirectory (CityCornerDirectory/)

Free local business directory laid out as café-style bento grids (Next.js 16, App Router, Tailwind).
Same data, pages and rules as LocalPro, with its own brand, design and wording. Listings come from the scraper's
Postgres database through a read-only login.

## Setup

```bash
cp .env.example .env   # set SITE_URL and WEB_DATABASE_URL
npm install
npm run dev            # http://localhost:3000
```

Remote databases need their CA certificate for verified TLS, saved in `certs/` (see LocalPro's README).

| Command | What it does |
|---|---|
| `npm run build` | Production build |
| `npm start` | Serve the build on port 3000 |
| `npm test` | Unit tests for data cleaning, category names, search queries, hours and map framing |
| `npm run lint` | ESLint |

## What's shared with LocalPro

The data layer and rules are copies: `lib/data.ts`, `lib/db.ts`, `lib/actions.ts`, `lib/hours.ts`.
Publishing rules, ranking (`businesses.score`), caching, sitemap and forms work the same way. Fix a bug in
one site's `lib/` and copy the change to the other.

## What's different

Everything visible. The look is a café menu board: cream paper, mocha ink for text and buttons (`--mocha` in
`app/globals.css`), and five pastel tiles (butter, matcha, peach, cloud, clay) as `bg-*` classes. There are no
borders or shadows; big rounded colour blocks do the work, and neighbouring tiles never share a colour
(`toneAt()` in `components/thumb.tsx`). Fonts are Urbanist (headings, heavy and tight) and Albert Sans (body).

The home page hero is itself a bento: the headline and search on a butter tile, two photo tiles of well-rated
places, live counts and "Popular now" categories. Below it come category tiles, top picks led by a large feature
card, cities, review quotes as speech tiles, how it works, and a mocha "Own a corner of the city?" banner for
owners. Inner pages use the same bento header (`PageHeader` in `components/cards.tsx`), and the form pages put a
pastel intro tile beside the form (`FormShell`).

There are no stock photos. City and category tiles use the photo of the best-rated business there
(`getCoverPhotos()` in `lib/data.ts`); without one they fall back to a pastel tile with a giant initial or an icon.
Business photos come from the listings themselves, or a pastel tile with initials. Name, contact email and the
featured cities live in `lib/site.ts`.
