# Simone Contorno — robotics engineering portfolio

A static, English-language portfolio for [simone-contorno.github.io](https://simone-contorno.github.io/). Content and UX refinement is implemented locally; deployment is a separate, manual action.

## Build and preview

Requires Node.js 20+ and Python 3. No packages are needed to build or serve the site.

```sh
npm run build
npm run check
npm run preview
```

Open **http://127.0.0.1:4173/**. Stop the preview with Ctrl+C. A local sandbox may need permission to open the loopback port and launch verification subprocesses.

`build` writes the generated HTML directly to the repository root and page directories. These output files must be included when you eventually commit a content change. `check` verifies generated files are current, checks links/metadata/sitemap, and exercises draft-to-publication transitions in an isolated temporary copy.

## Where to edit

| Source | Purpose |
| --- | --- |
| `_content/site.json` | Identity, canonical origin, navigation, `consultingEnabled` and `engineeringNotesEnabled` |
| `_content/pages/*.json` + `.html` | Page metadata and semantic HTML content |
| `_content/notes/*.json` + `.html` | Engineering notes and publication state |
| `_content/components/consulting.html` | Inactive advisory section, included only when enabled |
| `_tools/build.mjs` | Shared layout, SEO, structured data and sitemap |
| `assets/css/site.css` | Responsive design system |
| `assets/js/site.js` | Mobile navigation and honest clipboard feedback |
| `_tools/social-card.html` | Source layout for the committed social-sharing PNG |

Do not edit generated `index.html` files directly. The site has no server, database, runtime framework, analytics, remote fonts or third-party scripts. Essential content is already in HTML. Email links open the visitor’s email client; the website never sends messages or claims delivery.

## Publish an engineering note

Engineering Notes is currently disabled with `"engineeringNotesEnabled": false` in `_content/site.json`. No notes page (including `/notes/`), article, navigation item or sitemap entry is emitted, even if a note is marked published. Source templates and drafts stay in `_content`. When the section is ready, explicitly enable the flag and publish a completed article.

1. Add a JSON/HTML pair under `_content/notes/`, using an existing note as a pattern. Use a readable `/notes/slug/` path and a unique description.
2. Keep `status: "draft"` and `datePublished: null` during preparation. **Drafts are not emitted as public pages** and never appear in navigation, listings or the sitemap. Previously generated draft HTML is removed on rebuild; source files are preserved. This is not privacy or access control for the public source repository. Keep confidential or unapproved material out of this public repository entirely.
3. Document the period of the underlying work in `workPeriod`, cite sources and distinguish observations, interpretation and measured results. `prepared` records outline preparation, not publication.
4. After author review, set `status: "published"`, `datePublished` to the actual first publication date and `dateModified` to that date. Do not use the research year or outline-preparation date as publication date. If release slips, correct the date before deploying.
5. Update the article body from outline to finished writing. Run build/check and inspect the result. Published notes receive `BlogPosting`, article social metadata and sitemap inclusion. With `engineeringNotesEnabled: true`, the Engineering Notes navigation entry and homepage section appear when at least one note is published. Listings contain published articles only.
6. For later substantive edits, keep `datePublished` and update `dateModified`. Dates must be real calendar dates, nonfuture, and modification cannot precede publication.

The two existing outlines remain unchanged in `_content/notes/` for future work. Neither disabled nor empty notes sections generate an index page. Previously generated notes HTML is removed on rebuild. Old notes URLs have no page until the section is deliberately enabled with published content.

## Future consulting section

`_content/site.json` contains `"consultingEnabled": false`. The build requires an actual boolean and omits the entire advisory component from generated HTML when disabled. There is no consulting route, navigation item, service schema, price or booking system.

The reusable content is `_content/components/consulting.html`: **Independent Robotics Architecture & Integration Review**. It describes architecture/interface reviews, navigation integration, technical risk and validation strategy. The existing email channel handles enquiries.

Only after obtaining the required written employer authorisation should you consider setting the flag to `true`, reviewing the text and rebuilding. Enabling the flag is not authorisation. The visible section states that each engagement remains subject to prior written employer authorisation and a case-by-case conflict-of-interest review, and that proprietary/confidential information is not used or disclosed. It makes no legal or tax compliance claim.

`npm run check` tests enable/disable transitions in an isolated fixture; it never enables consulting in the working site. The repository default must remain false until explicitly changed with authorisation.

## Browser verification (optional development tools)

A local Chrome/Chromium installation is required. These pinned QA-only packages stay in ignored `.local/qa`; they are not website dependencies.

```sh
npm install --prefix .local/qa --cache .local/npm-cache --no-audit --no-fund puppeteer-core@24.12.1 axe-core@4.10.3
npm run preview
# In another terminal:
npm run test:browser
```

With the preview running, `npm run render:social` regenerates the sharing PNG after editing its HTML source. Browser verification itself does not modify website assets.

Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome`. Browser tests cover the 8 currently generated routes at 1440, 390 and 320 CSS pixels, axe accessibility checks, image loads, navigation, keyboard focus, real clipboard copy, denied-clipboard recovery, reduced motion and no-JavaScript use. Evidence and screenshots are saved to `.local/evidence/sticky-header/` (ignored); override with `EVIDENCE_DIR` for later runs. Automated checks are not a substitute for assistive-technology or real-device testing.

## GitHub Pages

Generated files remain compatible with the existing branch-root publishing layout. There is no new deployment workflow or hosting service. `_config.yml` excludes development files from the normal GitHub Pages/Jekyll build; underscore-prefixed source/documentation directories are excluded by Jekyll’s normal rules. The generator itself does not run on Pages: regenerate locally before committing.

Private editorial material in `docs/` is ignored locally through `.git/info/exclude` and explicitly excluded by `_config.yml`. On a new checkout, add `/docs/` to `.git/info/exclude` before placing private material there. It is not a public CV download or a website asset. Do not add `.nojekyll` or a raw upload workflow without also explicitly excluding `docs`, `_content`, `_tools`, `_docs`, `.local`, and development files. `.local` must never be committed or uploaded.

Root-relative links assume this user site is served at the domain root. `index.html` and the original section fragments still work. Old education/certifications fragments lead to the professional-background context; the language fragment leads to contact. Original portrait and thesis image URLs are retained. The obsolete PHP endpoint and unused template assets were intentionally retired.

There are no configurable cache headers on this branch-based site. CSS/JS references use content-digest query strings to invalidate stale cached files; images are local, responsive WebP assets with intrinsic dimensions. Hosting cache behaviour remains controlled by GitHub Pages.

## Repository scope

Commit website source, generated pages, assets and maintenance scripts. Keep private reference files in `docs/` and local audit reports in `_docs/` out of the repository. Add `/docs/` and `/_docs/` to `.git/info/exclude` on any checkout that contains them. QA dependencies, screenshots and raw evidence stay in ignored `.local/`.

No commit, push or deployment is performed by any build or check command.
