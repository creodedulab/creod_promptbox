const savedPromptStorageKey = "creodPromptBox.savedPrompts";
const githubSettingsStorageKey = "creodPromptBox.githubSettings";
const defaultGithubSettings = {
  owner: "creodedulab",
  repo: "creod_promptbox",
  branch: "main",
  token: "",
};

const defaultGalleryItems = [
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
  {
    title: "상세페이지 히어로 이미지",
    category: "product",
    categoryLabel: "제품",
    tool: "Image AI",
    size: "wide",
    image: "",
    description: "온라인 쇼핑몰 첫 화면에 배치하기 좋은 제품 중심 이미지",
    prompt:
      "텀블러 상세페이지 히어로 이미지를 만들어줘. 손에 잡힌 제품, 출근길 배경, 선명한 제품 디테일, 밝은 자연광, 커머스 상세페이지에 적합한 여백.",
  },
  {
    title: "브랜드 무드보드",
    category: "brand",
    categoryLabel: "브랜딩",
    tool: "Image AI",
    size: "",
    image: "",
    description: "브랜드 방향성을 빠르게 공유하기 위한 컬러와 소재 조합",
    prompt:
      "웰니스 브랜드 무드보드를 만들어줘. 차분한 블루와 그린, 천연 소재, 패키지 샘플, 로고가 없는 브랜드 보드, 프리미엄하지만 편안한 분위기.",
  },
  {
    title: "레스토랑 실내 전경",
    category: "space",
    categoryLabel: "공간",
    tool: "Image AI",
    size: "tall",
    image: "",
    description: "예약 페이지와 소개 페이지에 활용할 수 있는 매장 분위기",
    prompt:
      "모던 한식 레스토랑 실내 전경을 만들어줘. 따뜻한 간접 조명, 우드 테이블, 정갈한 테이블 세팅, 넓은 앵글, 실제 매장 사진 같은 품질.",
  },
  {
    title: "커리어 인터뷰 썸네일",
    category: "portrait",
    categoryLabel: "인물",
    tool: "Image AI",
    size: "wide",
    image: "",
    description: "콘텐츠 인터뷰 시리즈에 사용할 수 있는 인물 중심 썸네일",
    prompt:
      "커리어 인터뷰 썸네일 이미지를 만들어줘. 젊은 창업자 인물, 사무실 배경, 자신감 있는 표정, 잡지 커버 같은 구도, 텍스트를 넣을 여백.",
  },
];

function loadSavedPrompts() {
  try {
    return JSON.parse(localStorage.getItem(savedPromptStorageKey)) || [];
  } catch {
    return [];
  }
}

function savePromptItems(items) {
  localStorage.setItem(savedPromptStorageKey, JSON.stringify(items));
}

function loadGithubSettings() {
  try {
    return {
      ...defaultGithubSettings,
      ...(JSON.parse(sessionStorage.getItem(githubSettingsStorageKey)) || {}),
    };
  } catch {
    return { ...defaultGithubSettings };
  }
}

function saveGithubSettings(settings) {
  sessionStorage.setItem(githubSettingsStorageKey, JSON.stringify(settings));
}

const savedPromptItems = loadSavedPrompts();
const galleryItems = [...savedPromptItems, ...defaultGalleryItems];

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
const openSavePrompt = document.querySelector("#openSavePrompt");
const openGithubSettings = document.querySelector("#openGithubSettings");
const savePromptModal = document.querySelector("#savePromptModal");
const savePromptForm = document.querySelector("#savePromptForm");
const templateTitle = document.querySelector("#templateTitle");
const templateCategory = document.querySelector("#templateCategory");
const templateDescription = document.querySelector("#templateDescription");
const templateImage = document.querySelector("#templateImage");
const imageUploadPreview = document.querySelector("#imageUploadPreview");
const imageUploadStatus = document.querySelector("#imageUploadStatus");
const templatePrompt = document.querySelector("#templatePrompt");
const detectedVariables = document.querySelector("#detectedVariables");
const githubSettingsModal = document.querySelector("#githubSettingsModal");
const githubSettingsForm = document.querySelector("#githubSettingsForm");
const githubOwner = document.querySelector("#githubOwner");
const githubRepo = document.querySelector("#githubRepo");
const githubBranch = document.querySelector("#githubBranch");
const githubToken = document.querySelector("#githubToken");

