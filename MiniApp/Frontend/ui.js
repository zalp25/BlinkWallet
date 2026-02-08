export function showNav() {
  const nav = document.getElementById("bottom-nav");
  if (!nav) return;

  nav.style.display = "";
  nav.classList.remove("hidden");
}

export function hideNav() {
  const nav = document.getElementById("bottom-nav");
  if (!nav) return;

  nav.classList.add("hidden");
  nav.style.display = "none";
}

export function showBackBtn() {
  const btn = document.getElementById("back-btn");
  if (!btn) return;

  btn.style.display = "";
  btn.classList.remove("hidden");
}

export function hideBackBtn() {
  const btn = document.getElementById("back-btn");
  if (!btn) return;

  btn.classList.add("hidden");
  btn.style.display = "none";
}

export function showTotalValue() {
  document.querySelector(".assets-summary")?.classList.remove("hidden");
}

export function hideTotalValue() {
  document.querySelector(".assets-summary")?.classList.add("hidden");
}
