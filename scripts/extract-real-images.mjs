import fs from "fs";
import https from "https";

const products = JSON.parse(
  fs.readFileSync("public/data/products.json", "utf8")
);

const sample = products.slice(0, 10);

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml"
        }
      },
      res => {
        let body = "";

        res.on("data", x => body += x);

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body
          });
        });
      }
    );

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ status: 0, body: "" });
    });

    req.on("error", () => {
      resolve({ status: 0, body: "" });
    });
  });
}

function extractImages(html) {

  const urls = new Set();

  const regex =
    /https?:\\?\/\\?\/[^"'<>\\\s]+/gi;

  const matches = html.match(regex) || [];

  for (let url of matches) {

    url = url
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/")
      .replace(/\\u003D/g, "=")
      .replace(/\\u0026/g, "&")
      .replace(/["'\\),]+$/g, "");

    if (
      /\.(jpg|jpeg|png|webp|avif)/i.test(url) ||
      /cdn\.dmart\.in/i.test(url)
    ) {
      urls.add(url);
    }
  }

  return [...urls];
}

console.log("");
console.log("=========================================");
console.log(" GHARLIST - REAL IMAGE EXTRACTION TEST");
console.log("=========================================");
console.log("");

let totalPossible = 0;

for (let i = 0; i < sample.length; i++) {

  const p = sample[i];

  console.log("-----------------------------------------");
  console.log(`[${i + 1}/10] ${p.name}`);
  console.log(`Brand : ${p.brand || "N/A"}`);
  console.log(`Key   : ${p.productImageKey}`);

  const query = encodeURIComponent(
    `${p.name} ${p.brand || ""}`
  );

  const url =
    `https://www.dmart.in/search?searchTerm=${query}`;

  const result = await get(url);

  console.log(`HTTP  : ${result.status}`);

  const images = extractImages(result.body);

  console.log(`Images discovered: ${images.length}`);

  const productImages = images.filter(x =>
    !/\/icons\//i.test(x) &&
    !/\/logo/i.test(x) &&
    !/favicon/i.test(x) &&
    !/sprite/i.test(x) &&
    !/banner/i.test(x) &&
    !/placeholder/i.test(x)
  );

  console.log(`Possible product images: ${productImages.length}`);

  for (const image of productImages) {
    console.log(`  PRODUCT IMAGE -> ${image}`);
  }

  if (productImages.length > 0) {
    totalPossible++;
  }
}

console.log("");
console.log("=========================================");
console.log(" EXTRACTION COMPLETE");
console.log("=========================================");
console.log("");
console.log(`Products tested          : 10`);
console.log(`Products with candidates: ${totalPossible}`);
console.log("");
console.log("NO DATASET MODIFICATION.");
console.log("");
