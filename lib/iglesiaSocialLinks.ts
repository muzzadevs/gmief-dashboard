export const IGLESIA_SOCIAL_NETWORKS = [
  "facebook",
  "youtube",
  "tiktok",
  "instagram",
] as const;

export type IglesiaSocialNetwork = (typeof IGLESIA_SOCIAL_NETWORKS)[number];
export type IglesiaSocialLinkField = `${IglesiaSocialNetwork}_url`;

const SOCIAL_DOMAINS: Record<IglesiaSocialNetwork, string[]> = {
  facebook: ["facebook.com", "fb.com"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"],
  instagram: ["instagram.com"],
};

export function isValidIglesiaSocialUrl(
  value: unknown,
  network: IglesiaSocialNetwork
): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    const isHttp = url.protocol === "https:" || url.protocol === "http:";
    const isExpectedDomain = SOCIAL_DOMAINS[network].some(
      (domain) =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
    return (
      isHttp &&
      !url.port &&
      !url.username &&
      !url.password &&
      isExpectedDomain
    );
  } catch {
    return false;
  }
}

export function normalizeIglesiaSocialUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmedValue = value.trim();
  return trimmedValue || null;
}
