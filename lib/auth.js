const KEYS = {
  admin: "cpa_auth_admin",
  panel: "cpa_auth_panel",
  monitor: "cpa_auth_monitor",
};

const ENDPOINTS = {
  admin: "/api/admin/auth",
  panel: "/api/panel/auth",
  monitor: "/api/monitor/auth",
};

export function isAuthed(panel) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEYS[panel]) === "1";
  } catch {
    return false;
  }
}

export function setAuthed(panel, extra) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEYS[panel], "1");
    if (extra) window.localStorage.setItem(KEYS[panel] + "_data", JSON.stringify(extra));
  } catch {}
}

export function getAuthedData(panel) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEYS[panel] + "_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth(panel) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEYS[panel]);
    window.localStorage.removeItem(KEYS[panel] + "_data");
  } catch {}
}

/** Login nyata: POST password ke server, session disimpan di httpOnly cookie. */
export async function login(panel, password) {
  const res = await fetch(ENDPOINTS[panel], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login gagal.");
  setAuthed(panel, data.session || {});
  return data.session || {};
}

/** Verifikasi session cookie ke server. */
export async function checkSession(panel) {
  try {
    const res = await fetch(ENDPOINTS[panel], { method: "GET" });
    if (!res.ok) {
      clearAuth(panel);
      return null;
    }
    const data = await res.json();
    setAuthed(panel, data.session || {});
    return data.session || null;
  } catch {
    clearAuth(panel);
    return null;
  }
}

/** Logout: hapus cookie server + state lokal, redirect ke halaman login. */
export async function logout(panel) {
  try {
    await fetch(ENDPOINTS[panel], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
  } catch {}
  clearAuth(panel);
  if (typeof window !== "undefined") {
    window.location.assign(window.location.origin + "/" + panel + "/login");
  }
}
