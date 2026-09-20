import fs from "fs";
import path from "path";

const PRODUCTS_FILE =
  "public/data/products.json";

const BACKUP_FILE =
  "public/data/products.backup-before-image-fix.json";

const CACHE_FILE =
  "reports/dmart-image-cache.json";

const REPORT_FILE =
  "reports/image-resolution-report.json";

const UNRESOLVED_FILE =
  "reports/unresolved-image-products.json";

const API_BASE =
  "https://digital.dmart.in/api/v3/search/";

const CDN =
  "https://cdn.dmart.in/images/products/";

const CONCURRENCY = 12;
const RETRIES = 3;
const CHECKPOINT_EVERY = 20;

/* =========================================================
   FILE HELPERS
========================================================= */

function readJSON(file, fallback) {
  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch {
    return fallback;
  }
}

function atomicWrite(file, data) {
  const temp = file + ".tmp";

  fs.writeFileSync(
    temp,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  fs.renameSync(temp, file);
}

fs.mkdirSync("reports", {
  recursive: true
});

const products =
  readJSON(PRODUCTS_FILE, []);

if (!Array.isArray(products)) {
  throw new Error(
    "products.json is not an array"
  );
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
    "✓ Original dataset backed up"
  );
} else {
  console.log(
    "✓ Original backup already exists"
  );
}

/* =========================================================
   NORMALIZATION
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
    .replace(/\bpieces?\b/g, "pc")
    .replace(/\bpcs?\b/g, "pc")
    .replace(/\s+/g, "");
}

/* =========================================================
   CACHE
========================================================= */

const cache =
  readJSON(CACHE_FILE, {});

console.log("");
console.log(
  "Cached searches:",
  Object.keys(cache).length
);

/* =========================================================
   DMART SEARCH
========================================================= */

async function fetchDMart(name, attempt = 1) {

  const url =
    API_BASE +
    encodeURIComponent(name) +
    "?page=0&buryOOS=true&size=20&channel=web";

  try {

    const response =
      await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent":
            "Mozilla/5.0"
        }
      });

    if (!response.ok) {

      if (
        attempt < RETRIES &&
        (
          response.status === 429 ||
          response.status >= 500
        )
      ) {
        await new Promise(
          r => setTimeout(
            r,
            attempt * 1000
          )
        );

        return fetchDMart(
          name,
          attempt + 1
        );
      }

      return {
        status: "error",
        error:
          `HTTP ${response.status}`,
        skus: []
      };
    }

    const data =
      await response.json();

    const parents =
      Array.isArray(
        data?.products
      )
        ? data.products
        : [];

    const skus = [];

    for (const parent of parents) {

      for (
        const sku of
        parent?.sKUs || []
      ) {

        if (
          sku?.productImageKey &&
          sku?.imgCode
        ) {

          skus.push({
            productName:
              parent.name || "",

            productId:
              parent.productId || "",

            targetUrl:
              parent.targetUrl || "",

            skuUniqueID:
              sku.skuUniqueID || "",

            articleNumber:
              sku.articleNumber || "",

            name:
              sku.name || "",

            manufacturer:
              sku.manufacturer ||
              parent.manufacturer ||
              "",

            variantTextValue:
              sku.variantTextValue ||
              "",

            productImageKey:
              sku.productImageKey,

            imageKey:
              sku.imageKey || "",

            imgCode:
              String(sku.imgCode),

            binaryImgCode:
              sku.binaryImgCode || "",

            priceMRP:
              sku.priceMRP || "",

            priceSALE:
              sku.priceSALE || ""
          });

        }
      }
    }

    return {
      status: "ok",
      error: null,
      skus
    };

  } catch (error) {

    if (attempt < RETRIES) {

      await new Promise(
        r => setTimeout(
          r,
          attempt * 1000
        )
      );

      return fetchDMart(
        name,
        attempt + 1
      );
    }

    return {
      status: "error",
      error: error.message,
      skus: []
    };
  }
}

/* =========================================================
   UNIQUE SEARCH NAMES
========================================================= */

const uniqueNames = [
  ...new Set(
    products
      .map(
        p =>
          String(
            p.name || ""
          ).trim()
      )
      .filter(Boolean)
  )
];

console.log("");
console.log(
  "Products:",
  products.length
);

console.log(
  "Unique names:",
  uniqueNames.length
);

console.log(
  "Concurrency:",
  CONCURRENCY
);

console.log("");

/* =========================================================
   RESUMABLE CONCURRENT QUEUE
========================================================= */

let completed = 0;
let active = 0;
let cursor = 0;

function nextName() {

  while (
    active < CONCURRENCY &&
    cursor < uniqueNames.length
  ) {

    const name =
      uniqueNames[cursor++];

    const key =
      normalize(name);

    if (cache[key]) {

      completed++;

      continue;
    }

    active++;

    (async () => {

      try {

        cache[key] =
          await fetchDMart(name);

      } finally {

        active++;
        active--;

        completed++;

        if (
          completed %
            CHECKPOINT_EVERY ===
          0
        ) {

          atomicWrite(
            CACHE_FILE,
            cache
          );

          console.log(
            `Progress: ${completed}/${uniqueNames.length} | cache saved`
          );
        }

        nextName();
      }

    })();
  }
}

/*
 * The queue above starts work.
 * Wait until every name has either
 * been loaded or cached.
 */

nextName();

while (
  completed <
  uniqueNames.length
) {

  await new Promise(
    r => setTimeout(r, 250)
  );
}

/* Final cache save */

atomicWrite(
  CACHE_FILE,
  cache
);

