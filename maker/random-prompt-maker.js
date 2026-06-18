const templatePath = "Random Portrait Prompt/Random Portrait Prompt.txt";
const variableListPath = "Random Portrait Prompt/prompt_variable_lists_txt";

const generateButton = document.querySelector("#generateRandomPrompt");
const copyButton = document.querySelector("#copyGeneratedPrompt");
const resetButton = document.querySelector("#resetGeneratedPrompt");
const generatedPrompt = document.querySelector("#generatedPrompt");
const makerStatus = document.querySelector("#makerStatus");

let templateText = "";
const variableCache = new Map();

function setMakerStatus(message) {
  if (makerStatus) makerStatus.textContent = message;
}

function extractVariables(template) {
  return [...new Set([...template.matchAll(/\{([A-Z0-9_]+)\}/g)].map((match) => match[1]))];
}

function parseVariableList(text, variableName) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== variableName)
    .filter((line) => !/^=+$/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} 파일을 불러오지 못했습니다.`);
  return response.text();
}

async function getTemplate() {
  if (!templateText) {
    templateText = (await fetchText(templatePath)).trim();
  }
  return templateText;
}

async function getVariableOptions(variableName) {
  if (!variableCache.has(variableName)) {
    const text = await fetchText(`${variableListPath}/${variableName}.txt`);
    const options = parseVariableList(text, variableName);
    if (options.length === 0) throw new Error(`${variableName}.txt 안에 사용할 값이 없습니다.`);
    variableCache.set(variableName, options);
  }

  return variableCache.get(variableName);
}

async function generateRandomPrompt() {
  try {
    setMakerStatus("프롬프트를 생성하는 중입니다.");
    const template = await getTemplate();
    const variables = extractVariables(template);
    const selectedValues = {};

    await Promise.all(
      variables.map(async (variableName) => {
        selectedValues[variableName] = pickRandom(await getVariableOptions(variableName));
      }),
    );

    generatedPrompt.value = template.replace(/\{([A-Z0-9_]+)\}/g, (_, variableName) => {
      return selectedValues[variableName] || `{${variableName}}`;
    });
    setMakerStatus("");
  } catch (error) {
    generatedPrompt.value = "";
    setMakerStatus(error.message);
  }
}

async function copyGeneratedPrompt() {
  if (!generatedPrompt.value.trim()) {
    setMakerStatus("복사할 프롬프트가 없습니다.");
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedPrompt.value);
  } catch {
    generatedPrompt.select();
    document.execCommand("copy");
  }

  setMakerStatus("프롬프트가 복사되었습니다.");
}

function resetGeneratedPrompt() {
  generatedPrompt.value = "";
  generatedPrompt.placeholder = "생성 버튼을 눌러주세요";
  setMakerStatus("");
}

generateButton?.addEventListener("click", generateRandomPrompt);
copyButton?.addEventListener("click", copyGeneratedPrompt);
resetButton?.addEventListener("click", resetGeneratedPrompt);
