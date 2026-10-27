/* views.js - Tabs, theme and the lists on each page (overview, patients, doctors, assignments). */

/* ---------- tabs, theme ---------- */
function tab(n) {
  if (!["overview", "patients", "doctors", "mappings"].includes(n)) n = "overview";
  S.tab = n;
  history.replaceState(null, "", "#" + n);
  document.querySelectorAll(".nav").forEach((b) => b.classList.toggle("on", b.dataset.tab === n));
  ["overview", "patients", "doctors", "mappings"].forEach((t) =>
    $("t-" + t).classList.toggle("hidden", t !== n),
  );
}
document.querySelectorAll(".nav").forEach((b) => (b.onclick = () => tab(b.dataset.tab)));
function theme(t) {
  document.documentElement.dataset.theme = t;
  $("themeBtn").textContent = t === "dark" ? "Light mode" : "Dark mode";
  try {
    localStorage.setItem("cdtheme", t);
  } catch (e) {}
}
$("themeBtn").onclick = () =>
  theme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    const q = { patients: "qP", doctors: "qD" }[S.tab];
    if (q) {
      e.preventDefault();
      $(q).focus();
    }
  }
  if (e.key === "Escape") closeDrawer();
});

/* ---------- data ---------- */
async function load() {
  ["listP", "listD", "listM", "waiting", "recent"].forEach(
    (i) => ($(i).innerHTML = '<div class="sk"></div><div class="sk"></div>'),
  );
  try {
    [S.P, S.D, S.M] = await Promise.all([api("/patients/"), api("/doctors/"), api("/mappings/")]);
    render();
  } catch (e) {
    toast(errText(e), true);
  }
}
const docsOf = (pid) => S.M.filter((m) => m.patient === pid);
function render() {
  $("cP").textContent = S.P.length;
  $("cD").textContent = S.D.length;
  $("cM").textContent = S.M.length;
  overview();
  patients();
  doctors();
  mappings();
  if (S.open) drawer();
}
const empty = (msg, btn, act) =>
  `<div class="empty">${msg}${btn ? `<br><button class="btn" data-act="${act}">${btn}</button>` : ""}</div>`;

function overview() {
  const waiting = S.P.filter((p) => !docsOf(p.id).length);
  $("stats").innerHTML =
    [
      ["Patients", S.P.length, "patients"],
      ["Doctors", S.D.length, "doctors"],
      ["Assignments", S.M.length, "mappings"],
    ]
      .map(
        ([l, n, t]) =>
          `<button class="stat" data-act="tab" data-id="${t}"><b>${n}</b><span>${l}</span></button>`,
      )
      .join("") +
    `<button class="stat ${waiting.length ? "alert" : ""}" data-act="tab" data-id="patients"><b>${waiting.length}</b><span>Without a doctor</span></button>`;
  $("waiting").innerHTML = waiting.length
    ? waiting
        .slice(0, 4)
        .map(
          (p) =>
            `<div class="row" data-act="open" data-id="${p.id}">${av(p.name)}<div><h4>${esc(p.name)}</h4><div class="meta">${p.age} yrs, ${GENDER[p.gender]}</div></div><span class="btn sm">Assign doctor</span></div>`,
        )
        .join("")
    : empty(
        S.P.length ? "Everyone has a doctor. Nice." : "No patients yet.",
        S.P.length ? "" : "Add your first patient",
        "newP",
      );
  $("recent").innerHTML = S.P.length
    ? S.P.slice(0, 3)
        .map((p) => patientRow(p))
        .join("")
    : empty("Patients you add will show up here.");
}

function patientRow(p) {
  const d = docsOf(p.id);
  return `<div class="row" data-act="open" data-id="${p.id}">${av(p.name)}<div><h4>${esc(p.name)}</h4>
    <div class="meta">${p.age} yrs, ${GENDER[p.gender]}${p.phone ? ", " + esc(p.phone) : ""}</div>
    <div>${d.length ? d.map((m) => `<span class="chip">Dr. ${esc(m.doctor_name)}</span>`).join("") : '<span class="chip warn">No doctor yet</span>'}</div></div>
    <div class="acts"><button class="btn ghost sm" data-act="editP" data-id="${p.id}">Edit</button><button class="btn danger sm" data-act="delP" data-id="${p.id}">Delete</button></div></div>`;
}

