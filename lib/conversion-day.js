export const WIB = 7 * 3600 * 1000;

export const CONVERSION_DAY_START_HOUR = 7;

const DAY_START_MS = CONVERSION_DAY_START_HOUR * 3600 * 1000;

export function startOfConversionDay() {
  const wib = new Date(Date.now() + WIB);
  const midnightWib = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB).getTime();
  const intoDayMs = (wib.getUTCHours() * 3600 + wib.getUTCMinutes() * 60 + wib.getUTCSeconds()) * 1000 + wib.getUTCMilliseconds();
  return intoDayMs < DAY_START_MS ? midnightWib - 86400000 + DAY_START_MS : midnightWib + DAY_START_MS;
}

export const todayISO = () => {
  const wib = new Date(Date.now() + WIB);
  return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}-${String(wib.getUTCDate()).padStart(2, "0")}`;
};

export function rangeBounds(range, from, to) {
  const now = Date.now();
  const todayStart = startOfConversionDay();
  switch (range) {
    case "yesterday":
      return { fromISO: new Date(todayStart - 24 * 3600 * 1000).toISOString(), toISO: new Date(todayStart).toISOString() };
    case "week":
      return { fromISO: new Date(now - 7 * 86400 * 1000).toISOString(), toISO: new Date().toISOString() };
    case "month":
      return { fromISO: new Date(now - 30 * 86400 * 1000).toISOString(), toISO: new Date().toISOString() };
    case "custom": {
      if (!from || !to) return { fromISO: new Date(todayStart).toISOString(), toISO: new Date().toISOString() };
      const fromDate = new Date(from + "T00:00:00Z").getTime() - WIB;
      const toDate = new Date(to + "T23:59:59.999Z").getTime() - WIB;
      return { fromISO: new Date(fromDate).toISOString(), toISO: new Date(toDate).toISOString() };
    }
    case "today":
    default:
      return { fromISO: new Date(todayStart).toISOString(), toISO: new Date().toISOString() };
  }
}
