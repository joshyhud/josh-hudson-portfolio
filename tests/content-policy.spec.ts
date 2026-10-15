import { test, expect } from '@playwright/test';
import { z } from 'astro/zod';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { editorialFields, validateEditorial, isPublishable } from '../src/lib/content-policy';
import { KINSTA_AFFILIATE_URL } from '../src/config/affiliate';
import { validateArticles } from '../src/lib/content-quality';

const schema = z.object({ draft: z.boolean().optional(), ...editorialFields }).superRefine(validateEditorial);
const approved = {
  affiliate: 'kinsta',
  aiGenerated: true,
  targetKeyword: 'WordPress hosting requirements',
  searchIntent: 'commercial',
  sources: [{ url: 'https://kinsta.com/docs/', title: 'Official documentation', checkedAt: '2026-01-01' }],
  review: {
    approvedBy: 'Human editor',
    approvedAt: '2026-01-01',
    factsChecked: true,
    originalContent: true,
    noInventedExperience: true,
    readerValueChecked: true,
  },
};

test('existing articles retain their publication behavior', () => {
  expect(schema.safeParse({}).success).toBe(true);
  expect(isPublishable({ data: {} })).toBe(true);
  expect(isPublishable({ data: { draft: true } })).toBe(false);
});

test('drafts are valid but never publishable', () => {
  const data = schema.parse({ draft: true, affiliate: 'kinsta', aiGenerated: true });
  expect(isPublishable({ data })).toBe(false);
});

test('affiliate and AI content independently require explicit approval', () => {
  for (const data of [{ affiliate: 'kinsta' }, { aiGenerated: true }]) {
    expect(schema.safeParse(data).success).toBe(false);
    expect(isPublishable({ data: data as { aiGenerated?: boolean; affiliate?: 'kinsta' } })).toBe(false);
  }
  expect(schema.safeParse(approved).success).toBe(true);
  expect(isPublishable({ data: schema.parse(approved) })).toBe(true);
});

test('review checks cannot be false or omitted', () => {
  for (const key of ['factsChecked', 'originalContent', 'noInventedExperience', 'readerValueChecked']) {
    expect(schema.safeParse({ ...approved, review: { ...approved.review, [key]: false } }).success).toBe(false);
    expect(schema.safeParse({ ...approved, review: { ...approved.review, [key]: undefined } }).success).toBe(false);
  }
  expect(schema.safeParse({ ...approved, review: { ...approved.review, approvedBy: ' ' } }).success).toBe(false);
});

test('sources must be HTTPS and include a genuine official hostname', () => {
  for (const url of ['not-a-url', 'http://kinsta.com/docs/', 'https://kinsta.com.evil.example/', 'https://notkinsta.com/', 'javascript:alert(1)']) {
    expect(schema.safeParse({ ...approved, sources: [{ ...approved.sources[0], url }] }).success).toBe(false);
  }
  expect(schema.safeParse({ ...approved, sources: [] }).success).toBe(false);
});

test('future dates and missing SEO intent fail publication checks', () => {
  expect(schema.safeParse({ ...approved, review: { ...approved.review, approvedAt: '2999-01-01' } }).success).toBe(false);
  expect(schema.safeParse({ ...approved, sources: [{ ...approved.sources[0], checkedAt: '2999-01-01' }] }).success).toBe(false);
  expect(schema.safeParse({ ...approved, targetKeyword: undefined }).success).toBe(false);
  expect(schema.safeParse({ ...approved, searchIntent: undefined }).success).toBe(false);
});

test('raw tracking links and undisclosed reusable CTAs fail publication', () => {
  expect(() => isPublishable({ data: {}, body: `[Hosting](${KINSTA_AFFILIATE_URL})` })).toThrow(/centrally configured/);
  expect(() => isPublishable({ data: {}, body: '<KinstaCTA />' })).toThrow(/disclosure/);
});

