/* auth.js - Sign in, sign up and sign out. */

/* ---------- auth ---------- */
function mode(su) {
  signup = su;
  $("nameWrap").classList.toggle("hidden", !su);
  $("meter").classList.toggle("hidden", !su);
  $("meterTxt").classList.toggle("hidden", !su);
  $("aTitle").textContent = su ? "Create your account" : "Welcome back";
  $("aSub").textContent = su
    ? "It takes about ten seconds."
    : "Sign in with your email to continue.";
  $("aBtn").textContent = su ? "Create account" : "Sign in";
  $("aSwitch").innerHTML = su
    ? 'Already registered? <button type="button" id="sw">Sign in</button>'
    : 'New here? <button type="button" id="sw">Create an account</button>';
  $("sw").onclick = () => mode(!signup);
  fieldErrors($("authForm"), null);
}
$("showPw").onclick = () => {
  const p = $("aPass"),
    h = p.type === "password";
  p.type = h ? "text" : "password";
  $("showPw").textContent = h ? "Hide" : "Show";
};
$("aPass").oninput = () => {
  const v = $("aPass").value;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  const m = $("meter").firstElementChild;
  m.style.width = (v ? s * 25 : 0) + "%";
  m.style.background = ["#b3261e", "#b3261e", "#e0a100", "#2b9a66", "#2b9a66"][s];
  $("meterTxt").textContent = v ? ["Too short", "Weak", "Okay", "Good", "Strong"][s] : "";
};
$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target,
    b = Object.fromEntries(new FormData(f));
  fieldErrors(f, null);
  if (signup && !b.name.trim()) return fieldErrors(f, { name: "Please enter your name." });
  if (!b.email || !b.password)
    return fieldErrors(f, { password: "Email and password are both needed." });
  $("aBtn").disabled = true;
  try {
    const d = await api(
      signup ? "/auth/register/" : "/auth/login/",
      "POST",
      signup ? b : { email: b.email, password: b.password },
    );
    Object.assign(S, { access: d.access, refresh: d.refresh, user: d.user });
    save();
    enter();
    toast(signup ? "Account created. Welcome, " + d.user.name + "." : "Signed in.");
  } catch (err) {
    fieldErrors(f, err);
  } finally {
    $("aBtn").disabled = false;
  }
});
function logout() {
  sessionStorage.removeItem("cd");
  Object.assign(S, { access: null, refresh: null, user: null, P: [], D: [], M: [] });
  $("app").classList.add("hidden");
  $("auth").classList.remove("hidden");
  $("aPass").value = "";
  closeDrawer();
}
$("logout").onclick = logout;

async function enter() {
  $("auth").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("meName").textContent = S.user.name;
  $("meMail").textContent = S.user.email;
  const h = new Date().getHours();
  $("greet").textContent =
    (h < 12 ? "Good morning, " : h < 17 ? "Good afternoon, " : "Good evening, ") +
    S.user.name.split(" ")[0];
  tab(location.hash.slice(1) || "overview");
  await load();
}
