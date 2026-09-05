import i18n from "./index";

function getLocale(): string {
  const lng = i18n.language;
  return lng === "es" ? "es" : "en-US";
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(getLocale(), options);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, { month: "short", year: "numeric" });
}

export function formatDateDay(date: string | Date): string {
  return formatDate(date, { month: "short", day: "numeric" });
}
