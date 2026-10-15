import { z } from 'astro/zod';

export const editorialFields = {
  affiliate: z.literal('kinsta').optional(),
  aiGenerated: z.boolean().default(false),
  targetKeyword: z.string().trim().min(1).optional(),
  searchIntent: z.enum(['informational', 'commercial', 'transactional']).optional(),
  sources: z.array(z.object({
    url: z.string().url().refine((value) => URL.canParse(value) && new URL(value).protocol === 'https:', 'Use HTTPS sources'),
    title: z.string().trim().min(1),
    checkedAt: z.string().date(),
  })).default([]),
  review: z.object({
    approvedBy: z.string().trim().min(1),
    approvedAt: z.string().date(),
    factsChecked: z.literal(true),
    originalContent: z.literal(true),
    noInventedExperience: z.literal(true),
    readerValueChecked: z.literal(true),
  }).optional(),
};

type EditorialData = {
  draft?: boolean;
  affiliate?: 'kinsta';
  aiGenerated?: boolean;
  targetKeyword?: string;
  searchIntent?: string;
  sources?: { url: string; checkedAt: string }[];
  review?: { approvedBy: string; approvedAt: string };
};

export function isPublishable({ data, body = '' }: { data: EditorialData; body?: string }): boolean {
  if (!data.draft) {
    if (/[?&]kaid=/i.test(body)) {
      throw new Error('Use the centrally configured KinstaCTA instead of raw affiliate tracking URLs.');
    }
    if (/\bKinstaCTA\b/.test(body) && data.affiliate !== 'kinsta') {
      throw new Error('KinstaCTA requires affiliate: "kinsta" for article-level disclosure and review.');
    }
  }
  return !data.draft && (!(data.affiliate || data.aiGenerated) || !!data.review);
}

export function validateEditorial(data: EditorialData, ctx: z.RefinementCtx) {
  if (data.draft || !(data.affiliate || data.aiGenerated)) return;
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!data.review) issue('Affiliate and AI-assisted articles require explicit human review before publication.');
  if (!data.targetKeyword || !data.searchIntent) issue('Reviewed content requires a target keyword and search intent.');
  if (!data.sources?.length) issue('Reviewed content requires dated factual sources.');
  if (data.affiliate && !data.sources?.some(({ url }) => {
    if (!URL.canParse(url)) return false;
    const host = new URL(url).hostname;
    return host === 'kinsta.com' || host.endsWith('.kinsta.com');
  })) issue('Kinsta articles require at least one official Kinsta source.');
  const today = new Date().toISOString().slice(0, 10);
  if (data.review && data.review.approvedAt > today) issue('Approval date cannot be in the future.');
  if (data.sources?.some(({ checkedAt }) => checkedAt > today)) issue('Source check dates cannot be in the future.');
}
