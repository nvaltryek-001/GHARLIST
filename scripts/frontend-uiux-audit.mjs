import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const REPORT_DIR = path.join(ROOT, "reports");

fs.mkdirSync(REPORT_DIR, { recursive: true });

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const mdPath = path.join(
  REPORT_DIR,
  `frontend-uiux-audit-${stamp}.md`
);

const jsonPath = path.join(
  REPORT_DIR,
  `frontend-uiux-audit-${stamp}.json`
);

const results = {
  meta: {
    project: "GHARLIST",
    root: ROOT,
    timestamp: new Date().toISOString(),
    mode: "READ-ONLY FRONTEND + UI/UX AUDIT"
  },

  summary: {
    pass: 0,
    warn: 0,
    fail: 0
  },

  sections: [],

  recommendation: {
    decision: "UNDECIDED",
    reasons: []
  }
};

function section(name) {
  const item = {
    name,
    checks: []
  };

  results.sections.push(item);

  console.log("");
  console.log("============================================================");
  console.log(name);
  console.log("============================================================");

  return item;
}

let currentSection = null;

function check(status, name, detail = "") {
  const item = {
    status,
    name,
    detail
  };

  if (!currentSection) {
    currentSection = section("GENERAL");
  }

  currentSection.checks.push(item);

  if (status === "PASS") {
    results.summary.pass++;
    console.log(`[PASS] ${name}${detail ? " — " + detail : ""}`);
  }

  if (status === "WARN") {
    results.summary.warn++;
    console.log(`[WARN] ${name}${detail ? " — " + detail : ""}`);
  }

  if (status === "FAIL") {
    results.summary.fail++;
    console.log(`[FAIL] ${name}${detail ? " — " + detail : ""}`);
  }
}

function read(file) {
  try {
    return fs.readFileSync(
      path.join(ROOT, file),
      "utf8"
    );
  } catch {
    return "";
  }
}

function exists(file) {
  return fs.existsSync(
    path.join(ROOT, file)
  );
}

function sourceFiles(dir = SRC) {
  if (!fs.existsSync(dir)) return [];

  const output = [];

  function walk(folder) {
    for (const entry of fs.readdirSync(folder, {
      withFileTypes: true
    })) {
      const full = path.join(folder, entry.name);

      if (entry.isDirectory()) {
        if (
          ![
            "node_modules",
            "dist",
            ".git"
          ].includes(entry.name)
        ) {
          walk(full);
        }
      } else if (
        /\.(jsx?|tsx?|css|scss)$/.test(entry.name)
      ) {
        output.push(full);
      }
    }
  }

  walk(dir);

  return output;
}

function rel(file) {
  return path.relative(ROOT, file);
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

const files = sourceFiles();

console.log("");
console.log("============================================================");
console.log("       GHARLIST — FRONTEND + UI/UX MASTER AUDIT");
console.log("============================================================");
console.log(`Root: ${ROOT}`);
console.log(`Source files scanned: ${files.length}`);
console.log("MODE: READ ONLY — NO SOURCE FILES WILL BE MODIFIED");


// ============================================================
// 1. PROJECT STRUCTURE
// ============================================================

currentSection = section("1. PROJECT STRUCTURE");

const requiredFiles = [
  "package.json",
  "package-lock.json",
  "index.html",
  "vite.config.js",
  "vercel.json",

  "src/App.jsx",
  "src/main.jsx",
  "src/styles/index.css",

  "src/pages/Products.jsx",
  "src/pages/ProductDetail.jsx",
  "src/pages/Voice.jsx",
  "src/pages/MyList.jsx",
  "src/pages/Report.jsx",
  "src/pages/Share.jsx",
  "src/pages/History.jsx",
  "src/pages/NewList.jsx",

  "src/components/ProductCard.jsx",
  "src/components/ProductGrid.jsx",
  "src/components/ProductImage.jsx",

  "src/services/productService.js",
  "src/services/voiceService.js",
  "src/services/reportService.js",
  "src/services/reportImageService.js",
  "src/services/shareService.js",
  "src/services/imageService.js",
  "src/services/storageService.js",

  "src/store/shoppingStore.js",

  "public/data/products.json",
  "api/image-proxy.js"
];

for (const file of requiredFiles) {
  if (exists(file)) {
    check("PASS", file);
  } else {
    check("FAIL", file, "required file missing");
  }
}


// ============================================================
// 2. SOURCE INVENTORY
// ============================================================

currentSection = section("2. SOURCE INVENTORY");

const jsxFiles = files.filter(
  f => /\.jsx$/.test(f)
);

const jsFiles = files.filter(
  f => /\.js$/.test(f)
);

const cssFiles = files.filter(
  f => /\.(css|scss)$/.test(f)
);

check(
  jsxFiles.length > 0
    ? "PASS"
    : "FAIL",
  "JSX source detected",
  `${jsxFiles.length} files`
);

check(
  cssFiles.length > 0
    ? "PASS"
    : "FAIL",
  "CSS source detected",
  `${cssFiles.length} files`
);

console.log("");

for (const file of jsxFiles) {
  console.log(`  JSX  ${rel(file)}`);
}

for (const file of cssFiles) {
  console.log(`  CSS  ${rel(file)}`);
}


// ============================================================
// 3. PACKAGE / STACK
// ============================================================

currentSection = section("3. PACKAGE + FRONTEND STACK");

let packageJson = {};

try {
  packageJson = JSON.parse(
    read("package.json")
  );

  check(
    "PASS",
    "package.json valid"
  );
} catch (error) {
  check(
    "FAIL",
    "package.json parse",
    error.message
  );
}

const dependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {})
};

