import fs from "fs";
import https from "https";

const ROOT = "https://www.dmart.in";

function get(url) {
  return new Promise(resolve => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      },
      res => {
        let body = "";

        res.on("data", x => body += x);
        res.on("end", () => resolve({
          status: res.statusCode,
          body
        }));
      }
    ).on("error", () => resolve({
      status: 0,
      body: ""
    }));
  });
}

function abs(url) {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return ROOT + url;
  return ROOT + "/" + url;
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST - DMART API REQUEST REVERSE ENGINEER");
console.log("==============================================");
console.log("");

console.log("[1/5] Loading homepage...");

const home = await get(ROOT);

const scripts = [
  ...home.body.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
].map(x => abs(x[1]));

const uniqueScripts = [...new Set(scripts)];

console.log("JS bundles:", uniqueScripts.length);

let allJs = "";

console.log("");
console.log("[2/5] Downloading bundles...");

for (let i = 0; i < uniqueScripts.length; i++) {

  const r = await get(uniqueScripts[i]);

  if (r.status === 200) {
    allJs += "\n" + r.body;
  }
}

console.log("Combined JS:", allJs.length, "bytes");

console.log("");
console.log("[3/5] Extracting API context...");

const needles = [
  "digital.dmart.in/api",
  "/v3/search/",
  "/v3/productslist/suggestion/byId/",
  "/products/hybridproductlist",
  "hybridproductlist",
  "searchResult",
  "productImage",
  "productImageKey",
  "imageUrl",
  "image_url"
];

const contexts = [];

for (const needle of needles) {

  let start = 0;

  while (true) {

    const index = allJs.indexOf(needle, start);

    if (index === -1) break;

    const from = Math.max(0, index - 1200);
    const to = Math.min(allJs.length, index + 2500);

    contexts.push({
      needle,
      context: allJs.slice(from, to)
    });

    start = index + needle.length;

    if (contexts.length >= 80) break;
  }
}

console.log("Contexts found:", contexts.length);

console.log("");
console.log("==============================================");
console.log(" IMPORTANT API CONTEXT");
console.log("==============================================");

for (const item of contexts) {

  console.log("");
  console.log("###", item.needle);
  console.log(item.context);
}

console.log("");
console.log("[4/5] Checking search HTML for product JSON...");

const testUrl =
  "https://www.dmart.in/search?searchTerm=" +
  encodeURIComponent("Premia Badam Almonds");

const search = await get(testUrl);

console.log("Search HTTP:", search.status);
console.log("Search HTML:", search.body.length, "bytes");

const productTerms = [
  "productImage",
  "productImageKey",
  "imageUrl",
  "image_url",
  "productName",
  "articleName",
  "sellingPrice",
  "salePrice",
  "productList"
];

for (const term of productTerms) {

  const count =
    (search.body.match(
      new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    ) || []).length;

  console.log(`${term}: ${count}`);
}

console.log("");
console.log("[5/5] Saving reverse-engineering report...");

fs.mkdirSync("reports", { recursive: true });

fs.writeFileSync(
  "reports/dmart-api-context.txt",
  contexts.map(
    x => `\n\n========== ${x.needle} ==========\n\n${x.context}`
  ).join("")
);

fs.writeFileSync(
  "reports/dmart-search-sample.html",
  search.body
);

console.log("");
console.log("==============================================");
console.log(" REVERSE ENGINEERING COMPLETE");
console.log("==============================================");
console.log("");
console.log("Created:");
console.log("reports\\dmart-api-context.txt");
console.log("reports\\dmart-search-sample.html");
console.log("");
console.log("NO DATASET MODIFIED.");
console.log("");
