function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getSiteUrl(): URL {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL;

  if (explicit) {
    return new URL(normalizeSiteUrl(explicit));
  }

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return new URL(normalizeSiteUrl(vercel));
  }

  return new URL("http://localhost:3000");
}

