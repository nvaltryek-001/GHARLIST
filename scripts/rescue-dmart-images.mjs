import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PRODUCTS = path.join(ROOT, "public/data/products.json");
const CACHE = path.join(ROOT, "reports/dmart-image-cache.json");
const UNRESOLVED = path.join(ROOT, "reports/unresolved-image-products.json");
const RESCUE_REPORT = path.join(ROOT, "reports/image-rescue-report.json");

const API =
  "https://digital.dmart.in/api/v3/search/";

const CDN =
  "https://cdn.dmart.in/images/products/";

const CONCURRENCY = 16;
const TIMEOUT = 10000;
const RETRIES = 2;

const products = JSON.parse(
  fs.readFileSync(PRODUCTS, "utf8")
);

let cache = {};

if (fs.existsSync(CACHE)) {
  cache = JSON.parse(
    fs.readFileSync(CACHE, "utf8")
  );
}

function normalize(v = "") {
  return String(v)
    .toLowerCase()
    .replace(/dmart/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url, attempt = 1) {

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    TIMEOUT
  );

  try {

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!res.ok)
      throw new Error(`HTTP ${res.status}`);

    return await res.json();

  } catch (err) {

    if (attempt < RETRIES) {
      await sleep(500 * attempt);
      return fetchJSON(url, attempt + 1);
    }

    throw err;

  } finally {
    clearTimeout(timer);
  }
}

function walkProducts(data) {

  const out = [];

  function walk(v) {

    if (!v || typeof v !== "object")
      return;

    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }

    if (
      v.productId &&
      (v.name || v.sKUs || v.skus)
    ) {
      out.push(v);
    }

    for (const x of Object.values(v)) {
      if (x && typeof x === "object")
        walk(x);
    }
  }

  walk(data);

  const seen = new Set();

  return out.filter(x => {

    const id = String(x.productId);

    if (seen.has(id))
      return false;

    seen.add(id);
    return true;

  });
}

function skus(product) {
  return (
    product.sKUs ||
    product.skus ||
    product.SKUs ||
    []
  );
}

