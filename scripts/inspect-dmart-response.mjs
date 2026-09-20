const url =
  "https://digital.dmart.in/api/v3/search/" +
  encodeURIComponent("Premia Badam Almonds") +
  "?page=0&buryOOS=true&size=20&channel=web";

console.log("");
console.log("==============================================");
console.log(" GHARLIST - DMART API RESPONSE INSPECTOR");
console.log("==============================================");
console.log("");

const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "Referer": "https://www.dmart.in/"
  }
});

console.log("HTTP:", response.status);

const data = await response.json();

console.log("");
console.log("TOP LEVEL KEYS:");
console.log(Object.keys(data));

console.log("");
console.log("PRODUCT COUNT:");
console.log(data.products?.length || 0);

if (!data.products?.length) {
  console.log("❌ No products returned.");
  process.exit(1);
}

const product = data.products[0];

console.log("");
console.log("==============================================");
console.log(" FIRST PRODUCT RAW RESPONSE");
console.log("==============================================");
console.log("");

console.log(
  JSON.stringify(product, null, 2)
);

function inspect(obj, path = "product") {

  if (!obj || typeof obj !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(obj)) {

    const currentPath = `${path}.${key}`;

    if (
      /image|img|picture|photo|media|thumbnail|url|src|asset/i.test(key)
    ) {

      console.log("");
      console.log("🔎 POSSIBLE IMAGE FIELD");
      console.log("PATH :", currentPath);
      console.log("VALUE:", typeof value === "object"
        ? JSON.stringify(value)
        : value
      );
    }

    if (
      value &&
      typeof value === "object"
    ) {
      inspect(value, currentPath);
    }
  }
}

console.log("");
console.log("==============================================");
console.log(" IMAGE / MEDIA FIELD DISCOVERY");
console.log("==============================================");

inspect(product);

console.log("");
console.log("==============================================");
console.log(" FULL RESPONSE SAVED");
console.log("==============================================");

await import("fs").then(fs => {
  fs.writeFileSync(
    "reports/dmart-api-sample.json",
    JSON.stringify(data, null, 2)
  );
});

console.log("");
console.log("Created:");
console.log("reports\\dmart-api-sample.json");
console.log("");
console.log("NO DATASET MODIFIED.");
console.log("");
