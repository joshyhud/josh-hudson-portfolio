import { containsAffiliateTracking, isPublishable } from './content-policy';

type Article = {
  id: string;
  body?: string;
  data: Parameters<typeof isPublishable>[0]['data'] & {
    title: string;
  };
};

export function validateArticles(articles: Article[], internalTargetExists: (path: string) => boolean, reviewSlug?: string) {
  const errors: string[] = [];
  if (reviewSlug && !articles.some((article) => article.id === reviewSlug)) {
    throw new Error(`No article found for quality review: ${reviewSlug}`);
  }
  const candidates = articles.filter((article) => isPublishable(article) || article.id === reviewSlug);
  for (const article of candidates) {
    if (!(article.data.affiliate || article.data.aiGenerated)) continue;
    const fail = (message: string) => errors.push(`${article.id}: ${message}`);
    const body = article.body ?? '';
    const prose = body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '');
    if (containsAffiliateTracking(body)) fail('Use the centrally configured CTA, not raw affiliate tracking URLs.');
    if (/\bKinstaCTA\b/.test(body) && article.data.affiliate !== 'kinsta') fail('KinstaCTA requires affiliate metadata and disclosure.');
    if (!article.data.sources?.length) fail('Add dated, verified sources before requesting editorial approval.');
    const title = article.data.title.trim().toLowerCase();
    if (articles.some((other) => other.id !== article.id && other.data.title.trim().toLowerCase() === title)) {
      fail('Duplicate article title; update the existing article instead.');
    }
    if (/\b(TODO|TBD|FIXME|lorem ipsum|insert (?:link|source|text) here)\b|\[(?:placeholder|citation needed)\]/i.test(prose)) {
      fail('Remove placeholder text and resolve missing citations.');
    }
    if (prose.split(/\s+/).filter(Boolean).length < 250) {
      fail('Article lacks useful substance (minimum 250 words outside fenced code; editorial review is still required).');
    }
    if (/^#\s/m.test(prose) || !/^##\s/m.test(prose)) {
      fail('Use level-two section headings; the layout already supplies the page H1.');
    }
    const fences = [...body.matchAll(/^(`{3,}|~{3,})/gm)];
    if (fences.length % 2 !== 0) fail('Close Markdown code fences.');
    const headings = [...prose.matchAll(/^#{2,6}\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase());
    if (new Set(headings).size !== headings.length) fail('Remove repeated headings.');
    const keyword = article.data.targetKeyword?.toLowerCase();
    if (keyword) {
      const occurrences = body.toLowerCase().split(keyword).length - 1;
      const words = body.split(/\s+/).length;
      if (occurrences > 8 && occurrences * keyword.split(/\s+/).length / words > 0.08) {
        fail('Possible keyword stuffing: reduce repeated exact-match phrases and review readability.');
      }
    }
    let relevantInternalLinks = 0;
    // Covers ordinary Markdown inline links, images, reference definitions and autolinks.
    const links = [
      ...[...prose.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)/g)].map((match) => match[1].replace(/^<|>$/g, '')),
      ...[...prose.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)].map((match) => match[1]),
      ...[...prose.matchAll(/<(https?:\/\/[^>]+)>/g)].map((match) => match[1]),
      ...[...prose.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]),
    ];
    for (const link of links) {
      if (/^(?:https?:)?\/\//i.test(link)) {
        if (!URL.canParse(link) || !['http:', 'https:'].includes(new URL(link).protocol)) fail(`Malformed external URL: ${link}`);
      } else if (link.startsWith('#')) {
        // Local fragment targets are verified by the human editor.
      } else if (link.startsWith('/')) {
        const path = link.split(/[?#]/)[0];
        if (!internalTargetExists(path)) fail(`Broken internal link: ${link}`);
        if (path.startsWith('/blog/') && path.replace(/\/$/, '') !== `/blog/${article.id}`) relevantInternalLinks++;
      } else {
        fail(`Use a valid absolute HTTP(S) URL or root-relative internal link: ${link}`);
      }
    }
    if (relevantInternalLinks === 0 && !article.data.internalLinksNote) {
      fail('Add a contextually relevant published-article link, or record why none fits in internalLinksNote. Never add an unrelated link to satisfy validation.');
    }
  }
  if (errors.length) throw new Error(`Content validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
}
