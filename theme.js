const themeToggle = document.querySelector("#themeToggle");

function getStoredTheme() {
  try {
    return localStorage.getItem("promptbox-theme");
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem("promptbox-theme", theme);
  } catch {
    // Theme switching still works for the current page when storage is unavailable.
  }
}

function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = normalizedTheme;

  if (themeToggle) {
    const isDark = normalizedTheme === "dark";
    themeToggle.setAttribute("aria-label", isDark ? "라이트 테마로 변경" : "블랙 테마로 변경");
    themeToggle.setAttribute("title", "테마 변경");
  }
}

applyTheme(getStoredTheme() || "light");

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  storeTheme(nextTheme);
});
