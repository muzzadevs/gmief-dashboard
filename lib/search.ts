export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchIncludes(text: string, query: string): boolean {
  return normalizeSearchText(text).includes(normalizeSearchText(query));
}

export function searchStartsWith(text: string, query: string): boolean {
  return normalizeSearchText(text).startsWith(normalizeSearchText(query));
}
