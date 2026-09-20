import fs from "fs";
import https from "https";
import http from "http";

const products = JSON.parse(
  fs.readFileSync("public/data/products.json", "utf8")
);

const sample = products.slice(0, 10);

function get(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;

    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      },
      (res) => {
        let data = "";

        res.on("data", chunk => data += chunk);

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: data,
            finalUrl: res.headers.location || url
          });
        });
      }
    );

    req.setTimeout(15000, () => {
      req.destroy();
      resolve({
        status: 0,
        body: "",
        finalUrl: url
      });
    });

    req.on("error", () => {
      resolve({
        status: 0,
        body: "",
        finalUrl: url
      });
    });
  });
}

function extractImages(html) {
  const found = new Set();

  const patterns = [
    /https?:\/\/[^"'\\\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<>]*)?/gi,
    /https?:\/\/[^"'\\\s<>]*cdn[^"'\\\s<>]+/gi,
    /https?:\/\/[^"'\\\s<>]*image[^"'\\\s<>]+/gi
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern) || [];

    for (const m of matches) {
      found.add(
        m.replace(/\\u002F/g, "/")
         .replace(/\\\//g, "/")
         .replace(/&amp;/g, "&")
      );
    }
  }

  return [...found];
}

console.log("");
console.log("=========================================");
console.log(" GHARLIST - LIVE DMART IMAGE TEST");
console.log("=========================================");
console.log("");

let success = 0;

for (let i = 0; i < sample.length; i++) {

  const p = sample[i];

  console.log(`[${i + 1}/10] ${p.name}`);

  const query = encodeURIComponent(
    `${p.name} ${p.brand || ""}`
  );

  const searchUrl =
    `https://www.dmart.in/search?searchTerm=${query}`;

  const result = await get(searchUrl);

  console.log(`  HTTP: ${result.status}`);

  const images = extractImages(result.body);

  console.log(`  Images discovered: ${images.length}`);

  if (images.length > 0) {
    success++;

    console.log("  SAMPLE IMAGE:");
    console.log(`  ${images[0]}`);
  } else {
    console.log("  ❌ No image URL discovered");
  }

  console.log("");
}

console.log("=========================================");
console.log(" TEST COMPLETE");
console.log("=========================================");
console.log("");
console.log(`Products tested : ${sample.length}`);
console.log(`Products with image found : ${success}`);
console.log(`Products without image : ${sample.length - success}`);
console.log("");
console.log("DO NOT MODIFY DATASET YET.");
console.log("");
