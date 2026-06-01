const fallbackGalleryItems = [
  {
    title: "스킨케어 제품 화보",
    category: "product",
    categoryLabel: "제품",
    tool: "Image AI",
    size: "tall",
    image: "",
    description: "깨끗한 욕실 조명과 투명한 물방울 질감의 제품 컷",
    prompt:
      "미니멀한 [제품명] 제품 화보를 만들어줘. {촬영장소}, {{조명}}, 물방울 질감, [메인컬러] 톤, 고급 브랜드 광고 사진 스타일.",
  },
  {
    title: "카페 신메뉴 포스터",
    category: "brand",
    categoryLabel: "브랜딩",
    tool: "Image AI",
    size: "wide",
    image: "",
    description: "계절 음료 출시를 알리는 따뜻한 무드의 포스터",
    prompt:
      "[시즌] 시즌 카페 [메뉴명] 포스터 이미지를 만들어줘. 크림 질감, {조명}, [포인트컬러] 포인트, 인쇄 광고에 어울리는 구성.",
  },
  {
    title: "프로필용 인물 사진",
    category: "portrait",
    categoryLabel: "인물",
    tool: "Image AI",
    size: "",
    image: "",
    description: "링크드인과 포트폴리오에 사용할 수 있는 자연스러운 프로필",
    prompt:
      "[사용처]에 사용할 전문적이지만 딱딱하지 않은 프로필 사진을 만들어줘. {표정}, [조명], [의상], 얕은 심도, 고해상도 인물 사진.",
  },
  {
    title: "소형 서재 인테리어",
    category: "space",
    categoryLabel: "공간",
    tool: "Image AI",
    size: "tall",
    image: "",
    description: "작은 방을 업무와 독서에 맞게 꾸민 공간 예시",
    prompt:
      "작은 [공간종류] 인테리어 이미지를 만들어줘. [가구소재] 책상, {조명}, 벽 선반, [주요용도]에 맞는 세팅, 좁지만 아늑한 공간, 현실적인 사진.",
  },
];

let galleryItems = [...fallbackGalleryItems];
let activeCategory = "all";
let selectedPrompt = "";
let selectedVariables = [];
let variableValues = {};

const categoryTabs = document.querySelectorAll(".tab");
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

function normalizeItem(item) {
  return {
    title: item.title || "제목 없음",
    category: item.category || "product",
    categoryLabel: item.categoryLabel || "제품",
    tool: item.tool || "Image AI",
    size: item.size || "",
    image: item.image || "",
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
    galleryItems = [...fallbackGalleryItems];
  }

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

function renderGallery() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = galleryItems.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const targetText = `${item.title} ${item.categoryLabel} ${item.description} ${item.prompt}`.toLowerCase();
    return matchesCategory && targetText.includes(keyword);
  });

  galleryGrid.innerHTML = filtered
    .map(
      (item) => `
        <article class="gallery-card" tabindex="0" role="button" aria-label="${escapeHTML(item.title)} 프롬프트 보기" data-title="${escapeHTML(item.title)}">
          <div class="image-frame ${escapeHTML(item.size)}">
            ${
              item.image
                ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)} 결과물" loading="lazy" />`
                : '<span class="placeholder">결과물 이미지 예정</span>'
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
  modalCategory.textContent = item.categoryLabel;
  modalTitle.textContent = item.title;
  modalDescription.textContent = item.description;
  modalPrompt.textContent = item.prompt;
  modalImage.innerHTML = item.image
    ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)} 결과물" />`
    : '<span class="placeholder">결과물 이미지 예정</span>';
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

categoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    categoryTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeCategory = tab.dataset.category;
    renderGallery();
  });
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

renderGallery();
loadGalleryItems();
