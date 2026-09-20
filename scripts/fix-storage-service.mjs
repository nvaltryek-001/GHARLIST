import fs from "fs";
import path from "path";

const file = path.join(
  process.cwd(),
  "src/services/storageService.js"
);

fs.mkdirSync(path.dirname(file), { recursive: true });

fs.writeFileSync(file, `
const CURRENT_LIST_KEY = "gharlist-current-list";
const HISTORY_KEY = "gharlist-history";

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) return fallback;

    const parsed = JSON.parse(value);

    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

/* =========================
   CURRENT SHOPPING LIST
========================= */

export function loadCurrentList() {
  return readJSON(
    CURRENT_LIST_KEY,
    []
  );
}

export function saveCurrentList(items) {
  writeJSON(
    CURRENT_LIST_KEY,
    Array.isArray(items) ? items : []
  );
}

export function clearCurrentList() {
  localStorage.removeItem(
    CURRENT_LIST_KEY
  );
}

/* =========================
   HISTORY
========================= */

export function loadHistory() {
  return readJSON(
    HISTORY_KEY,
    []
  );
}

export function saveHistory(history) {
  writeJSON(
    HISTORY_KEY,
    Array.isArray(history) ? history : []
  );
}

export function addHistory(report) {
  const history = loadHistory();

  const entry = {
    id:
      globalThis.crypto?.randomUUID?.() ||
      \`history-\${Date.now()}\`,
    ...report,
    createdAt:
      report?.createdAt ||
      new Date().toISOString()
  };

  const next = [
    entry,
    ...history
  ];

  saveHistory(next);

  return entry;
}

export function deleteHistory(id) {
  const next = loadHistory().filter(
    item => String(item.id) !== String(id)
  );

  saveHistory(next);

  return next;
}

export function clearHistory() {
  localStorage.removeItem(
    HISTORY_KEY
  );
}

/* =========================
   GENERIC STORAGE HELPERS
========================= */

export function getStorageItem(key, fallback = null) {
  return readJSON(key, fallback);
}

export function setStorageItem(key, value) {
  writeJSON(key, value);
}

export function removeStorageItem(key) {
  localStorage.removeItem(key);
}
`, "utf8");

console.log("✓ storageService.js fixed");
console.log("✓ Current list storage");
console.log("✓ History storage");
console.log("✓ Delete/Clear history");
console.log("✓ Store-compatible exports");
