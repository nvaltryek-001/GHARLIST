import fs from "fs";

const file = "reports/dmart-api-context.txt";
const text = fs.readFileSync(file, "utf8");

console.log("==============================================");
console.log(" GHARLIST - LOCATE DMART IMAGE FUNCTION");
console.log("==============================================");

const terms = [
  "EI=function",
  "EI = function",
  "EI:function",
  "fA=function",
  "fA = function",
  "fA:function",
  "fA=e=>",
  "fA = e =>",
  "v5.MEDIUM",
  "productImageKey",
  "imgCode"
];

for (const term of terms) {
  console.log(`\n========== ${term} ==========`);

  let pos = 0;
  let count = 0;

  while ((pos = text.indexOf(term, pos)) !== -1) {
    count++;

    const start = Math.max(0, pos - 2500);
    const end = Math.min(text.length, pos + 7000);

    console.log("\n--- MATCH", count, "---");
    console.log(text.slice(start, end));

    pos += term.length;

    if (count >= 5) break;
  }

  if (!count) console.log("NOT FOUND");
}

console.log("\n==============================================");
console.log(" SEARCH COMPLETE");
console.log("==============================================");