for (const name of [
  "react",
  "react-dom",
  "react-router-dom",
  "lucide-react",
  "zustand",
  "vite"
]) {
  if (dependencies[name]) {
    check(
      "PASS",
      `Dependency: ${name}`,
      dependencies[name]
    );
  } else {
    check(
      "WARN",
      `Dependency: ${name}`,
      "not declared"
    );
  }
}


// ============================================================
// 4. ROUTING
// ============================================================

currentSection = section("4. ROUTING + NAVIGATION");

const app = read("src/App.jsx");

const routes = [
  "/",
  "/products",
  "/product/:id",
  "/voice",
  "/my-list",
  "/report",
  "/share",
  "/history",
  "/new-list"
];

for (const route of routes) {
  const escaped = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (
    new RegExp(
      `path\\s*=\\s*["']${escaped}["']`
    ).test(app)
  ) {
    check(
      "PASS",
      `Route ${route}`
    );
  } else {
    check(
      "FAIL",
      `Route ${route}`,
      "route not detected"
    );
  }
}

if (app.includes("NavLink")) {
  check(
    "PASS",
    "React navigation detected"
  );
} else {
  check(
    "WARN",
    "Navigation links",
    "NavLink not detected"
  );
}


// ============================================================
// 5. HEADER / NAVIGATION UX
// ============================================================

currentSection = section("5. HEADER + NAVIGATION UX");

for (const token of [
  "top-header",
  "desktop-nav",
  "mobile-nav",
  "brand-logo"
]) {
  if (app.includes(token)) {
    check(
      "PASS",
      `Navigation token: ${token}`
    );
  } else {
    check(
      "WARN",
      `Navigation token: ${token}`,
      "not detected"
    );
  }
}

if (
  app.includes("mobile-nav") &&
  app.includes("desktop-nav")
) {
  check(
    "PASS",
    "Desktop/mobile navigation architecture"
  );
} else {
  check(
    "WARN",
    "Responsive navigation architecture"
  );
}


// ============================================================
// 6. PAGE CONTENT COVERAGE
// ============================================================

currentSection = section("6. PAGE UX COVERAGE");

const pageChecks = {
  "Products.jsx": [
    "Search",
    "search",
    "filter",
    "Load More"
  ],

  "Voice.jsx": [
    "SpeechRecognition",
    "Add All",
    "View My List"
  ],

  "MyList.jsx": [
    "quantity",
    "remove",
    "Report"
  ],

  "Report.jsx": [
    "Shopping Report",
    "Share",
    "Print"
  ],

  "Share.jsx": [
    "WhatsApp",
    "Email",
    "Print"
  ],

  "History.jsx": [
    "History"
  ],

  "NewList.jsx": [
    "New"
  ]
};

for (const [file, tokens] of Object.entries(pageChecks)) {
  const filePath = `src/pages/${file}`;
  const text = read(filePath);

  if (!text) {
    check(
      "FAIL",
      `${file} readable`
    );
    continue;
  }

  check(
    "PASS",
    `${file} exists`
  );

  for (const token of tokens) {
    if (
      text.toLowerCase()
        .includes(token.toLowerCase())
    ) {
      check(
        "PASS",
        `${file}: ${token}`
      );
    } else {
      check(
        "WARN",
        `${file}: ${token}`,
        "token not detected"
      );
    }
  }
}


