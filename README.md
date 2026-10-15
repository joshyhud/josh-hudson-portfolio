# Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).

## Reviewed affiliate content

This remains a static Astro Markdown/MDX blog. The existing npm lockfile, SCSS,
layouts, canonical metadata, structured data, sitemap and GitHub Pages deployment
are retained. No AI service, credentials, scheduled publishing or new dependencies
are required.

### Configuration and rendering

`src/config/affiliate.ts` is the only location for `KINSTA_AFFILIATE_URL`.
Change that value centrally rather than pasting tracking URLs into articles.
Set `affiliate: "kinsta"` in Markdown frontmatter to render
`AffiliateDisclosure.astro` before the article and `KinstaCTA.astro` after it.
The CTA uses `rel="sponsored nofollow"` and includes a local disclosure, so it
can also be reused in MDX. Always retain the article-level disclosure.
Do not put raw affiliate links in Markdown or enable affiliate CTAs without metadata.
In MDX the CTA accepts a `text` prop, for example
`<KinstaCTA text="Explore Kinsta WordPress hosting" />` after importing the component.
Promotional wording such as a free-month offer must only be used after checking
current official eligibility and terms; the default intentionally makes no offer.
Unrelated posts have no CTA or disclosure added.

### Opportunity research and AI-assisted drafts

1. **Research:** Run `npm run content -- audit`, then `npm run content -- opportunities`.
   Edit `content/opportunities.json` to
   maintain the backlog: intent, audience, reader outcome, outline, internal links,
   candidate official sources and conversion fit. Priorities are editorial
   hypotheses, not fabricated traffic/search-volume estimates. Check actual search
   results and existing content for duplication before commissioning an article.
   Run `npm run content -- research wordpress-migration-planning` to see source
   starting points and up to three topic-overlap-based internal-link suggestions.
   Longer existing articles are preferred, drafts/self-links excluded, and short
   articles flagged. Scores are not claims of editorial quality: read every
   suggestion and omit irrelevant links. No links are inserted automatically.
   Opportunities marked `action: "update"` must improve their `existingSlug`;
   the draft command refuses to create a competing article.
2. **Brief:** Run `npm run content -- brief wordpress-migration-planning`.
   Give the resulting brief to your chosen AI assistant along with current,
   verified source excerpts. This is deliberately provider-neutral and does not
   send repository content to a service. The command does not call an AI API.
3. **Draft:** Save only the generated Markdown body to a local file outside the repository,
   then run `npm run content -- draft wordpress-migration-planning /absolute/path/to/body.txt`.
   This creates a new Markdown file, never overwrites existing work, and always
   sets `draft: true` and `aiGenerated: true`. Only add `--affiliate` when a
   Kinsta recommendation is justified; that explicitly opts into `affiliate: "kinsta"`,
   which adds the visible disclosure and CTA at render time.
   Frontmatter title/description and the filename supply the suggested meta
   title, description and URL slug; the brief also labels those suggestions.
   Inspect AI output as untrusted input; never execute generated commands or imports.
4. **Quality control:** Edit for original reader value, balanced alternatives, limitations and intent.
   Verify **every** factual claim against current official sources, preferably
   official Kinsta pages for Kinsta claims. Add inline citations close to claims.
   Candidate research links are not evidence until actually read and checked.
   Never invent pricing, features, guarantees, performance, statistics,
   testimonials or personal experience. Remove unsupported claims and placeholders.
5. Add factual sources to frontmatter (rendered as an article source list):

   ```yaml
   sources:
     - url: "https://kinsta.com/docs/"
       title: "The specific official document actually consulted"
       checkedAt: "2026-10-15"
   ```

   Use the precise document URL, actual title and actual date of review, not the
   generic example above. Verify internal links and avoid keyword stuffing.
   Run `npm run content -- validate wordpress-migration-planning` to check that
   draft's body before human approval. This still excludes it from published routes.
   If no existing article is relevant, explain why in frontmatter `internalLinksNote`
   (at least ten characters) rather than adding an unrelated link.
6. **Human approval → Publish:** A human editor must explicitly add the following review record **only after**
   performing the checks, update `pubDate`/`updatedDate` as appropriate, and
   separately change `draft` to `false`:

   ```yaml
   review:
     approvedBy: "Actual editor name or GitHub handle"
     approvedAt: "2026-10-15"
     factsChecked: true
     originalContent: true
     noInventedExperience: true
     readerValueChecked: true
   ```

   Never ask the AI to approve itself. Re-review after substantive edits and
   periodically recheck published factual claims; dates do not prove freshness.
   Use repository review/branch protection to restrict who may approve changes.
   Metadata records human attestation, not cryptographic identity verification.

