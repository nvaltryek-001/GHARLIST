import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://127.0.0.1:5173";
const OUT = "reports/browser-uiux/populated-report";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

let pass = 0;
let warn = 0;
let fail = 0;

function PASS(label, detail = "") {
  pass++;
  console.log(`[PASS] ${label}${detail ? " — " + detail : ""}`);
}

function WARN(label, detail = "") {
  warn++;
  console.log(`[WARN] ${label}${detail ? " — " + detail : ""}`);
}

function FAIL(label, detail = "") {
  fail++;
  console.log(`[FAIL] ${label}${detail ? " — " + detail : ""}`);
}

async function waitForApp(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
}

async function createRealReport(page) {
  await page.goto(`${BASE}/products`, {
    waitUntil: "networkidle"
  });

  const cards = page.locator(".product-card");
  const count = await cards.count();

  if (count < 3) {
    FAIL("Products: enough products", `found ${count}`);
    return false;
  }

  for (let i = 0; i < 3; i++) {
    const button = cards.nth(i).locator("button.add-button");

    if (await button.count()) {
      await button.click();
      await page.waitForTimeout(200);
    } else {
      FAIL("Products: Add button", `product ${i + 1}`);
      return false;
    }
  }

  PASS("Products: added 3 products");

  await page.goto(`${BASE}/my-list`, {
    waitUntil: "networkidle"
  });

  await page.waitForTimeout(500);

  const listItems = page.locator(".shopping-list-item");
  const listCount = await listItems.count();

  if (listCount >= 3) {
    PASS("My List: populated", `${listCount} items`);
  } else {
    FAIL("My List: populated", `found ${listCount}`);
    return false;
  }

  // Find the actual report-generation action.
  const candidates = [
    "button:has-text('Generate Report')",
    "button:has-text('Report')",
    "a:has-text('Generate Report')",
    "a:has-text('Report')",
    "[role='button']:has-text('Generate Report')",
    "[role='button']:has-text('Report')"
  ];

  let reportButton = null;

  for (const selector of candidates) {
    const locator = page.locator(selector).first();

    if (await locator.count()) {
      if (await locator.isVisible().catch(() => false)) {
        reportButton = locator;
        break;
      }
    }
  }

  if (!reportButton) {
    const buttons = await page.locator("button, a").allTextContents();

    FAIL(
      "My List: report generation control",
      `not found. Available: ${buttons.join(" | ")}`
    );

    return false;
  }

  PASS(
    "My List: report generation control",
    `"${(await reportButton.innerText()).trim()}"`
  );

  await reportButton.click();

  await page.waitForTimeout(1000);

  // Report may navigate directly or render after state update.
  if (!page.url().includes("/report")) {
    await page.goto(`${BASE}/report`, {
      waitUntil: "networkidle"
    });
    await page.waitForTimeout(700);
  }

  return true;
}

