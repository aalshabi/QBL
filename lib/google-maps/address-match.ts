function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F]/g, "");
}
/** Require a location anchor to match the returned address, not merely a Riyadh label. */
export function matchesAddressAnchor(input: string, result: string): boolean {
  const source = normalize(input),
    returned = normalize(result);
  const shortCodes = source.match(/\b[a-z]{4}\s?\d{4}\b/g) ?? [];
  if (shortCodes.length)
    return shortCodes.every((x) =>
      returned.replace(/\s/g, "").includes(x.replace(/\s/g, "")),
    );
  const numbers = source.match(/\b\d{3,5}\b/g) ?? [];
  if (
    !numbers.length ||
    !numbers.every((n) =>
      new RegExp("(?:^|\\D)" + n + "(?:\\D|$)").test(returned),
    )
  )
    return false;
  const tokens = source
    .replace(
      /(?:الرياض|riyadh|المملكه العربيه السعوديه|saudi arabia|شارع|طريق|street|road|\d+)/g,
      " ",
    )
    .split(/[^\p{L}]+/u)
    .filter((x) => x.length >= 3);
  return tokens.length > 0 && tokens.every((t) => returned.includes(t));
}
