const sar = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 });
const sarFraction = new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("ar-SA");
const dateTime = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" });

export const formatSar = (value: number) => sar.format(value);
export const formatSarExact = (value: number) => sarFraction.format(value);
export const formatNumber = (value: number) => num.format(value);
export const formatDateTime = (value: string | null) => (value ? dateTime.format(new Date(value)) : "—");
export const formatDate = (value: string | null) => (value ? dateOnly.format(new Date(value)) : "—");
