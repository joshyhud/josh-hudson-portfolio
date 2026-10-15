import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const opportunities = JSON.parse(await readFile(new URL('content/opportunities.json', root), 'utf8'));
const [command, id, bodyPath] = process.argv.slice(2);
const opportunity = opportunities.find((item) => item.id === id);

const stopwords = new Set(['the', 'and', 'for', 'with', 'your', 'from', 'that', 'this', 'how', 'what', 'before', 'choosing']);
const tokens = (value) => new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g)?.filter((word) => !stopwords.has(word)));
async function existingArticles() {
  const directory = new URL('src/content/blog/', root);
  const files = (await readdir(directory, { recursive: true })).filter((file) => /\.(md|mdx)$/.test(file));
  return Promise.all(files.map(async (file) => {
    const text = await readFile(new URL(file, directory), 'utf8');
    return {
      slug: file.replace(/\.(md|mdx)$/, '').toLowerCase().replace(/\/index$/, ''),
      title: text.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? file,
      draft: /^draft:\s*true\s*$/m.test(text),
      words: text.split(/\s+/).length,
      text,
    };
  }));
}

async function suggestLinks(brief) {
  const query = tokens(`${brief.topic} ${brief.targetKeyword} ${(brief.secondaryTopics ?? []).join(' ')}`);
  return (await existingArticles())
    .filter((article) => !article.draft && article.slug !== brief.existingSlug)
    .map((article) => {
      const words = tokens(article.text);
      const overlap = [...query].filter((word) => words.has(word)).length;
      const path = `/blog/${article.slug}/`;
      const curatedBonus = brief.internalLinks?.includes(path) ? 3 : 0;
      return { path, title: article.title, score: overlap * (article.words >= 250 ? 2 : 1) + curatedBonus, shortArticle: article.words < 250 };
    })
    .filter((article) => article.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

try {
  if (command === 'audit') {
    for (const article of await existingArticles()) {
      if (/\bwordpress\b|\bkinsta\b|kaid=/i.test(article.text)) {
        console.log(JSON.stringify({
          slug: article.slug, title: article.title, draft: article.draft,
          kinsta: /\bkinsta\b/i.test(article.text), rawAffiliateLinks: /[?&]kaid=/i.test(article.text),
          words: article.words,
        }));
      }
    }
  } else if (command === 'validate' && /^[a-z0-9_/-]+$/.test(id ?? '') && !id.includes('..')) {
    const result = spawnSync('npm', ['run', 'validate:content'], {
      cwd: fileURLToPath(root),
      env: { ...process.env, CONTENT_REVIEW_SLUG: id },
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } else if (command === 'opportunities') {
    for (const item of opportunities.toSorted((a, b) => a.priority - b.priority)) {
      console.log(`${item.priority}. ${item.id} — ${item.searchIntent}: ${item.readerOutcome}`);
    }
  } else if (command === 'research' && opportunity) {
    console.log(JSON.stringify({
      opportunity,
      existingContent: await suggestLinks(opportunity),
      officialResearchStartingPoints: opportunity.sourceCandidates ?? ['https://kinsta.com/docs/'],
      nextStep: 'Check duplication, intent and current official sources; record evidence before drafting. Scores are topic overlap, not quality guarantees.',
    }, null, 2));
  } else if (command === 'brief' && opportunity) {
    console.log(`Prepare an editorial Markdown draft using this brief:
${JSON.stringify({
  ...opportunity,
  suggestedMetaTitle: opportunity.title,
  suggestedMetaDescription: opportunity.readerOutcome,
  suggestedSlug: opportunity.existingSlug ?? opportunity.id,
  suggestedInternalLinks: await suggestLinks(opportunity),
}, null, 2)}

These are editorial hypotheses, NOT measured keyword volumes, rankings or verified facts.
Check existing articles for duplication and validate search intent before writing.
If action is update, improve the named existing article rather than creating another.
Use sourceCandidates only as research starting points: fetch current official pages,
record exact URLs and check dates, and map factual claims to inline citations.
If you cannot access a source, omit the claim or flag it for the editor; never guess.
Ask the editor for verified source excerpts if browsing is unavailable.
Do not invent Kinsta prices, features, guarantees, performance, uptime or customer counts.
Do not claim first-hand experience, invent reviews/testimonials or fabricate statistics.
Explain limitations, alternatives and who should NOT choose managed hosting.
Write useful original advice, not keyword stuffing, deceptive trademarks or sales hype.
Include an introduction, a direct answer to the intent, useful explanatory sections,
and evidence-based comparisons where appropriate. Use ## headings; the layout supplies H1.
Include only relevant verified internal links, never links solely to satisfy a quota.
Recommend Kinsta only if the verified requirements justify it; otherwise omit the recommendation.
Do not include affiliate URLs, HTML, imports, frontmatter or executable content.
The site adds disclosure and CTA only when an editor explicitly opts into affiliate metadata.
Use ordinary Markdown only. At least 250 words of useful substance are needed, not filler.
Return the article body only, followed by a separately supplied source/review checklist.
This is an unapproved draft, not permission to publish, advertise or post on third-party sites.`);
  } else if (command === 'draft' && opportunity && bodyPath) {
    if (opportunity.action === 'update') throw new Error(`Update the existing ${opportunity.existingSlug} article; do not generate a duplicate.`);
    const body = await readFile(bodyPath, 'utf8');
    if (!body.trim() || /^\s*---/.test(body) || /<|^\s*(import|export)\s/m.test(body) || /[?&]kaid=/i.test(body)) {
      throw new Error('Supply a non-empty plain Markdown body without frontmatter, HTML, imports or affiliate tracking URLs.');
    }
    const metadata = {
      title: opportunity.title,
      description: opportunity.readerOutcome,
      pubDate: new Date().toISOString().slice(0, 10),
      draft: true,
      aiGenerated: true,
      ...(process.argv.includes('--affiliate') ? { affiliate: 'kinsta' } : {}),
      targetKeyword: opportunity.targetKeyword,
      searchIntent: opportunity.searchIntent,
      tags: ['WordPress', 'Hosting'],
      sources: [],
    };
    const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
    const destination = new URL(`src/content/blog/${opportunity.id}.md`, root);
    await writeFile(destination, `---\n${frontmatter}\n---\n\n${body.trim()}\n`, { flag: 'wx' });
    console.log(`Created unapproved draft: ${fileURLToPath(destination)}\nAdd verified sources and human review before explicitly setting draft: false.`);
  } else {
    throw new Error('Usage: npm run content -- audit | opportunities | research <id> | brief <id> | draft <id> <markdown-body-path> [--affiliate] | validate <slug>');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