console.log("");
console.log(
  "✓ DMart API cache complete"
);

console.log(
  "Cache:",
  CACHE_FILE
);

/* =========================================================
   MATCHING
========================================================= */

function scoreCandidate(
  product,
  sku
) {

  let score = 0;

  const localKey =
    String(
      product.productImageKey ||
      ""
    ).trim();

  const remoteKey =
    String(
      sku.productImageKey ||
      ""
    ).trim();

  /*
   * ABSOLUTE STRONGEST MATCH
   */

  if (
    localKey &&
    remoteKey &&
    localKey === remoteKey
  ) {
    score += 10000;
  }

  const localName =
    normalize(product.name);

  const remoteName =
    normalize(
      sku.name ||
      sku.productName
    );

  if (
    localName &&
    remoteName &&
    remoteName.includes(localName)
  ) {
    score += 500;
  }

  const localQty =
    normalizeQuantity(
      product.quantity
    );

  const remoteQty =
    normalizeQuantity(
      sku.variantTextValue ||
      sku.name
    );

  if (
    localQty &&
    remoteQty &&
    remoteQty.includes(localQty)
  ) {
    score += 1000;
  }

  const localBrand =
    normalize(product.brand);

  const remoteManufacturer =
    normalize(sku.manufacturer);

  if (
    localBrand &&
    remoteManufacturer &&
    remoteManufacturer.includes(
      localBrand
    )
  ) {
    score += 100;
  }

  return score;
}

/* =========================================================
   UPDATE DATA
========================================================= */

let exactMatches = 0;
let quantityMatches = 0;
let nameMatches = 0;
let unresolved = 0;
let apiErrors = 0;

const unresolvedRows = [];

for (
  const product of products
) {

  const key =
    normalize(product.name);

  const result =
    cache[key];

  if (
    !result ||
    !Array.isArray(
      result.skus
    ) ||
    !result.skus.length
  ) {

    if (
      result?.status ===
      "error"
    ) {
      apiErrors++;
    }

    unresolved++;

    unresolvedRows.push({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      productImageKey:
        product.productImageKey || "",
      reason:
        result?.error ||
        "No current DMart SKU found"
    });

    continue;
  }

  let best = null;
  let bestScore = -1;

  for (
    const sku of result.skus
  ) {

    const score =
      scoreCandidate(
        product,
        sku
      );

    if (
      score >
      bestScore
    ) {

      bestScore = score;
      best = sku;
    }
  }

  /*
   * Require either:
   *
   * 10000+ = exact image key
   * OR
   * 1000+  = quantity-level match
   *
   * Never use weak name-only matching.
   */

  if (
    !best ||
    bestScore < 1000
  ) {

    unresolved++;

    unresolvedRows.push({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      productImageKey:
        product.productImageKey || "",
      reason:
        `No strong SKU match (${bestScore})`
    });

    continue;
  }

  const exactKey =
    String(
      product.productImageKey ||
      ""
    ) ===
    String(
      best.productImageKey ||
      ""
    );

  const localQty =
    normalizeQuantity(
      product.quantity
    );

  const remoteQty =
    normalizeQuantity(
      best.variantTextValue ||
      best.name
    );

  if (exactKey) {
    exactMatches++;
  } else if (
    localQty &&
    remoteQty.includes(localQty)
  ) {
    quantityMatches++;
  } else {
    nameMatches++;
  }

  /*
   * Preserve original local product
   * identity while adding live image metadata.
   */

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

  product.dmartProductId =
    best.productId || "";

  product.dmartTargetUrl =
    best.targetUrl || "";
}

/* =========================================================
   SAVE UPDATED DATA
========================================================= */

atomicWrite(
  PRODUCTS_FILE,
  products
);

atomicWrite(
  UNRESOLVED_FILE,
  unresolvedRows
);

/* =========================================================
   REPORT
========================================================= */

const resolved =
  products.filter(
    p =>
      p.productImageKey &&
      p.imgCode &&
      p.image
  ).length;

const report = {

  generatedAt:
    new Date().toISOString(),

  totalProducts:
    products.length,

  uniqueNames:
    uniqueNames.length,

  resolved,

  unresolved,

  apiErrors,

  exactKeyMatches:
    exactMatches,

  quantityMatches:
    quantityMatches,

  nameMatches:
    nameMatches,

  imageFormula:
    `${CDN}{productImageKey}_{imgCode}_B.jpg`,

  cacheFile:
    CACHE_FILE,

  backupFile:
    BACKUP_FILE,

  unresolvedFile:
    UNRESOLVED_FILE
};

atomicWrite(
  REPORT_FILE,
  report
);

console.log("");
console.log("==============================================");
console.log(" GHARLIST IMAGE RESOLUTION COMPLETE");
console.log("==============================================");
console.log("");

console.log(
  "Total products       :",
  products.length
);

console.log(
  "Resolved images      :",
  resolved
);

console.log(
  "Unresolved           :",
  unresolved
);

console.log(
  "API errors            :",
  apiErrors
);

console.log(
  "Exact key matches    :",
  exactMatches
);

console.log(
  "Quantity matches     :",
  quantityMatches
);

console.log(
  "Name matches         :",
  nameMatches
);

console.log("");

console.log(
  "Products:",
  PRODUCTS_FILE
);

console.log(
  "Cache:",
  CACHE_FILE
);

console.log(
  "Report:",
  REPORT_FILE
);

console.log(
  "Unresolved:",
  UNRESOLVED_FILE
);

console.log(
  "Backup:",
  BACKUP_FILE
);

console.log("");
console.log("==============================================");
