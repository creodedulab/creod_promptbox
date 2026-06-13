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
let selectedImage = "";
let selectedTitle = "";
let selectedSubCategoryLabel = "";
let selectedRoute = "";
let imagePanX = 0;
let imagePanY = 0;
let isImagePanning = false;
let imagePanStartX = 0;
let imagePanStartY = 0;
let imagePanOriginX = 0;
let imagePanOriginY = 0;

const mainCategoryTabs = document.querySelectorAll("[data-main-category]");
const subcategoryTabs = document.querySelector("#subcategoryTabs");
const galleryGrid = document.querySelector("#galleryGrid");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
const resultCount = document.querySelector("#resultCount");
const toast = document.querySelector("#toast");
const promptModal = document.querySelector("#promptModal");
const modalImage = document.querySelector("#modalImage");
const expandImage = document.querySelector("#expandImage");
const imageZoom = document.querySelector("#imageZoom");
const imageZoomValue = document.querySelector("#imageZoomValue");
const imageLightbox = document.querySelector("#imageLightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const closeLightbox = document.querySelector("#closeLightbox");
const lightboxBackdrop = document.querySelector("#lightboxBackdrop");
const promptLightbox = document.querySelector("#promptLightbox");
const fullPromptText = document.querySelector("#fullPromptText");
const closePromptLightboxButton = document.querySelector("#closePromptLightbox");
const promptLightboxBackdrop = document.querySelector("#promptLightboxBackdrop");
const modalCategory = document.querySelector("#modalCategory");
const modalTitle = document.querySelector("#modalTitle");
const modalDescription = document.querySelector("#modalDescription");
const modalContent = document.querySelector(".modal-content");
const variablePanel = document.querySelector("#variablePanel");
const variableList = document.querySelector("#variableList");
const variableActions = document.querySelector("#variableActions");
const finalPrompt = document.querySelector("#finalPrompt");
const viewFullPrompt = document.querySelector("#viewFullPrompt");
const copyModalPrompt = document.querySelector("#copyModalPrompt");
const copyPromptLink = document.querySelector("#copyPromptLink");
const generatePrompt = document.querySelector("#generatePrompt");
const resetPrompt = document.querySelector("#resetPrompt");

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

function toRouteSlug(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getItemRoute(item) {
  return item.route || `${item.mainCategory}/${item.subCategory}/${toRouteSlug(item.title)}`;
}

function getPromptUrl(item) {
  const route = typeof item === "string" ? item : getItemRoute(item);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}#/${route}`;
}

function getRouteFromHash() {
  const hash = decodeURIComponent(window.location.hash || "");
  if (!hash.startsWith("#/")) return "";
  return hash.slice(2);
}

function findItemByRoute(route) {
  return galleryItems.find((item) => getItemRoute(item) === route);
}

function openRouteFromHash() {
  const route = getRouteFromHash();
  if (!route) {
    if (promptModal.classList.contains("open")) closePromptModal(false);
    return;
  }

  const item = findItemByRoute(route);
  if (item) openPromptModal(item, false);
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
    route: item.route || `${mainCategory}/${subCategory}/${toRouteSlug(item.title || "제목 없음")}`,
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
  openRouteFromHash();
}

function extractVariables(prompt) {
  const matches = [...prompt.matchAll(/\{\{([^{}]+)\}\}/g)];
  const names = matches
    .map((match) => match[1])
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set(names)];
}

function replaceVariables(prompt, values) {
  return prompt.replace(/\{\{([^{}]+)\}\}/g, (match, variableName) => {
    const name = variableName.trim();
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
        <article class="gallery-card" tabindex="0" role="button" aria-label="${escapeHTML(item.title)} 프롬프트 보기" data-route="${escapeHTML(getItemRoute(item))}">
          <div class="image-frame ${escapeHTML(item.size)}">
            ${
              item.image
                ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)} 결과물" loading="lazy" />`
                : `<span class="placeholder">${escapeHTML(item.subCategoryLabel)}</span>`
            }
            <div class="card-overlay">
              <strong>${escapeHTML(item.title)}</strong>
              <span>${escapeHTML(item.mainCategoryLabel)} / ${escapeHTML(item.subCategoryLabel)}</span>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  resultCount.textContent = `${filtered.length}개의 예시`;
  emptyState.hidden = filtered.length > 0;
}

