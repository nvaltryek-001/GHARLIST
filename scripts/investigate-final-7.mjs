import fs from "fs";

const products = JSON.parse(
  fs.readFileSync("./public/data/products.json", "utf8")
);

const ids = [
  "dmart-00572",
  "dmart-02149",
  "dmart-02366",
  "dmart-03445",
  "dmart-04916",
  "dmart-04938",
  "dmart-04943"
];

const targets = products.filter(p => ids.includes(p.id));

const CDN = "https://cdn.dmart.in/images/products/";

function norm(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(v) {
  return new Set(
    norm(v)
      .split(" ")
      .filter(x => x.length >= 3)
  );
}

function similarity(a, b) {
  const A = tokens(a);
  const B = tokens(b);

  if (!A.size || !B.size) return 0;

  let common = 0;

  for (const x of A) {
    if (B.has(x)) common++;
  }

  return common / Math.max(A.size, B.size);
}

function articleFromKey(key) {
  const m = String(key || "").match(/(\d{9})/);
  return m ? m[1] : "";
}

async function search(query) {
  const url =
    "https://digital.dmart.in/api/v3/search/" +
    encodeURIComponent(query) +
    "?page=0&buryOOS=true&size=20&channel=web";

  try {
    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!r.ok) return null;

    return await r.json();
  } catch {
    return null;
  }
}

function collectProducts(data) {
  const found = [];

  function walk(v) {
    if (!v || typeof v !== "object") return;

    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }

    if (
      v.productId &&
      (v.name || v.sKUs || v.skus)
    ) {
      found.push(v);
    }

    for (const value of Object.values(v)) {
      if (value && typeof value === "object") {
        walk(value);
      }
    }
  }

  walk(data);

  const unique = new Map();

  for (const p of found) {
    unique.set(String(p.productId), p);
  }

  return [...unique.values()];
}

function getSkus(product) {
  return (
    product.sKUs ||
    product.skus ||
    product.SKUs ||
    []
  );
}

async function checkImage(url) {
  try {
    const r = await fetch(url, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "Mozilla/5.0"
      }
    });

    const type =
      r.headers.get("content-type") || "";

    const data = await r.arrayBuffer();

    return {
      ok:
        r.ok &&
        type.startsWith("image/") &&
        data.byteLength > 1000,
      status: r.status,
      type,
      bytes: data.byteLength
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      type: "",
      bytes: 0
    };
  }
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST — STRICT FINAL 7 INVESTIGATION");
console.log(" NO FILE MODIFICATION");
console.log("==============================================");

for (const target of targets) {

  console.log("");
  console.log("==============================================");
  console.log(`${target.id} | ${target.name}`);
  console.log(`Brand       : ${target.brand || "-"}`);
  console.log(`Quantity    : ${target.quantity || "-"}`);
  console.log(`Article     : ${target.articleNumber || articleFromKey(target.productImageKey) || "-"}`);
  console.log(`Image Key   : ${target.productImageKey || "-"}`);
  console.log("==============================================");

  const queries = [
    target.name,
    `${target.brand || ""} ${target.name}`.trim(),
    target.articleNumber,
    articleFromKey(target.productImageKey)
  ].filter(Boolean);

  const remoteMap = new Map();

  for (const query of [...new Set(queries)]) {

    const data = await search(query);

    if (!data) {
      console.log(`Query: ${query} -> API failed`);
      continue;
    }

    const remote = collectProducts(data);

    console.log(
      `Query: ${query} -> ${remote.length} products`
    );

    for (const p of remote) {
      remoteMap.set(
        String(p.productId),
        p
      );
    }
  }

  const candidates = [];

  for (const remote of remoteMap.values()) {

    const productScore =
      similarity(
        target.name,
        remote.name
      );

    const remoteSkus =
      getSkus(remote);

    for (const sku of remoteSkus) {

      const key =
        String(
          sku.productImageKey ||
          sku.imageKey ||
          ""
        ).trim();

      const code =
        String(
          sku.imgCode || ""
        ).trim();

      if (!key || !code)
        continue;

      const skuArticle =
        String(
          sku.articleNumber ||
          ""
        ).trim();

      const articleTarget =
        String(
          target.articleNumber ||
          articleFromKey(
            target.productImageKey
          ) ||
          ""
        );

      const articleMatch =
        !!articleTarget &&
        !!skuArticle &&
        skuArticle === articleTarget;

      const skuName =
        sku.name || remote.name || "";

      const skuScore =
        similarity(
          target.name,
          skuName
        );

      let confidence = 0;

      if (articleMatch)
        confidence += 60;

      confidence +=
        productScore * 25;

      confidence +=
        skuScore * 15;

      candidates.push({
        confidence,
        articleMatch,
        productName:
          remote.name || "",
        skuName,
        productId:
          remote.productId,
        skuUniqueID:
          sku.skuUniqueID || "",
        articleNumber:
          skuArticle,
        key,
        code,
        url:
          `${CDN}${key}_${code}_B.jpg`
      });
    }
  }

  candidates.sort(
    (a, b) =>
      b.confidence - a.confidence
  );

  const unique = new Map();

  for (const c of candidates) {
    if (!unique.has(c.url)) {
      unique.set(c.url, c);
    }
  }

  const list =
    [...unique.values()].slice(0, 15);

  if (!list.length) {
    console.log("");
    console.log("❌ NO CANDIDATES FOUND");
    continue;
  }

  console.log("");
  console.log("CANDIDATES:");

  for (const c of list) {

    const result =
      await checkImage(c.url);

    const marker =
      c.articleMatch
        ? "ARTICLE-MATCH"
        : "NAME-MATCH";

    console.log("");
    console.log(
      `${result.ok ? "✓" : "✗"} ${marker}`
    );
    console.log(
      `Confidence : ${c.confidence.toFixed(1)}`
    );
    console.log(
      `Product    : ${c.productName}`
    );
    console.log(
      `SKU        : ${c.skuName}`
    );
    console.log(
      `Article    : ${c.articleNumber || "-"}`
    );
    console.log(
      `SKU ID     : ${c.skuUniqueID || "-"}`
    );
    console.log(
      `Image      : ${c.key}_${c.code}_B.jpg`
    );
    console.log(
      `HTTP       : ${result.status}`
    );
    console.log(
      `Bytes      : ${result.bytes}`
    );
    console.log(
      `URL        : ${c.url}`
    );
  }
}

console.log("");
console.log("==============================================");
console.log(" INVESTIGATION COMPLETE");
console.log("==============================================");
console.log("products.json was NOT modified.");
console.log("==============================================");
