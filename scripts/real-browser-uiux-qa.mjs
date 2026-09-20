import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const ROOT = process.cwd();
const QA_DIR = path.join(ROOT, "reports", "browser-uiux");
fs.mkdirSync(QA_DIR, { recursive: true });

const PORT = 5173;
const BASE = `http://127.0.0.1:${PORT}`;

const results = {
  startedAt: new Date().toISOString(),
  browser: {},
  summary: {
    pass: 0,
    warn: 0,
    fail: 0
  },
  pages: [],
  interactions: [],
  layout: [],
  runtime: [],
  screenshots: []
};

function log(status, message, detail = "") {
  const line =
    `[${status}] ${message}` +
    (detail ? ` — ${detail}` : "");

  console.log(line);

  if (status === "PASS") results.summary.pass++;
  if (status === "WARN") results.summary.warn++;
  if (status === "FAIL") results.summary.fail++;
}

function record(collection, status, name, detail = "") {
  results[collection].push({
    status,
    name,
    detail
  });

  log(status, name, detail);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, timeout = 30000) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return true;
      }
    } catch {}

    await sleep(500);
  }

  return false;
}

function safeName(value) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

console.log("");
console.log("============================================================");
console.log("      GHARLIST — REAL BROWSER UI/UX 1000X AUDIT");
console.log("============================================================");
console.log(`Project: ${ROOT}`);
console.log(`URL: ${BASE}`);
console.log("Mode: REAL CHROMIUM BROWSER");
console.log("Source modification: NONE");
console.log("");


// ============================================================
// PLAYWRIGHT
// ============================================================

let playwright;

try {
  playwright = await import("playwright");
  log("PASS", "Playwright available");
} catch {
  log(
    "WARN",
    "Playwright not installed",
    "Installing temporary local browser test dependency"
  );

  const install = spawn(
    "npm.cmd",
    [
      "install",
      "--no-save",
      "--package-lock=false",
      "playwright"
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
      shell: false
    }
  );

  const code = await new Promise(resolve => {
    install.on("close", resolve);
  });

  if (code !== 0) {
    log(
      "FAIL",
      "Playwright installation failed"
    );

    process.exit(1);
  }

  playwright = await import("playwright");

  log(
    "PASS",
    "Playwright installed"
  );
}


// ============================================================
// START VITE
// ============================================================

console.log("");
console.log("============================================================");
console.log("STARTING GHARLIST DEV SERVER");
console.log("============================================================");

const server = spawn(
  process.platform === "win32" ? "cmd.exe" : "npm",
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1 --port 5173"]
    : ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"],
  {
    cwd: ROOT,
    stdio: "pipe",
    windowsHide: true,
    shell: false
  }
);

let serverOutput = "";

server.stdout.on("data", data => {
  serverOutput += data.toString();
});

server.stderr.on("data", data => {
  serverOutput += data.toString();
});

const serverReady =
  await waitForServer(
    `${BASE}/`,
    30000
  );

if (!serverReady) {
  log(
    "FAIL",
    "Vite dev server",
    "server did not become ready"
  );

  try {
    server.kill();
  } catch {}

  process.exit(1);
}

log(
  "PASS",
  "Vite dev server",
  BASE
);


// ============================================================
// BROWSER
// ============================================================

let browser;

try {
  browser =
    await playwright.chromium.launch({
      headless: true
    });

  results.browser = {
    name: "Chromium",
    headless: true
  };

  log(
    "PASS",
    "Chromium launched"
  );
} catch (error) {
  log(
    "FAIL",
    "Chromium launch",
    error.message
  );

  try {
    server.kill();
  } catch {}

  process.exit(1);
}


// ============================================================
// VIEWPORTS
// ============================================================

const viewports = [
  {
    name: "desktop",
    width: 1440,
    height: 900
  },
  {
    name: "laptop",
    width: 1280,
    height: 800
  },
  {
    name: "tablet",
    width: 768,
    height: 900
  },
  {
    name: "mobile",
    width: 390,
    height: 844
  }
];

const routes = [
  "/",
  "/products",
  "/voice",
  "/my-list",
  "/report",
  "/share",
  "/history",
  "/new-list"
];


// ============================================================
// PAGE TEST FUNCTION
// ============================================================

