import { state } from "../state.js";

export function initHistory() {
  renderHistory();
}

export function addHistory(text) {
  state.history.unshift({ time: Date.now(), text });
  renderHistory();
}

function renderHistory() {
  const ul = document.getElementById("history-list");
  ul.innerHTML = "";

  if (!state.history.length) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No history yet";
    ul.appendChild(empty);
    return;
  }

  state.history.forEach(h => {
    const li = document.createElement("li");
    li.className = "history-card";

    const time = document.createElement("div");
    time.className = "history-time";
    time.textContent = formatHistoryTime(h.time);

    const text = document.createElement("div");
    text.className = "history-text";
    text.textContent = h.text;

    li.append(time, text);
    ul.appendChild(li);
  });
}

function formatHistoryTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
