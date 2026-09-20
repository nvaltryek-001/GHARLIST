const API = "https://digital.dmart.in/api/v3/search/";
const CDN = "https://cdn.dmart.in/images/products/";

const targets = [
  {
    id: "dmart-00518",
    name: "Lapsi Rava Small Daliya",
    brand: "",
    quantity: "500 gm",
    key: "SEP110000830xx13SEP23"
  },
  {
    id: "dmart-01083",
    name: "Colombian Brew Double Chocolate Mocha Coffee Premix",
    brand: "Colombian Brew Coffee",
    quantity: "10 U",
    key: "APR130002522xx14APR25"
  },
  {
    id: "dmart-01723",
    name: "Switz Samosa Dough Sheet",
    brand: "Switz",
    quantity: "500 gm",
    key: "MAR120002029xx30MAR22"
  },
  {
    id: "dmart-04976",
    name: "Pot Planter Saucer Base Plate - 10 cm",
    brand: "",
    quantity: "1 Unit",
    key: "DEC150011214xx24DEC25vvG1u"
  }
];

function article(key) {
  const m = key.match(/^[A-Z]+(\d+)xx/i);
  return m ? m[1] : "";
}

function skuList(product) {
  return product.sKUs || product.skus || product.SKUs || [];
}

function cleanKey(v) {
  return String(v || "")
    .replace(/^.*\//, "")
    .trim();
}

function imageUrl(sku) {
  const key = cleanKey(
    sku.productImageKey || sku.imageKey
  );
  const code = String(sku.imgCode || "").trim();

  if (!key || !code) return "";

  return `${CDN}${key}_${code}_B.jpg`;
}

function walk(data) {
  const out = [];

  function visit(v) {
    if (!v || typeof v !== "object") return;

    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }

    if (
      v.productId &&
      (v.name || v.sKUs || v.skus)
    ) {
      out.push(v);
    }

    Object.values(v).forEach(x => {
      if (x && typeof x === "object") visit(x);
    });
  }

  visit(data);

  const seen = new Set();

  return out.filter(x => {
    const id = String(x.productId);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function search(query) {
  const url =
    API +
    encodeURIComponent(query) +
    "?page=0&buryOOS=true&size=20&channel=web";

  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!res.ok) return [];

    return walk(await res.json());
  } catch {
    return [];
  }
}

async function inspect(target) {

  console.log("");
  console.log("--------------------------------------------------");
  console.log(`${target.id} | ${target.name}`);
  console.log(`Article : ${article(target.key)}`);
  console.log(`Key     : ${target.key}`);
  console.log("--------------------------------------------------");

  const queries = [
    target.key,
    article(target.key),
    target.name,
    `${target.brand} ${target.name}`.trim(),
    `${target.name} ${target.quantity}`
  ].filter(Boolean);

  const found = new Map();

  for (const query of queries) {

    const products = await search(query);

    console.log(
      `Query "${query}" -> ${products.length} products`
    );

    for (const product of products) {

      for (const sku of skuList(product)) {

        const key = cleanKey(
          sku.productImageKey ||
          sku.imageKey
        );

        const code =
          String(sku.imgCode || "").trim();

        if (!key || !code) continue;

        const id =
          `${product.productId}:${sku.skuUniqueID || key}:${code}`;

        if (found.has(id)) continue;

        found.set(id, {
          product,
          sku
        });
      }
    }
  }

  const rows = [...found.values()];

  console.log("");
  console.log(`Unique image SKUs found: ${rows.length}`);

  for (const { product, sku } of rows) {

    const key = cleanKey(
      sku.productImageKey ||
      sku.imageKey
    );

    const url = imageUrl(sku);

    const sameKey =
      key === target.key;

    const sameArticle =
      String(sku.articleNumber || "") ===
      article(target.key);

    console.log("");
    console.log(
      `Product: ${product.name}`
    );
    console.log(
      `SKU: ${sku.skuUniqueID || "-"}`
    );
    console.log(
      `Article: ${sku.articleNumber || "-"}`
    );
    console.log(
      `Variant: ${sku.variantTextValue || "-"}`
    );
    console.log(
      `ImageKey: ${key}`
    );
    console.log(
      `imgCode: ${sku.imgCode || "-"}`
    );
    console.log(
      `MATCH KEY: ${sameKey ? "YES" : "NO"}`
    );
    console.log(
      `MATCH ARTICLE: ${sameArticle ? "YES" : "NO"}`
    );
    console.log(
      `IMAGE: ${url}`
    );
  }
}

for (const target of targets) {
  await inspect(target);
}

console.log("");
console.log("==================================================");
console.log("TARGETED SEARCH COMPLETE");
console.log("==================================================");