async function testPage(
  browserContext,
  route,
  viewport
) {
  const page =
    await browserContext.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const brokenImages = [];

  page.on(
    "console",
    message => {
      if (
        message.type() === "error"
      ) {
        consoleErrors.push(
          message.text()
        );
      }
    }
  );

  page.on(
    "pageerror",
    error => {
      pageErrors.push(
        error.message
      );
    }
  );

  page.on(
    "requestfailed",
    request => {
      failedRequests.push({
        url: request.url(),
        failure:
          request.failure()?.errorText ||
          "unknown"
      });
    }
  );

  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height
  });

  const response =
    await page.goto(
      `${BASE}${route}`,
      {
        waitUntil: "networkidle",
        timeout: 30000
      }
    );

  await page.waitForTimeout(800);

  const status =
    response?.status() ?? 0;

  if (
    status >= 200 &&
    status < 400
  ) {
    record(
      "pages",
      "PASS",
      `${viewport.name} ${route}`,
      `HTTP ${status}`
    );
  } else {
    record(
      "pages",
      "FAIL",
      `${viewport.name} ${route}`,
      `HTTP ${status}`
    );
  }


  // ----------------------------------------------------------
  // GLOBAL LAYOUT
  // ----------------------------------------------------------

  const layout =
    await page.evaluate(() => {
      const body =
        document.body;

      const html =
        document.documentElement;

      const elements =
        [...document.querySelectorAll("*")];

      const overflowing =
        elements
          .filter(element => {
            const rect =
              element.getBoundingClientRect();

            return (
              rect.right >
                window.innerWidth + 2 ||
              rect.left < -2
            );
          })
          .slice(0, 15)
          .map(element => ({
            tag: element.tagName,
            className:
              typeof element.className ===
              "string"
                ? element.className
                : "",
            right:
              Math.round(
                element.getBoundingClientRect().right
              ),
            left:
              Math.round(
                element.getBoundingClientRect().left
              )
          }));

      return {
        viewportWidth:
          window.innerWidth,

        documentWidth:
          Math.max(
            html.scrollWidth,
            body.scrollWidth
          ),

        horizontalOverflow:
          Math.max(
            html.scrollWidth,
            body.scrollWidth
          ) >
          window.innerWidth + 2,

        verticalOverflow:
          html.scrollHeight >
          window.innerHeight + 2,

        overflowing
      };
    });

  results.layout.push({
    route,
    viewport: viewport.name,
    ...layout
  });

  if (
    layout.horizontalOverflow
  ) {
    record(
      "layout",
      "FAIL",
      `${viewport.name} ${route}: horizontal overflow`,
      `${layout.documentWidth}px document width vs ${layout.viewportWidth}px viewport`
    );
  } else {
    record(
      "layout",
      "PASS",
      `${viewport.name} ${route}: horizontal overflow`,
      "none"
    );
  }


  // ----------------------------------------------------------
  // RENDERED ELEMENT CHECK
  // ----------------------------------------------------------

  const elements =
    await page.evaluate(() => {
      const visible = selector => {
        const el =
          document.querySelector(selector);

        if (!el) {
          return {
            exists: false
          };
        }

        const rect =
          el.getBoundingClientRect();

        const style =
          getComputedStyle(el);

        return {
          exists: true,
          visible:
            rect.width > 0 &&
            rect.height > 0,
          width:
            Math.round(rect.width),
          height:
            Math.round(rect.height),
          x:
            Math.round(rect.x),
          y:
            Math.round(rect.y),
          display:
            style.display,
          overflow:
            style.overflow
        };
      };

      return {
        header:
          visible(".top-header"),

        nav:
          visible(".desktop-nav"),

        mobileNav:
          visible(".mobile-nav"),

        productGrid:
          visible(".product-grid"),

        productCard:
          visible(".product-card"),

        loadMore:
          visible(".load-more"),

        shoppingList:
          visible(".shopping-list"),

        reportPage:
          visible(".report-page"),

        reportItem:
          visible(".report-item"),

        reportImage:
          visible(".report-image"),

        reportContent:
          visible(".report-content"),

        reportSummary:
          visible(".report-summary")
      };
    });


  // ----------------------------------------------------------
  // PRODUCTS PAGE
  // ----------------------------------------------------------

  if (
    route === "/products"
  ) {
    const productCount =
      await page.locator(
        ".product-card"
      ).count();

    if (
      productCount > 0
    ) {
      record(
        "interactions",
        "PASS",
        `${viewport.name} Products: product cards`,
        `${productCount} visible`
      );
    } else {
      record(
        "interactions",
        "FAIL",
        `${viewport.name} Products: product cards`,
        "no product cards rendered"
      );
    }


    const search =
      page.locator(
        'input[type="search"], input[placeholder*="Search" i]'
      ).first();

    if (
      await search.count()
    ) {
      record(
        "interactions",
        "PASS",
        `${viewport.name} Products: search rendered`
      );

      try {
        await search.fill("rice");

        await page.waitForTimeout(
          400
        );

        const afterSearch =
          await page.locator(
            ".product-card"
          ).count();

        record(
          "interactions",
          afterSearch > 0
            ? "PASS"
            : "WARN",
          `${viewport.name} Products: search interaction`,
          `${afterSearch} matching cards`
        );

        await search.fill("");
      } catch (error) {
        record(
          "interactions",
          "FAIL",
          `${viewport.name} Products: search interaction`,
          error.message
        );
      }
    } else {
      record(
        "interactions",
        "FAIL",
        `${viewport.name} Products: search control`
      );
    }


    const clear =
      page.getByRole(
        "button",
        {
          name: /clear filters/i
        }
      ).first();

    if (
      await clear.count()
    ) {
      const box =
        await clear.boundingBox();

      if (
        box &&
        box.width > 0 &&
        box.height > 0
      ) {
        record(
          "interactions",
          "PASS",
          `${viewport.name} Products: Clear filters rendered`
        );

        try {
          await clear.click();
          record(
            "interactions",
            "PASS",
            `${viewport.name} Products: Clear filters clickable`
          );
        } catch (error) {
          record(
            "interactions",
            "FAIL",
            `${viewport.name} Products: Clear filters click`,
            error.message
          );
        }
      } else {
        record(
          "interactions",
          "WARN",
          `${viewport.name} Products: Clear filters`,
          "element exists but is not visible"
        );
      }
    }


    const loadMore =
      page.getByRole(
        "button",
        {
          name: /load more/i
        }
      ).first();

    if (
      await loadMore.count()
    ) {
      const before =
        await page.locator(
          ".product-card"
        ).count();

      try {
        await loadMore.click();

        await page.waitForTimeout(
          500
        );

        const after =
          await page.locator(
            ".product-card"
          ).count();

        record(
          "interactions",
          after > before
            ? "PASS"
            : "WARN",
          `${viewport.name} Products: Load More`,
          `${before} → ${after} cards`
        );
      } catch (error) {
        record(
          "interactions",
          "FAIL",
          `${viewport.name} Products: Load More click`,
          error.message
        );
      }
    } else {
      record(
        "interactions",
        "WARN",
        `${viewport.name} Products: Load More`,
        "button not visible or not needed"
      );
    }


    const firstAdd =
      page.getByRole(
        "button",
        {
          name: /^add /i
        }
      ).first();

    if (
      await firstAdd.count()
    ) {
      try {
        await firstAdd.click();

        await page.waitForTimeout(
          300
        );

        record(
          "interactions",
          "PASS",
          `${viewport.name} Products: Add button click`
        );
      } catch (error) {
        record(
          "interactions",
          "FAIL",
          `${viewport.name} Products: Add button click`,
          error.message
        );
      }
    }
  }


  // ----------------------------------------------------------
  // REPORT PAGE — REAL LAYOUT DIAGNOSTICS
  // ----------------------------------------------------------

  if (
    route === "/report"
  ) {
    const reportItems =
      await page.locator(
        ".report-item"
      ).count();

    if (
      reportItems > 0
    ) {
      record(
        "interactions",
        "PASS",
        `${viewport.name} Report: items`,
        `${reportItems}`
      );

      const reportGeometry =
        await page.evaluate(() => {
          const items =
            [...document.querySelectorAll(
              ".report-item"
            )];

          return items.slice(0, 5).map(
            item => {
              const image =
                item.querySelector(
                  ".report-image"
                );

              const content =
                item.querySelector(
                  ".report-content"
                );

              const total =
                item.querySelector(
                  ".report-total, .line-total"
                );

              const ir =
                image?.getBoundingClientRect();

              const cr =
                content?.getBoundingClientRect();

              const tr =
                total?.getBoundingClientRect();

              return {
                itemWidth:
                  Math.round(
                    item.getBoundingClientRect().width
                  ),

                image: ir
                  ? {
                      x: Math.round(ir.x),
                      y: Math.round(ir.y),
                      width: Math.round(ir.width),
                      height: Math.round(ir.height)
                    }
                  : null,

                content: cr
                  ? {
                      x: Math.round(cr.x),
                      y: Math.round(cr.y),
                      width: Math.round(cr.width),
                      height: Math.round(cr.height)
                    }
                  : null,

                total: tr
                  ? {
                      x: Math.round(tr.x),
                      y: Math.round(tr.y),
                      width: Math.round(tr.width),
                      height: Math.round(tr.height)
                    }
                  : null
              };
            }
          );
        });

      for (
        const item of reportGeometry
      ) {
        if (
          item.content &&
          item.content.width < 120
        ) {
          record(
            "layout",
            "FAIL",
            `${viewport.name} Report: content column too narrow`,
            `${item.content.width}px`
          );
        }

        if (
          item.image &&
          item.content &&
          item.total
        ) {
          const imageRight =
            item.image.x +
            item.image.width;

          const contentRight =
            item.content.x +
            item.content.width;

          const overlapImageContent =
            imageRight >
            item.content.x + 4;

          const overlapContentTotal =
            contentRight >
            item.total.x + 4;

          if (
            overlapImageContent
          ) {
            record(
              "layout",
              "FAIL",
              `${viewport.name} Report: image/content overlap`,
              `${imageRight}px > ${item.content.x}px`
            );
          }

          if (
            overlapContentTotal
          ) {
            record(
              "layout",
              "FAIL",
              `${viewport.name} Report: content/price overlap`
            );
          }
        }
      }

    } else {
      record(
        "interactions",
        "WARN",
        `${viewport.name} Report: items`,
        "No report items in current local state"
      );
    }
  }


  // ----------------------------------------------------------
  // IMAGE CHECK
  // ----------------------------------------------------------

  const images =
    await page.locator(
      "img"
    ).evaluateAll(
      imgs =>
        imgs.map(img => ({
          src:
            img.currentSrc ||
            img.src,
          complete:
            img.complete,
          naturalWidth:
            img.naturalWidth,
          naturalHeight:
            img.naturalHeight
        }))
    );

  for (
    const image of images
  ) {
    if (
      image.complete &&
      image.naturalWidth === 0
    ) {
      brokenImages.push(
        image.src
      );
    }
  }

  if (
    brokenImages.length
  ) {
    record(
      "runtime",
      "FAIL",
      `${viewport.name} ${route}: broken images`,
      `${brokenImages.length}`
    );
  } else {
    record(
      "runtime",
      "PASS",
      `${viewport.name} ${route}: images`,
      `${images.length} checked`
    );
  }


  // ----------------------------------------------------------
  // CONSOLE / JS ERRORS
  // ----------------------------------------------------------

  if (
    consoleErrors.length
  ) {
    record(
      "runtime",
      "FAIL",
      `${viewport.name} ${route}: console errors`,
      consoleErrors.slice(0, 3).join(" | ")
    );
  } else {
    record(
      "runtime",
      "PASS",
      `${viewport.name} ${route}: console errors`,
      "none"
    );
  }

  if (
    pageErrors.length
  ) {
    record(
      "runtime",
      "FAIL",
      `${viewport.name} ${route}: page errors`,
      pageErrors.slice(0, 3).join(" | ")
    );
  } else {
    record(
      "runtime",
      "PASS",
      `${viewport.name} ${route}: runtime errors`,
      "none"
    );
  }


  if (
    failedRequests.length
  ) {
    record(
      "runtime",
      "WARN",
      `${viewport.name} ${route}: failed requests`,
      `${failedRequests.length}`
    );
  } else {
    record(
      "runtime",
      "PASS",
      `${viewport.name} ${route}: failed requests`,
      "none"
    );
  }


  // ----------------------------------------------------------
  // SCREENSHOT
  // ----------------------------------------------------------

  const screenshotName =
    `${safeName(
      viewport.name
    )}-${safeName(route)}.png`;

  const screenshotPath =
    path.join(
      QA_DIR,
      screenshotName
    );

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  results.screenshots.push(
    screenshotPath
  );

  log(
    "PASS",
    `Screenshot: ${viewport.name} ${route}`,
    screenshotName
  );


  await page.close();
}


