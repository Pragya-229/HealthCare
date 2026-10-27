/* api.js - Talks to the Django API. Adds the JWT and refreshes it once if it expired. */

async function api(path, method = "GET", body, retry = true) {
  const o = { method, headers: { "Content-Type": "application/json" } };
  if (S.access) o.headers.Authorization = "Bearer " + S.access;
  if (body) o.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch("/api" + path, o);
  } catch (e) {
    throw { detail: "Can't reach the server. Is it running?" };
  }
  if (res.status === 401 && retry && S.refresh) {
    const r = await fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: S.refresh }),
    });
    if (r.ok) {
      S.access = (await r.json()).access;
      save();
      return api(path, method, body, false);
    }
    logout();
    throw { detail: "Your session ran out. Please sign in again." };
  }
  if (res.status === 204) return null;
  const d = await res.json().catch(() => null);
  if (!res.ok) throw d;
  return d;
}
const save = () =>
  sessionStorage.setItem("cd", JSON.stringify({ a: S.access, r: S.refresh, u: S.user }));