async function testViewport(view) {
  console.log("");
  console.log(`========== ${view.name.toUpperCase()} ${view.width}x${view.height} ==========`);

  const context = await browser.newContext({
    viewport: {
      width: view.width,
      height: view.height
    }
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", message => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", error => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", request => {
    failedRequests.push(
      `${request.method()} ${request.url()} — ${
        request.failure()?.errorText || "failed"
      }`
    );
  });

  // Start clean.
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const success = await createRealReport(page);

  if (!success) {
    await context.close();
    return;
  }

  const reportItems = page.locator(".report-item");
  const itemCount = await reportItems.count();

  if (itemCount >= 3) {
    PASS(
      `${view.name} Report: populated`,
      `${itemCount} real report items`
    );
  } else {
    FAIL(
      `${view.name} Report: populated`,
      `found ${itemCount}`
    );
  }

  const images = page.locator(".report-item img");
  const imageCount = await images.count();

  if (imageCount >= itemCount && itemCount > 0) {
    PASS(
      `${view.name} Report: product images`,
      `${imageCount} images`
    );
  } else if (itemCount === 0) {
    FAIL(
      `${view.name} Report: product images`,
      "no report items available"
    );
  } else {
    WARN(
      `${view.name} Report: product images`,
      `${imageCount}/${itemCount}`
    );
  }

  const text = await page.locator("body").innerText();

  if (/NaN/i.test(text)) {
    FAIL(`${view.name} Report: NaN check`, "NaN detected");
  } else {
    PASS(`${view.name} Report: NaN check`, "none");
  }

  if (/₹/.test(text) && /Total/i.test(text)) {
    PASS(`${view.name} Report: totals`, "price + total detected");
  } else {
    WARN(
      `${view.name} Report: totals`,
      "expected total/₹ text not detected"
    );
  }

  // Real geometry check.
  const geometry = await page.evaluate(() => {
    return [...document.querySelectorAll(".report-item")].map(
      (item, index) => {
        const image =
          item.querySelector("img") ||
          item.querySelector(".report-item-image") ||
          item.querySelector('[class*="image"]');

        const content =
          item.querySelector(".report-item-content") ||
          item.querySelector(".report-product-info") ||
          item.querySelector('[class*="content"]');

        const imageRect = image?.getBoundingClientRect();
        const contentRect = content?.getBoundingClientRect();

        let overlap = false;

        if (imageRect && contentRect) {
          overlap =
            imageRect.right > contentRect.left &&
            imageRect.left < contentRect.right &&
            imageRect.bottom > contentRect.top &&
            imageRect.top < contentRect.bottom;
        }

        return {
          index,
          overlap,
          image: imageRect
            ? {
                x: imageRect.x,
                y: imageRect.y,
                width: imageRect.width,
                height: imageRect.height
              }
            : null,
          content: contentRect
            ? {
                x: contentRect.x,
                y: contentRect.y,
                width: contentRect.width,
                height: contentRect.height
              }
            : null
        };
      }
    );
  });

  const overlaps = geometry.filter(item => item.overlap);

  if (overlaps.length === 0) {
    PASS(
      `${view.name} Report: image/content overlap`,
      "none"
    );
  } else {
    FAIL(
      `${view.name} Report: image/content overlap`,
      `${overlaps.length} item(s)`
    );
  }

  // Check title positioning.
  const titleIssues = await page.evaluate(() => {
    return [...document.querySelectorAll(".report-item")].filter(item => {
      const image =
        item.querySelector("img") ||
        item.querySelector('[class*="image"]');

      const heading =
        item.querySelector("h2") ||
        item.querySelector("h3") ||
        item.querySelector("h4");

      if (!image || !heading) return false;

      const ir = image.getBoundingClientRect();
      const hr = heading.getBoundingClientRect();

      return (
        hr.left < ir.right &&
        hr.top < ir.bottom
      );
    }).length;
  });

  if (titleIssues === 0) {
    PASS(`${view.name} Report: title positioning`, "clean");
  } else {
    FAIL(
      `${view.name} Report: title positioning`,
      `${titleIssues} item(s)`
    );
  }

  // Broken image check.
  const brokenImages = await page.locator("img").evaluateAll(
    images =>
      images.filter(
        image => !image.complete || image.naturalWidth === 0
      ).length
  );

  if (brokenImages === 0) {
    PASS(`${view.name} Report: broken images`, "none");
  } else {
    WARN(
      `${view.name} Report: broken images`,
      `${brokenImages}`
    );
  }

  // Horizontal overflow.
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));

  if (overflow.scrollWidth <= overflow.clientWidth + 1) {
    PASS(`${view.name} Report: horizontal overflow`, "none");
  } else {
    FAIL(
      `${view.name} Report: horizontal overflow`,
      `${overflow.scrollWidth}px > ${overflow.clientWidth}px`
    );
  }

  if (consoleErrors.length === 0) {
    PASS(`${view.name} Report: console errors`, "none");
  } else {
    FAIL(
      `${view.name} Report: console errors`,
      consoleErrors.join(" | ")
    );
  }

  if (pageErrors.length === 0) {
    PASS(`${view.name} Report: runtime errors`, "none");
  } else {
    FAIL(
      `${view.name} Report: runtime errors`,
      pageErrors.join(" | ")
    );
  }

  if (failedRequests.length === 0) {
    PASS(`${view.name} Report: failed requests`, "none");
  } else {
    WARN(
      `${view.name} Report: failed requests`,
      `${failedRequests.length}`
    );
  }

  const screenshot = `${OUT}/${view.name}-populated-report.png`;

  await page.screenshot({
    path: screenshot,
    fullPage: true
  });

  PASS(`${view.name} screenshot`, screenshot);

  await context.close();
}

for (const viewport of viewports) {
  await testViewport(viewport);
}

const decision =
  fail > 0
    ? "POPULATED_REPORT_UI_FIX_REQUIRED"
    : warn > 0
      ? "POPULATED_REPORT_REVIEW_RECOMMENDED"
      : "POPULATED_REPORT_HEALTHY";

const result = {
  generatedAt: new Date().toISOString(),
  pass,
  warn,
  fail,
  decision
};

writeFileSync(
  `${OUT}/populated-report-result.json`,
  JSON.stringify(result, null, 2)
);

console.log("");
console.log("============================================================");
console.log("       POPULATED REPORT REAL BROWSER FINAL RESULT");
console.log("============================================================");
console.log(`PASS : ${pass}`);
console.log(`WARN : ${warn}`);
console.log(`FAIL : ${fail}`);
console.log("");
console.log(`DECISION : ${decision}`);
console.log("");
console.log(`Screenshots: ${OUT}`);
console.log("============================================================");

await browser.close();
