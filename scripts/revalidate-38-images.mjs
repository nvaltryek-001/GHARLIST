import fs from "fs";
import path from "path";

const PRODUCTS = path.join(
  process.cwd(),
  "public/data/products.json"
);

const REPORT = path.join(
  process.cwd(),
  "reports/final-image-validation.json"
);

const products =
  JSON.parse(
    fs.readFileSync(PRODUCTS, "utf8")
  );

const previous =
  JSON.parse(
    fs.readFileSync(REPORT, "utf8")
  );

const brokenIds =
  new Set(
    previous.brokenProducts.map(
      x => x.id
    )
  );

const targets =
  products.filter(
    p => brokenIds.has(p.id)
  );

const CONCURRENCY = 4;
const TIMEOUT = 30000;
const RETRIES = 4;

console.log("");
console.log("==============================================");
console.log(" GHARLIST — 38 IMAGE REVALIDATION");
console.log("==============================================");
console.log("");
console.log(`Targets     : ${targets.length}`);
console.log(`Concurrency : ${CONCURRENCY}`);
console.log(`Timeout     : ${TIMEOUT} ms`);
console.log(`Retries     : ${RETRIES}`);
console.log("");

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}

async function check(url, attempt = 1) {

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      TIMEOUT
    );

  try {

    const response =
      await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0",
          "accept":
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });

    const type =
      response.headers.get(
        "content-type"
      ) || "";

    const buffer =
      await response.arrayBuffer();

    const bytes =
      buffer.byteLength;

    const ok =
      response.ok &&
      type
        .toLowerCase()
        .startsWith("image/") &&
      bytes > 1000;

    return {
      ok,
      status: response.status,
      contentType: type,
      bytes
    };

  } catch (error) {

    if (attempt < RETRIES) {

      await sleep(
        1000 * attempt
      );

      return check(
        url,
        attempt + 1
      );
    }

    return {
      ok: false,
      reason:
        error.name ===
        "AbortError"
          ? "timeout"
          : String(
              error.message ||
              error
            )
    };

  } finally {

    clearTimeout(timer);
  }
}

let cursor = 0;
let completed = 0;

const results = [];

async function worker() {

  while (true) {

    const index =
      cursor++;

    if (
      index >= targets.length
    ) return;

    const product =
      targets[index];

    const result =
      await check(
        product.image
      );

    results.push({
      id: product.id,
      name: product.name,
      image: product.image,
      ...result
    });

    completed++;

    console.log(
      `[${completed}/${targets.length}] ` +
      `${product.id} | ` +
      `${result.ok ? "✓ WORKING" : "✗ " + (result.reason || "FAILED")} | ` +
      `${result.status || ""} ` +
      `${result.bytes || 0} bytes`
    );
  }
}

await Promise.all(
  Array.from(
    { length: CONCURRENCY },
    () => worker()
  )
);

const working =
  results.filter(
    x => x.ok
  );

const failed =
  results.filter(
    x => !x.ok
  );

console.log("");
console.log("==============================================");
console.log(" REVALIDATION RESULT");
console.log("==============================================");
console.log(
  `Checked : ${results.length}`
);
console.log(
  `Working : ${working.length}`
);
console.log(
  `Failed  : ${failed.length}`
);
console.log("");

console.log("WORKING:");
for (const x of working) {
  console.log(
    `✓ ${x.id} | ${x.name}`
  );
}

console.log("");
console.log("STILL FAILED:");

for (const x of failed) {
  console.log(
    `✗ ${x.id} | ${x.name} | ` +
    `${x.status || x.reason || "failed"}`
  );
}

fs.writeFileSync(
  path.join(
    process.cwd(),
    "reports/image-revalidation-38.json"
  ),
  JSON.stringify(
    {
      generatedAt:
        new Date().toISOString(),
      checked:
        results.length,
      working:
        working.length,
      failed:
        failed.length,
      results
    },
    null,
    2
  )
);

console.log("");
console.log(
  "Report: reports/image-revalidation-38.json"
);
console.log("==============================================");