function openPromptModal(item, updateHash = true) {
  selectedPrompt = item.prompt;
  selectedVariables = extractVariables(item.prompt);
  variableValues = {};
  selectedImage = item.image;
  selectedTitle = item.title;
  selectedSubCategoryLabel = item.subCategoryLabel;
  selectedRoute = getItemRoute(item);
  if (updateHash && getRouteFromHash() !== selectedRoute) {
    history.pushState(null, "", `#/${selectedRoute}`);
  }
  modalCategory.textContent = `${item.mainCategoryLabel} / ${item.subCategoryLabel}`;
  modalTitle.textContent = item.title;
  modalDescription.textContent = item.description;
  modalImage.innerHTML = item.image
    ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)} 결과물" />`
    : `<span class="placeholder">${escapeHTML(item.subCategoryLabel)}</span>`;
  renderVariableInputs();
  resetFinalPrompt();
  resetImageZoom();

  promptModal.classList.add("open");
  promptModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalImage.scrollTop = 0;
  modalContent.scrollTop = 0;
  promptModal.scrollTop = 0;
  requestAnimationFrame(() => {
    modalContent.scrollTop = 0;
    resetFinalPromptScroll();
  });
}

function resetImageZoom() {
  imageZoom.value = "100";
  resetImagePan();
  updateImageZoom();
}

function updateImageZoom() {
  const zoomValue = Number(imageZoom.value);
  if (zoomValue <= 100) resetImagePan();
  modalImage.style.setProperty("--zoom-scale", zoomValue / 100);
  imageZoomValue.textContent = `${zoomValue}%`;
  modalImage.classList.toggle("zoomed", zoomValue > 100 && Boolean(selectedImage));
}

function resetImagePan() {
  imagePanX = 0;
  imagePanY = 0;
  applyImagePan();
}

function applyImagePan() {
  modalImage.style.setProperty("--pan-x", `${imagePanX}px`);
  modalImage.style.setProperty("--pan-y", `${imagePanY}px`);
}

function zoomImageBy(delta) {
  const min = Number(imageZoom.min);
  const max = Number(imageZoom.max);
  const step = Number(imageZoom.step) || 10;
  const current = Number(imageZoom.value);
  const next = Math.min(max, Math.max(min, current + delta * step));

  if (next === current) return;
  imageZoom.value = String(next);
  updateImageZoom();
}

function startImagePan(event) {
  if (!selectedImage || Number(imageZoom.value) <= 100) return;

  isImagePanning = true;
  imagePanStartX = event.clientX;
  imagePanStartY = event.clientY;
  imagePanOriginX = imagePanX;
  imagePanOriginY = imagePanY;
  modalImage.classList.add("dragging");
  modalImage.setPointerCapture(event.pointerId);
}

function moveImagePan(event) {
  if (!isImagePanning) return;

  imagePanX = imagePanOriginX + event.clientX - imagePanStartX;
  imagePanY = imagePanOriginY + event.clientY - imagePanStartY;
  applyImagePan();
}

function stopImagePan(event) {
  if (!isImagePanning) return;

  isImagePanning = false;
  modalImage.classList.remove("dragging");
  if (modalImage.hasPointerCapture(event.pointerId)) {
    modalImage.releasePointerCapture(event.pointerId);
  }
}

function openImageLightbox() {
  lightboxImage.innerHTML = selectedImage
    ? `<img src="${escapeHTML(selectedImage)}" alt="${escapeHTML(selectedTitle)} 결과물 크게 보기" />`
    : `<span class="placeholder">${escapeHTML(selectedSubCategoryLabel)}</span>`;
  imageLightbox.classList.add("open");
  imageLightbox.setAttribute("aria-hidden", "false");
}

function closeImageLightbox() {
  imageLightbox.classList.remove("open");
  imageLightbox.setAttribute("aria-hidden", "true");
}

function openPromptLightbox() {
  fullPromptText.textContent = finalPrompt.textContent;
  promptLightbox.classList.add("open");
  promptLightbox.setAttribute("aria-hidden", "false");
  fullPromptText.scrollTop = 0;
}

function closePromptLightbox() {
  promptLightbox.classList.remove("open");
  promptLightbox.setAttribute("aria-hidden", "true");
}

