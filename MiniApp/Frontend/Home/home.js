import { state, sortByPriority } from "../state.js";

export function initHome() {
  renderHome();
}

export function renderHome() {
  document.getElementById("username").textContent = state.username ?? "";

  const ul = document.getElementById("prices");
  ul.innerHTML = "";

  const currencies = sortByPriority(Object.keys(state.rates));

  for (const k of currencies) {
    const li = document.createElement("li");
    li.textContent = `${k}: $${state.rates[k]}`;
    ul.appendChild(li);
  }
}