// ============================================================
// RUN ALL VIEWPORTS
// ============================================================

const context =
  await browser.newContext();

for (
  const viewport of viewports
) {
  console.log("");
  console.log(
    `========== ${viewport.name.toUpperCase()} ${viewport.width}x${viewport.height} ==========`
  );

  for (
    const route of routes
  ) {
    await testPage(
      context,
      route,
      viewport
    );
  }
}

await context.close();


// ============================================================
// FINAL REPORT
// ============================================================

console.log("");
console.log("============================================================");
console.log("             REAL BROWSER QA FINAL RESULT");
console.log("============================================================");

console.log(
  `PASS : ${results.summary.pass}`
);

console.log(
  `WARN : ${results.summary.warn}`
);

console.log(
  `FAIL : ${results.summary.fail}`
);

console.log("");

const browserDecision =
  results.summary.fail === 0
    ? "BROWSER_UI_HEALTHY"
    : results.summary.fail <= 5
      ? "TARGETED_UI_PATCH_REQUIRED"
      : "MAJOR_UI_REWORK_REQUIRED";

results.decision =
  browserDecision;

console.log(
  `DECISION : ${browserDecision}`
);

console.log("");

if (
  browserDecision ===
  "BROWSER_UI_HEALTHY"
) {
  console.log(
    "✓ Real browser layout is healthy."
  );
}

