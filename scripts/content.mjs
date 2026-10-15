import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const opportunities = JSON.parse(await readFile(new URL('content/opportunities.json', root), 'utf8'));
const [command, id, bodyPath] = process.argv.slice(2);
const opportunity = opportunities.find((item) => item.id === id);

try {
  if (command === 'opportunities') {
    for (const item of opportunities.toSorted((a, b) => a.priority - b.priority)) {
      console.log(`${item.priority}. ${item.id} — ${item.searchIntent}: ${item.readerOutcome}`);
    }
  } else if (command === 'brief' && opportunity) {
    console.log(`Prepare an editorial Markdown draft using this brief:
${JSON.stringify(opportunity, null, 2)}

These are editorial hypotheses, NOT measured keyword volumes, rankings or verified facts.
Check existing articles for duplication and validate search intent before writing.
Use sourceCandidates only as research starting points: fetch current official pages,
record exact URLs and check dates, and map factual claims to inline citations.
If you cannot access a source, omit the claim or flag it for the editor; never guess.
Ask the editor for verified source excerpts if browsing is unavailable.
Do not invent Kinsta prices, features, guarantees, performance, uptime or customer counts.
Do not claim first-hand experience, invent reviews/testimonials or fabricate statistics.
Explain limitations, alternatives and who should NOT choose managed hosting.
Write useful original advice, not keyword stuffing, deceptive trademarks or sales hype.
Do not include affiliate URLs, HTML, imports, frontmatter or executable content.
The site adds the disclosure and optional CTA; use ordinary Markdown only.
Return the article body only, followed by a separately supplied source/review checklist.
This is an unapproved draft, not permission to publish, advertise or post on third-party sites.`);
  } else if (command === 'draft' && opportunity && bodyPath) {
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
      affiliate: 'kinsta',
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
    throw new Error('Usage: npm run content -- opportunities | brief <id> | draft <id> <markdown-body-path>');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
