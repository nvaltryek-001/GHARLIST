import fs from "fs";

const API = "https://digital.dmart.in/api";

const products = JSON.parse(
  fs.readFileSync("public/data/products.json", "utf8")
);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchProduct(product) {

  const query = encodeURIComponent(
    `${product.name}${product.brand ? " " + product.brand : ""}`
  );

  const url =
    `${API}/v3/search/${query}?page=0&buryOOS=true&size=20&channel=web`;

  try {

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.dmart.in/"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        products: []
      };
    }

    const json = await response.json();

    return {
      ok: true,
      status: response.status,
      products: json.products || []
    };

  } catch (error) {

    return {
      ok: false,
      status: 0,
      products: []
    };
  }
}

function getImage(obj) {

  if (!obj || typeof obj !== "object") return "";

  const possible = [
    obj.image,
    obj.imageUrl,
    obj.imageURL,
    obj.image_url,
    obj.productImage,
    obj.productImageUrl,
    obj.productImageURL,
    obj.thumbnail,
    obj.thumbnailUrl,
    obj.imgUrl,
    obj.imgURL
  ];

  for (const value of possible) {

    if (
      typeof value === "string" &&
      /^https?:\/\//i.test(value) &&
      /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(value)
    ) {
      return value;
    }
  }

  // recursively inspect nested objects
  for (const value of Object.values(obj)) {

    if (value && typeof value === "object") {

      const found = getImage(value);

      if (found) return found;
    }
  }

  return "";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreMatch(local, remote) {

  const localName = normalize(local.name);
  const remoteName = normalize(
    remote.name ||
    remote.productName ||
    remote.articleName ||
    remote.displayName
  );

  if (!localName || !remoteName) return 0;

  if (localName === remoteName) return 100;

  const a = new Set(localName.split(" "));
  const b = new Set(remoteName.split(" "));

  let common = 0;

  for (const word of a) {
    if (b.has(word)) common++;
  }

  return Math.round(
    (common / Math.max(a.size, b.size)) * 100
  );
}

console.log("");
console.log("=================================================");
console.log(" GHARLIST - DMART REAL IMAGE RESOLVER");
console.log("=================================================");
console.log("");

console.log(`Dataset products: ${products.length}`);

console.log("");
console.log("[1/3] Testing DMart API with first 10 products...");
console.log("");

let testSuccess = 0;
let testImages = 0;

for (let i = 0; i < 10; i++) {

  const p = products[i];

  const result = await searchProduct(p);

  console.log(
    `[${i + 1}/10] ${p.name} | HTTP ${result.status} | API products ${result.products.length}`
  );

  if (result.products.length) {

    testSuccess++;

    const ranked = result.products
      .map(x => ({
        item: x,
        score: scoreMatch(p, x),
        image: getImage(x)
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];

    if (best?.image) {
      testImages++;

      console.log(`  MATCH: ${best.score}%`);
      console.log(`  IMAGE: ${best.image}`);
    } else {
      console.log("  No direct image field found");
    }
  }

  await sleep(150);
}

console.log("");
console.log("TEST RESULT");
console.log("-----------------------------");
console.log(`API matches : ${testSuccess}/10`);
console.log(`Images      : ${testImages}/10`);
console.log("");

if (testImages < 5) {

  console.log("❌ STOP");
  console.log("API response does not expose enough direct product images.");
  console.log("No dataset modified.");
  process.exit(0);
}

console.log("✅ API IMAGE SOURCE VERIFIED");
console.log("");
console.log("[2/3] Resolving ALL 5,188 products...");
console.log("");

const resolved = [];
const stats = {
  total: products.length,
  apiSuccess: 0,
  matched: 0,
  images: 0,
  noMatch: 0,
  noImage: 0,
  errors: 0
};

const BATCH = 20;

for (let start = 0; start < products.length; start += BATCH) {

  const batch = products.slice(
    start,
    start + BATCH
  );

  const results = await Promise.all(
    batch.map(p => searchProduct(p))
  );

  for (let i = 0; i < batch.length; i++) {

    const local = batch[i];
    const result = results[i];

    if (result.ok) {
      stats.apiSuccess++;
    } else {
      stats.errors++;
    }

    const ranked = result.products
      .map(item => ({
        item,
        score: scoreMatch(local, item),
        image: getImage(item)
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];

    if (!best || best.score < 45) {

      stats.noMatch++;

      resolved.push({
        id: local.id,
        name: local.name,
        brand: local.brand,
        quantity: local.quantity,
        oldImage: local.image,
        image: "",
        matchScore: best?.score || 0,
        status: "NO_MATCH"
      });

      continue;
    }

    stats.matched++;

    if (best.image) {
      stats.images++;
    } else {
      stats.noImage++;
    }

    resolved.push({
      id: local.id,
      name: local.name,
      brand: local.brand,
      quantity: local.quantity,
      oldImage: local.image,
      image: best.image || "",
      matchScore: best.score,
      status: best.image
        ? "RESOLVED"
        : "MATCH_NO_IMAGE"
    });
  }

  const done = Math.min(
    start + BATCH,
    products.length
  );

  if (
    done % 100 === 0 ||
    done === products.length
  ) {
    console.log(
      `${done}/${products.length} | images=${stats.images} | matched=${stats.matched} | noMatch=${stats.noMatch}`
    );
  }

  await sleep(100);
}

console.log("");
console.log("[3/3] Saving resolver output...");

fs.mkdirSync("reports", {
  recursive: true
});

fs.writeFileSync(
  "reports/resolved-product-images.json",
  JSON.stringify(resolved, null, 2)
);

fs.writeFileSync(
  "reports/image-resolver-stats.json",
  JSON.stringify(stats, null, 2)
);

console.log("");
console.log("=================================================");
console.log(" RESOLUTION COMPLETE");
console.log("=================================================");
console.log("");

console.log(`Total products : ${stats.total}`);
console.log(`API success    : ${stats.apiSuccess}`);
console.log(`Matched        : ${stats.matched}`);
console.log(`Images found   : ${stats.images}`);
console.log(`No image       : ${stats.noImage}`);
console.log(`No match       : ${stats.noMatch}`);
console.log(`Errors         : ${stats.errors}`);

console.log("");
console.log("Created:");
console.log("reports\\resolved-product-images.json");
console.log("reports\\image-resolver-stats.json");
console.log("");
console.log("⚠️ Dataset/frontend NOT modified yet.");
console.log("");
