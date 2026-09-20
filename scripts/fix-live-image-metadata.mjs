import fs from "fs";
import path from "path";

const PRODUCTS_FILE = "public/data/products.json";
const BACKUP_FILE =
  "public/data/products.backup-before-image-fix.json";

const API_BASE =
  "https://digital.dmart.in/api/v3/search/";

const CDN =
  "https://cdn.dmart.in/images/products/";

const products =
  JSON.parse(
    fs.readFileSync(
      PRODUCTS_FILE,
      "utf8"
    )
  );

if (!Array.isArray(products)) {
  throw new Error("products.json is not an array");
}

/* =========================================================
   BACKUP
========================================================= */

if (!fs.existsSync(BACKUP_FILE)) {
  fs.copyFileSync(
    PRODUCTS_FILE,
    BACKUP_FILE
  );

  console.log(
    "✓ Original products.json backed up"
  );
} else {
  console.log(
    "✓ Existing backup preserved"
  );
}

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeQuantity(value) {
  return normalize(value)
    .replace(/\bgrams?\b/g, "gm")
    .replace(/\bkilograms?\b/g, "kg")
    .replace(/\bmilliliters?\b/g, "ml")
    .replace(/\bliters?\b/g, "l")
    .replace(/\s+/g, "");
}

function scoreSKU(product, sku) {

  let score = 0;

  const productName =
    normalize(product.name);

  const skuName =
    normalize(sku.name);

  const productQty =
    normalizeQuantity(product.quantity);

  const skuQty =
    normalizeQuantity(
      sku.variantTextValue ||
      sku.name
    );

  /* exact image key is strongest */
  if (
    product.productImageKey &&
    sku.productImageKey &&
    product.productImageKey ===
      sku.productImageKey
  ) {
    score += 1000;
  }

  /* quantity */
  if (
    productQty &&
    skuQty &&
    skuQty.includes(productQty)
  ) {
    score += 500;
  }

  /* exact normalized name */
  if (
    productName &&
    skuName &&
    skuName.includes(productName)
  ) {
    score += 300;
  }

  /* reverse name relationship */
  if (
    skuName &&
    productName &&
    productName.includes(skuName)
  ) {
    score += 150;
  }

  /* brand */
  const brand =
    normalize(product.brand);

  const manufacturer =
    normalize(sku.manufacturer);

  if (
    brand &&
    manufacturer &&
    manufacturer.includes(brand)
  ) {
    score += 50;
  }

  return score;
}

/* =========================================================
   API CACHE
========================================================= */

const apiCache = new Map();

async function searchDMart(name) {

  const cacheKey = normalize(name);

  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  const url =
    API_BASE +
    encodeURIComponent(name) +
    "?page=0&buryOOS=true&size=20&channel=web";

  try {

    const response =
      await fetch(url, {
        headers: {
          accept: "application/json"
        }
      });

    if (!response.ok) {
      console.log(
        "API",
        response.status,
        name
      );

      apiCache.set(cacheKey, []);

      return [];
    }

    const data =
      await response.json();

    const parents =
      Array.isArray(data?.products)
        ? data.products
        : [];

    const skus = [];

    for (const parent of parents) {

      for (const sku of
        parent?.sKUs || []) {

        if (
          sku?.productImageKey &&
          sku?.imgCode
        ) {

          skus.push({
            ...sku,
            parentName:
              parent.name,
            parentProductId:
              parent.productId
          });

        }

      }

    }

    apiCache.set(
      cacheKey,
      skus
    );

    return skus;

  } catch (error) {

    console.log(
      "API ERROR:",
      name,
      error.message
    );

    apiCache.set(
      cacheKey,
      []
    );

    return [];
  }
}

/* =========================================================
   PROCESS
========================================================= */

console.log("");
console.log("==============================================");
console.log(" GHARLIST — LIVE DMART IMAGE METADATA FIX");
console.log("==============================================");
console.log("");

console.log(
  "Products:",
  products.length
);

console.log(
  "Current missing imgCode:",
  products.filter(
    p => !p.imgCode
  ).length
);

console.log("");

/*
 * Cache means repeated product names
 * only hit DMart once.
 */

const uniqueNames =
  [
    ...new Set(
      products.map(
        p => String(p.name || "").trim()
      ).filter(Boolean)
    )
  ];

