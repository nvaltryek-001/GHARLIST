import fs from "fs";
import path from "path";

const PRODUCTS_FILE = "./public/data/products.json";
const IMAGE_MAP_FILE = "./public/data/product-images.json";

const CONCURRENCY = 40;
const TIMEOUT_MS = 6000;

const products = JSON.parse(
  fs.readFileSync(PRODUCTS_FILE, "utf8")
);

const imageMap = JSON.parse(
  fs.readFileSync(IMAGE_MAP_FILE, "utf8")
);

console.log("\n==================================================");
console.log(" GHARLIST - FULL IMAGE VALIDATION");
console.log("==================================================");

console.log(`Products loaded : ${products.length}`);

const results = new Array(products.length);

let nextIndex = 0;
let completed = 0;

function getMappedImage(product) {
  if (product.image) {
    return product.image;
  }

  if (Array.isArray(imageMap)) {
    const found = imageMap.find(
      (item) =>
        item.id === product.id ||
        item.productId === product.id
    );

    return found?.image || found?.url || null;
  }

  if (imageMap && typeof imageMap === "object") {
    const value = imageMap[product.id];

    if (typeof value === "string") {
      return value;
    }

    return value?.image || value?.url || null;
  }

  return null;
}

async function validateImage(product, index) {
  const url = getMappedImage(product);

  const result = {
    index,
    id: product.id,
    name: product.name,
    brand: product.brand || "",
    category: product.category || "",
    image: url,
    status: null,
    contentType: null,
    reachable: false,
    error: null,
  };

  if (!url) {
    result.status = "NO_URL";
    return result;
  }

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Range: "bytes=0-0",
        "User-Agent": "GHARLIST-Image-Audit/1.0",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    result.status = response.status;

    result.contentType =
      response.headers.get("content-type") || "";

    result.reachable =
      response.ok &&
      result.contentType.toLowerCase().startsWith("image/");

    if (!result.reachable && response.status >= 200 && response.status < 300) {
      result.error = "Response is not an image";
    }
  } catch (error) {
    result.status = "ERROR";

    result.error =
      error?.name === "AbortError"
        ? "TIMEOUT"
        : String(error?.message || error);
  } finally {
    clearTimeout(timer);
  }

  return result;
}

async function worker() {
  while (true) {
    const index = nextIndex++;

    if (index >= products.length) {
      return;
    }

    results[index] = await validateImage(
      products[index],
      index
    );

    completed++;

    if (
      completed % 100 === 0 ||
      completed === products.length
    ) {
      process.stdout.write(
        `\rChecked ${completed}/${products.length}`
      );
    }
  }
}

const workers = Array.from(
  { length: Math.min(CONCURRENCY, products.length) },
  () => worker()
);

await Promise.all(workers);

console.log("\n");

const summary = {
  totalProducts: products.length,
  withImageUrl: 0,
  withoutImageUrl: 0,
  workingImages: 0,
  brokenImages: 0,
  timeoutImages: 0,
  nonImageResponses: 0,
  uniqueImageUrls: 0,
  duplicateImageUrls: 0,
};

const urlCounts = new Map();

for (const result of results) {
  if (result.image) {
    summary.withImageUrl++;

    urlCounts.set(
      result.image,
      (urlCounts.get(result.image) || 0) + 1
    );
  } else {
    summary.withoutImageUrl++;
  }

  if (result.reachable) {
    summary.workingImages++;
  } else {
    summary.brokenImages++;
  }

  if (result.error === "TIMEOUT") {
    summary.timeoutImages++;
  }

  if (
    result.status >= 200 &&
    result.status < 300 &&
    !result.reachable
  ) {
    summary.nonImageResponses++;
  }
}

summary.uniqueImageUrls = urlCounts.size;

summary.duplicateImageUrls =
  [...urlCounts.values()]
    .filter((count) => count > 1)
    .reduce(
      (total, count) => total + count - 1,
      0
    );

const report = {
  generatedAt: new Date().toISOString(),

  summary,

  duplicateImageUrls: [...urlCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({
      url,
      count,
    })),

  products: results,
};

fs.writeFileSync(
  "./reports/image-validation-report.json",
  JSON.stringify(report, null, 2),
  "utf8"
);

const csvHeader = [
  "ID",
  "Product",
  "Brand",
  "Category",
  "Image",
  "Status",
  "ContentType",
  "Reachable",
  "Error",
].join(",");

const csvRows = results.map((item) =>
  [
    item.id,
    item.name,
    item.brand,
    item.category,
    item.image,
    item.status,
    item.contentType,
    item.reachable,
    item.error || "",
  ]
    .map((value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`
    )
    .join(",")
);

fs.writeFileSync(
  "./reports/image-validation.csv",
  [csvHeader, ...csvRows].join("\n"),
  "utf8"
);

console.log("==================================================");
console.log(" IMAGE AUDIT COMPLETE");
console.log("==================================================");

console.log(`Total products       : ${summary.totalProducts}`);
console.log(`With image URL       : ${summary.withImageUrl}`);
console.log(`Without image URL    : ${summary.withoutImageUrl}`);
console.log(`Working images       : ${summary.workingImages}`);
console.log(`Broken images        : ${summary.brokenImages}`);
console.log(`Timeout images       : ${summary.timeoutImages}`);
console.log(`Non-image responses  : ${summary.nonImageResponses}`);
console.log(`Unique image URLs    : ${summary.uniqueImageUrls}`);
console.log(`Duplicate URLs       : ${summary.duplicateImageUrls}`);

console.log("\nReports:");
console.log("reports/image-validation-report.json");
console.log("reports/image-validation.csv");

console.log("\n==================================================");
