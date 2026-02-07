import { state, saveState } from "../state.js";
import { renderHome } from "../Home/home.js";
import { renderAssets } from "../Assets/assets.js";

export function initSettings() {
  const input = document.getElementById("settings-name");
  const saveBtn = document.getElementById("settings-save-name");
  const error = document.getElementById("settings-name-error");
  if (!input || !saveBtn) return;

  input.value = state.username ?? "";
  if (error) error.textContent = "";
  input.classList.remove("input-error");

  const setError = message => {
    if (error) {
      error.textContent = message;
      error.classList.add("settings-error-text");
      error.classList.remove("settings-success-text");
    }
    input.classList.add("input-error");
  };

  const clearError = () => {
    if (error) {
      error.textContent = "";
      error.classList.remove("settings-error-text");
    }
    input.classList.remove("input-error");
  };

  const showSuccess = message => {
    if (error) {
      error.textContent = message;
      error.classList.add("settings-success-text");
      error.classList.remove("settings-error-text");
    }
    input.classList.add("input-success");
  };

  const clearSuccess = () => {
    if (error) error.classList.remove("settings-success-text");
    input.classList.remove("input-success");
  };

  const applyName = () => {
    const next = input.value.trim();
    if (!next) return;
    if (next.length > 12) {
      setError("Name must be 12 characters or less");
      clearSuccess();
      return;
    }
    clearError();
    clearSuccess();
    state.username = next;
    saveState();
    showSuccess("Nickname updated successfully!");
    renderHome();
  };

  saveBtn.onclick = applyName;
  input.oninput = () => {
    if (input.value.trim().length <= 12) clearError();
    clearSuccess();
  };

}
