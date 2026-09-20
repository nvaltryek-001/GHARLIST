import fs from "fs";
import path from "path";

const PRODUCTS = path.join(process.cwd(), "public/data/products.json");
const CACHE = path.join(process.cwd(), "reports/dmart-image-cache.json");
const FAILED = path.join(process.cwd(), "reports/unresolved-image-products.json");

const API = "https://digital.dmart.in/api/v3/search/";
const CDN = "https://cdn.dmart.in/images/products/";

const CONCURRENCY = 16;
const TIMEOUT = 10000;

const products = JSON.parse(
  fs.readFileSync(PRODUCTS, "utf8")
);

function normalize(v = "") {
  return String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {

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
      return null;

    return await res.json();

  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function walk(data) {

  const result = [];

  function visit(v) {

    if (!v || typeof v !== "object")
      return;

    if (Array.isArray(v)) {
      for (const x of v)
        visit(x);
      return;
    }

    if (
      v.productId &&
      (v.name || v.sKUs || v.skus)
    ) {
      result.push(v);
    }

    for (const x of Object.values(v)) {

      if (
        x &&
        typeof x === "object"
      ) {
        visit(x);
      }
    }
  }

  visit(data);

  const seen = new Set();

  return result.filter(x => {

    const id = String(x.productId);

    if (seen.has(id))
      return false;

    seen.add(id);
    return true;

  });
}

function getSKUs(product) {

  return (
    product.sKUs ||
    product.skus ||
    product.SKUs ||
    []
  );
}

function cleanKey(value) {

  return String(value || "")
    .replace(/^.*\//, "")
    .trim();
}

function imageUrl(sku) {

  const key = cleanKey(
    sku.productImageKey ||
    sku.imageKey
  );

  const code =
    String(sku.imgCode || "").trim();

  if (!key || !code)
    return "";

  return `${CDN}${key}_${code}_B.jpg`;
}

function articleFromKey(key) {

  const value =
    String(key || "");

  const match =
    value.match(
      /(?:^|\/)[A-Z]+(\d{7,})xx/i
    );

  return match
    ? match[1]
    : "";
}

function score(local, remote, sku) {

  const a = normalize(local);
  const b = normalize(
    remote || ""
  );

  let s = 0;

  if (a === b)
    s += 100;

  else if (
    a.includes(b) ||
    b.includes(a)
  )
    s += 75;

  else {

    const aa =
      new Set(a.split(" "));

    const bb =
      new Set(b.split(" "));

    let common = 0;

    for (const x of aa) {
      if (bb.has(x))
        common++;
    }

    if (
      aa.size &&
      common / aa.size >= 0.7
    )
      s += 55;
  }

  if (sku.articleNumber)
    s += 50;

  return s;
}

function buildQueries(product) {

  const key =
    product.productImageKey || "";

  const article =
    product.articleNumber ||
    articleFromKey(key);

  const name =
    product.name || "";

  const brand =
    product.brand || "";

  const quantity =
    product.quantity || "";

  const result = [

    // MOST IMPORTANT
    article,

    key,

    `${article} ${brand}`,

    `${article} ${name}`,

    // Name variants
    name,

    `${brand} ${name}`,

    `${name} ${quantity}`,

    `${brand} ${name} ${quantity}`

  ];

  return [
    ...new Set(
      result
        .map(x => String(x || "").trim())
        .filter(
          x =>
            normalize(x).length >= 3
        )
    )
  ];
}

async function search(query) {

  const url =
    API +
    encodeURIComponent(query) +
    "?page=0&buryOOS=true&size=20&channel=web";

  const data =
    await fetchJSON(url);

  if (!data)
    return [];

  return walk(data);
}

async function resolve(product) {

  const queries =
    buildQueries(product);

  let best = null;
  let bestScore = 0;

  const localKey =
    cleanKey(
      product.productImageKey
    );

  const localArticle =
    product.articleNumber ||
    articleFromKey(localKey);

  for (const query of queries) {

    const results =
      await search(query);

    for (const remote of results) {

      for (const sku of getSKUs(remote)) {

        const remoteKey =
          cleanKey(
            sku.productImageKey ||
            sku.imageKey
          );

        const remoteArticle =
          String(
            sku.articleNumber || ""
          );

        let s =
          score(
            product.name,
            remote.name,
            sku
          );

        // EXACT IMAGE KEY = strongest possible match
        if (
          localKey &&
          remoteKey &&
          localKey === remoteKey
        ) {
          s += 1000;
        }

        // EXACT ARTICLE NUMBER
        if (
          localArticle &&
          remoteArticle &&
          localArticle === remoteArticle
        ) {
          s += 500;
        }

        if (!imageUrl(sku))
          continue;

        if (s > bestScore) {

          bestScore = s;

          best = {
            sku,
            remote,
            query
          };
        }
      }
    }

    // Exact key/article match found
    if (bestScore >= 1000)
      break;
  }

  return best;
}

const remaining =
  products.filter(
    p =>
      !p.image ||
      p.imageStatus !== "dmart-live"
  );

console.log("");
console.log("==============================================");
console.log(" GHARLIST — EXACT IMAGE KEY RESCUE");
console.log("==============================================");
console.log("");
console.log(
  `Total products : ${products.length}`
);
console.log(
  `Already live   : ${
    products.length - remaining.length
  }`
);
console.log(
  `Remaining      : ${remaining.length}`
);
console.log(
  `Concurrency    : ${CONCURRENCY}`
);
console.log("");

let cursor = 0;
let completed = 0;
let rescued = 0;
let failed = 0;
let exactKey = 0;
let exactArticle = 0;

async function worker() {

  while (true) {

    const index = cursor++;

    if (
      index >= remaining.length
    )
      return;

    const product =
      remaining[index];

    const result =
      await resolve(product);

    if (result) {

      const sku =
        result.sku;

      const key =
        cleanKey(
          sku.productImageKey ||
          sku.imageKey
        );

      const code =
        String(
          sku.imgCode || ""
        ).trim();

      const url =
        imageUrl(sku);

      const localKey =
        cleanKey(
          product.productImageKey
        );

      const localArticle =
        product.articleNumber ||
        articleFromKey(localKey);

      const remoteArticle =
        String(
          sku.articleNumber || ""
        );

      if (
        localKey &&
        localKey === key
      ) {
        exactKey++;
      }

      if (
        localArticle &&
        remoteArticle &&
        localArticle === remoteArticle
      ) {
        exactArticle++;
      }

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

      if (sku.articleNumber)
        product.articleNumber =
          String(sku.articleNumber);

      if (sku.skuUniqueID)
        product.skuUniqueID =
          String(sku.skuUniqueID);

      if (sku.binaryImgCode)
        product.binaryImgCode =
          String(sku.binaryImgCode);

      rescued++;

    } else {

      failed++;
    }

    completed++;

    if (
      completed % 25 === 0 ||
      completed === remaining.length
    ) {

      console.log(
        `[${(
          completed /
          remaining.length *
          100
        ).toFixed(1)}%] ` +
        `${completed}/${remaining.length} | ` +
        `rescued=${rescued} | ` +
        `failed=${failed} | ` +
        `exactKey=${exactKey}`
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

const stillFailed =
  products.filter(
    p =>
      !p.image ||
      p.imageStatus !== "dmart-live"
  );

fs.writeFileSync(
  FAILED,
  JSON.stringify(
    stillFailed.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      quantity: p.quantity,
      productImageKey:
        p.productImageKey
    })),
    null,
    2
  )
);

fs.writeFileSync(
  path.join(
    process.cwd(),
    "reports/exact-image-rescue-report.json"
  ),
  JSON.stringify(
    {
      generatedAt:
        new Date().toISOString(),
      totalProducts:
        products.length,
      attempted:
        remaining.length,
      rescued,
      failed,
      exactKey,
      exactArticle,
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
console.log(" EXACT IMAGE RESCUE COMPLETE");
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
  `Exact key      : ${exactKey}`
);
console.log(
  `Exact article   : ${exactArticle}`
);
console.log(
  `FINAL LIVE     : ${
    products.filter(
      p =>
        p.imageStatus ===
        "dmart-live"
    ).length
  }`
);
console.log("==============================================");