function imageKey(sku) {

  return String(
    sku.productImageKey ||
    sku.imageKey ||
    ""
  )
    .replace(/^.*\//, "")
    .trim();
}

function imageUrl(sku) {

  const key = imageKey(sku);
  const code = String(
    sku.imgCode || ""
  ).trim();

  if (!key || !code)
    return "";

  return `${CDN}${key}_${code}_B.jpg`;
}

function numberTokens(v = "") {
  return String(v).match(
    /\d+(?:\.\d+)?/g
  ) || [];
}

function quantityScore(local, sku) {

  if (!local) return 0;

  const a = normalize(local);

  const b = normalize(
    `${sku.variantTextValue || ""} ${sku.name || ""}`
  );

  if (!a || !b)
    return 0;

  if (a === b)
    return 100;

  const an = numberTokens(a);
  const bn = numberTokens(b);

  if (
    an.length &&
    bn.length &&
    an.some(x => bn.includes(x))
  ) {
    return 85;
  }

  const tokens =
    a.split(" ")
      .filter(x => x.length > 1);

  const matched =
    tokens.filter(x =>
      b.includes(x)
    );

  if (
    tokens.length &&
    matched.length === tokens.length
  ) {
    return 90;
  }

  return 0;
}

function nameScore(local, remote) {

  const a = normalize(local);
  const b = normalize(remote);

  if (!a || !b)
    return 0;

  if (a === b)
    return 100;

  if (
    a.includes(b) ||
    b.includes(a)
  ) {
    return 90;
  }

  const aa = new Set(a.split(" "));
  const bb = new Set(b.split(" "));

  let common = 0;

  for (const x of aa) {
    if (bb.has(x))
      common++;
  }

  const ratio =
    aa.size ? common / aa.size : 0;

  if (ratio >= 0.8)
    return 80;

  if (ratio >= 0.65)
    return 70;

  if (ratio >= 0.5)
    return 60;

  return 0;
}

function queries(product) {

  const name = String(
    product.name || ""
  ).trim();

  const brand = String(
    product.brand || ""
  ).trim();

  const sub = String(
    product.subcategory || ""
  ).trim();

  const cleanName =
    name
      .replace(/\([^)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const tokens =
    normalize(name)
      .split(" ")
      .filter(Boolean);

  const shortName =
    tokens.slice(0, 5).join(" ");

  const result = [
    name,
    cleanName,
    `${brand} ${cleanName}`.trim(),
    shortName,
    `${brand} ${shortName}`.trim()
  ];

  if (sub) {
    result.push(
      `${brand} ${sub}`.trim()
    );
  }

  return [
    ...new Set(
      result.filter(
        x => x && normalize(x).length >= 3
      )
    )
  ];
}

async function search(query) {

  const url =
    `${API}${encodeURIComponent(query)}` +
    `?page=0&buryOOS=true&size=20&channel=web`;

  const data =
    await fetchJSON(url);

  return walkProducts(data);
}

async function rescue(product) {

  const qs =
    queries(product);

  let best = null;
  let bestScore = 0;
  let usedQuery = "";

  for (const query of qs) {

    let results = [];

    try {
      results = await search(query);
    } catch {
      continue;
    }

    for (const remote of results) {

      const ns =
        nameScore(
          product.name,
          remote.name
        );

      if (ns < 55)
        continue;

      for (const sku of skus(remote)) {

        const url =
          imageUrl(sku);

        if (!url)
          continue;

        const qs =
          quantityScore(
            product.quantity,
            sku
          );

        let score =
          ns + qs;

        if (ns >= 90)
          score += 20;

        if (qs >= 85)
          score += 30;

        if (score > bestScore) {

          bestScore = score;

          best = {
            sku,
            remote
          };

          usedQuery = query;
        }
      }
    }

    if (
      best &&
      bestScore >= 140
    ) {
      break;
    }
  }

  if (!best)
    return null;

  return {
    product,
    sku: best.sku,
    remote: best.remote,
    score: bestScore,
    query: usedQuery
  };
}

const remaining =
  products.filter(
    p =>
      !p.image ||
      p.imageStatus !== "dmart-live"
  );

console.log("");
console.log("==============================================");
console.log(" GHARLIST — IMAGE RESCUE PASS");
console.log("==============================================");
console.log("");
console.log(
  `Total products : ${products.length}`
);
console.log(
  `Already live   : ${products.length - remaining.length}`
);
console.log(
  `Needs rescue   : ${remaining.length}`
);
console.log(
  `Concurrency    : ${CONCURRENCY}`
);
console.log("");

let cursor = 0;
let completed = 0;
let rescued = 0;
let failed = 0;

const rescuedItems = [];
const failedItems = [];

async function worker() {

  while (true) {

    const index = cursor++;

    if (index >= remaining.length)
      return;

    const product =
      remaining[index];

    try {

      const result =
        await rescue(product);

      if (result) {

        const sku =
          result.sku;

        const key =
          imageKey(sku);

        const code =
          String(
            sku.imgCode || ""
          ).trim();

        const url =
          imageUrl(sku);

        product.productImageKey = key;
        product.imgCode = code;
        product.imageKey =
          sku.imageKey || key;
        product.image = url;
        product.imageStatus =
          "dmart-live";
        product.imageSource =
          "DMart CDN";
        product.imageValidated =
          false;

        if (sku.binaryImgCode)
          product.binaryImgCode =
            String(sku.binaryImgCode);

        if (sku.skuUniqueID)
          product.skuUniqueID =
            String(sku.skuUniqueID);

        if (sku.articleNumber)
          product.articleNumber =
            String(sku.articleNumber);

        rescued++;

        rescuedItems.push({
          id: product.id,
          name: product.name,
          query: result.query,
          score: result.score,
          image: url
        });

      } else {

        failed++;

        failedItems.push({
          id: product.id,
          name: product.name,
          quantity: product.quantity
        });

      }

    } catch {

      failed++;

      failedItems.push({
        id: product.id,
        name: product.name,
        quantity: product.quantity
      });

    }

    completed++;

    if (
      completed % 50 === 0 ||
      completed === remaining.length
    ) {

      const pct =
        (
          completed /
          remaining.length *
          100
        ).toFixed(1);

      console.log(
        `[${pct}%] ` +
        `${completed}/${remaining.length} | ` +
        `rescued=${rescued} | ` +
        `failed=${failed}`
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

fs.writeFileSync(
  PRODUCTS,
  JSON.stringify(products, null, 2)
);

fs.writeFileSync(
  UNRESOLVED,
  JSON.stringify(
    failedItems,
    null,
    2
  )
);

fs.writeFileSync(
  RESCUE_REPORT,
  JSON.stringify(
    {
      generatedAt:
        new Date().toISOString(),
      totalProducts:
        products.length,
      beforeRescue:
        products.length -
        remaining.length,
      attempted:
        remaining.length,
      rescued,
      failed,
      finalLive:
        products.filter(
          p =>
            p.imageStatus ===
            "dmart-live"
        ).length
    },
    null,
    2
  )
);

console.log("");
console.log("==============================================");
console.log(" IMAGE RESCUE COMPLETE");
console.log("==============================================");
console.log(
  `Total products : ${products.length}`
);
console.log(
  `Rescued        : ${rescued}`
);
console.log(
  `Still failed   : ${failed}`
);
console.log(
  `Final live     : ${
    products.filter(
      p => p.imageStatus === "dmart-live"
    ).length
  }`
);
console.log("");
console.log(
  "Updated: public/data/products.json"
);
console.log(
  "Report : reports/image-rescue-report.json"
);
console.log(
  "Failed : reports/unresolved-image-products.json"
);
console.log("==============================================");
