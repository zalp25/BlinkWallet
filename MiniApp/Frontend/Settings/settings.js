import { state } from "../state.js";
import { renderHome } from "../Home/home.js";

export function initSettings() {
  const input = document.getElementById("settings-name");
  const saveBtn = document.getElementById("settings-save-name");
  const error = document.getElementById("settings-name-error");

  if (!input || !saveBtn) return;

  input.value = state.username ?? "";
  if (error) error.textContent = "";
  input.classList.remove("input-error");

  const setError = message => {
    if (error) error.textContent = message;
    input.classList.add("input-error");
  };

  const clearError = () => {
    if (error) error.textContent = "";
    input.classList.remove("input-error");
  };

  const applyName = () => {
    const next = input.value.trim();
    if (!next) return;
    if (next.length > 12) {
      setError("Name must be 12 characters or less");
      return;
    }
    clearError();
    state.username = next;
    renderHome();
  };

  saveBtn.onclick = applyName;
  input.oninput = () => {
    if (input.value.trim().length <= 12) clearError();
  };
}