function patients() {
  const q = $("qP").value.toLowerCase();
  $("fP").innerHTML = [
    ["all", "All"],
    ["none", "Without a doctor"],
    ["has", "With a doctor"],
  ]
    .map(
      ([k, l]) =>
        `<button class="${S.pFilter === k ? "on" : ""}" data-act="pf" data-id="${k}">${l}</button>`,
    )
    .join("");
  let l = S.P.filter((p) => (p.name + " " + p.phone).toLowerCase().includes(q));
  if (S.pFilter === "none") l = l.filter((p) => !docsOf(p.id).length);
  if (S.pFilter === "has") l = l.filter((p) => docsOf(p.id).length);
  const s = $("sortP").value;
  if (s === "name") l.sort((a, b) => a.name.localeCompare(b.name));
  if (s === "age") l.sort((a, b) => b.age - a.age);
  $("listP").innerHTML = l.length
    ? l.map(patientRow).join("")
    : S.P.length
      ? empty("Nothing matches. Try clearing the search or filter.")
      : empty("You haven't added any patients yet.", "Add your first patient", "newP");
}
$("qP").oninput = patients;
$("sortP").onchange = patients;

function doctors() {
  const q = $("qD").value.toLowerCase(),
    specs = [...new Set(S.D.map((d) => d.specialization))].sort();
  $("fD").innerHTML = specs.length
    ? ['<button class="' + (S.spec ? "" : "on") + '" data-act="sf" data-id="">All</button>']
        .concat(
          specs.map(
            (s) =>
              `<button class="${S.spec === s ? "on" : ""}" data-act="sf" data-id="${esc(s)}">${esc(s)}</button>`,
          ),
        )
        .join("")
    : "";
  const l = S.D.filter(
    (d) =>
      (!S.spec || d.specialization === S.spec) &&
      (d.name + " " + d.specialization).toLowerCase().includes(q),
  );
  $("listD").innerHTML = l.length
    ? l
        .map((d) => {
          const n = S.M.filter((m) => m.doctor === d.id).length;
          return `<div class="row">${av(d.name)}<div><h4>Dr. ${esc(d.name)}</h4><div class="meta">${esc(d.specialization)}, ${d.experience_years} yrs experience</div>
    <div class="meta">${esc(d.email)}${d.phone ? ", " + esc(d.phone) : ""}</div><span class="chip">${n} of your patients</span></div>
    <div class="acts"><button class="btn ghost sm" data-act="editD" data-id="${d.id}">Edit</button><button class="btn danger sm" data-act="delD" data-id="${d.id}">Delete</button></div></div>`;
        })
        .join("")
    : S.D.length
      ? empty("No doctor matches that.")
      : empty("No doctors in the system yet.", "Add a doctor", "newD");
}
$("qD").oninput = doctors;

function mappings() {
  $("mP").innerHTML = S.P.length
    ? S.P.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")
    : '<option value="">Add a patient first</option>';
  $("mD").innerHTML = S.D.length
    ? S.D.map(
        (d) => `<option value="${d.id}">Dr. ${esc(d.name)} (${esc(d.specialization)})</option>`,
      ).join("")
    : '<option value="">Add a doctor first</option>';
  $("listM").innerHTML = S.M.length
    ? S.M.map(
        (
          m,
        ) => `<div class="row">${av(m.patient_name)}<div><h4>${esc(m.patient_name)} <span class="meta">is seeing</span> Dr. ${esc(m.doctor_name)}</h4>
    <div class="meta">${esc(m.doctor_specialization)}, assigned ${new Date(m.assigned_at).toLocaleDateString()}</div></div>
    <div class="acts"><button class="btn danger sm" data-act="delM" data-id="${m.id}">Remove</button></div></div>`,
      ).join("")
    : empty("Nobody is assigned to a doctor yet.");
}
$("assignForm").addEventListener("submit", (e) => {
  e.preventDefault();
  assign($("mP").value, $("mD").value);
});
async function assign(p, d) {
  if (!p || !d) return toast("You need at least one patient and one doctor.", true);
  try {
    await api("/mappings/", "POST", { patient: +p, doctor: +d });
    toast("Doctor assigned.");
    await load();
  } catch (e) {
    toast(errText(e), true);
  }
}
