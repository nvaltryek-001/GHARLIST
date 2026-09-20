import fs from "fs";
import path from "path";

const root = process.cwd();

const dirs = [
  "src/components",
  "src/pages",
  "src/services",
  "src/store",
  "src/utils",
  "src/styles"
];

for (const dir of dirs) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}

const files = {

"src/services/productService.js": `
let productsCache = null;

export async function loadProducts() {
  if (productsCache) return productsCache;

  const response = await fetch("/data/products.json");

  if (!response.ok) {
    throw new Error("Unable to load product dataset");
  }

  productsCache = await response.json();
  return productsCache;
}

export async function getProductById(id) {
  const products = await loadProducts();
  return products.find(product => product.id === id) || null;
}

export async function getCategories() {
  const products = await loadProducts();

  return [...new Set(
    products
      .map(product => product.category)
      .filter(Boolean)
  )].sort();
}

export async function getBrands() {
  const products = await loadProducts();

  return [...new Set(
    products
      .map(product => product.brand)
      .filter(Boolean)
  )].sort();
}

export async function getProductsByCategory(category) {
  const products = await loadProducts();

  if (!category || category === "All") {
    return products;
  }

  return products.filter(product => product.category === category);
}

export async function searchProducts(query, products = null) {
  const data = products || await loadProducts();

  const q = String(query || "").trim().toLowerCase();

  if (!q) return data;

  return data.filter(product => {
    const text = [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.quantity,
      product.description,
      product.breadcrumbs
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(q);
  });
}

export function filterProducts(products, {
  category = "All",
  brand = "All",
  minPrice = "",
  maxPrice = ""
} = {}) {
  return products.filter(product => {
    if (category !== "All" && product.category !== category) {
      return false;
    }

    if (brand !== "All" && product.brand !== brand) {
      return false;
    }

    const price = Number(product.salePrice || product.mrp || 0);

    if (minPrice !== "" && price < Number(minPrice)) {
      return false;
    }

    if (maxPrice !== "" && price > Number(maxPrice)) {
      return false;
    }

    return true;
  });
}
`,

"src/services/storageService.js": `
const LIST_KEY = "gharlist-current-list";
const HISTORY_KEY = "gharlist-history";

export function loadCurrentList() {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCurrentList(list) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export function clearCurrentList() {
  localStorage.removeItem(LIST_KEY);
}

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function addHistoryEntry(entry) {
  const history = loadHistory();

  history.unshift(entry);

  saveHistory(history);

  return history;
}

export function deleteHistoryEntry(id) {
  const history = loadHistory().filter(item => item.id !== id);

  saveHistory(history);

  return history;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
`,

"src/store/shoppingStore.js": `
import { create } from "zustand";
import {
  loadCurrentList,
  saveCurrentList,
  clearCurrentList
} from "../services/storageService";

const initialItems = loadCurrentList();

export const useShoppingStore = create((set, get) => ({
  items: initialItems,

  addItem: product => {
    const items = get().items;

    const existing = items.find(item => item.productId === product.id);

    let updated;

    if (existing) {
      updated = items.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updated = [
        ...items,
        {
          productId: product.id,
          product,
          quantity: 1
        }
      ];
    }

    saveCurrentList(updated);
    set({ items: updated });
  },

  removeItem: productId => {
    const updated = get().items.filter(
      item => item.productId !== productId
    );

    saveCurrentList(updated);
    set({ items: updated });
  },

  setQuantity: (productId, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);

    const updated = get().items.map(item =>
      item.productId === productId
        ? { ...item, quantity: value }
        : item
    );

    saveCurrentList(updated);
    set({ items: updated });
  },

  increment: productId => {
    const item = get().items.find(
      item => item.productId === productId
    );

    if (item) {
      get().setQuantity(productId, item.quantity + 1);
    }
  },

  decrement: productId => {
    const item = get().items.find(
      item => item.productId === productId
    );

    if (!item) return;

    if (item.quantity <= 1) {
      get().removeItem(productId);
    } else {
      get().setQuantity(productId, item.quantity - 1);
    }
  },

  clearList: () => {
    clearCurrentList();
    set({ items: [] });
  },

  totalUnits: () =>
    get().items.reduce(
      (sum, item) => sum + item.quantity,
      0
    ),

  totalAmount: () =>
    get().items.reduce(
      (sum, item) =>
        sum +
        Number(item.product.salePrice || item.product.mrp || 0) *
        item.quantity,
      0
    )
}));
`,

"src/services/voiceService.js": `
let recognition = null;

export function isVoiceSupported() {
  return Boolean(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  );
}

export function startVoiceRecognition({
  lang = "en-IN",
  onResult,
  onError,
  onEnd
} = {}) {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError?.("Voice recognition is not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = event => {
    const transcript =
      event.results?.[0]?.[0]?.transcript || "";

    onResult?.(transcript);
  };

  recognition.onerror = event => {
    onError?.(event.error || "Voice recognition failed");
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();
}

export function stopVoiceRecognition() {
  recognition?.stop();
  recognition = null;
}
`,

"src/services/reportService.js": `
export function buildReport(items) {
  const totalUnits = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = items.reduce(
    (sum, item) =>
      sum +
      Number(item.product.salePrice || item.product.mrp || 0) *
      item.quantity,
    0
  );

  return {
    items,
    totalUnits,
    totalAmount,
    createdAt: new Date().toISOString()
  };
}

export function reportToText(report) {
  const lines = [
    "GHARLIST SHOPPING LIST",
    "",
    `Items: ${report.items.length}`,
    `Units: ${report.totalUnits}`,
    `Total: ₹${report.totalAmount.toFixed(2)}`,
    ""
  ];

  report.items.forEach((item, index) => {
    const price =
      Number(
        item.product.salePrice ||
        item.product.mrp ||
        0
      );

    lines.push(
      `${index + 1}. ${item.product.name} (${item.product.quantity || "1"}) x ${item.quantity} - ₹${(price * item.quantity).toFixed(2)}`
    );
  });

  return lines.join("\\n");
}
`,

"src/services/shareService.js": `
import { reportToText } from "./reportService";

export async function shareReport(report) {
  const text = reportToText(report);

  if (navigator.share) {
    await navigator.share({
      title: "GHARLIST Shopping List",
      text
    });

    return true;
  }

  await navigator.clipboard.writeText(text);

  return false;
}

export async function copyReport(report) {
  await navigator.clipboard.writeText(
    reportToText(report)
  );
}

export function shareWhatsApp(report) {
  const text = encodeURIComponent(
    reportToText(report)
  );

  window.open(
    "https://wa.me/?text=" + text,
    "_blank",
    "noopener,noreferrer"
  );
}

export function shareEmail(report) {
  const subject = encodeURIComponent(
    "GHARLIST Shopping List"
  );

  const body = encodeURIComponent(
    reportToText(report)
  );

  window.location.href =
    \`mailto:?subject=\${subject}&body=\${body}\`;
}

export function printReport() {
  window.print();
}
`
};

for (const [file, content] of Object.entries(files)) {
  fs.writeFileSync(
    path.join(root, file),
    content.trimStart(),
    "utf8"
  );

  console.log("CREATED:", file);
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST FLOW FOUNDATION CREATED");
console.log("==============================================");
console.log("Dataset loader       ✓");
console.log("Search/filter        ✓");
console.log("Zustand shopping     ✓");
console.log("LocalStorage         ✓");
console.log("Voice service        ✓");
console.log("Report service       ✓");
console.log("Share service        ✓");
console.log("History storage      ✓");
console.log("");
console.log("NEXT: UI FLOW");
console.log("==============================================");
