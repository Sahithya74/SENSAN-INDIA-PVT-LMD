# SENSAN India Projects — website

A cinematic, scroll-driven site for SENSAN India Projects Private Limited —
roads, highways, bridges, tunnels and subways, building construction and GeM
projects.

**Live site:** https://sahithya74.github.io/SENSAN-INDIA-PVT-LMD/ (published by GitHub Actions on every push to `main`)

React 19 · Vite · TypeScript · Tailwind CSS 4 · GSAP (ScrollTrigger, SplitText, DrawSVG) · Lenis · Three.js.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
```

## How the hero works

The opening is one pinned, scroll-scrubbed timeline (0 → 1). It drives a
Three.js scene at dawn in which an elevated highway viaduct assembles member
by member — footings, piers, caps, steel girders, deck, barriers, lighting —
and ends with the SENSAN wordmark, itself built from the same structural
members, completing the sentence *"Every great build begins with…"*.

| Device | What renders |
| --- | --- |
| Desktop | Real-time scene with shadows (`webgl-full`) |
| Tablet / modest desktop | Real-time scene, lighter settings (`webgl-lite`) |
| Phones, Save-Data, no WebGL2 | Canvas frame sequence pre-rendered from the same scene (`frames`) |
| Reduced motion | Final composition, no pinning (`static`) |

Force a tier for testing with `?tier=webgl-full|webgl-lite|frames|static`.

After changing anything in `src/hero/scene/`, regenerate the frame sequences,
posters and social image (and avoid editing `vite.config.ts` while it runs):

```bash
npm run render:hero  # ~10 min, uses the installed Chrome
node scripts/render-still.mjs --p 0.7 --orient portrait --size 1600x2000 --export viaduct-dawn   # section image
```

## Page structure

Hero → marquee → 01 Company → 02 Domains → 03 Process → 04 Leadership →
05 Projects → 06 Why SENSAN → 07 Contact → footer. Domains, Process and
Projects travel horizontally on desktop and are rebuilt as vertical sequences
or swipe carousels on touch devices.

## Editing content

All facts and copy live in `src/content/` — nothing is hard-coded in components.

| File | What it holds |
| --- | --- |
| `company.ts` | Registered facts (legal name, CIN, ROC, office, email). Add a phone number or social profiles only once confirmed. |
| `copy.ts` | Brand lines, hero sentences, section copy, marquee words |
| `domains.ts` | Construction domains. `basis: 'registered'` = registered business activity; `basis: 'service'` = further work the company undertakes (buildings, GeM projects). Set `visible: false` to hide one. |
| `process.ts` | The illustrative five-stage process |
| `directors.ts` | Director names and designation |
| `projects.ts` | Portfolio — currently labelled placeholders; set `verified: true` on real entries |
| `principles.ts` | Brand principles (positioning, not certifications) |

Never publish figures, clients, awards, certifications or testimonials the
company has not confirmed in writing.

## Director portraits

Add the original photographs, named exactly:

| Director | File |
| --- | --- |
| Lakshmanan Kavitha | `src/assets/directors/lakshmanan-kavitha.jpg` |
| Muthusamy Sengottuvel Arun Sanjeev | `src/assets/directors/muthusamy-sengottuvel-arun-sanjeev.jpg` |

Either commit them from your computer, or on GitHub open
`src/assets/directors/` → **Add file → Upload files**. The deploy workflow runs
`npm run images`, so uploaded photos appear on the live site automatically.
Locally, run `npm run images` and review `qa-output/portraits/<name>-compare.jpg`.

Crop and finish are set per portrait in `scripts/portraits.config.mjs`
(Kavitha's uses the `professional` finish). The treatment is photographic
only — crop, exposure, white balance, gentle contrast, edge falloff,
sharpening. Faces are never altered.

## Contact form

Submissions go through [Web3Forms](https://web3forms.com) to the company inbox.
Generate a free access key with that inbox, then either:

- locally: copy `.env.example` to `.env` and set `VITE_WEB3FORMS_KEY`, or
- for the live site: add a repository secret **WEB3FORMS_KEY**
  (Settings → Secrets and variables → Actions) and re-run the deploy.

Without a key the form opens the visitor's email app with their message
prefilled — it never shows a false "sent" message.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds with `BASE_PATH=/<repository>/` and
publishes `dist/`. One-time setup in the repository:

1. The repository must be **public** (or on a plan that allows Pages for private repositories).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Actions → *Deploy to GitHub Pages* → **Run workflow** (or push to `main`).

## QA scripts

```bash
npm run qa -- --only desktop,mobile                 # hero stage screenshots → qa-output/
npm run qa -- --only desktop --stages none --sections   # every section
npm run qa -- --reduced                             # prefers-reduced-motion
npm run qa -- --no-webgl                            # WebGL disabled → frame fallback
node scripts/render-still.mjs --p 0,1               # single scene stills (dev server running)
node scripts/contact-sheet.mjs desktop-webgl-full   # tile screenshots into one sheet
```
