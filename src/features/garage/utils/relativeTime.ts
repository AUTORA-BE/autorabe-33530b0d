/**
 * Returns a localized "time ago" string for a given ISO date.
 */
export function formatRelativeTime(
  iso: string,
  lang: "fr" | "nl" | "de" | "en" = "fr"
): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  const labels = {
    fr: {
      now: "à l'instant",
      min: (n: number) => `il y a ${n} min`,
      hour: (n: number) => `il y a ${n} h`,
      yesterday: "hier",
      day: (n: number) => `il y a ${n} j`,
    },
    nl: {
      now: "zojuist",
      min: (n: number) => `${n} min geleden`,
      hour: (n: number) => `${n} u geleden`,
      yesterday: "gisteren",
      day: (n: number) => `${n} d geleden`,
    },
    de: {
      now: "gerade eben",
      min: (n: number) => `vor ${n} Min`,
      hour: (n: number) => `vor ${n} Std`,
      yesterday: "gestern",
      day: (n: number) => `vor ${n} T`,
    },
    en: {
      now: "just now",
      min: (n: number) => `${n}m ago`,
      hour: (n: number) => `${n}h ago`,
      yesterday: "yesterday",
      day: (n: number) => `${n}d ago`,
    },
  } as const;

  const L = labels[lang];
  if (sec < 60) return L.now;
  if (min < 60) return L.min(min);
  if (hour < 24) return L.hour(hour);
  if (day === 1) return L.yesterday;
  return L.day(day);
}
