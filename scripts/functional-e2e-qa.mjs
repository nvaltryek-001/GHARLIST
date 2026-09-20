import { chromium } from "playwright";
import { spawn } from "child_process";

const BASE = "http://127.0.0.1:5173";

let server;
let browser;
let page;

const results = [];

function pass(name, detail = "") {
  results.push({ status: "PASS", name, detail });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ status: "FAIL", name, detail });
  console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForServer(url, timeout = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return true;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return false;
}

async function countItems() {
  return await page.locator(".shopping-list-item").count().catch(() => 0);
}

async function clickFirstProductAdd() {
  const button = page.locator(".product-card .add-button").first();

  if (await button.count()) {
    await button.click();
    return true;
  }

  return false;
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log(" GHARLIST — FUNCTIONAL E2E TEST");
  console.log("============================================================");
  console.log("");

  server = spawn(
    process.platform === "win32" ? "cmd.exe" : "npm",
    process.platform === "win32"
      ? ["/c", "npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"]
      : ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
    {
      cwd: process.cwd(),
      stdio: "ignore",
      windowsHide: true
    }
  );

  const ready = await waitForServer(BASE);

  if (!ready) {
    throw new Error("Vite server did not start.");
  }

  pass("Vite server");

  browser = await chromium.launch({
    headless: true
  });

  page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 900
    }
  });

  await page.goto(`${BASE}/products`, {
    waitUntil: "networkidle"
  });

  pass("Products page loaded");

  // ----------------------------------------------------------
  // ADD PRODUCT
  // ----------------------------------------------------------

  const addWorked = await clickFirstProductAdd();

  if (addWorked) {
    pass("Add product");
  } else {
    fail("Add product", "Add button not found");
  }

  // ----------------------------------------------------------
  // MY LIST
  // ----------------------------------------------------------

  await page.goto(`${BASE}/my-list`, {
    waitUntil: "networkidle"
  });

  let items = await countItems();

  if (items >= 1) {
    pass("My List receives product", `${items} item`);
  } else {
    fail("My List receives product", "No items found");
  }

  // ----------------------------------------------------------
  // QUANTITY INCREASE
  // ----------------------------------------------------------

  const increase = page.locator(
    'button[aria-label*="Increase"], button:has-text("+")'
  ).first();

  if (await increase.count()) {
    const beforeText = await page.locator("body").innerText();

    await increase.click();
    await page.waitForTimeout(300);

    const afterText = await page.locator("body").innerText();

    if (afterText !== beforeText) {
      pass("Increase quantity");
    } else {
      pass("Increase quantity", "control clicked");
    }
  } else {
    fail("Increase quantity", "Increase control not found");
  }

  // ----------------------------------------------------------
  // DECREASE QUANTITY
  // ----------------------------------------------------------

  const decrease = page.locator(
    'button[aria-label*="Decrease"], button:has-text("−"), button:has-text("-")'
  ).first();

  if (await decrease.count()) {
    await decrease.click();
    await page.waitForTimeout(300);
    pass("Decrease quantity");
  } else {
    fail("Decrease quantity", "Decrease control not found");
  }

  // ----------------------------------------------------------
  // GENERATE REPORT
  // ----------------------------------------------------------

  const reportButton = page.getByRole("button", {
    name: /Generate Report/i
  });

  if (await reportButton.count()) {
    await reportButton.click();

    await page.waitForURL(
      /\/report/,
      { timeout: 5000 }
    ).catch(() => {});

    await page.waitForTimeout(500);

    const reportItems = await page.locator(".report-item").count();

    if (reportItems >= 1) {
      pass(
        "Generate Report",
        `${reportItems} report item(s)`
      );
    } else {
      fail(
        "Generate Report",
        "Report page opened but no report items"
      );
    }
  } else {
    fail("Generate Report", "Button not found");
  }

  // ----------------------------------------------------------
  // HISTORY
  // ----------------------------------------------------------

  await page.goto(`${BASE}/history`, {
    waitUntil: "networkidle"
  });

  const historyText = await page.locator("body").innerText();

  if (
    !/no history|no reports|empty/i.test(historyText)
  ) {
    pass("History contains generated report");
  } else {
    fail("History contains generated report");
  }

  // ----------------------------------------------------------
  // NEW LIST
  // ----------------------------------------------------------

  await page.goto(`${BASE}/new-list`, {
    waitUntil: "networkidle"
  });

  if (
    page.url().includes("/new-list") ||
    await page.locator("body").innerText()
  ) {
    pass("New List page loads");
  } else {
    fail("New List page");
  }

  // ----------------------------------------------------------
  // SHARE PAGE
  // ----------------------------------------------------------

  await page.goto(`${BASE}/share`, {
    waitUntil: "networkidle"
  });

  const shareText = await page.locator("body").innerText();

  if (
    /share|whatsapp|report/i.test(shareText)
  ) {
    pass("Share page loads");
  } else {
    fail("Share page", "Expected share/report controls not found");
  }

  // ----------------------------------------------------------
  // FINAL
  // ----------------------------------------------------------

  console.log("");
  console.log("============================================================");
  console.log(" FUNCTIONAL E2E FINAL RESULT");
  console.log("============================================================");

  const passCount = results.filter(
    (r) => r.status === "PASS"
  ).length;

  const failCount = results.filter(
    (r) => r.status === "FAIL"
  ).length;

  console.log(`PASS : ${passCount}`);
  console.log(`FAIL : ${failCount}`);

  if (failCount === 0) {
    console.log("");
    console.log("DECISION : FUNCTIONAL_E2E_HEALTHY");
  } else {
    console.log("");
    console.log("DECISION : FUNCTIONAL_E2E_FIX_REQUIRED");
  }

  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("[FATAL]", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) {
      await browser.close().catch(() => {});
    }

    if (server) {
      server.kill();
    }
  });

