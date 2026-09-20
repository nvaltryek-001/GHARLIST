import fs from "fs";

const file = "./public/data/products.json";
const products = JSON.parse(fs.readFileSync(file, "utf8"));

const fixes = {
  "dmart-00572": {
    productImageKey: "NOV110000337xx17NOV25vvG",
    imageKey: "NOV110000337xx17NOV25vvG",
    imgCode: "4",
    image: "https://cdn.dmart.in/images/products/NOV110000337xx17NOV25vvG_4_B.jpg",
    imageValidated: false
  },

  "dmart-02366": {
    productImageKey: "DEC120000341xx5DEC22",
    imageKey: "DEC120000341xx5DEC22",
    imgCode: "4",
    image: "https://cdn.dmart.in/images/products/DEC120000341xx5DEC22_4_B.jpg",
    imageValidated: false
  }
};

for (const product of products) {
  if (!fixes[product.id]) continue;

  Object.assign(product, fixes[product.id]);

  console.log(
    `RESTORED ORIGINAL: ${product.id} | ${product.name}`
  );
}

fs.writeFileSync(
  file,
  JSON.stringify(products, null, 2)
);

console.log("");
console.log("Wrong fuzzy matches removed.");
console.log("00572 → original key restored");
console.log("02366 → original key restored");
