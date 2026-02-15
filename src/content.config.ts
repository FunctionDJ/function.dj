import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform German date format (DD.MM.YYYY) to Date object
			pubDate: z.string().transform((str) => {
				const [day, month, year] = str.split(".");
				return new Date(`${year}-${month}-${day}`);
			}),
			updatedDate: z
				.string()
				.transform((str) => {
					const [day, month, year] = str.split(".");
					return new Date(`${year}-${month}-${day}`);
				})
				.optional(),
			heroImage: image().optional(),
			draft: z.boolean().optional(),
		}),
});

export const collections = { blog };
