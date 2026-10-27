/* drawer.js - The side panel that opens when you click a patient. */

/* ---------- patient drawer ---------- */
function drawer() {
  const p = S.P.find((x) => x.id === S.open);
  if (!p) return closeDrawer();
  const ms = docsOf(p.id),
    have = ms.map((m) => m.doctor),
    free = S.D.filter((d) => !have.includes(d.id));
  $("drawer").innerHTML =
    `<div class="top">${av(p.name)}<div><h3 style="margin:0">${esc(p.name)}</h3><div class="meta">${p.age} yrs, ${GENDER[p.gender]}</div></div>
    <button class="btn ghost sm" style="margin-left:auto" data-act="closeDrawer">Close</button></div>
    <dl><dt>Phone</dt><dd>${esc(p.phone) || "Not added"}</dd><dt>Address</dt><dd>${esc(p.address) || "Not added"}</dd><dt>Medical history</dt><dd>${esc(p.medical_history) || "Nothing noted"}</dd>
    <dt>Added</dt><dd>${new Date(p.created_at).toLocaleDateString()}</dd></dl>
    <div class="acts" style="margin-bottom:18px"><button class="btn ghost sm" data-act="editP" data-id="${p.id}">Edit details</button></div>
    <h4 style="margin:0 0 10px">Doctors (${ms.length})</h4>
    ${ms.length ? ms.map((m) => `<div class="drow"><div><b>Dr. ${esc(m.doctor_name)}</b><div class="meta">${esc(m.doctor_specialization)}</div></div><button class="btn danger sm" data-act="delM" data-id="${m.id}">Remove</button></div>`).join("") : '<div class="meta">No doctor assigned yet.</div>'}
    ${
      free.length
        ? `<div class="addrow"><select id="dwSel">${free.map((d) => `<option value="${d.id}">Dr. ${esc(d.name)} (${esc(d.specialization)})</option>`).join("")}</select><button class="btn" data-act="dwAdd" data-id="${p.id}">Assign</button></div>`
        : '<div class="meta" style="margin-top:10px">' +
          (S.D.length ? "All doctors are already assigned." : "Add a doctor first to assign one.") +
          "</div>"
    }`;
}
function openDrawer(id) {
  S.open = id;
  drawer();
  $("drawer").classList.add("open");
  $("scrim").classList.add("show");
}
function closeDrawer() {
  S.open = null;
  $("drawer").classList.remove("open");
  $("scrim").classList.remove("show");
}
