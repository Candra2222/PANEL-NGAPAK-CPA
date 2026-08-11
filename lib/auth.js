const KEYS = {
  admin: "cpa_auth_admin",
  panel: "cpa_auth_panel",
  monitor: "cpa_auth_monitor",
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

export function logout(panel) {
  clearAuth(panel);
  if (typeof window !== "undefined") {
    window.location.assign(window.location.origin + "/" + panel + "/login");
  }
}
