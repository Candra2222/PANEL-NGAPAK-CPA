const CF_API = "https://api.cloudflare.com/client/v4";
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_API_TOKEN;
const SCRIPT_NAME = "panel-ngapak-cpa";

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function cfFetch(path, opts = {}) {
  const res = await fetch(`${CF_API}${path}`, {
    ...opts,
    headers: { ...headers(), ...opts.headers },
  });
  const json = await res.json().catch(() => null);
  if (!json || !json.success) {
    const msg = json?.errors?.map((e) => e.message).join(", ") || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json.result;
}

export async function getZoneId(domain) {
  const result = await cfFetch(`/zones?name=${encodeURIComponent(domain)}`);
  if (!result.length) throw new Error(`Zone tidak ditemukan untuk ${domain}. Pastikan domain sudah ada di Cloudflare.`);
  return result[0].id;
}

export async function addCustomDomain(domain, zoneId) {
  const result = await cfFetch(`/accounts/${ACCOUNT_ID}/workers/domains`, {
    method: "PUT",
    body: JSON.stringify({
      hostname: domain,
      service: SCRIPT_NAME,
      zone_id: zoneId,
      environment: "production",
    }),
  });
  return { cf_domain_id: result.id, zone_id: result.zone_id };
}

export async function removeCustomDomain(cfDomainId) {
  await cfFetch(`/accounts/${ACCOUNT_ID}/workers/domains/${cfDomainId}`, {
    method: "DELETE",
  });
}

export async function addRoute(domain, zoneId) {
  try {
    const result = await cfFetch(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}/routes`, {
      method: "POST",
      body: JSON.stringify({
        pattern: `*.${domain}/*`,
        zone_id: zoneId,
      }),
    });
    return { cf_route_id: result.id };
  } catch {
    return { cf_route_id: null, note: "Route ditambahkan via wrangler.jsonc" };
  }
}

export async function removeRoute(cfRouteId) {
  if (!cfRouteId) return;
  try {
    await cfFetch(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}/routes/${cfRouteId}`, {
      method: "DELETE",
    });
  } catch {}
}

export async function listCustomDomains() {
  const result = await cfFetch(`/accounts/${ACCOUNT_ID}/workers/domains`);
  return result.filter((d) => d.service === SCRIPT_NAME);
}

export async function listRoutes() {
  try {
    const result = await cfFetch(`/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}/routes`);
    return result;
  } catch {
    return [];
  }
}
