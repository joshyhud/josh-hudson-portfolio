import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { editorialFields, validateEditorial } from "./lib/content-policy";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      slug: z.never().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      ...editorialFields,
    }).superRefine(validateEditorial),
});

export const collections = { blog };