function resetFinalPromptScroll() {
  finalPrompt.scrollTop = 0;
  fullPromptText.scrollTop = 0;
}

function closePromptModal(clearHash = true) {
  closePromptLightbox();
  promptModal.classList.remove("open");
  promptModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (clearHash && getRouteFromHash() === selectedRoute) {
    history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
  }
}

function renderVariableInputs() {
  variablePanel.hidden = selectedVariables.length === 0;
  variableActions.hidden = selectedVariables.length === 0;

  if (selectedVariables.length === 0) {
    variableList.innerHTML = "";
    return;
  }

  variableList.innerHTML = selectedVariables
    .map(
      (name) => `
        <div class="variable-field">
          <div class="variable-field-head">
            <label for="variable-${escapeHTML(name)}">${escapeHTML(name)}</label>
            <label class="variable-toggle">
              <input type="checkbox" data-variable-enabled="${escapeHTML(name)}" checked />
              적용
            </label>
          </div>
          <input id="variable-${escapeHTML(name)}" type="text" data-variable="${escapeHTML(name)}" placeholder="${escapeHTML(name)} 입력" />
        </div>
      `,
    )
    .join("");
}

function updateFinalPrompt() {
  const enabledValues = {};
  variableList.querySelectorAll("[data-variable-enabled]:checked").forEach((checkbox) => {
    const name = checkbox.dataset.variableEnabled;
    if (variableValues[name]) enabledValues[name] = variableValues[name];
  });

  finalPrompt.textContent = replaceVariables(selectedPrompt, enabledValues);
  fullPromptText.textContent = finalPrompt.textContent;
  resetFinalPromptScroll();
}

function resetFinalPrompt() {
  variableValues = {};
  finalPrompt.textContent = selectedPrompt;
  fullPromptText.textContent = finalPrompt.textContent;
  resetFinalPromptScroll();
  variableList.querySelectorAll("[data-variable]").forEach((input) => {
    input.value = "";
  });
  variableList.querySelectorAll("[data-variable-enabled]").forEach((checkbox) => {
    checkbox.checked = true;
  });
}

function showToast(message = "프롬프트가 복사되었습니다.") {
  toast.textContent = message;
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
imageZoom.addEventListener("input", updateImageZoom);
modalImage.addEventListener("wheel", (event) => {
  if (!selectedImage) return;

  event.preventDefault();
  zoomImageBy(event.deltaY < 0 ? 1 : -1);
}, { passive: false });
modalImage.addEventListener("pointerdown", startImagePan);
modalImage.addEventListener("pointermove", moveImagePan);
modalImage.addEventListener("pointerup", stopImagePan);
modalImage.addEventListener("pointercancel", stopImagePan);
expandImage.addEventListener("click", openImageLightbox);
closeLightbox.addEventListener("click", closeImageLightbox);
lightboxBackdrop.addEventListener("click", closeImageLightbox);
viewFullPrompt.addEventListener("click", openPromptLightbox);
closePromptLightboxButton.addEventListener("click", closePromptLightbox);
promptLightboxBackdrop.addEventListener("click", closePromptLightbox);

galleryGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".gallery-card");
  if (!card) return;

  const item = findItemByRoute(card.dataset.route);
  if (item) openPromptModal(item);
});

galleryGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".gallery-card");
  if (!card) return;

  event.preventDefault();
  const item = findItemByRoute(card.dataset.route);
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
});

generatePrompt.addEventListener("click", updateFinalPrompt);

resetPrompt.addEventListener("click", resetFinalPrompt);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && promptLightbox.classList.contains("open")) {
    closePromptLightbox();
    return;
  }

  if (event.key === "Escape" && imageLightbox.classList.contains("open")) {
    closeImageLightbox();
    return;
  }

  if (event.key === "Escape" && promptModal.classList.contains("open")) {
    closePromptModal();
  }
});

copyModalPrompt.addEventListener("click", async () => {
  await copyPrompt(finalPrompt.textContent);
  showToast();
});

copyPromptLink.addEventListener("click", async () => {
  await copyPrompt(getPromptUrl(selectedRoute));
  showToast("프롬프트 링크가 복사되었습니다.");
});

window.addEventListener("hashchange", openRouteFromHash);

renderSubcategoryTabs();
renderGallery();
loadGalleryItems();
