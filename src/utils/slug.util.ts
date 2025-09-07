// src/utils/slug.util.ts
export function generateSlugFromName(name: string): string {
  const base = name
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'item';
}

export async function ensureUniqueSlug<T extends { id: string }>(
  existingSlugsFetcher: (slug: string) => Promise<boolean>,
  baseSlug: string,
  currentIdToExclude?: string,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;

  // Helper to check existence while allowing exclusion by id if fetcher supports it
  const exists = async (slug: string): Promise<boolean> => {
    return existingSlugsFetcher(slug);
  };

  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}


