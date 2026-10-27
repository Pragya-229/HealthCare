/* actions.js - Add/edit dialogs, delete confirmations and the single click handler. */

/* ---------- dialogs ---------- */
function ask(title, msg, yes) {
  return new Promise((r) => {
    $("cTitle").textContent = title;
    $("cMsg").textContent = msg;
    $("cYes").textContent = yes;
    const d = $("cDlg");
    d.returnValue = "";
    d.onclose = () => r(d.returnValue === "yes");
    d.showModal();
  });
}
function fill(form, obj) {
  fieldErrors(form, null);
  for (const el of form.elements)
    if (el.name)
      el.value =
        obj && obj[el.name] != null
          ? obj[el.name]
          : el.tagName === "SELECT"
            ? el.options[0].value
            : "";
}
async function submit(form, dlg, path, id, okMsg) {
  const b = Object.fromEntries(new FormData(form));
  fieldErrors(form, null);
  try {
    await api(id ? `${path}${id}/` : path, id ? "PUT" : "POST", b);
    $(dlg).close();
    toast(okMsg);
    await load();
  } catch (e) {
    fieldErrors(form, e);
  }
}
$("pForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  if (!f.name.value.trim() || f.age.value === "")
    return fieldErrors(f, {
      name: f.name.value.trim() ? [] : "Name is required.",
      age: f.age.value === "" ? "Age is required." : [],
    });
  submit(
    f,
    "pDlg",
    "/patients/",
    S.editP && S.editP.id,
    S.editP ? "Patient updated." : "Patient added.",
  );
});
$("dForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  if (!f.name.value.trim() || !f.specialization.value.trim() || !f.email.value.trim())
    return fieldErrors(f, {
      name: f.name.value.trim() ? [] : "Required.",
      specialization: f.specialization.value.trim() ? [] : "Required.",
      email: f.email.value.trim() ? [] : "Required.",
    });
  if (f.experience_years.value === "") f.experience_years.value = 0;
  submit(
    f,
    "dDlg",
    "/doctors/",
    S.editD && S.editD.id,
    S.editD ? "Doctor updated." : "Doctor added.",
  );
});

/* ---------- one click handler for every button ---------- */
const A = {
  tab: (id) => tab(id),
  open: (id) => openDrawer(id),
  closeDrawer,
  closeDlg: (id, t) => $(t.dataset.id).close(),
  pf: (id) => {
    S.pFilter = id;
    patients();
  },
  sf: (id, t) => {
    S.spec = t.dataset.id;
    doctors();
  },
  newP: () => {
    S.editP = null;
    $("pTitle").textContent = "Add patient";
    fill($("pForm"), null);
    $("pDlg").showModal();
    $("pName").focus();
  },
  editP: (id) => {
    S.editP = S.P.find((p) => p.id === id);
    $("pTitle").textContent = "Edit patient";
    fill($("pForm"), S.editP);
    $("pDlg").showModal();
  },
  newD: () => {
    S.editD = null;
    $("dTitle").textContent = "Add doctor";
    fill($("dForm"), null);
    $("dDlg").showModal();
    $("dName").focus();
  },
  editD: (id) => {
    S.editD = S.D.find((d) => d.id === id);
    $("dTitle").textContent = "Edit doctor";
    fill($("dForm"), S.editD);
    $("dDlg").showModal();
  },
  dwAdd: (id) => assign(id, $("dwSel").value),
  delP: async (id) => {
    const p = S.P.find((x) => x.id === id);
    if (
      await ask(
        "Delete " + p.name + "?",
        "Their record and doctor assignments will be removed for good.",
        "Delete patient",
      )
    ) {
      try {
        await api(`/patients/${id}/`, "DELETE");
        if (S.open === id) closeDrawer();
        toast("Patient deleted.");
        await load();
      } catch (e) {
        toast(errText(e), true);
      }
    }
  },
  delD: async (id) => {
    const d = S.D.find((x) => x.id === id);
    if (
      await ask(
        "Delete Dr. " + d.name + "?",
        "Any assignments with this doctor will be removed too.",
        "Delete doctor",
      )
    ) {
      try {
        await api(`/doctors/${id}/`, "DELETE");
        toast("Doctor deleted.");
        await load();
      } catch (e) {
        toast(errText(e), true);
      }
    }
  },
  delM: async (id) => {
    try {
      await api(`/mappings/${id}/`, "DELETE");
      toast("Assignment removed.");
      await load();
    } catch (e) {
      toast(errText(e), true);
    }
  },
};
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]");
  if (!t) return;
  const id =
    t.dataset.id !== undefined && /^\d+$/.test(t.dataset.id) ? Number(t.dataset.id) : t.dataset.id;
  if (A[t.dataset.act]) A[t.dataset.act](id, t);
});
