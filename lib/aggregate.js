import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Query agregat ringan (SQL) agar beban CPU di Worker tetap kecil.
 * Semua fungsi "fail-open": bila query agregat tak didukung, fallback
 * ke pengambilan baris lalu dihitung di JS.
 */

/** Ambil SUM(column) dengan filter opsional. */
export async function sumWhere(table, column, applyFilter) {
  const supabase = supabaseAdmin();
  let q = supabase.from(table).select(`${column}.sum()`);
  if (applyFilter) q = applyFilter(q);
  const { data, error } = await q;
  if (!error && Array.isArray(data) && data.length === 1) {
    const row = data[0];
    const v = row?.sum ?? row?.[column];
    if (v !== undefined && v !== null) return Number(v) || 0;
  }
  let q2 = supabase.from(table).select(column);
  if (applyFilter) q2 = applyFilter(q2);
  const { data: rows, error: e2 } = await q2;
  if (e2) return 0;
  return (rows || []).reduce((s, r) => s + (Number(r?.[column]) || 0), 0);
}

/** Hitung jumlah baris dengan filter opsional. */
export async function countWhere(table, applyFilter) {
  const supabase = supabaseAdmin();
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (applyFilter) q = applyFilter(q);
  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
}

/** count + SUM(valueCol) untuk satu filter (mis. satu panel). Fail-open: bila agregat tak didukung, ambil baris & hitung di JS. */
export async function countSumWhere(table, valueCol, buildFilter) {
  const supabase = supabaseAdmin();
  let q = supabase.from(table).select(`count(),${valueCol}.sum()`);
  if (buildFilter) q = buildFilter(q);
  const { data, error } = await q;
  if (!error && Array.isArray(data) && data.length === 1) {
    const row = data[0];
    return {
      count: Number(row?.count || 0),
      sum: Number(row?.sum ?? row?.[valueCol] ?? 0) || 0,
    };
  }
  let q2 = supabase.from(table).select(valueCol);
  if (buildFilter) q2 = buildFilter(q2);
  const { data: rows, error: e2 } = await q2;
  if (e2) return { count: 0, sum: 0 };
  return (rows || []).reduce(
    (acc, r) => {
      acc.count += 1;
      acc.sum += Number(r?.[valueCol]) || 0;
      return acc;
    },
    { count: 0, sum: 0 }
  );
}

/** count + SUM(valueCol) dikelompokkan per keyCol -> Map<key, {count, sum}>. Fail-open: fetch penuh + hitung di JS. */
export async function groupBy(table, keyCol, valueCol, buildFilter) {
  const supabase = supabaseAdmin();
  let q = supabase.from(table).select(`${keyCol},count(),${valueCol}.sum()`);
  if (buildFilter) q = buildFilter(q);
  const { data, error } = await q;
  const map = new Map();
  if (!error && Array.isArray(data)) {
    data.forEach((row) => {
      const key = row?.[keyCol];
      if (key === null || key === undefined) return;
      map.set(key, {
        count: Number(row?.count || 0),
        sum: Number(row?.sum ?? row?.[valueCol] ?? 0) || 0,
      });
    });
    return map;
  }
  let q2 = supabase.from(table).select(`${keyCol},${valueCol}`);
  if (buildFilter) q2 = buildFilter(q2);
  const { data: rows, error: e2 } = await q2;
  if (e2) return map;
  (rows || []).forEach((r) => {
    const key = r?.[keyCol];
    if (key === null || key === undefined) return;
    const cur = map.get(key) || { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += Number(r?.[valueCol]) || 0;
    map.set(key, cur);
  });
  return map;
}

/** Jumlah baris per keyCol -> Map<key, count>. Fail-open: fetch penuh + hitung di JS. */
export async function groupCount(table, keyCol, buildFilter) {
  const supabase = supabaseAdmin();
  let q = supabase.from(table).select(`${keyCol},count()`);
  if (buildFilter) q = buildFilter(q);
  const { data, error } = await q;
  const map = new Map();
  if (!error && Array.isArray(data)) {
    data.forEach((row) => {
      const key = row?.[keyCol];
      if (key === null || key === undefined) return;
      map.set(key, Number(row?.count || 0));
    });
    return map;
  }
  let q2 = supabase.from(table).select(keyCol);
  if (buildFilter) q2 = buildFilter(q2);
  const { data: rows, error: e2 } = await q2;
  if (e2) return map;
  (rows || []).forEach((r) => {
    const key = r?.[keyCol];
    if (key === null || key === undefined) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

/** Per-hari count + SUM(valueCol) untuk rentang tanggal -> Map<"YYYY-MM-DD", {count, sum}>. Fail-open. */
export async function dailyAggregate(table, valueCol, fromISO, toISO, buildFilter) {
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const dayKey = (v) =>
    typeof v === "string"
      ? v.slice(0, 10)
      : v instanceof Date
        ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`
        : iso(v);
  const supabase = supabaseAdmin();
  const map = new Map();
  if (!buildFilter) {
    const { data, error } = await supabase.rpc("daily_aggregate", {
      p_table: table,
      p_value: valueCol ?? null,
      p_from: fromISO,
      p_to: toISO,
    });
    if (!error && Array.isArray(data)) {
      data.forEach((row) => {
        const key = dayKey(row?.day);
        map.set(key, {
          count: Number(row?.cnt || 0),
          sum: valueCol ? Number(row?.total ?? 0) || 0 : undefined,
        });
      });
      return map;
    }
  }
  const cols = valueCol ? `created_at,${valueCol}` : "created_at";
  let q2 = supabase
    .from(table)
    .select(cols)
    .gte("created_at", fromISO)
    .lte("created_at", toISO);
  if (buildFilter) q2 = buildFilter(q2);
  const { data: rows, error: e2 } = await q2;
  if (e2) return map;
  (rows || []).forEach((r) => {
    const key = iso(r?.created_at);
    const cur = map.get(key) || { count: 0, sum: 0 };
    cur.count += 1;
    if (valueCol) cur.sum += Number(r?.[valueCol]) || 0;
    map.set(key, cur);
  });
  return map;
}

/** count + SUM(valueCol) untuk satu nilai keyCol (mis. satu panel). */
export async function countSumByKey(table, keyCol, valueCol, key, applyFilter) {
  const supabase = supabaseAdmin();
  let q = supabase.from(table).select(`count(),${valueCol}.sum()`).eq(keyCol, key);
  if (applyFilter) q = applyFilter(q);
  const { data, error } = await q;
  if (!error && Array.isArray(data) && data.length === 1) {
    const row = data[0];
    return {
      count: Number(row?.count || 0),
      sum: Number(row?.sum ?? row?.[valueCol] ?? 0) || 0,
    };
  }
  const [count, sum] = await Promise.all([
    countWhere(table, (qq) => {
      const x = qq.eq(keyCol, key);
      return applyFilter ? applyFilter(x) : x;
    }),
    sumWhere(table, valueCol, (qq) => {
      const x = qq.eq(keyCol, key);
      return applyFilter ? applyFilter(x) : x;
    }),
  ]);
  return { count, sum };
}