// ============================================================
// 7. PRODUCTS PAGE UX
// ============================================================

currentSection = section("7. PRODUCTS PAGE UI/UX");

const productsPage =
  read("src/pages/Products.jsx");

const productsCss =
  read("src/styles/index.css");

const productsChecks = [
  ["search input", /<input/i],
  ["select/filter control", /<select/i],
  ["ProductGrid", /ProductGrid/i],
  ["Load More", /Load More/i],
  ["Clear filters", /Clear filters/i],
  ["category", /category/i],
  ["brand", /brand/i]
];

for (const [name, regex] of productsChecks) {
  check(
    regex.test(productsPage)
      ? "PASS"
      : "WARN",
    `Products: ${name}`
  );
}

if (
  /discount|% OFF/i.test(productsPage)
) {
  check(
    "WARN",
    "Products discount UI",
    "discount-related token exists; inspect visually"
  );
} else {
  check(
    "PASS",
    "Products discount UI absent"
  );
}


// ============================================================
// 8. LOAD MORE UX
// ============================================================

currentSection = section("8. LOAD MORE UX");

if (
  /Load More/i.test(productsPage)
) {
  check(
    "PASS",
    "Load More action exists"
  );
} else {
  check(
    "FAIL",
    "Load More action"
  );
}

const loadMoreCssHits = [
  "load-more",
  "loadmore",
  "pagination"
].filter(
  token =>
    productsCss
      .toLowerCase()
      .includes(token.toLowerCase())
);

if (loadMoreCssHits.length) {
  check(
    "PASS",
    "Load More has CSS coverage",
    loadMoreCssHits.join(", ")
  );
} else {
  check(
    "WARN",
    "Load More CSS coverage",
    "could fall back to browser/default styling"
  );
}


// ============================================================
// 9. CLEAR FILTER UX
// ============================================================

currentSection = section("9. FILTER / CLEAR-FILTER UX");

const clearFilterMatches =
  productsPage.match(
    /clear filters/gi
  ) || [];

if (clearFilterMatches.length) {
  check(
    "PASS",
    "Clear filters exists"
  );
} else {
  check(
    "WARN",
    "Clear filters"
  );
}

const filterCssTokens = [
  "filter",
  "filters",
  "chip",
  "badge",
  "select"
];

const filterHits = filterCssTokens.filter(
  token =>
    productsCss
      .toLowerCase()
      .includes(token)
);

if (filterHits.length >= 2) {
  check(
    "PASS",
    "Filter CSS architecture",
    filterHits.join(", ")
  );
} else {
  check(
    "WARN",
    "Filter CSS architecture",
    "limited filter styling detected"
  );
}


// ============================================================
// 10. PRODUCT CARD
// ============================================================

currentSection = section("10. PRODUCT CARD UI/UX");

const productCard =
  read("src/components/ProductCard.jsx");

for (const token of [
  "ProductImage",
  "product-card",
  "add-button",
  "product-price",
  "quantity"
]) {
  if (
    productCard.includes(token) ||
    productsCss.includes(token)
  ) {
    check(
      "PASS",
      `Product card: ${token}`
    );
  } else {
    check(
      "WARN",
      `Product card: ${token}`
    );
  }
}

