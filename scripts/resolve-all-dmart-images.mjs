import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PRODUCTS = path.join(ROOT, "public/data/products.json");
const CACHE = path.join(ROOT, "reports/dmart-image-cache.json");
const REPORT = path.join(ROOT, "reports/image-resolution-report.json");
const UNRESOLVED = path.join(ROOT, "reports/unresolved-image-products.json");
const BACKUP = path.join(ROOT, "public/data/products.backup-before-image-fix.json");

const API_BASE =
  "https://digital.dmart.in/api/v3/search/";

const CDN =
  "https://cdn.dmart.in/images/products/";

const CONCURRENCY = 16;
const TIMEOUT = 12000;
const RETRIES = 3;
const CHECKPOINT = 100;

fs.mkdirSync(path.dirname(CACHE), { recursive: true });

const products = JSON.parse(fs.readFileSync(PRODUCTS, "utf8"));

if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(PRODUCTS, BACKUP);
  console.log("✓ Original products.json backup created");
} else {
  console.log("✓ Original backup already exists");
}

let cache = {};

if (fs.existsSync(CACHE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE, "utf8"));
  } catch {
    cache = {};
  }
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/dmart/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function atomicWrite(file, data) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function extractNumbers(value = "") {
  return String(value).match(/\d+(?:\.\d+)?/g) || [];
}

function quantityScore(localQty, sku) {
  const a = normalize(localQty);
  const b = normalize(
    `${sku.variantTextValue || ""} ${sku.name || ""}`
  );

  if (!a || !b) return 0;

  if (a === b) return 100;

  const an = extractNumbers(a);
  const bn = extractNumbers(b);

  if (an.length && bn.length) {
    if (an.some(x => bn.includes(x))) return 80;
  }

  const tokens = a.split(" ").filter(x => x.length > 1);
  const matches = tokens.filter(x => b.includes(x));

  if (tokens.length && matches.length === tokens.length) return 90;
  if (matches.length) return 50;

  return 0;
}

async function fetchJSON(url, attempt = 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "application/json",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } catch (error) {

    if (attempt < RETRIES) {
      await sleep(700 * attempt);
      return fetchJSON(url, attempt + 1);
    }

    throw error;

  } finally {
    clearTimeout(timer);
  }
}

