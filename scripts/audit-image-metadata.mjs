import fs from "fs";

const products =
  JSON.parse(
    fs.readFileSync(
      "public/data/products.json",
      "utf8"
    )
  );

let withKey = 0;
let withImgCode = 0;
let withBoth = 0;
let missingKey = 0;
let missingImgCode = 0;

const codeCounts = {};
const missingSamples = [];

for (const product of products) {

  const key =
    String(product.productImageKey || "").trim();

  const code =
    String(product.imgCode || "").trim();

  if (key) withKey++;
  else missingKey++;

  if (code) {
    withImgCode++;
    codeCounts[code] =
      (codeCounts[code] || 0) + 1;
  } else {
    missingImgCode++;
  }

  if (key && code) {
    withBoth++;
  }

  if (
    (!key || !code) &&
    missingSamples.length < 15
  ) {
    missingSamples.push({
      id: product.id,
      name: product.name,
      quantity: product.quantity,
      key: key || "MISSING",
      imgCode: code || "MISSING"
    });
  }
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST 5,188 IMAGE METADATA AUDIT");
console.log("==============================================");
console.log("");

console.log(
  "Total products       :",
  products.length
);

console.log(
  "With productImageKey :",
  withKey
);

console.log(
  "With imgCode         :",
  withImgCode
);

console.log(
  "With BOTH            :",
  withBoth
);

console.log(
  "Missing key          :",
  missingKey
);

console.log(
  "Missing imgCode      :",
  missingImgCode
);

console.log("");
console.log("imgCode distribution:");
console.log(codeCounts);

console.log("");
console.log("Missing metadata samples:");
console.table(missingSamples);

console.log("");
console.log("EXPECTED IMAGE FORMULA:");
console.log(
  "https://cdn.dmart.in/images/products/{productImageKey}_{imgCode}_B.jpg"
);

console.log("");
console.log("==============================================");
