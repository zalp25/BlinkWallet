import { state } from "../state.js";

export function initHistory() {
  renderHistory();
}

export function addHistory(text) {
  state.history.unshift({
    time: new Date().toLocaleString(),
    text
  });
  renderHistory();
}

function renderHistory() {
  const ul = document.getElementById("history-list");
  ul.innerHTML = "";

  state.history.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `[${h.time}] ${h.text}`;
    ul.appendChild(li);
  });
}
