const makerCards = document.querySelectorAll("[data-random-prompt-maker]");
const makerToast = document.querySelector("#makerToast");
const templateCache = new Map();
const variableCache = new Map();
const generatedState = new WeakMap();
let makerToastTimer;

function extractVariables(template) {
  return [...new Set([...template.matchAll(/\{([A-Z0-9_]+)\}/g)].map((match) => match[1]))];
}

function parseVariableList(text, variableName) {
  const numberedItems = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (numberedItems.length > 0) return numberedItems;

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== variableName && line !== `{${variableName}}`)
    .filter((line) => !/^=+$/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

const bodyProportionOptionIndexes = {
  slim: 1,
  curvy: 2,
  glamour: 3,
  fit: 4,
  refined: 5,
};

async function fetchText(path) {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const candidates = [...new Set([path, encodedPath])];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: "no-store" });
      if (response.ok) return response.text();
    } catch (error) {
      if (window.location.protocol === "file:") {
        throw new Error("파일을 직접 열면 프롬프트 데이터를 불러올 수 없습니다. 로컬 서버 주소로 Maker 페이지를 열어주세요.");
      }
    }
  }

  throw new Error(`${path} 파일을 불러오지 못했습니다.`);
}

async function getTemplate(templatePath) {
  if (!templateCache.has(templatePath)) {
    const template = (await fetchText(templatePath)).trim();
    if (!template) throw new Error(`${templatePath} 파일이 비어 있습니다.`);
    templateCache.set(templatePath, template);
  }

  return templateCache.get(templatePath);
}

async function getVariableOptions(variableListPath, variableName) {
  const cacheKey = `${variableListPath}/${variableName}`;
  if (!variableCache.has(cacheKey)) {
    const text = await fetchText(`${variableListPath}/${variableName}.txt`);
    const options = parseVariableList(text, variableName);
    if (options.length === 0) throw new Error(`${variableName}.txt에 사용할 값이 없습니다.`);
    variableCache.set(cacheKey, options);
  }

  return variableCache.get(cacheKey);
}

function getCardElements(card) {
  return {
    cardHead: card.querySelector(".prompt-maker-card-head"),
    generateButton: card.querySelector("[data-generate-random-prompt]"),
    copyButton: card.querySelector("[data-copy-generated-prompt]"),
    resetButton: card.querySelector("[data-reset-generated-prompt]"),
    generatedPrompt: card.querySelector("[data-generated-prompt]"),
    makerStatus: card.querySelector("[data-maker-status]"),
    sourcePreview: card.querySelector("[data-source-prompt-preview]"),
    bodyOptionInputs: card.querySelectorAll("[data-body-proportion-option]"),
  };
}

function replaceTemplateVariables(template, selectedValues) {
  return template.replace(/\{([A-Z0-9_]+)\}/g, (_, variableName) => {
    return selectedValues[variableName] || `{${variableName}}`;
  });
}

async function applyBodyProportionSelection(card, selectedValues) {
  if (!("BODY_PROPORTION_DESCRIPTION" in selectedValues)) return;

  const options = await getVariableOptions(card.dataset.variableListPath, "BODY_PROPORTION_DESCRIPTION");
  selectedValues.BODY_PROPORTION_DESCRIPTION =
    options[getSelectedBodyProportionIndex(card)] || options[0];
}

async function renderGeneratedPrompt(card) {
  const state = generatedState.get(card);
  if (!state) return;

  const { generatedPrompt } = getCardElements(card);
  await applyBodyProportionSelection(card, state.selectedValues);
  generatedPrompt.value = replaceTemplateVariables(state.template, state.selectedValues);
}

function setCardExpanded(card, isExpanded) {
  card.classList.toggle("is-open", isExpanded);
  card.setAttribute("aria-expanded", String(isExpanded));

  const { cardHead } = getCardElements(card);
  if (cardHead) cardHead.setAttribute("aria-expanded", String(isExpanded));
}