let activeCategory = "all";
let selectedPrompt = "";
let selectedVariables = [];
let variableValues = {};
let compressedImageData = "";
let githubSettings = loadGithubSettings();

const categoryLabels = {
  product: "제품",
  portrait: "인물",
  brand: "브랜딩",
  space: "공간",
};

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => {
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
          <div class="image-frame ${item.size}">
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

function openSavePromptModal() {
  savePromptModal.classList.add("open");
  savePromptModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  templateTitle.focus();
}

function openGithubSettingsModal() {
  githubOwner.value = githubSettings.owner;
  githubRepo.value = githubSettings.repo;
  githubBranch.value = githubSettings.branch;
  githubToken.value = githubSettings.token;
  githubSettingsModal.classList.add("open");
  githubSettingsModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  githubOwner.focus();
}

function closeSavePromptModal() {
  savePromptModal.classList.remove("open");
  savePromptModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function closeGithubSettingsModal() {
  githubSettingsModal.classList.remove("open");
  githubSettingsModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function updateDetectedVariables() {
  const variables = extractVariables(templatePrompt.value);

  if (variables.length === 0) {
    detectedVariables.textContent = "아직 감지된 변수가 없습니다. [제품명]처럼 입력해보세요.";
    return;
  }

  detectedVariables.innerHTML = variables
    .map((name) => `<span class="variable-chip">${escapeHTML(name)}</span>`)
    .join("");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function canvasToWebP(canvas, quality = 0.78) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataURLToBase64(dataUrl) {
  return dataUrl.split(",")[1] || "";
}

function encodeBase64UTF8(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64UTF8(base64Text) {
  return decodeURIComponent(escape(atob(base64Text.replace(/\n/g, ""))));
}

function makeGithubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${githubSettings.token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function githubApiURL(path) {
  return `https://api.github.com/repos/${githubSettings.owner}/${githubSettings.repo}/contents/${path}`;
}

async function fetchGithubContent(path) {
  const response = await fetch(`${githubApiURL(path)}?ref=${encodeURIComponent(githubSettings.branch)}`, {
    headers: makeGithubHeaders(),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub 파일 조회 실패: ${response.status}`);
  }

  return response.json();
}

async function saveGithubContent(path, contentBase64, message, sha = null) {
  const body = {
    message,
    content: contentBase64,
    branch: githubSettings.branch,
  };

  if (sha) body.sha = sha;

  const response = await fetch(githubApiURL(path), {
    method: "PUT",
    headers: makeGithubHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub 저장 실패: ${response.status}`);
  }

  return response.json();
}

async function loadGithubPrompts() {
  if (!githubSettings.token) return;

  const file = await fetchGithubContent("data/prompts.json");
  if (!file?.content) return;

  const prompts = JSON.parse(decodeBase64UTF8(file.content));
  savedPromptItems.splice(0, savedPromptItems.length, ...prompts);
  galleryItems.splice(0, galleryItems.length, ...savedPromptItems, ...defaultGalleryItems);
  savePromptItems(savedPromptItems);
  renderGallery();
}

async function saveItemToGithub(item) {
  if (!githubSettings.token) {
    throw new Error("GitHub 설정에서 token을 먼저 입력해주세요.");
  }

  const itemForGithub = { ...item };

  if (item.image) {
    const imageName = `${Date.now()}-${item.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "")}.webp`;
    const imagePath = `images/generated/${imageName}`;
    await saveGithubContent(imagePath, dataURLToBase64(item.image), `Add image for ${item.title}`);
    itemForGithub.image = imagePath;
  }

  const dataFile = await fetchGithubContent("data/prompts.json");
  let prompts = [];

  if (dataFile?.content) {
    prompts = JSON.parse(decodeBase64UTF8(dataFile.content));
  }

  prompts.unshift(itemForGithub);

  await saveGithubContent(
    "data/prompts.json",
    encodeBase64UTF8(JSON.stringify(prompts, null, 2)),
    `Add prompt: ${item.title}`,
    dataFile?.sha,
  );

  return itemForGithub;
}

async function compressImageToWebP(file) {
  const image = await fileToImage(file);
  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(image.src);

  const blob = await canvasToWebP(canvas);
  const dataUrl = await blobToDataURL(blob);

  return {
    dataUrl,
    width,
    height,
    originalSize: file.size,
    compressedSize: blob.size,
  };
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

galleryGrid.addEventListener("click", async (event) => {
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

openSavePrompt.addEventListener("click", openSavePromptModal);
openGithubSettings.addEventListener("click", openGithubSettingsModal);

savePromptModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-save-modal]")) {
    closeSavePromptModal();
  }
});

githubSettingsModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-github-modal]")) {
    closeGithubSettingsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && promptModal.classList.contains("open")) {
    closePromptModal();
  }

  if (event.key === "Escape" && savePromptModal.classList.contains("open")) {
    closeSavePromptModal();
  }

  if (event.key === "Escape" && githubSettingsModal.classList.contains("open")) {
    closeGithubSettingsModal();
  }
});

copyModalPrompt.addEventListener("click", async () => {
  await copyPrompt(finalPrompt.textContent);
  showToast();
});

templatePrompt.addEventListener("input", updateDetectedVariables);

templateImage.addEventListener("change", async () => {
  const file = templateImage.files[0];
  compressedImageData = "";

  if (!file) {
    imageUploadPreview.innerHTML = "<span>이미지를 선택하면 WebP로 압축되어 미리보기가 표시됩니다.</span>";
    imageUploadStatus.textContent = "권장: 가로 1200px 이하, WebP 품질 78로 자동 압축";
    return;
  }

  imageUploadStatus.textContent = "이미지를 WebP로 압축하는 중입니다...";

  try {
    const result = await compressImageToWebP(file);
    compressedImageData = result.dataUrl;
    imageUploadPreview.innerHTML = `<img src="${compressedImageData}" alt="압축된 결과물 미리보기" />`;
    imageUploadStatus.textContent = `압축 완료: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} · ${result.width}×${result.height}px`;
  } catch {
    imageUploadPreview.innerHTML = "<span>이미지를 압축하지 못했습니다. 다른 이미지를 선택해주세요.</span>";
    imageUploadStatus.textContent = "압축 실패";
  }
});

githubSettingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  githubSettings = {
    owner: githubOwner.value.trim(),
    repo: githubRepo.value.trim(),
    branch: githubBranch.value.trim(),
    token: githubToken.value.trim(),
  };

  saveGithubSettings(githubSettings);
  closeGithubSettingsModal();
  toast.textContent = "GitHub 설정이 저장되었습니다.";
  showToast();

  try {
    await loadGithubPrompts();
  } catch (error) {
    window.setTimeout(() => {
      toast.textContent = error.message;
      showToast();
    }, 300);
  } finally {
    window.setTimeout(() => {
      toast.textContent = "프롬프트가 복사되었습니다.";
    }, 2200);
  }
});

savePromptForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newItem = {
    title: templateTitle.value.trim(),
    category: templateCategory.value,
    categoryLabel: categoryLabels[templateCategory.value],
    tool: "Image AI",
    size: "",
    image: compressedImageData,
    description: templateDescription.value.trim() || "사용자가 저장한 프롬프트 템플릿",
    prompt: templatePrompt.value.trim(),
  };

  try {
    const savedItem = await saveItemToGithub(newItem);
    savedPromptItems.unshift(savedItem);
    savePromptItems(savedPromptItems);
    galleryItems.unshift(savedItem);
    toast.textContent = "GitHub에 프롬프트가 저장되었습니다.";
  } catch (error) {
    savedPromptItems.unshift(newItem);
    savePromptItems(savedPromptItems);
    galleryItems.unshift(newItem);
    toast.textContent = `${error.message} 로컬에 임시 저장했습니다.`;
  }

  savePromptForm.reset();
  compressedImageData = "";
  imageUploadPreview.innerHTML = "<span>이미지를 선택하면 WebP로 압축되어 미리보기가 표시됩니다.</span>";
  imageUploadStatus.textContent = "권장: 가로 1200px 이하, WebP 품질 78로 자동 압축";
  updateDetectedVariables();
  activeCategory = "all";
  categoryTabs.forEach((item) => item.classList.toggle("active", item.dataset.category === "all"));
  renderGallery();
  closeSavePromptModal();
  showToast();
  window.setTimeout(() => {
    toast.textContent = "프롬프트가 복사되었습니다.";
  }, 1700);
});

updateDetectedVariables();
renderGallery();
loadGithubPrompts().catch(() => {});
