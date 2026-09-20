import fs from "fs";

const files = fs.readdirSync("reports");

const candidates = files.filter(x =>
  x.endsWith(".js") ||
  x.includes("dmart")
);

console.log("");
console.log("==============================================");
console.log(" GHARLIST - FIND DMART IMAGE URL BUILDER");
console.log("==============================================");
console.log("");

console.log("Searching existing reports...");

let found = 0;

for (const file of candidates) {

  const path = `reports/${file}`;

  let text = "";

  try {
    text = fs.readFileSync(path, "utf8");
  } catch {
    continue;
  }

  const needles = [
    "productImageKey",
    "imageKey",
    "binaryImgCode",
    "cdn.dmart.in",
    "/images/products/",
    "images/products"
  ];

  for (const needle of needles) {

    let index = 0;

    while (true) {

      index = text.indexOf(needle, index);

      if (index === -1) break;

      found++;

      console.log("");
      console.log("----------------------------------------------");
      console.log(`FILE   : ${file}`);
      console.log(`MATCH  : ${needle}`);
      console.log("----------------------------------------------");

      console.log(
        text.slice(
          Math.max(0, index - 1200),
          Math.min(text.length, index + 2500)
        )
      );

      index += needle.length;

      if (found >= 40) break;
    }

    if (found >= 40) break;
  }

  if (found >= 40) break;
}

console.log("");
console.log("==============================================");
console.log(" SEARCH COMPLETE");
console.log("==============================================");
console.log("");
console.log("Matches:", found);
console.log("");

if (!found) {
  console.log("No builder found in reports.");
  console.log("Next step: download and inspect current DMart JS bundles.");
}

console.log("");
