export function normalizeSaudiPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("00966")) local = local.slice(5);
  else if (local.startsWith("966")) local = local.slice(3);
  else if (local.startsWith("0")) local = local.slice(1);
  if (!/^5\d{8}$/.test(local)) return null;
  return `+966${local}`;
}
