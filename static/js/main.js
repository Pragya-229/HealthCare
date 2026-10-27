/* main.js - Runs last: restores the theme and the saved session. */

/* ---------- start ---------- */
try {
  theme(
    localStorage.getItem("cdtheme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
} catch (e) {
  theme("light");
}
mode(false);
try {
  const s = JSON.parse(sessionStorage.getItem("cd"));
  if (s && s.a) {
    Object.assign(S, { access: s.a, refresh: s.r, user: s.u });
    enter();
  }
} catch (e) {}
