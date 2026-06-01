const categoryMap = {
  image: {
    label: "이미지",
    subcategories: [
      ["ad-poster", "광고포스터"],
      ["person", "인물"],
      ["animal", "동물"],
      ["avatar", "아바타"],
      ["cosplay", "코스프레"],
      ["illustration", "일러스트"],
      ["infographic", "인포그래픽"],
      ["mockup", "목업"],
      ["daily", "일상"],
      ["wallpaper", "배경화면"],
      ["season", "시즌"],
      ["thumbnail", "썸네일"],
    ],
  },
  vba: {
    label: "VBA",
    subcategories: [
      ["excel", "엑셀"],
      ["powerpoint", "파워포인트"],
    ],
  },
  appscript: {
    label: "앱스스크립트",
    subcategories: [
      ["google-sheets", "구글시트"],
      ["google-forms", "구글폼"],
      ["google-docs", "구글독스"],
    ],
  },
  notebooklm: {
    label: "노트북LM",
    subcategories: [["slides", "슬라이드"]],
    links: {
      slides: "https://creodedulab.github.io/ntlm_design_prmpt/",
    },
  },
};

let galleryItems = [];
let activeMainCategory = "all";
let activeSubCategory = "all";
let selectedPrompt = "";
let selectedVariables = [];
let variableValues = {};

const mainCategoryTabs = document.querySelectorAll("[data-main-category]");
const subcategoryTabs = document.querySelector("#subcategoryTabs");
const galleryGrid = document.querySelector("#galleryGrid");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
const resultCount = document.querySelector("#resultCount");
const toast = document.querySelector("#toast");
const promptModal = document.querySelector("#promptModal");
const modalImage = document.querySelector("#modalImage");
const modalCategory = document.querySelector("#modalCategory");
const modalTitle = document.querySelector("#modalTitle");
const modalDescription = document.querySelector("#modalDescription");
const modalPrompt = document.querySelector("#modalPrompt");
const variablePanel = document.querySelector("#variablePanel");
const variableList = document.querySelector("#variableList");
const finalPrompt = document.querySelector("#finalPrompt");
const copyModalPrompt = document.querySelector("#copyModalPrompt");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function getCategoryLabel(mainCategory) {
  return categoryMap[mainCategory]?.label || "이미지";
}

function getSubCategoryLabel(mainCategory, subCategory) {
  const subcategories = categoryMap[mainCategory]?.subcategories || [];
  return subcategories.find(([key]) => key === subCategory)?.[1] || "기타";
}

function normalizeItem(item) {
  const mainCategory = item.mainCategory || item.category || "image";
  const subCategory = item.subCategory || item.category || "ad-poster";

  return {
    title: item.title || "제목 없음",
    mainCategory,
    mainCategoryLabel: item.mainCategoryLabel || getCategoryLabel(mainCategory),
    subCategory,
    subCategoryLabel: item.subCategoryLabel || getSubCategoryLabel(mainCategory, subCategory),
    tool: item.tool || "Prompt",
    size: item.size || "",
    image: item.image || "",
    link: item.link || "",
    description: item.description || "",
    prompt: item.prompt || "",
  };
}

async function loadGalleryItems() {
  try {
    const response = await fetch("data/prompts.json", { cache: "no-store" });
    if (!response.ok) throw new Error("data/prompts.json을 불러오지 못했습니다.");

    const items = await response.json();
    if (Array.isArray(items) && items.length > 0) {
      galleryItems = items.map(normalizeItem);
    }
  } catch {
    galleryItems = [];
  }

  renderSubcategoryTabs();
  renderGallery();
}

function extractVariables(prompt) {
  const matches = [...prompt.matchAll(/\{\{([^{}]+)\}\}|\[([^\[\]]+)\]|\{([^{}]+)\}/g)];
  const names = matches
    .map((match) => match[1] || match[2] || match[3])
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set(names)];
}

function replaceVariables(prompt, values) {
  return prompt.replace(/\{\{([^{}]+)\}\}|\[([^\[\]]+)\]|\{([^{}]+)\}/g, (match, doubleBrace, square, brace) => {
    const name = (doubleBrace || square || brace).trim();
    return values[name] || match;
  });
}

