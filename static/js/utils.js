/* utils.js - Shared state and small helpers used by every other script. */

const $ = (id) => document.getElementById(id);
const S = {
  access: null,
  refresh: null,
  user: null,
  P: [],
  D: [],
  M: [],
  editP: null,
  editD: null,
  open: null,
  spec: "",
  pFilter: "all",
  tab: "overview",
};
let signup = false;
const esc = (s) => {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
};
const initials = (n) =>
  n
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const hue = (n) => {
  let h = 0;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h},45%,40%)`;
};
const av = (n) => `<div class="av" style="background:${hue(n)}">${esc(initials(n))}</div>`;
const GENDER = { M: "Male", F: "Female", O: "Other" };

function toast(msg, err) {
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.textContent = msg;
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function errText(d) {
  if (!d) return "Something went wrong. Try again.";
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  return Object.keys(d)
    .map((k) => {
      const v = Array.isArray(d[k]) ? d[k].join(" ") : d[k];
      return k === "non_field_errors" ? v : k + ": " + v;
    })
    .join("  ");
}

/* field-level errors from the API land right under the matching input */
function fieldErrors(form, data) {
  form.querySelectorAll(".ferr").forEach((e) => e.remove());
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
  const g = form.querySelector(".gerr,#aErr");
  if (g) g.textContent = "";
  if (!data || typeof data !== "object" || data.detail) {
    if (g) g.textContent = errText(data);
    return;
  }
  for (const k in data) {
    const f = form.elements[k],
      msg = [].concat(data[k]).join(" ");
    if (f && k !== "non_field_errors") {
      f.setAttribute("aria-invalid", "true");
      const d = document.createElement("div");
      d.className = "ferr";
      d.textContent = msg;
      (f.closest(".pw") || f).after(d);
    } else if (g) g.textContent = msg;
  }
}