console.log(
  "Unique product names:",
  uniqueNames.length
);

console.log("");

let nameIndex = 0;

for (const name of uniqueNames) {

  nameIndex++;

  await searchDMart(name);

  if (
    nameIndex % 25 === 0 ||
    nameIndex === uniqueNames.length
  ) {

    console.log(
      `API progress: ${nameIndex}/${uniqueNames.length}`
    );

  }

  /*
   * Small delay so we don't hammer
   * the live API.
   */

  await new Promise(
    resolve =>
      setTimeout(resolve, 80)
  );
}

/* =========================================================
   MATCH PRODUCTS
========================================================= */

let exactKeyMatches = 0;
let quantityMatches = 0;
let nameMatches = 0;
let noMatch = 0;

const unresolved = [];

for (let i = 0; i < products.length; i++) {

  const product = products[i];

  const candidates =
    apiCache.get(
      normalize(product.name)
    ) || [];

  if (!candidates.length) {

    noMatch++;

    if (unresolved.length < 100) {
      unresolved.push({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        reason: "No API SKU"
      });
    }

    continue;
  }

  let best = null;
  let bestScore = -1;

  for (const sku of candidates) {

    const score =
      scoreSKU(
        product,
        sku
      );

    if (score > bestScore) {
      bestScore = score;
      best = sku;
    }
  }

  /*
   * Require a meaningful match.
   */

  if (
    !best ||
    bestScore < 500
  ) {

    noMatch++;

    if (unresolved.length < 100) {
      unresolved.push({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        reason:
          `Low-confidence match (${bestScore})`
      });
    }

    continue;
  }

  /*
   * Track match type.
   */

  if (
    product.productImageKey ===
    best.productImageKey
  ) {
    exactKeyMatches++;
  } else if (
    normalizeQuantity(product.quantity) &&
    normalizeQuantity(
      best.variantTextValue ||
      best.name
    ).includes(
      normalizeQuantity(
        product.quantity
      )
    )
  ) {
    quantityMatches++;
  } else {
    nameMatches++;
  }

  /*
   * Update current image metadata.
   */

  product.productImageKey =
    best.productImageKey;

  product.imgCode =
    String(best.imgCode);

  product.imageKey =
    best.imageKey || "";

  product.skuUniqueID =
    best.skuUniqueID ||
    product.skuUniqueID ||
    "";

  product.articleNumber =
    best.articleNumber ||
    product.articleNumber ||
    "";

  product.image =
    CDN +
    best.productImageKey +
    "_" +
    best.imgCode +
    "_B.jpg";

  product.imageStatus =
    "dmart-live";

  product.imageSource =
    "DMart CDN";

  product.imageValidated =
    false;
}

/* =========================================================
   WRITE UPDATED DATA
========================================================= */

fs.writeFileSync(
  PRODUCTS_FILE,
  JSON.stringify(
    products,
    null,
    2
  ),
  "utf8"
);

/* =========================================================
   REPORT
========================================================= */

const withCode =
  products.filter(
    p =>
      p.productImageKey &&
      p.imgCode
  ).length;

console.log("");
console.log("==============================================");
console.log(" IMAGE METADATA UPDATE COMPLETE");
console.log("==============================================");
console.log("");

console.log(
  "Total products       :",
  products.length
);

console.log(
  "With image key       :",
  products.filter(
    p => p.productImageKey
  ).length
);

console.log(
  "With imgCode         :",
  withCode
);

console.log(
  "Exact key matches    :",
  exactKeyMatches
);

console.log(
  "Quantity matches     :",
  quantityMatches
);

console.log(
  "Name matches         :",
  nameMatches
);

console.log(
  "Unresolved           :",
  noMatch
);

console.log("");

if (unresolved.length) {

  fs.writeFileSync(
    "reports/unresolved-image-products.json",
    JSON.stringify(
      unresolved,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "Unresolved report:",
    "reports/unresolved-image-products.json"
  );
}

console.log(
  "Backup:",
  BACKUP_FILE
);

console.log(
  "Updated:",
  PRODUCTS_FILE
);

console.log("");
console.log(
  "IMAGE FORMULA:"
);

console.log(
  CDN +
  "{productImageKey}_{imgCode}_B.jpg"
);

console.log("");
console.log("==============================================");