function toggleCard(card) {
  setCardExpanded(card, !card.classList.contains("is-open"));
}

function setMakerStatus(card, message) {
  const { makerStatus } = getCardElements(card);
  if (makerStatus) makerStatus.textContent = message;
}

function getSelectedBodyProportionIndex(card) {
  const selectedOption = card.querySelector("[data-body-proportion-option]:checked")?.dataset
    .bodyProportionOption;

  return bodyProportionOptionIndexes[selectedOption] || 0;
}

function enforceSingleBodyOption(card, selectedInput) {
  if (!selectedInput.checked) return;

  getCardElements(card).bodyOptionInputs.forEach((input) => {
    if (input !== selectedInput) input.checked = false;
  });
}

function showMakerToast(message = "복사되었습니다.") {
  if (!makerToast) return;

  window.clearTimeout(makerToastTimer);
  makerToast.textContent = message;
  makerToast.classList.add("show");
  makerToastTimer = window.setTimeout(() => makerToast.classList.remove("show"), 1600);
}

async function generateRandomPrompt(card) {
  const templatePath = card.dataset.templatePath;
  const variableListPath = card.dataset.variableListPath;
  const { generatedPrompt } = getCardElements(card);

  try {
    setMakerStatus(card, "프롬프트를 생성하는 중입니다.");
    const template = await getTemplate(templatePath);
    const variables = extractVariables(template);
    const selectedValues = {};

    await Promise.all(
      variables.map(async (variableName) => {
        const options = await getVariableOptions(variableListPath, variableName);
        selectedValues[variableName] = pickRandom(options);
      }),
    );

    generatedState.set(card, { template, selectedValues });
    await renderGeneratedPrompt(card);
    setMakerStatus(card, "");
  } catch (error) {
    generatedPrompt.value = "";
    generatedState.delete(card);
    setMakerStatus(card, error.message);
  }
}

async function updateBodyProportionSelection(card) {
  if (!generatedState.has(card)) return;

  try {
    await renderGeneratedPrompt(card);
    setMakerStatus(card, "");
  } catch (error) {
    setMakerStatus(card, error.message);
  }
}

async function copyGeneratedPrompt(card) {
  const { generatedPrompt } = getCardElements(card);

  if (!generatedPrompt.value.trim()) {
    setMakerStatus(card, "복사할 프롬프트가 없습니다.");
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedPrompt.value);
  } catch {
    generatedPrompt.select();
    document.execCommand("copy");
  }

  setMakerStatus(card, "");
  showMakerToast();
}

function resetGeneratedPrompt(card) {
  const { generatedPrompt } = getCardElements(card);
  generatedState.delete(card);
  generatedPrompt.value = "";
  generatedPrompt.placeholder = "생성 버튼을 눌러주세요.";
  setMakerStatus(card, "");
}

makerCards.forEach((card) => {
  const { generateButton, copyButton, resetButton, bodyOptionInputs } = getCardElements(card);
  generateButton?.addEventListener("click", () => generateRandomPrompt(card));
  copyButton?.addEventListener("click", () => copyGeneratedPrompt(card));
  resetButton?.addEventListener("click", () => resetGeneratedPrompt(card));
  bodyOptionInputs.forEach((input) => {
    input.addEventListener("change", () => {
      enforceSingleBodyOption(card, input);
      updateBodyProportionSelection(card);
    });
  });
});

makerCards.forEach(async (card) => {
  const { cardHead, sourcePreview } = getCardElements(card);
  setCardExpanded(card, false);

  if (cardHead) {
    cardHead.setAttribute("role", "button");
    cardHead.setAttribute("tabindex", "0");
    cardHead.addEventListener("click", () => toggleCard(card));
    cardHead.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleCard(card);
    });
  }

  if (!sourcePreview) return;

  try {
    const template = await fetchText(card.dataset.templatePath);
    sourcePreview.textContent = template.trim() || "템플릿 파일이 비어 있습니다.";
  } catch (error) {
    sourcePreview.textContent = error.message;
  }
});
