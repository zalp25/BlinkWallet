import { state, saveState } from "../state.js";
import { saveRemoteUser, updateUserPassword, updateUserTag } from "../api.js";
import { renderHome } from "../Home/home.js";
import { renderAssets } from "../Assets/assets.js";

export function initSettings() {
  const nameInput = document.getElementById("settings-name");
  const nameSaveBtn = document.getElementById("settings-save-name");
  const nameError = document.getElementById("settings-name-error");

  const tagInput = document.getElementById("settings-tag");
  const tagSaveBtn = document.getElementById("settings-save-tag");
  const tagError = document.getElementById("settings-tag-error");

  const passwordInput = document.getElementById("settings-password");
  const passwordSaveBtn = document.getElementById("settings-save-password");
  const passwordError = document.getElementById("settings-password-error");

  if (!nameInput || !nameSaveBtn) return;

  nameInput.value = state.username ?? "";
  if (nameError) nameError.textContent = "";
  nameInput.classList.remove("input-error");

  const setError = (target, input, message) => {
    if (target) {
      target.textContent = message;
      target.classList.add("settings-error-text");
      target.classList.remove("settings-success-text");
    }
    if (input) input.classList.add("input-error");
  };

  const clearError = (target, input) => {
    if (target) {
      target.textContent = "";
      target.classList.remove("settings-error-text");
    }
    if (input) input.classList.remove("input-error");
  };

  const showSuccess = (target, input, message) => {
    if (target) {
      target.textContent = message;
      target.classList.add("settings-success-text");
      target.classList.remove("settings-error-text");
    }
    if (input) input.classList.add("input-success");
  };

  const clearSuccess = (target, input) => {
    if (target) target.classList.remove("settings-success-text");
    if (input) input.classList.remove("input-success");
  };

  const applyName = () => {
    if (!state.loggedIn || !state.userId) {
      setError(nameError, nameInput, "Login required");
      return;
    }
    const next = nameInput.value.trim();
    if (!next) return;
    if (next.length > 12) {
      setError(nameError, nameInput, "Name must be 12 characters or less");
      clearSuccess(nameError, nameInput);
      return;
    }
    clearError(nameError, nameInput);
    clearSuccess(nameError, nameInput);
    state.username = next;
    saveState();
    showSuccess(nameError, nameInput, "Nickname updated successfully!");
    renderHome();
    renderAssets();
    saveRemoteUser(state.userId, next);
  };

  const applyTag = async () => {
    if (!state.loggedIn || !state.userId) {
      setError(tagError, tagInput, "Login required");
      return;
    }
    const raw = (tagInput?.value ?? "").trim().toLowerCase();
    if (!raw) return;
    const valid = /^[a-z0-9_.-]{3,12}$/.test(raw);
    if (!valid) {
      setError(tagError, tagInput, "Tag must be 3-12 chars (a-z, 0-9, _ . -)");
      clearSuccess(tagError, tagInput);
      return;
    }
    clearError(tagError, tagInput);
    clearSuccess(tagError, tagInput);
    const { ok, data } = await updateUserTag(state.userId, raw);
    if (!ok) {
      setError(tagError, tagInput, data?.error ?? "Tag update failed");
      return;
    }
    state.userTag = raw;
    showSuccess(tagError, tagInput, "Tag updated successfully!");
  };

  const applyPassword = async () => {
    if (!state.loggedIn || !state.userId) {
      setError(passwordError, passwordInput, "Login required");
      return;
    }
    const pwd = (passwordInput?.value ?? "").trim();
    if (pwd.length < 6) {
      setError(passwordError, passwordInput, "Password must be 6+ chars");
      clearSuccess(passwordError, passwordInput);
      return;
    }
    clearError(passwordError, passwordInput);
    clearSuccess(passwordError, passwordInput);
    const { ok, data } = await updateUserPassword(state.userId, pwd);
    if (!ok) {
      setError(passwordError, passwordInput, data?.error ?? "Password update failed");
      return;
    }
    showSuccess(passwordError, passwordInput, "Password updated successfully!");
    passwordInput.value = "";
  };

  nameSaveBtn.onclick = applyName;
  nameInput.oninput = () => {
    if (nameInput.value.trim().length <= 12) clearError(nameError, nameInput);
    clearSuccess(nameError, nameInput);
  };

  if (tagSaveBtn && tagInput) {
    tagInput.oninput = () => {
      tagInput.value = tagInput.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      clearError(tagError, tagInput);
      clearSuccess(tagError, tagInput);
    };
    tagSaveBtn.onclick = applyTag;
  }

  if (passwordSaveBtn && passwordInput) {
    passwordInput.oninput = () => {
      clearError(passwordError, passwordInput);
      clearSuccess(passwordError, passwordInput);
    };
    passwordSaveBtn.onclick = applyPassword;
  }
}