if (
  /onClick\s*=\s*\{/.test(productCard)
) {
  check(
    "PASS",
    "Product card interaction"
  );
}


// ============================================================
// 11. BUTTON UX
// ============================================================

currentSection = section("11. BUTTON SYSTEM");

const allSource =
  files
    .filter(
      f => /\.(jsx|tsx)$/.test(f)
    )
    .map(
      f => fs.readFileSync(f, "utf8")
    )
    .join("\n");

const buttonCount =
  countMatches(
    allSource,
    /<button\b/gi
  );

const buttonTypeCount =
  countMatches(
    allSource,
    /<button\b[^>]*type\s*=/gi
  );

console.log(
  `Buttons detected: ${buttonCount}`
);

console.log(
  `Buttons with explicit type: ${buttonTypeCount}`
);

if (
  buttonCount === 0
) {
  check(
    "WARN",
    "Buttons",
    "no button elements detected"
  );
} else if (
  buttonTypeCount === buttonCount
) {
  check(
    "PASS",
    "All buttons declare type"
  );
} else {
  check(
    "WARN",
    "Buttons missing explicit type",
    `${buttonCount - buttonTypeCount}`
  );
}

const buttonCss =
  productsCss;

if (
  /\.add-button|\.primary|\.btn|button\s*\{/i.test(
    buttonCss
  )
) {
  check(
    "PASS",
    "Button styling detected"
  );
} else {
  check(
    "WARN",
    "Button styling",
    "possible browser-default buttons"
  );
}


// ============================================================
// 12. FORM / INPUT UX
// ============================================================

currentSection = section("12. FORM + INPUT UX");

const inputCount =
  countMatches(
    allSource,
    /<(input|select|textarea)\b/gi
  );

const labelCount =
  countMatches(
    allSource,
    /<label\b/gi
  );

console.log(`Form controls: ${inputCount}`);
console.log(`Labels: ${labelCount}`);

if (
  inputCount === 0
) {
  check(
    "WARN",
    "Form controls",
    "none detected"
  );
} else {
  check(
    "PASS",
    "Form controls detected"
  );
}

if (
  labelCount > 0
) {
  check(
    "PASS",
    "Labels detected"
  );
} else {
  check(
    "WARN",
    "Form labels",
    "no <label> elements detected"
  );
}


// ============================================================
// 13. ACCESSIBILITY
// ============================================================

currentSection = section("13. ACCESSIBILITY");

const imgCount =
  countMatches(
    allSource,
    /<img\b/gi
  );

const altCount =
  countMatches(
    allSource,
    /<img\b[^>]*\balt\s*=/gi
  );

console.log(
  `IMG elements: ${imgCount}`
);

console.log(
  `IMG elements with alt: ${altCount}`
);

if (
  imgCount === 0 ||
  altCount === imgCount
) {
  check(
    "PASS",
    "Image alt coverage"
  );
} else {
  check(
    "WARN",
    "Image alt coverage",
    `${imgCount - altCount} image(s) may lack alt`
  );
}

const ariaCount =
  countMatches(
    allSource,
    /\baria-[a-z-]+\s*=/gi
  );

if (ariaCount > 0) {
  check(
    "PASS",
    "ARIA attributes detected",
    ariaCount
  );
} else {
  check(
    "WARN",
    "ARIA coverage",
    "no ARIA attributes detected"
  );
}

if (
  /role\s*=\s*["']button["']/.test(
    allSource
  )
) {
  check(
    "PASS",
    "Keyboard/clickable role support detected"
  );
}


// ============================================================
// 14. IMAGE SYSTEM
// ============================================================

currentSection = section("14. PRODUCT IMAGE UX");

const imageService =
  read("src/services/imageService.js");

const productImage =
  read("src/components/ProductImage.jsx");

for (const token of [
  "getImageCandidates",
  "cdn.dmart.in"
]) {
  if (
    imageService.includes(token) ||
    productImage.includes(token)
  ) {
    check(
      "PASS",
      `Image system: ${token}`
    );
  } else {
    check(
      "WARN",
      `Image system: ${token}`
    );
  }
}

if (
  /Image unavailable/i.test(
    productImage
  )
) {
  check(
    "PASS",
    "Image fallback state"
  );
} else {
  check(
    "WARN",
    "Image fallback state"
  );
}


// ============================================================
// 15. REPORT UX
// ============================================================

currentSection = section("15. REPORT UI/UX");

const reportPage =
  read("src/pages/Report.jsx");

const reportCss =
  productsCss;

for (const token of [
  "Shopping Report",
  "Qty",
  "Share",
  "Print"
]) {
  check(
    reportPage.includes(token)
      ? "PASS"
      : "WARN",
    `Report: ${token}`
  );
}

const reportSelectors = [
  "report-page",
  "report-item",
  "report-image",
  "report-summary",
  "report-actions",
  "report-content"
];

for (const selector of reportSelectors) {
  if (
    reportCss.includes(`.${selector}`)
  ) {
    check(
      "PASS",
      `Report CSS: .${selector}`
    );
  } else {
    check(
      "WARN",
      `Report CSS: .${selector}`,
      "selector not detected"
    );
  }
}


// ============================================================
// 16. MY LIST UX
// ============================================================

currentSection = section("16. MY LIST UI/UX");

const myList =
  read("src/pages/MyList.jsx");

for (const token of [
  "increment",
  "decrement",
  "remove",
  "quantity",
  "totalAmount"
]) {
  check(
    myList.includes(token)
      ? "PASS"
      : "WARN",
    `My List: ${token}`
  );
}

const myListCssTokens = [
  "shopping-list",
  "shopping-list-item",
  "shopping-list-image",
  "shopping-list-info",
  "shopping-list-actions",
  "quantity-control",
  "line-total",
  "list-summary"
];

for (const token of myListCssTokens) {
  check(
    productsCss.includes(`.${token}`)
      ? "PASS"
      : "WARN",
    `My List CSS: .${token}`
  );
}


// ============================================================
// 17. VOICE UX
// ============================================================

currentSection = section("17. VOICE UI/UX");

const voice =
  read("src/pages/Voice.jsx");

const voiceService =
  read("src/services/voiceService.js");

for (const token of [
  "SpeechRecognition",
  "en-IN",
  "hi-IN",
  "kn-IN",
  "Add All",
  "View My List"
]) {
  check(
    voice.includes(token) ||
    voiceService.includes(token)
      ? "PASS"
      : "WARN",
    `Voice: ${token}`
  );
}

for (const token of [
  "voice-card",
  "large-mic"
]) {
  check(
    productsCss.includes(`.${token}`)
      ? "PASS"
      : "WARN",
    `Voice CSS: .${token}`
  );
}


// ============================================================
// 18. RESPONSIVE DESIGN
// ============================================================

currentSection = section("18. RESPONSIVE DESIGN");

const mediaQueries =
  productsCss.match(
    /@media\s*\([^)]*\)/gi
  ) || [];

check(
  mediaQueries.length > 0
    ? "PASS"
    : "FAIL",
  "Media queries",
  `${mediaQueries.length}`
);

const breakpoints = [
  "680px",
  "768px",
  "900px",
  "1024px",
  "1200px",
  "1440px"
];

for (const bp of breakpoints) {
  if (
    productsCss.includes(bp)
  ) {
    check(
      "PASS",
      `Breakpoint ${bp}`
    );
  }
}

if (
  /max-width\s*:\s*100%/i.test(
    productsCss
  ) ||
  /width\s*:\s*100%/i.test(
    productsCss
  )
) {
  check(
    "PASS",
    "Responsive width rules detected"
  );
} else {
  check(
    "WARN",
    "Responsive width rules",
    "limited evidence"
  );
}


// ============================================================
// 19. DANGEROUS FIXED DIMENSIONS
// ============================================================

currentSection = section("19. FIXED SIZE / OVERFLOW AUDIT");

const fixedWidths =
  productsCss.match(
    /width\s*:\s*\d{3,4}px/gi
  ) || [];

const fixedHeights =
  productsCss.match(
    /height\s*:\s*\d{3,4}px/gi
  ) || [];

const overflowHidden =
  productsCss.match(
    /overflow\s*:\s*hidden/gi
  ) || [];

console.log(
  `Large fixed widths: ${fixedWidths.length}`
);

console.log(
  `Large fixed heights: ${fixedHeights.length}`
);

console.log(
  `overflow:hidden rules: ${overflowHidden.length}`
);

if (
  fixedWidths.length <= 10
) {
  check(
    "PASS",
    "Large fixed-width audit",
    `${fixedWidths.length}`
  );
} else {
  check(
    "WARN",
    "Many fixed widths",
    `${fixedWidths.length}`
  );
}

if (
  overflowHidden.length <= 15
) {
  check(
    "PASS",
    "Overflow hidden usage"
  );
} else {
  check(
    "WARN",
    "Heavy overflow:hidden usage",
    `${overflowHidden.length}`
  );
}


// ============================================================
// 20. INLINE STYLE AUDIT
// ============================================================

currentSection = section("20. INLINE STYLE AUDIT");

const inlineStyles =
  countMatches(
    allSource,
    /\bstyle\s*=\s*\{/gi
  );

if (
  inlineStyles === 0
) {
  check(
    "PASS",
    "No JSX inline style blocks"
  );
} else {
  check(
    "WARN",
    "JSX inline styles",
    `${inlineStyles}`
  );
}


// ============================================================
// 21. RAW HTML / BROWSER DEFAULT UI
// ============================================================

currentSection = section("21. BROWSER-DEFAULT UI AUDIT");

const rawButtonFiles = [];

for (const file of jsxFiles) {
  const text = fs.readFileSync(
    file,
    "utf8"
  );

  if (
    /<button\b/.test(text) &&
    !/className\s*=/.test(text)
  ) {
    rawButtonFiles.push(
      rel(file)
    );
  }
}

if (
  rawButtonFiles.length === 0
) {
  check(
    "PASS",
    "Buttons appear class-styled"
  );
} else {
  check(
    "WARN",
    "Possible unstyled buttons",
    rawButtonFiles.join(", ")
  );
}

if (
  /button\s*\{/i.test(productsCss)
) {
  check(
    "PASS",
    "Global button styling detected"
  );
} else {
  check(
    "WARN",
    "Global button styling",
    "check individual button classes"
  );
}


// ============================================================
// 22. TYPOGRAPHY
// ============================================================

currentSection = section("22. TYPOGRAPHY");

const fontFamilies =
  productsCss.match(
    /font-family\s*:[^;]+/gi
  ) || [];

const fontSizes =
  productsCss.match(
    /font-size\s*:\s*[^;]+/gi
  ) || [];

check(
  fontFamilies.length
    ? "PASS"
    : "WARN",
  "Font family rules",
  `${fontFamilies.length}`
);

check(
  fontSizes.length
    ? "PASS"
    : "WARN",
  "Font size rules",
  `${fontSizes.length}`
);

if (
  /clamp\s*\(/i.test(
    productsCss
  )
) {
  check(
    "PASS",
    "Fluid typography detected"
  );
} else {
  check(
    "WARN",
    "Fluid typography",
    "clamp() not detected"
  );
}


// ============================================================
// 23. DESIGN SYSTEM
// ============================================================

currentSection = section("23. DESIGN SYSTEM");

const cssVariables =
  productsCss.match(
    /--[a-zA-Z0-9_-]+\s*:/g
  ) || [];

if (
  cssVariables.length >= 5
) {
  check(
    "PASS",
    "CSS design tokens",
    `${cssVariables.length}`
  );
} else {
  check(
    "WARN",
    "CSS design tokens",
    `${cssVariables.length}`
  );
}

const greenTokens =
  (
    productsCss.match(
      /#[0-9a-fA-F]{6}/g
    ) || []
  ).filter(
    c =>
      /0[0-9a-fA-F]([0-9a-fA-F]){4}/.test(c)
  );

check(
  "PASS",
  "Color rules detected",
  `${(productsCss.match(/#[0-9a-fA-F]{6}/g) || []).length} hex colors`
);


// ============================================================
// 24. EMPTY / LOADING / ERROR UX
// ============================================================

currentSection = section("24. EMPTY / LOADING / ERROR STATES");

const stateTokens = [
  "loading",
  "Loading",
  "error",
  "Error",
  "empty",
  "Empty",
  "No products",
  "No items"
];

for (const page of Object.keys(pageChecks)) {
  const text = read(
    `src/pages/${page}`
  );

  const hits = stateTokens.filter(
    token => text.includes(token)
  );

  if (hits.length >= 2) {
    check(
      "PASS",
      `${page} state handling`,
      hits.join(", ")
    );
  } else {
    check(
      "WARN",
      `${page} state handling`,
      "limited loading/error/empty evidence"
    );
  }
}


// ============================================================
// 25. PRODUCT DATASET
// ============================================================

currentSection = section("25. DATASET CONNECTION");

const dataPath =
  path.join(
    ROOT,
    "public/data/products.json"
  );

if (fs.existsSync(dataPath)) {
  try {
    const data =
      JSON.parse(
        fs.readFileSync(
          dataPath,
          "utf8"
        )
      );

    const products =
      Array.isArray(data)
        ? data
        : [];

    check(
      products.length === 5188
        ? "PASS"
        : "WARN",
      "Product dataset",
      `${products.length} records`
    );

    const ids = new Set(
      products
        .map(p => p?.id)
        .filter(Boolean)
    );

    check(
      ids.size === products.length
        ? "PASS"
        : "FAIL",
      "Product IDs unique",
      `${ids.size}/${products.length}`
    );

    const missingImage =
      products.filter(
        p =>
          !p?.image ||
          String(p.image).trim() === ""
      );

    check(
      missingImage.length === 0
        ? "PASS"
        : "WARN",
      "Product image metadata",
      `${missingImage.length} missing`
    );
  } catch (error) {
    check(
      "FAIL",
      "products.json parse",
      error.message
    );
  }
} else {
  check(
    "FAIL",
    "products.json",
    "missing"
  );
}


// ============================================================
// 26. STORE / BUSINESS LOGIC SAFETY
// ============================================================

currentSection = section("26. FRONTEND STATE SAFETY");

const store =
  read("src/store/shoppingStore.js");

for (const token of [
  "addItem",
  "removeItem",
  "increment",
  "decrement",
  "setQuantity",
  "clearList",
  "totalAmount"
]) {
  check(
    store.includes(token)
      ? "PASS"
      : "WARN",
    `Store: ${token}`
  );
}

if (
  /Number\.isFinite/.test(
    store
  )
) {
  check(
    "PASS",
    "Finite-number protection"
  );
} else {
  check(
    "WARN",
    "Finite-number protection"
  );
}

const sourceAll =
  files
    .map(
      f =>
        fs.readFileSync(f, "utf8")
    )
    .join("\n");

if (
  /\bNaN\b/.test(
    sourceAll
  )
) {
  check(
    "WARN",
    "NaN token found in source",
    "inspect before deployment"
  );
} else {
  check(
    "PASS",
    "No NaN token in source"
  );
}


// ============================================================
// 27. REPORT SERVICE
// ============================================================

currentSection = section("27. REPORT ENGINE");

const reportService =
  read("src/services/reportService.js");

for (const token of [
  "normalizeReport",
  "buildReport",
  "totalAmount",
  "totalUnits",
  "reportToText"
]) {
  check(
    reportService.includes(token)
      ? "PASS"
      : "WARN",
    `Report service: ${token}`
  );
}


// ============================================================
// 28. SHARE ENGINE
// ============================================================

currentSection = section("28. SHARE ENGINE");

const shareService =
  read("src/services/shareService.js");

for (const token of [
  "wa.me",
  "navigator.share",
  "copyReport",
  "shareEmail",
  "printReport"
]) {
  check(
    shareService.includes(token)
      ? "PASS"
      : "WARN",
    `Share service: ${token}`
  );
}


// ============================================================
// 29. DEPLOYMENT CONFIG
// ============================================================

currentSection = section("29. DEPLOYMENT");

const vercel =
  read("vercel.json");

if (
  vercel.includes("index.html")
) {
  check(
    "PASS",
    "Vercel SPA rewrite"
  );
} else {
  check(
    "WARN",
    "Vercel SPA rewrite"
  );
}

if (
  exists("api/image-proxy.js")
) {
  check(
    "PASS",
    "Image proxy"
  );
} else {
  check(
    "WARN",
    "Image proxy"
  );
}


// ============================================================
// 30. BUILD
// ============================================================

currentSection = section("30. PRODUCTION BUILD");

try {
  console.log("");
  console.log("Running npm run build...");

  execSync(
    "npm run build",
    {
      cwd: ROOT,
      stdio: "inherit"
    }
  );

  check(
    "PASS",
    "npm run build"
  );
} catch (error) {
  check(
    "FAIL",
    "npm run build",
    "production build failed"
  );
}


// ============================================================
// 31. SCREENSHOT-DERIVED VISUAL AUDIT
// ============================================================

currentSection = section(
  "31. VISUAL ISSUES OBSERVED FROM PROVIDED SCREENSHOTS"
);

const visualIssues = [
  {
    severity: "FAIL",
    issue: "Report item layout",
    detail:
      "Provided screenshot shows product image/content/quantity columns colliding or becoming extremely wide."
  },
  {
    severity: "FAIL",
    issue: "Report title/text wrapping",
    detail:
      "One report screenshot shows product title rendered vertically because the content column becomes too narrow."
  },
  {
    severity: "FAIL",
    issue: "Report horizontal spacing",
    detail:
      "Large unused horizontal spaces appear between image/content/price areas."
  },
  {
    severity: "WARN",
    issue: "Report metadata alignment",
    detail:
      "Brand/Pack metadata does not maintain a clean hierarchy relative to product title."
  },
  {
    severity: "WARN",
    issue: "Load More appearance",
    detail:
      "Provided Products screenshot shows a browser-default-looking Load More button."
  },
  {
    severity: "WARN",
    issue: "Clear filters appearance",
    detail:
      "Provided Products screenshot shows Clear filters visually weaker than the surrounding GHARLIST design system."
  },
  {
    severity: "WARN",
    issue: "Products filter toolbar",
    detail:
      "Search/category/brand controls need stronger responsive layout and consistent heights."
  },
  {
    severity: "WARN",
    issue: "Products vertical rhythm",
    detail:
      "Large unused areas appear around the filter/result sections."
  }
];

for (const issue of visualIssues) {
  check(
    issue.severity,
    issue.issue,
    issue.detail
  );
}


// ============================================================
// 32. ARCHITECTURE REBUILD DETECTION
// ============================================================

currentSection = section(
  "32. PATCH VS FRONTEND REBUILD ANALYSIS"
);

const failCount =
  results.summary.fail;

const warnCount =
  results.summary.warn;

const coreArchitectureHealthy =
  exists("src/App.jsx") &&
  exists("src/pages/Products.jsx") &&
  exists("src/pages/Voice.jsx") &&
  exists("src/pages/MyList.jsx") &&
  exists("src/pages/Report.jsx") &&
  exists("src/pages/Share.jsx") &&
  exists("src/services/productService.js") &&
  exists("src/services/voiceService.js") &&
  exists("src/services/reportService.js") &&
  exists("src/services/shareService.js") &&
  exists("src/store/shoppingStore.js");

const hasHugeSource =
  files.some(
    file => {
      try {
        return fs.statSync(file).size > 300000;
      } catch {
        return false;
      }
    }
  );

if (
  coreArchitectureHealthy &&
  !hasHugeSource &&
  failCount <= 5
) {
  results.recommendation.decision =
    "PATCH_EXISTING_FRONTEND";

  results.recommendation.reasons.push(
    "Core frontend architecture exists."
  );

  results.recommendation.reasons.push(
    "Pages/services/store are already separated."
  );

  results.recommendation.reasons.push(
    "Current problems are predominantly UI/UX/CSS presentation issues."
  );

  results.recommendation.reasons.push(
    "Rebuilding everything would introduce unnecessary regression risk."
  );

  check(
    "PASS",
    "Architecture suitable for targeted UI patching"
  );

} else {
  results.recommendation.decision =
    "CONSIDER_FRONTEND_REBUILD";

  results.recommendation.reasons.push(
    "Core structural problems were detected."
  );

  results.recommendation.reasons.push(
    `Failures detected: ${failCount}`
  );

  results.recommendation.reasons.push(
    `Warnings detected: ${warnCount}`
  );

  check(
    "WARN",
    "Architecture requires deeper review before patching"
  );
}


// ============================================================
// 33. FINAL SUMMARY
// ============================================================

console.log("");
console.log("============================================================");
console.log("                    FINAL AUDIT");
console.log("============================================================");

console.log(
  `PASS : ${results.summary.pass}`
);

console.log(
  `WARN : ${results.summary.warn}`
);

console.log(
  `FAIL : ${results.summary.fail}`
);

console.log(
  `RECOMMENDATION : ${results.recommendation.decision}`
);

console.log("");

for (
  const reason
  of results.recommendation.reasons
) {
  console.log(`  - ${reason}`);
}


// ============================================================
// SAVE JSON
// ============================================================

fs.writeFileSync(
  jsonPath,
  JSON.stringify(
    results,
    null,
    2
  ),
  "utf8"
);


// ============================================================
// SAVE MARKDOWN
// ============================================================

const md = [];

md.push("# GHARLIST Frontend + UI/UX Master Audit");
md.push("");
md.push(`Generated: ${results.meta.timestamp}`);
md.push("");
md.push("## Summary");
md.push("");
md.push(`- PASS: ${results.summary.pass}`);
md.push(`- WARN: ${results.summary.warn}`);
md.push(`- FAIL: ${results.summary.fail}`);
md.push("");
md.push(
  `## Recommendation: ${results.recommendation.decision}`
);
md.push("");

for (
  const reason
  of results.recommendation.reasons
) {
  md.push(`- ${reason}`);
}

md.push("");

for (
  const section
  of results.sections
) {
  md.push("");
  md.push(`## ${section.name}`);
  md.push("");

  for (
    const item
    of section.checks
  ) {
    md.push(
      `- **${item.status}** — ${item.name}` +
      (
        item.detail
          ? ` — ${item.detail}`
          : ""
      )
    );
  }
}

fs.writeFileSync(
  mdPath,
  md.join("\n"),
  "utf8"
);

console.log("");
console.log("============================================================");
console.log("AUDIT FILES");
console.log("============================================================");
console.log(mdPath);
console.log(jsonPath);
console.log("");
console.log("NO APPLICATION SOURCE FILES WERE MODIFIED.");
