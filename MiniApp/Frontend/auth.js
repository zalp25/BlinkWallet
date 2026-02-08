import { state } from "./state.js";
import { loadRemoteBalances, loginUser, registerUser } from "./api.js";
import { renderHome } from "./Home/home.js";
import { renderAssets } from "./Assets/assets.js";
import { showNav, hideNav, showTotalValue, hideTotalValue } from "./ui.js";

const TAG_PATTERN = /^[a-z0-9_.-]{3,12}$/;

export function initAuth() {
  const panel = document.getElementById("panel-auth");
  if (!panel) return;

  const loginTab = document.getElementById("auth-tab-login");
  const registerTab = document.getElementById("auth-tab-register");
  const loginForm = document.getElementById("auth-login");
  const registerForm = document.getElementById("auth-register");
  const loginError = document.getElementById("auth-login-error");
  const registerError = document.getElementById("auth-register-error");

  const loginTag = document.getElementById("login-tag");
  const loginPassword = document.getElementById("login-password");
  const registerName = document.getElementById("register-name");
  const registerTag = document.getElementById("register-tag");
  const registerPassword = document.getElementById("register-password");

  const toggleTab = isLogin => {
    loginTab.classList.toggle("active", isLogin);
    registerTab.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    clearErrors();
  };

  const clearErrors = () => {
    if (loginError) loginError.textContent = "";
    if (registerError) registerError.textContent = "";
    [loginTag, loginPassword, registerName, registerTag, registerPassword]
      .filter(Boolean)
      .forEach(input => input.classList.remove("input-error"));
  };

  const normalizeTag = input => {
    const next = input.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (next !== input.value) input.value = next;
  };

  loginTab.onclick = () => toggleTab(true);
  registerTab.onclick = () => toggleTab(false);

  loginTag.oninput = () => normalizeTag(loginTag);
  registerTag.oninput = () => normalizeTag(registerTag);

  loginForm.onsubmit = async e => {
    e.preventDefault();
    clearErrors();

    const tag = loginTag.value.trim().toLowerCase();
    const password = loginPassword.value.trim();
    if (!TAG_PATTERN.test(tag)) {
      setError(loginError, loginTag, "Invalid tag");
      return;
    }
    if (!password) {
      setError(loginError, loginPassword, "Password required");
      return;
    }

    const { ok, data } = await loginUser({ tag, password });
    if (!ok) {
      setError(loginError, loginPassword, data?.error ?? "Login failed");
      return;
    }

    await applyAuth(data);
  };

  registerForm.onsubmit = async e => {
    e.preventDefault();
    clearErrors();

    const name = registerName.value.trim();
    const tag = registerTag.value.trim().toLowerCase();
    const password = registerPassword.value.trim();

    if (!name) {
      setError(registerError, registerName, "Name required");
      return;
    }
    if (!TAG_PATTERN.test(tag)) {
      setError(registerError, registerTag, "Tag must be 3-12 chars (a-z, 0-9, _ . -)");
      return;
    }
    if (password.length < 6) {
      setError(registerError, registerPassword, "Password must be 6+ chars");
      return;
    }

    const { ok, data } = await registerUser({ name, tag, password });
    if (!ok) {
      setError(registerError, registerTag, data?.error ?? "Registration failed");
      return;
    }

    await applyAuth(data);
  };

  toggleTab(true);
}

export function requireAuth() {
  const panel = document.getElementById("panel-auth");
  if (!panel) return;

  panel.classList.remove("hidden");
  hideNav();
  hideTotalValue();
  document.body.classList.add("auth-open");
}

async function applyAuth(data) {
  state.loggedIn = true;
  state.userId = data?.user_id ?? null;
  state.username = data?.name ?? "";
  state.userTag = data?.tag ?? "";

  const balances = await loadRemoteBalances(state.userId);
  if (balances) state.balances = balances;

  document.getElementById("panel-auth")?.classList.add("hidden");
  document.body.classList.remove("auth-open");
  const nameInput = document.getElementById("settings-name");
  if (nameInput) nameInput.value = state.username;
  const tagInput = document.getElementById("settings-tag");
  if (tagInput) tagInput.value = state.userTag;
  showNav();
  showTotalValue();
  renderHome();
  renderAssets();
}

function setError(target, input, message) {
  if (target) target.textContent = message;
  if (input) input.classList.add("input-error");
}
