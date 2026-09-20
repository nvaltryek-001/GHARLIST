import fs from "fs";
import path from "path";

const PRODUCTS = path.join(
  process.cwd(),
  "public/data/products.json"
);

const CDN =
  "https://cdn.dmart.in/images/products/";

const targets = [
  {
    id: "dmart-00518",
    name: "Lapsi Rava Small Daliya",
    key: "SEP110000830xx13SEP23"
  },
  {
    id: "dmart-01083",
    name: "Colombian Brew Double Chocolate Mocha Coffee Premix",
    key: "APR130002522xx14APR25"
  },
  {
    id: "dmart-01723",
    name: "Switz Samosa Dough Sheet",
    key: "MAR120002029xx30MAR22"
  },
  {
    id: "dmart-04976",
    name: "Pot Planter Saucer Base Plate - 10 cm",
    key: "DEC150011214xx24DEC25vvG1u"
  }
];

async function test(url) {

  try {

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () => controller.abort(),
        8000
      );

    const response =
      await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0"
        }
      });

    clearTimeout(timer);

    const type =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      response.ok &&
      type.toLowerCase().startsWith("image/")
    ) {
      const buffer =
        await response.arrayBuffer();

      if (buffer.byteLength > 1000) {
        return {
          ok: true,
          status: response.status,
          type,
          bytes: buffer.byteLength
        };
      }
    }

  } catch {}

  return {
    ok: false
  };
}

console.log("");
console.log("==============================================");
console.log(" GHARLIST — FINAL 4 CDN IMAGE PROBE");
console.log("==============================================");
console.log("");

const products =
  JSON.parse(
    fs.readFileSync(
      PRODUCTS,
      "utf8"
    )
  );

let totalFound = 0;

for (const target of targets) {

  console.log("");
  console.log(
    `🔎 ${target.id} | ${target.name}`
  );
  console.log(
    `KEY: ${target.key}`
  );

  let found = null;

  // Test the most common codes first.
  const codes = [
    4, 5, 1, 2, 3,
    6, 7, 8, 9, 10,
    11, 12, 13, 14, 15,
    16, 17, 18, 19, 20
  ];

  for (const code of codes) {

    const url =
      `${CDN}${target.key}_${code}_B.jpg`;

    const result =
      await test(url);

    process.stdout.write(
      result.ok
        ? `\n  ✓ CODE ${code} -> ${result.status} ${result.type} ${result.bytes} bytes\n`
        : `.`
    );

    if (result.ok) {

      found = {
        code,
        url,
        ...result
      };

      break;
    }
  }

  console.log("");

  if (found) {

    console.log(
      `  ✅ FOUND: imgCode=${found.code}`
    );

    console.log(
      `  ${found.url}`
    );

    const product =
      products.find(
        p => p.id === target.id
      );

    if (product) {

      product.imgCode =
        String(found.code);

      product.image =
        found.url;

      product.imageStatus =
        "dmart-live";

      product.imageSource =
        "DMart CDN";

      product.imageValidated =
        true;

      product.productImageKey =
        target.key;

      product.imageKey =
        target.key;
    }

    totalFound++;

  } else {

    console.log(
      "  ❌ No working imgCode 1–20"
    );
  }
}

fs.writeFileSync(
  PRODUCTS,
  JSON.stringify(
    products,
    null,
    2
  )
);

const remaining =
  products.filter(
    p =>
      !p.image ||
      p.imageStatus !== "dmart-live"
  );

console.log("");
console.log("==============================================");
console.log(" FINAL 4 PROBE COMPLETE");
console.log("==============================================");
console.log(
  `Found this pass : ${totalFound}/4`
);
console.log(
  `Still unresolved: ${remaining.length}`
);
console.log("==============================================");
