const productName = "Dove Cream Beauty Bathing Bar";

const api =
  "https://digital.dmart.in/api/v3/search/" +
  encodeURIComponent(productName) +
  "?page=0&buryOOS=true&size=5&channel=web";

console.log("");
console.log("==============================================");
console.log(" GHARLIST — CURRENT DMART IMAGE DISCOVERY");
console.log("==============================================");
console.log("");
console.log("Searching:", productName);
console.log("");

try {
  const response = await fetch(api);

  console.log("API status:", response.status);

  if (!response.ok) {
    throw new Error(
      "DMart API returned HTTP " + response.status
    );
  }

  const data = await response.json();

  const products = data?.products || [];

  console.log(
    "Products returned:",
    products.length
  );

  if (!products.length) {
    console.log("No products returned.");
    process.exit(1);
  }

  const parent = products[0];

  console.log("");
  console.log("PRODUCT:");
  console.log("Name:", parent.name);
  console.log("Product ID:", parent.productId);

  const sku =
    parent.sKUs?.find(
      x =>
        x.productImageKey &&
        x.imgCode
    ) ||
    parent.sKUs?.[0];

  if (!sku) {
    console.log("No SKU image metadata found.");
    process.exit(1);
  }

  console.log("");
  console.log("SKU IMAGE METADATA");
  console.log("------------------------------");
  console.log("SKU:", sku.skuUniqueID);
  console.log("Article:", sku.articleNumber);
  console.log("imageKey:", sku.imageKey);
  console.log(
    "productImageKey:",
    sku.productImageKey
  );
  console.log("imgCode:", sku.imgCode);
  console.log(
    "binaryImgCode:",
    sku.binaryImgCode
  );

  const key = sku.productImageKey;
  const imageKey = sku.imageKey;
  const code = sku.imgCode;

  const candidates = [];

  function add(label, url) {
    candidates.push({
      label,
      url
    });
  }

  const base =
    "https://cdn.dmart.in/images/products/";

  /* flattened productImageKey */

  add(
    "flat-key-code",
    base + key + "_" + code + ".jpg"
  );

  add(
    "flat-key-code-B",
    base + key + "_" + code + "_B.jpg"
  );

  add(
    "flat-key-code-M",
    base + key + "_" + code + "_M.jpg"
  );

  add(
    "flat-key-code-S",
    base + key + "_" + code + "_S.jpg"
  );

  add(
    "flat-key-B",
    base + key + "_B.jpg"
  );

  add(
    "flat-key-M",
    base + key + "_M.jpg"
  );

  /* imageKey nested path */

  if (imageKey) {

    add(
      "imageKey-code",
      base +
      imageKey +
      "_" +
      code +
      ".jpg"
    );

    add(
      "imageKey-code-B",
      base +
      imageKey +
      "_" +
      code +
      "_B.jpg"
    );

    add(
      "imageKey-code-M",
      base +
      imageKey +
      "_" +
      code +
      "_M.jpg"
    );

    add(
      "imageKey-B",
      base +
      imageKey +
      "_B.jpg"
    );

    add(
      "imageKey-M",
      base +
      imageKey +
      "_M.jpg"
    );

  }

  /* common CDN variants */

  add(
    "flat-key-code-webp",
    base + key + "_" + code + ".webp"
  );

  add(
    "flat-key-code-B-webp",
    base + key + "_" + code + "_B.webp"
  );

  add(
    "imageKey-code-webp",
    base + imageKey + "_" + code + ".webp"
  );

  console.log("");
  console.log("TESTING IMAGE URL CANDIDATES");
  console.log("--------------------------------");

  const working = [];

  for (const candidate of candidates) {

    try {

      const r = await fetch(
        candidate.url,
        {
          method: "GET"
        }
      );

      const contentType =
        r.headers.get("content-type") || "";

      const length =
        r.headers.get("content-length") || "";

      console.log(
        r.status.toString().padEnd(5),
        candidate.label.padEnd(28),
        contentType.padEnd(25),
        length,
      );

      if (
        r.ok &&
        contentType.startsWith("image/")
      ) {
        working.push(candidate);
      }

    } catch (error) {

      console.log(
        "ERR  ".padEnd(5),
        candidate.label,
        error.message
      );

    }
  }

  console.log("");
  console.log("==============================================");

  if (working.length) {

    console.log(
      "FOUND WORKING IMAGE URL(S):"
    );

    for (const item of working) {
      console.log("");
      console.log(item.label);
      console.log(item.url);
    }

  } else {

    console.log(
      "NO GUESSED URL FORMAT WORKED."
    );

    console.log("");
    console.log(
      "We will extract the CURRENT DMart image builder"
    );

    console.log(
      "from the live frontend instead of guessing."
    );

  }

  console.log("");
  console.log("==============================================");

} catch (error) {

  console.error("");
  console.error(
    "IMAGE DISCOVERY FAILED:"
  );
  console.error(error.message);
  console.error("");

  process.exit(1);
}
