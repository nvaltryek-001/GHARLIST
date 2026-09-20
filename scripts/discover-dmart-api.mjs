import fs from "fs";
import https from "https";

const ROOT = "https://www.dmart.in";

function get(url) {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      },
      res => {
        let data = "";

        res.on("data", x => data += x);
        res.on("end", () => resolve({
          status: res.statusCode,
          body: data
        }));
      }
    ).on("error", () => resolve({
      status: 0,
      body: ""
    }));
  });
}

function absolute(url) {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return ROOT + url;
  return ROOT + "/" + url;
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST - DMART API DISCOVERY");
console.log("==============================================");
console.log("");

console.log("[1/4] Downloading DMart homepage...");

const home = await get(ROOT);

console.log("HTTP:", home.status);
console.log("HTML:", home.body.length, "bytes");

const scripts = [
  ...home.body.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
].map(x => absolute(x[1]));

const uniqueScripts = [...new Set(scripts)];

console.log("JS bundles found:", uniqueScripts.length);

console.log("");
console.log("[2/4] Downloading JS bundles...");

let allJs = "";

for (let i = 0; i < uniqueScripts.length; i++) {

  const url = uniqueScripts[i];

  const result = await get(url);

  console.log(
    `[${i + 1}/${uniqueScripts.length}]`,
    result.status,
    url
  );

  if (result.status === 200) {
    allJs += "\n" + result.body;
  }
}

console.log("");
console.log("[3/4] Searching for API/product/image endpoints...");

const patterns = [
  /https?:\/\/[^"'`\\\s]+/gi,
  /["'`]\/[^"'`\\\s]*(?:api|search|product|catalog|image)[^"'`\\\s]*["'`]/gi,
  /["'`][^"'`\\\s]*(?:\/api\/|graphql|searchProduct|productSearch|productList|search)[^"'`\\\s]*["'`]/gi
];

const found = new Set();

for (const regex of patterns) {

  const matches = allJs.match(regex) || [];

  for (const m of matches) {

    const cleaned = m
      .replace(/^["'`]/, "")
      .replace(/["'`]$/, "")
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/");

    if (
      /api|graphql|search|product|catalog|image/i.test(cleaned)
    ) {
      found.add(cleaned);
    }
  }
}

const results = [...found]
  .filter(x => x.length < 500)
  .sort();

console.log("");
console.log("DISCOVERED ENDPOINT CANDIDATES:");
console.log("");

for (const x of results) {
  console.log(x);
}

console.log("");
console.log("[4/4] Saving discovery report...");

fs.mkdirSync("reports", { recursive: true });

fs.writeFileSync(
  "reports/dmart-api-discovery.json",
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    homepageStatus: home.status,
    scriptCount: uniqueScripts.length,
    candidates: results
  }, null, 2)
);

console.log("");
console.log("==============================================");
console.log(" DISCOVERY COMPLETE");
console.log("==============================================");
console.log("");
console.log("Candidates:", results.length);
console.log("Report: reports/dmart-api-discovery.json");
console.log("");
console.log("DO NOT MODIFY products.json");
console.log("");
