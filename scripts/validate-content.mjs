import { readdir } from 'node:fs/promises';

const root = new URL('../src/content/blog/', import.meta.url);
const files = await readdir(root, { recursive: true });
const slugs = new Map();
for (const file of files.filter((path) => /\.(md|mdx)$/.test(path))) {
  if (!/^[a-zA-Z0-9_/-]+\.(md|mdx)$/.test(file)) {
    throw new Error(`Use letters, numbers, hyphens or underscores in article filenames: ${file}`);
  }
  const slug = file.replace(/\.(md|mdx)$/, '').toLowerCase().replace(/\/index$/, '');
  if (slugs.has(slug)) {
    throw new Error(`Duplicate content slug "${slug}": ${slugs.get(slug)} and ${file}. Rename or update the existing article.`);
  }
  slugs.set(slug, file);
}
console.log(`Validated ${slugs.size} unique Markdown/MDX file slugs. Astro will validate frontmatter and publishable content next.`);
