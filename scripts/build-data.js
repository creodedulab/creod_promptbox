const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const examplesDir = path.join(rootDir, "examples");
const outputPath = path.join(rootDir, "data", "prompts.json");

const categories = {
  image: {
    label: "이미지",
    subcategories: {
      "ad-poster": "광고포스터",
      person: "인물",
      animal: "동물",
      avatar: "아바타",
      cosplay: "코스프레",
      illustration: "일러스트",
      infographic: "인포그래픽",
      mockup: "목업",
      daily: "일상",
      wallpaper: "배경화면",
      season: "시즌",
      thumbnail: "썸네일",
    },
  },
  vba: {
    label: "VBA",
    subcategories: {
      excel: "엑셀",
      powerpoint: "파워포인트",
    },
  },
  appscript: {
    label: "앱스스크립트",
    subcategories: {
      "google-sheets": "구글시트",
      "google-forms": "구글폼",
      "google-docs": "구글독스",
    },
  },
  notebooklm: {
    label: "노트북LM",
    subcategories: {
      slides: "슬라이드",
    },
  },
};

const imageExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);

function toSitePath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function readTextFile(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function getFirstMatchingFile(dir, predicate) {
  return fs
    .readdirSync(dir)
    .map((fileName) => path.join(dir, fileName))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .find(predicate);
}

function getPromptFile(workDir) {
  const preferred = path.join(workDir, "prompt.txt");
  if (fs.existsSync(preferred)) return preferred;

  return getFirstMatchingFile(workDir, (filePath) => path.extname(filePath).toLowerCase() === ".txt");
}

function getImageFile(workDir) {
  const preferredNames = ["result.webp", "preview.webp", "image.webp", "result.png", "preview.png"];
  for (const fileName of preferredNames) {
    const filePath = path.join(workDir, fileName);
    if (fs.existsSync(filePath)) return filePath;
  }

  return getFirstMatchingFile(workDir, (filePath) => imageExtensions.has(path.extname(filePath).toLowerCase()));
}

function getDescription(workDir) {
  const descriptionPath = path.join(workDir, "description.txt");
  if (!fs.existsSync(descriptionPath)) return "";
  return readTextFile(descriptionPath);
}

function getLink(workDir) {
  const linkPath = path.join(workDir, "link.txt");
  if (!fs.existsSync(linkPath)) return "";
  return readTextFile(linkPath);
}

function getWorkDirs(subcategoryDir) {
  return fs
    .readdirSync(subcategoryDir)
    .map((fileName) => path.join(subcategoryDir, fileName))
    .filter((filePath) => fs.statSync(filePath).isDirectory());
}

function buildItems() {
  const items = [];

  for (const [mainCategory, mainConfig] of Object.entries(categories)) {
    const mainDir = path.join(examplesDir, mainCategory);
    if (!fs.existsSync(mainDir)) continue;

    for (const [subCategory, subCategoryLabel] of Object.entries(mainConfig.subcategories)) {
      const subcategoryDir = path.join(mainDir, subCategory);
      if (!fs.existsSync(subcategoryDir)) continue;

      for (const workDir of getWorkDirs(subcategoryDir)) {
        const promptFile = getPromptFile(workDir);
        const imageFile = getImageFile(workDir);

        if (!promptFile) {
          console.warn(`Skipped: ${workDir} has no prompt.txt or .txt file.`);
          continue;
        }

        const title = path.basename(workDir);
        const item = {
          title,
          mainCategory,
          mainCategoryLabel: mainConfig.label,
          subCategory,
          subCategoryLabel,
          tool:
            mainCategory === "vba"
              ? "VBA"
              : mainCategory === "appscript"
                ? "Apps Script"
                : mainCategory === "notebooklm"
                  ? "NotebookLM"
                  : "Image AI",
          size: "",
          image: imageFile ? toSitePath(imageFile) : "",
          description: getDescription(workDir),
          prompt: readTextFile(promptFile),
        };

        const link = getLink(workDir);
        if (link) item.link = link;

        items.push(item);
      }
    }
  }

  return items;
}

const items = buildItems();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");

console.log(`Wrote ${items.length} prompt item(s) to ${toSitePath(outputPath)}.`);
