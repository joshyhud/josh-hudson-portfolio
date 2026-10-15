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

### Opportunity research and AI-assisted drafts

1. Run `npm run content -- opportunities`. Edit `content/opportunities.json` to
   maintain the backlog: intent, audience, reader outcome, outline, internal links,
   candidate official sources and conversion fit. Priorities are editorial
   hypotheses, not fabricated traffic/search-volume estimates. Check actual search
   results and existing content for duplication before commissioning an article.
2. Run `npm run content -- brief managed-wordpress-hosting-checklist`.
   Give the resulting brief to your chosen AI assistant along with current,
   verified source excerpts. This is deliberately provider-neutral and does not
   send repository content to a service. The command does not call an AI API.
3. Save only the generated Markdown body to a local file outside the repository,
   then run `npm run content -- draft managed-wordpress-hosting-checklist /absolute/path/to/body.txt`.
   This creates a new Markdown file, never overwrites existing work, and always
   sets `draft: true`, `aiGenerated: true`, and `affiliate: "kinsta"`.
   Inspect AI output as untrusted input; never execute generated commands or imports.
4. Edit for original reader value, balanced alternatives, limitations and intent.
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
6. A human editor must explicitly add the following review record **only after**
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

Run `npx playwright test tests/content-policy.spec.ts` for policy/workflow checks
and `npm run build` before submitting the reviewed change through the normal
repository process. GitHub Pages still deploys only from `main` using the existing
workflow. There are no scheduled AI publishing jobs.

The existing Mastodon publisher is now manual-only (`workflow_dispatch`) to
prevent pushing a generated draft from automatically sharing it. Do not invoke it
for drafts; independently verify that an approved article is live first.
No automated third-party outreach, spam, paid advertising, fake reviews or
testimonials are part of this system.

The existing `modern-wordpress` article has been moved to draft pending human
fact-checking and source review. Its embedded tracking link and unverified
promotional offer were removed; its existing account of personal experience is
preserved as source material, not independently verified by this system.