### Publication safeguards

`npm run build` validates frontmatter using the existing Astro/Zod content schema.
Publishing affiliate or AI-generated content requires a review record, keyword,
intent and dated HTTPS sources; Kinsta affiliate articles also require an official
Kinsta source. Future review/source dates and incomplete review flags fail the build.
These automated checks cannot establish truth, originality or whether a claim is
supported: a human must perform those checks. Unapproved drafts stay out of static
routes, related posts, listings, RSS and therefore the generated sitemap.
Preview a draft in your editor; there is intentionally no public draft-preview route.

For published affiliate/AI articles (and a draft explicitly selected for review),
quality checks report duplicate titles, placeholders, malformed HTTP(S) URLs,
broken root-relative blog/static-page/asset links, missing contextual internal
links, repeated headings, unclosed code fences, missing H2 structure and obvious
exact-phrase overuse. A 250-word floor excludes code blocks and is only a basic
substance check, never proof of quality. Markdown/MDX compilation happens in Astro.
Source-link reachability, factual support, fragment anchors, complex Markdown
syntax and editorial relevance still need human review; no unreliable external
network availability check is treated as proof of accuracy.
File-derived slugs must use letters, numbers, underscores and hyphens; duplicate
case-insensitive MD/MDX slugs (including nested `index` collisions) fail prebuild.
Do not override slugs in frontmatter. Existing `pubDate`, tags and SEO architecture
are retained rather than introducing parallel date/category/canonical fields.

Run `npx playwright test tests/content-policy.spec.ts` for policy/workflow checks
and `npm run validate:content` (the normal build plus content checks) before submitting through the normal
repository process. GitHub Pages still deploys only from `main` using the existing
workflow. A separate read-only pull-request workflow runs the safeguards and build;
it has no deployment or social publishing permissions. There are no scheduled AI publishing jobs.

The existing Mastodon publisher is now manual-only (`workflow_dispatch`) to
prevent pushing a generated draft from automatically sharing it. Do not invoke it
for drafts; independently verify that an approved article is live first.
No automated third-party outreach, spam, paid advertising, fake reviews or
testimonials are part of this system.

The existing `modern-wordpress` article has been moved to draft pending human
fact-checking and source review. Its embedded tracking link and unverified
promotional offer were removed; its existing account of personal experience is
preserved as source material, not independently verified by this system.

### Existing-content audit and candidate backlog

The initial audit found 26 Markdown posts. `modern-wordpress` is the existing
hosting/Kinsta article and held the sole embedded Kinsta tracking URL. Update that
article instead of creating another generic managed-hosting explainer.
`wordpress-7` is a short update-policy thought, not a comprehensive hosting guide.
`lazy-loading` and `silence-in-the-library` are relevant performance/dependency
resources where the context fits; do not link travel, personal or PWA posts simply
to increase link count. Existing posts have no duplicate titles, but a shared-vs-managed
worksheet overlaps the existing hosting explainer: merge it unless research proves
distinct value. No new articles have been generated from the backlog.

The 20 ranked candidates are in `content/opportunities.json`. Commercial intent
scores use an editorial 1–5 scale (1: mostly educational; 5: active provider choice),
and competition labels are explicitly unverified estimates, not search-volume data:

1. Refresh the existing managed WordPress hosting explainer/checklist.
2. Migration planning and rollback.
3. Total hosting cost worksheet.
4. Agency hosting shortlists.
5. Small-business hosting decisions.
6. WooCommerce hosting requirements.
7. High-traffic capacity evaluation.
8. Freelancer client handover.
9. Managed-vs-shared workload decision (merge if overlapping).
10. Kinsta alternatives.
11. Kinsta vs WP Engine workflow comparison.
12. Managed hosting vs self-managed VPS responsibilities.
13. Performance diagnosis before switching hosts.
14. Staging and update workflow.
15. Backup recovery evaluation.
16. Hosting support scope.
17. Membership-site uncached workloads.
18. Multisite compatibility.
19. Hosting plan limits.
20. Portability and exit planning.

Research official sources and actual search intent before commissioning any of
these. Each candidate records audience, secondary topics, Kinsta relevance,
competition estimate, suggested CTA, internal-link candidates and its distinct
reason to exist. The backlog is not a publishing queue.