function renderSubcategoryTabs() {
  if (activeMainCategory === "all") {
    subcategoryTabs.innerHTML = "";
    return;
  }

  const category = categoryMap[activeMainCategory];
  const link = category?.links?.[activeSubCategory];

  subcategoryTabs.innerHTML = `
    <button class="subtab ${activeSubCategory === "all" ? "active" : ""}" type="button" data-sub-category="all">전체</button>
    ${(category?.subcategories || [])
      .map(
        ([key, label]) => `
          <button class="subtab ${activeSubCategory === key ? "active" : ""}" type="button" data-sub-category="${key}">
            ${label}
          </button>
        `,
      )
      .join("")}
    ${link ? `<a class="subtab-link" href="${link}" target="_blank" rel="noreferrer">슬라이드 페이지 열기</a>` : ""}
  `;
}

function renderGallery() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = galleryItems.filter((item) => {
    const matchesMain =
      activeMainCategory === "all" || item.mainCategory === activeMainCategory;
    const matchesSub =
      activeSubCategory === "all" || item.subCategory === activeSubCategory;
    const targetText = `${item.title} ${item.mainCategoryLabel} ${item.subCategoryLabel} ${item.description} ${item.prompt}`.toLowerCase();
    return matchesMain && matchesSub && targetText.includes(keyword);
  });

  galleryGrid.innerHTML = filtered
    .map(
      (item) => `
        <article class="gallery-card" tabindex="0" role="button" aria-label="${escapeHTML(item.title)} 프롬프트 보기" data-title="${escapeHTML(item.title)}">
          <div class="image-frame ${escapeHTML(item.size)}">
            ${
              item.image
                ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)} 결과물" loading="lazy" />`
                : `<span class="placeholder">${escapeHTML(item.subCategoryLabel)}</span>`
            }
          </div>
        </article>
      `,
    )
    .join("");

  resultCount.textContent = `${filtered.length}개의 예시`;
  emptyState.hidden = filtered.length > 0;
}

function openPromptModal(item) {
  selectedPrompt = item.prompt;
  selectedVariables = extractVariables(item.prompt);
  variableValues = {};
  modalCategory.textContent = `${item.mainCategoryLabel} / ${item.subCategoryLabel}`;
  modalTitle.textContent = item.title;
  modalDescription.textContent = item.description;
  modalPrompt.textContent = item.prompt;
  modalImage.innerHTML = item.image
    ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)} 결과물" />`
    : `<span class="placeholder">${escapeHTML(item.subCategoryLabel)}</span>`;
  renderVariableInputs();
  updateFinalPrompt();

  promptModal.classList.add("open");
  promptModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  copyModalPrompt.focus();
}

function closePromptModal() {
  promptModal.classList.remove("open");
  promptModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function renderVariableInputs() {
  variablePanel.hidden = selectedVariables.length === 0;

  if (selectedVariables.length === 0) {
    variableList.innerHTML = "";
    return;
  }

  variableList.innerHTML = selectedVariables
    .map(
      (name) => `
        <div class="variable-field">
          <label for="variable-${escapeHTML(name)}">${escapeHTML(name)}</label>
          <input id="variable-${escapeHTML(name)}" type="text" data-variable="${escapeHTML(name)}" placeholder="${escapeHTML(name)} 입력" />
        </div>
      `,
    )
    .join("");
}

function updateFinalPrompt() {
  finalPrompt.textContent = replaceVariables(selectedPrompt, variableValues);
}

function showToast() {
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

async function copyPrompt(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

mainCategoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    mainCategoryTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeMainCategory = tab.dataset.mainCategory;
    activeSubCategory = "all";
    renderSubcategoryTabs();
    renderGallery();
  });
});

subcategoryTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-sub-category]");
  if (!tab) return;

  activeSubCategory = tab.dataset.subCategory;
  renderSubcategoryTabs();
  renderGallery();
});

searchInput.addEventListener("input", renderGallery);

galleryGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".gallery-card");
  if (!card) return;

  const item = galleryItems.find((galleryItem) => galleryItem.title === card.dataset.title);
  if (item) openPromptModal(item);
});

galleryGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".gallery-card");
  if (!card) return;

  event.preventDefault();
  const item = galleryItems.find((galleryItem) => galleryItem.title === card.dataset.title);
  if (item) openPromptModal(item);
});

promptModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) {
    closePromptModal();
  }
});

variableList.addEventListener("input", (event) => {
  if (!event.target.matches("[data-variable]")) return;

  variableValues[event.target.dataset.variable] = event.target.value.trim();
  updateFinalPrompt();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && promptModal.classList.contains("open")) {
    closePromptModal();
  }
});

copyModalPrompt.addEventListener("click", async () => {
  await copyPrompt(finalPrompt.textContent);
  showToast();
});

renderSubcategoryTabs();
renderGallery();
loadGalleryItems();
