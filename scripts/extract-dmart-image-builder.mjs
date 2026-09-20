import fs from "fs";
import path from "path";

console.log("==============================================");
console.log(" GHARLIST - EXTRACT DMART IMAGE BUILDER");
console.log("==============================================");

const root = "reports";
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(txt|json|html|js|mjs|map)$/i.test(name)) files.push(p);
  }
}

walk(root);

const patterns = [
  /EI\s*=\s*function[\s\S]{0,5000}/g,
  /EI\s*:\s*function[\s\S]{0,5000}/g,
  /function\s+EI[\s\S]{0,5000}/g,
  /\.EI\s*=\s*[\s\S]{0,5000}/g,
  /images\/products[\s\S]{0,3000}/gi,
  /cdn\.dmart\.in[\s\S]{0,3000}/gi,
  /digital\.dmart\.in[\s\S]{0,3000}/gi,
  /productImageKey[\s\S]{0,5000}/g
];

let found = 0;

for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const re of patterns) {
    re.lastIndex = 0;
    let match;

    while ((match = re.exec(text))) {
      found++;

      console.log("\n----------------------------------------------");
      console.log("FILE:", file);
      console.log("MATCH:", re);
      console.log("----------------------------------------------");

      console.log(
        match[0]
          .replace(/\s+/g, " ")
          .slice(0, 6000)
      );

      if (found >= 30) break;
    }

    if (found >= 30) break;
  }

  if (found >= 30) break;
}

console.log("\n==============================================");
console.log("TOTAL MATCHES:", found);
console.log("==============================================");

if (!found) {
  console.log(`
No builder definition found in reports.

NEXT STEP:
We need to download the current DMart JavaScript bundles
and locate the module containing function EI.
`);
}