if (
  browserDecision ===
  "TARGETED_UI_PATCH_REQUIRED"
) {
  console.log(
    "⚠ Fix only the detected UI/layout issues."
  );
}

if (
  browserDecision ===
  "MAJOR_UI_REWORK_REQUIRED"
) {
  console.log(
    "⚠ Significant browser-rendered issues detected."
  );
}

console.log("");
console.log("SCREENSHOTS:");
for (
  const screenshot
  of results.screenshots
) {
  console.log(
    `  ${screenshot}`
  );
}


// ============================================================
// WRITE REPORT
// ============================================================

const jsonPath =
  path.join(
    QA_DIR,
    "browser-uiux-result.json"
  );

fs.writeFileSync(
  jsonPath,
  JSON.stringify(
    results,
    null,
    2
  ),
  "utf8"
);

const markdown = [];

markdown.push(
  "# GHARLIST Real Browser UI/UX QA"
);

markdown.push("");

markdown.push(
  `Generated: ${results.startedAt}`
);

markdown.push("");

markdown.push(
  `## Result`
);

markdown.push(
  `- PASS: ${results.summary.pass}`
);

markdown.push(
  `- WARN: ${results.summary.warn}`
);

markdown.push(
  `- FAIL: ${results.summary.fail}`
);

markdown.push(
  `- DECISION: ${browserDecision}`
);

