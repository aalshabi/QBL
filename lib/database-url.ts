/**
 * pg 8 يعامل sslmode=prefer|require|verify-ca معاملة verify-full (تحقق كامل من
 * الشهادة واسم الخادم)، ويطبع تحذيرًا أمنيًا في كل تشغيل بارد لأن pg 9 سيعيدها
 * إلى دلالات libpq الأضعف. نثبّت السلوك الحالي صراحةً: verify-full.
 *
 * لا يُلمس الرابط إن طلب صاحبه دلالات libpq (uselibpqcompat) أو عطّل TLS أو لم
 * يحدد sslmode أصلًا.
 */
const VERIFY_FULL_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function withExplicitVerifyFull(connectionString: string): string {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }

  const mode = url.searchParams.get("sslmode");
  if (!mode || !VERIFY_FULL_ALIASES.has(mode)) return connectionString;
  if (url.searchParams.has("uselibpqcompat")) return connectionString;

  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
