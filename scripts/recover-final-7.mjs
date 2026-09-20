import fs from "fs";
import path from "path";

const PRODUCTS =
  path.join(
    process.cwd(),
    "public/data/products.json"
  );

const CDN =
  "https://cdn.dmart.in/images/products/";

const targets = [
  "dmart-00572",
  "dmart-02149",
  "dmart-02366",
  "dmart-03445",
  "dmart-04916",
  "dmart-04938",
  "dmart-04943"
];

const products =
  JSON.parse(
    fs.readFileSync(
      PRODUCTS,
      "utf8"
    )
  );

const selected =
  products.filter(
    p => targets.includes(p.id)
  );

function clean(v) {
  return String(v || "")
    .replace(/^.*\//, "")
    .trim();
}

function article(key) {
  const m =
    String(key || "").match(
      /[A-Z]+(\d+)xx/i
    );

  return m ? m[1] : "";
}

async function search(query) {

  const url =
    "https://digital.dmart.in/api/v3/search/" +
    encodeURIComponent(query) +
    "?page=0&buryOOS=true&size=20&channel=web";

  try {

    const r =
      await fetch(url, {
        headers: {
          accept:
            "application/json",
          "user-agent":
            "Mozilla/5.0"
        }
      });

    if (!r.ok)
      return null;

    return await r.json();

  } catch {
    return null;
  }
}

function walk(data) {

  const out = [];

  function visit(v) {

    if (!v || typeof v !== "object")
      return;

    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }

    if (
      v.productId &&
      (v.name ||
       v.sKUs ||
       v.skus)
    ) {
      out.push(v);
    }

    Object.values(v).forEach(x => {
      if (
        x &&
        typeof x === "object"
      )
        visit(x);
    });
  }

  visit(data);

  const seen = new Set();

  return out.filter(p => {

    const id =
      String(p.productId);

    if (seen.has(id))
      return false;

    seen.add(id);
    return true;
  });
}

function skus(p) {
  return (
    p.sKUs ||
    p.skus ||
    p.SKUs ||
    []
  );
}

function score(local, remote) {

  const a =
    String(local || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const b =
    String(remote || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  if (a === b)
    return 100;

  if (
    a.includes(b) ||
    b.includes(a)
  )
    return 85;

  const aa =
    new Set(a.split(/\s+/));

  const bb =
    new Set(b.split(/\s+/));

  let common = 0;

  for (const x of aa)
    if (bb.has(x))
      common++;

  return aa.size
    ? common / aa.size * 70
    : 0;
}

async function probe(url) {

  try {

    const r =
      await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0"
        }
      });

    const type =
      r.headers.get(
        "content-type"
      ) || "";

    const data =
      await r.arrayBuffer();

    return (
      r.ok &&
      type.startsWith("image/") &&
      data.byteLength > 1000
    );

  } catch {
    return false;
  }
}

for (const product of selected) {

  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    `${product.id} | ${product.name}`
  );
  console.log(
    `Key: ${product.productImageKey}`
  );
  console.log(
    `Article: ${
      product.articleNumber ||
      article(product.productImageKey)
    }`
  );
  console.log(
    "=========================================="
  );

  const queries = [
    product.name,
    `${product.brand || ""} ${product.name}`,
    product.articleNumber,
    article(product.productImageKey),
    product.productImageKey
  ].filter(Boolean);

  const candidates = [];

  for (const query of [
    ...new Set(queries)
  ]) {

    const data =
      await search(query);

    if (!data)
      continue;

    const remote =
      walk(data);

    console.log(
      `Query: ${query} -> ${remote.length}`
    );

    for (const p of remote) {

      const baseScore =
        score(
          product.name,
          p.name
        );

      if (baseScore < 45)
        continue;

      for (const sku of skus(p)) {

        const key =
          clean(
            sku.productImageKey ||
            sku.imageKey
          );

        const code =
          String(
            sku.imgCode || ""
          ).trim();

        if (!key || !code)
          continue;

        const url =
          `${CDN}${key}_${code}_B.jpg`;

        candidates.push({
          key,
          code,
          url,
          score: baseScore,
          remote: p.name,
          article:
            sku.articleNumber
        });
      }
    }
  }

  const unique =
    new Map();

  for (const c of candidates) {

    const k =
      `${c.key}_${c.code}`;

    if (!unique.has(k))
      unique.set(k, c);
  }

  const list =
    [...unique.values()]
      .sort(
        (a,b) =>
          b.score - a.score
      );

  let found = null;

  for (const c of list) {

    const ok =
      await probe(c.url);

    console.log(
      `${ok ? "✓" : "✗"} ` +
      `${c.remote} | ` +
      `${c.key}_${c.code}_B.jpg`
    );

    if (ok && !found)
      found = c;
  }

  if (found) {

    product.productImageKey =
      found.key;

    product.imgCode =
      found.code;

    product.imageKey =
      found.key;

    product.image =
      found.url;

    product.imageStatus =
      "dmart-live";

    product.imageSource =
      "DMart CDN";

    product.imageValidated =
      true;

    console.log(
      `\n✅ RECOVERED: ${found.url}`
    );

  } else {

    console.log(
      "\n❌ No verified replacement found"
    );
  }
}

fs.writeFileSync(
  PRODUCTS,
  JSON.stringify(
    products,
    null,
    2
  )
);

const remaining =
  products.filter(
    p =>
      !p.image ||
      p.imageValidated !== true
  );

console.log("");
console.log(
  "=============================================="
);
console.log(
  "7-PRODUCT RECOVERY COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  `Verified products : ${
    products.length -
    remaining.length
  }`
);
console.log(
  `Still unverified  : ${
    remaining.length
  }`
);
console.log(
  "=============================================="
);