test('the draft workflow is local, non-overwriting and never approves content', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'affiliate-content-'));
  try {
    await mkdir(join(directory, 'scripts'));
    await mkdir(join(directory, 'content'));
    await mkdir(join(directory, 'src/content/blog'), { recursive: true });
    await copyFile(new URL('../scripts/content.mjs', import.meta.url), join(directory, 'scripts/content.mjs'));
    await copyFile(new URL('../scripts/validate-content.mjs', import.meta.url), join(directory, 'scripts/validate-content.mjs'));
    await copyFile(new URL('../content/opportunities.json', import.meta.url), join(directory, 'content/opportunities.json'));
    const run = (...args: string[]) => execFileSync(process.execPath, [join(directory, 'scripts/content.mjs'), ...args], { encoding: 'utf8', stdio: 'pipe' });
    const id = 'wordpress-migration-planning';
    expect(run('opportunities')).toContain(id);
    expect(run('brief', id)).toContain('Do not invent Kinsta');
    const body = join(directory, 'body.txt');
    await writeFile(body, '## Requirements\n\nDefine the requirements before comparing hosting options.');
    run('draft', id, body, '--affiliate');
    const article = await readFile(join(directory, `src/content/blog/${id}.md`), 'utf8');
    expect(article).toContain('draft: true');
    expect(article).toContain('aiGenerated: true');
    expect(article).toContain('affiliate: "kinsta"');
    expect(article).not.toContain('review:');
    expect(() => run('draft', id, body)).toThrow();
    expect(() => run('draft', '../../escape', body)).toThrow();
    expect(() => run('draft', 'managed-wordpress-hosting-checklist', body)).toThrow();
    expect(run('research', id)).toContain('officialResearchStartingPoints');
    run('draft', 'wordpress-hosting-cost-worksheet', body);
    expect(await readFile(join(directory, 'src/content/blog/wordpress-hosting-cost-worksheet.md'), 'utf8')).not.toContain('affiliate:');
    const checkSlugs = () => execFileSync(process.execPath, [join(directory, 'scripts/validate-content.mjs')], { stdio: 'pipe' });
    expect(checkSlugs).not.toThrow();
    await writeFile(join(directory, `src/content/blog/${id}.mdx`), 'Duplicate slug fixture');
    expect(checkSlugs).toThrow();
    await writeFile(body, '<script>alert(1)</script>');
    expect(() => run('draft', 'freelancer-client-hosting', body)).toThrow();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('published reviewed content gets actionable quality errors', () => {
  const data = { ...schema.parse(approved), title: 'Unique fixture title' };
  const paragraph = 'A test fixture provides enough words to exercise validation independently from editorial judgment. '.repeat(22);
  const article = { id: 'fixture', data, body: `## Requirements\n\n${paragraph}\n\n[Related guide](/blog/guide/)` };
  expect(() => validateArticles([article], (path) => path === '/blog/guide/')).not.toThrow();
  for (const body of [
    '## Too short\nA short article.',
    article.body + '\nTODO: add evidence.',
    article.body + '\n[Broken link](/blog/missing/)',
    article.body + '\n[Malformed URL](https://)',
    article.body + '\n```js\nunclosed fence',
    article.body + '\n## Requirements\nDuplicated heading.',
  ]) {
    expect(() => validateArticles([{ ...article, body }], (path) => path === '/blog/guide/')).toThrow(/Content validation failed/);
  }
  expect(() => validateArticles([article, { ...article, id: 'duplicate' }], () => true)).toThrow(/Duplicate article title/);
  expect(() => validateArticles([{ ...article, data: { ...data, draft: true }, body: 'TODO' }], () => false)).not.toThrow();
  expect(() => validateArticles([{ ...article, data: { ...data, draft: true }, body: 'TODO' }], () => false, 'fixture')).toThrow(/placeholder/);
  expect(() => validateArticles([article], () => true, 'missing')).toThrow(/No article found/);
  expect(() => validateArticles([{ ...article, body: `## Requirements\n\n${paragraph}` }], () => true)).toThrow(/internalLinksNote/);
  expect(() => validateArticles([{
    ...article,
    data: { ...data, internalLinksNote: 'No sufficiently relevant published guide exists yet.' },
    body: `## Requirements\n\n${paragraph}`,
  }], () => true)).not.toThrow();
});

test('the opportunity backlog has twenty distinct, complete editorial candidates', async () => {
  const entries = JSON.parse(await readFile(new URL('../content/opportunities.json', import.meta.url), 'utf8'));
  expect(entries).toHaveLength(20);
  expect(new Set(entries.map((entry: { id: string }) => entry.id)).size).toBe(20);
  for (const entry of entries) {
    for (const field of ['topic', 'title', 'searchIntent', 'audience', 'targetKeyword', 'secondaryTopics', 'commercialIntentScore', 'kinstaRelevance', 'competitionEstimate', 'suggestedCTA', 'internalLinks', 'reason']) {
      expect(entry[field], `${entry.id}: ${field}`).toBeDefined();
    }
    expect(entry.commercialIntentScore).toBeGreaterThanOrEqual(1);
    expect(entry.commercialIntentScore).toBeLessThanOrEqual(5);
  }
});
