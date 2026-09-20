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

const CONCURRENCY = 25;
const TIMEOUT = 10000;

const results = new Array(
  products.length
);

let cursor = 0;
let completed = 0;

async function check(product) {

  if (!product.image) {
    return {
      id: product.id,
      ok: false,
      reason: "missing-image"
    };
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      TIMEOUT
    );

  try {

    const response =
      await fetch(product.image, {
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0"
        }
      });

    const type =
      response.headers.get(
        "content-type"
      ) || "";

    const buffer =
      await response.arrayBuffer();

    const ok =
      response.ok &&
      type.toLowerCase().startsWith("image/") &&
      buffer.byteLength > 1000;

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      status: response.status,
      contentType: type,
      bytes: buffer.byteLength,
      ok
    };

  } catch (error) {

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      ok: false,
      reason: error.name === "AbortError"
        ? "timeout"
        : String(error.message || error)

    };

  } finally {
    clearTimeout(timer);
  }
}

async function worker() {

  while (true) {

    const index = cursor++;

    if (index >= products.length)
      return;

    results[index] =
      await check(products[index]);

    completed++;

    if (
      completed % 100 === 0 ||
      completed === products.length
    ) {

      console.log(
        `[${(
          completed /
          products.length *
          100
        ).toFixed(1)}%] ` +
        `${completed}/${products.length}`
      );
    }
  }
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST — FINAL 5,188 IMAGE VALIDATION");
console.log("==============================================");
console.log("");
console.log(
  `Products   : ${products.length}`
);
console.log(
  `Concurrency: ${CONCURRENCY}`
);
console.log("");

await Promise.all(
  Array.from(
    { length: CONCURRENCY },
    () => worker()
  )
);

const working =
  results.filter(x => x.ok);

const broken =
  results.filter(x => !x.ok);

for (const product of products) {

  const result =
    results.find(
      x => x.id === product.id
    );

  product.imageValidated =
    Boolean(result?.ok);
}

fs.writeFileSync(
  PRODUCTS,
  JSON.stringify(
    products,
    null,
    2
  )
);

const report = {
  generatedAt:
    new Date().toISOString(),

  total:
    products.length,

  working:
    working.length,

  broken:
    broken.length,

  successRate:
    `${(
      working.length /
      products.length *
      100
    ).toFixed(2)}%`,

  brokenProducts:
    broken
};

fs.writeFileSync(
  REPORT,
  JSON.stringify(
    report,
    null,
    2
  )
);

console.log("");
console.log("==============================================");
console.log(" FINAL IMAGE VALIDATION COMPLETE");
console.log("==============================================");
console.log(
  `Total   : ${products.length}`
);
console.log(
  `Working : ${working.length}`
);
console.log(
  `Broken  : ${broken.length}`
);
console.log(
  `Success : ${report.successRate}`
);
console.log("");
console.log(
  `Report: ${REPORT}`
);
console.log("==============================================");