function extractProducts(data) {
  const result = [];

  function walk(value) {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (
      value.productId &&
      (
        value.name ||
        value.sKUs ||
        value.skus
      )
    ) {
      result.push(value);
    }

    for (const value2 of Object.values(value)) {
      if (value2 && typeof value2 === "object") {
        walk(value2);
      }
    }
  }

  walk(data);

  const unique = [];
  const seen = new Set();

  for (const item of result) {
    const key = String(item.productId);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

function getSKUs(product) {
  return (
    product.sKUs ||
    product.skus ||
    product.SKUs ||
    []
  );
}

function cleanImageKey(value) {
  if (!value) return "";

  return String(value)
    .replace(/^.*\//, "")
    .trim();
}

function buildImage(productImageKey, imgCode) {
  if (!productImageKey || !imgCode) return "";

  return `${CDN}${cleanImageKey(productImageKey)}_${imgCode}_B.jpg`;
}

async function resolveName(name) {

  const encoded = encodeURIComponent(name);

  const url =
    `${API_BASE}${encoded}?page=0&buryOOS=true&size=20&channel=web`;

  const data = await fetchJSON(url);

  const apiProducts = extractProducts(data);

  if (!apiProducts.length) {
    return {
      status: "unresolved",
      reason: "no-products"
    };
  }

  const localName = normalize(name);

  let candidates = [];

  for (const product of apiProducts) {

    const apiName = normalize(product.name || "");

    let nameScore = 0;

    if (apiName === localName) {
      nameScore = 100;
    } else if (
      apiName.includes(localName) ||
      localName.includes(apiName)
    ) {
      nameScore = 85;
    } else {
      const a = new Set(localName.split(" "));
      const b = new Set(apiName.split(" "));

      let common = 0;

      for (const token of a) {
        if (b.has(token)) common++;
      }

      const ratio =
        a.size
          ? common / a.size
          : 0;

      if (ratio >= 0.8) nameScore = 75;
      else if (ratio >= 0.6) nameScore = 60;
    }

    if (nameScore < 60) continue;

    for (const sku of getSKUs(product)) {

      const productImageKey =
        cleanImageKey(
          sku.productImageKey ||
          sku.imageKey ||
          ""
        );

      const imgCode =
        sku.imgCode ||
        "";

      if (!productImageKey || !imgCode) continue;

      candidates.push({
        product,
        sku,
        nameScore,
        imageScore: nameScore
      });
    }
  }

  if (!candidates.length) {
    return {
      status: "unresolved",
      reason: "no-image-metadata"
    };
  }

  return {
    status: "resolved",
    candidates
  };
}

const uniqueNames = [
  ...new Set(
    products
      .map(p => p.name)
      .filter(Boolean)
  )
];

console.log("");
console.log("==============================================");
console.log(" GHARLIST — DMART LIVE IMAGE RESOLVER");
console.log("==============================================");
console.log("");
console.log(`Products       : ${products.length}`);
console.log(`Unique names   : ${uniqueNames.length}`);
console.log(`Cached names   : ${Object.keys(cache).length}`);
console.log(`Concurrency    : ${CONCURRENCY}`);
console.log(`Timeout        : ${TIMEOUT} ms`);
console.log("");

let cursor = 0;
let completed = 0;
let resolved = 0;
let unresolved = 0;
let apiErrors = 0;

const started = Date.now();

async function worker() {

  while (true) {

    const index = cursor++;

    if (index >= uniqueNames.length) return;

    const name = uniqueNames[index];
    const key = normalize(name);

    if (cache[key]) {
      completed++;
      continue;
    }

    try {

      const result = await resolveName(name);

      cache[key] = {
        name,
        ...result,
        updatedAt: new Date().toISOString()
      };

      if (result.status === "resolved") {
        resolved++;
      } else {
        unresolved++;
      }

    } catch (error) {

      apiErrors++;

      cache[key] = {
        name,
        status: "error",
        reason: String(error.message || error),
        updatedAt: new Date().toISOString()
      };

    }

    completed++;

    if (
      completed % CHECKPOINT === 0 ||
      completed === uniqueNames.length
    ) {

      atomicWrite(CACHE, cache);

      const elapsed =
        ((Date.now() - started) / 1000).toFixed(1);

      const percent =
        ((completed / uniqueNames.length) * 100).toFixed(1);

      console.log(
        `[${percent}%] ${completed}/${uniqueNames.length} | ` +
        `resolved=${resolved} | ` +
        `unresolved=${unresolved} | ` +
        `errors=${apiErrors} | ` +
        `${elapsed}s`
      );
    }
  }
}

await Promise.all(
  Array.from(
    { length: CONCURRENCY },
    () => worker()
  )
);

atomicWrite(CACHE, cache);

console.log("");
console.log("✓ API resolution finished");
console.log("");

let exactMatches = 0;
let quantityMatches = 0;
let fallbackMatches = 0;
let finalUnresolved = 0;

const unresolvedProducts = [];

for (const product of products) {

  const key = normalize(product.name);
  const result = cache[key];

  if (!result || result.status !== "resolved") {

    finalUnresolved++;

    unresolvedProducts.push({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      reason:
        result?.reason ||
        "not-resolved"
    });

    continue;
  }

  const candidates = result.candidates || [];

  let best = null;
  let bestScore = -1;
  let bestType = "fallback";

  for (const candidate of candidates) {

    const sku = candidate.sku;

    const qScore =
      quantityScore(
        product.quantity,
        sku
      );

    let score =
      candidate.nameScore +
      qScore;

    let type = "name";

    if (candidate.nameScore >= 100 && qScore >= 80) {
      type = "exact";
      score += 100;
    } else if (qScore >= 80) {
      type = "quantity";
      score += 40;
    }

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
      bestType = type;
    }
  }

  if (!best) {

    finalUnresolved++;

    unresolvedProducts.push({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      reason: "no-best-sku"
    });

    continue;
  }

  const sku = best.sku;

  const productImageKey =
    cleanImageKey(
      sku.productImageKey ||
      sku.imageKey ||
      ""
    );

  const imgCode =
    String(sku.imgCode || "").trim();

  const image =
    buildImage(
      productImageKey,
      imgCode
    );

  if (!image) {

    finalUnresolved++;

    unresolvedProducts.push({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      reason: "missing-image-url"
    });

    continue;
  }

  product.productImageKey = productImageKey;
  product.imgCode = imgCode;

  if (sku.binaryImgCode) {
    product.binaryImgCode =
      String(sku.binaryImgCode);
  }

  if (sku.skuUniqueID) {
    product.skuUniqueID =
      String(sku.skuUniqueID);
  }

  if (sku.articleNumber) {
    product.articleNumber =
      String(sku.articleNumber);
  }

  product.imageKey =
    sku.imageKey || productImageKey;

  product.image = image;

  product.imageStatus =
    "dmart-live";

  product.imageSource =
    "DMart CDN";

  product.imageValidated =
    false;

  if (bestType === "exact") {
    exactMatches++;
  } else if (bestType === "quantity") {
    quantityMatches++;
  } else {
    fallbackMatches++;
  }
}

fs.writeFileSync(
  PRODUCTS,
  JSON.stringify(products, null, 2)
);

fs.writeFileSync(
  UNRESOLVED,
  JSON.stringify(
    unresolvedProducts,
    null,
    2
  )
);

const report = {
  generatedAt: new Date().toISOString(),

  totalProducts: products.length,

  uniqueNames,

  resolvedProducts:
    products.length -
    finalUnresolved,

  unresolvedProducts:
    finalUnresolved,

  exactMatches,

  quantityMatches,

  fallbackMatches,

  apiErrors,

  cachedNames:
    Object.keys(cache).length,

  imageFormula:
    "https://cdn.dmart.in/images/products/{productImageKey}_{imgCode}_B.jpg",

  backup:
    "public/data/products.backup-before-image-fix.json",

  productsFile:
    "public/data/products.json",

  unresolvedFile:
    "reports/unresolved-image-products.json"
};

fs.writeFileSync(
  REPORT,
  JSON.stringify(
    report,
    null,
    2
  )
);

console.log("");
console.log("==============================================");
console.log(" IMAGE RESOLUTION COMPLETE");
console.log("==============================================");
console.log(`Total products     : ${products.length}`);
console.log(`Resolved products  : ${report.resolvedProducts}`);
console.log(`Unresolved         : ${report.unresolvedProducts}`);
console.log(`Exact matches      : ${exactMatches}`);
console.log(`Quantity matches   : ${quantityMatches}`);
console.log(`Fallback matches   : ${fallbackMatches}`);
console.log(`API errors         : ${apiErrors}`);
console.log("");
console.log(`Updated: ${PRODUCTS}`);
console.log(`Cache  : ${CACHE}`);
console.log(`Report : ${REPORT}`);
console.log(`Failed : ${UNRESOLVED}`);
console.log("");
console.log("NEXT: run the image validator + npm run build");
console.log("==============================================");