markdown.push("");

markdown.push(
  "## Layout failures"
);

for (
  const item
  of results.layout.filter(
    x => x.status === "FAIL"
  )
) {
  markdown.push(
    `- ${item.name}: ${item.detail}`
  );
}

markdown.push("");

markdown.push(
  "## Runtime failures"
);

for (
  const item
  of results.runtime.filter(
    x => x.status === "FAIL"
  )
) {
  markdown.push(
    `- ${item.name}: ${item.detail}`
  );
}

markdown.push("");

markdown.push(
  "## Screenshots"
);

for (
  const screenshot
  of results.screenshots
) {
  markdown.push(
    `- ${screenshot}`
  );
}

const mdPath =
  path.join(
    QA_DIR,
    "browser-uiux-result.md"
  );

fs.writeFileSync(
  mdPath,
  markdown.join("\n"),
  "utf8"
);


// ============================================================
// CLEANUP
// ============================================================

await browser.close();

try {
  server.kill();
} catch {}

console.log("");
console.log("============================================================");
console.log("FILES");
console.log("============================================================");
console.log(mdPath);
console.log(jsonPath);
console.log(QA_DIR);
console.log("");
console.log("REAL CHROMIUM TEST COMPLETE.");
console.log("NO APPLICATION SOURCE FILES WERE MODIFIED.");
console.log("============================================================");

process.exit(
  results.summary.fail > 0
    ? 2
    : 0
);

