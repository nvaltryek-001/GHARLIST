import { chromium } from "playwright";
import { spawn } from "child_process";

const BASE = "http://127.0.0.1:5173";

let server;
let browser;

const results = [];

function pass(name, detail = "") {
  results.push({ status: "PASS", name });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ status: "FAIL", name });
  console.log(`[FAIL] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForServer(timeout = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(BASE);

      if (response.ok) {
        return true;
      }
    } catch {}

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return false;
}

async function testLanguage(page, label, code, phrase) {
  await page.goto(`${BASE}/voice`, {
    waitUntil: "networkidle"
  });

  await page.waitForTimeout(500);

  const languageButton = page.getByRole("button", {
    name: new RegExp(label, "i")
  }).first();

  if (!(await languageButton.count())) {
    fail(`${label} language selector`);
    return;
  }

  await languageButton.click();

  pass(`${label} language selector`);

  // Browser SpeechRecognition is not reliable in headless
  // Chromium, so inject a fake recognition implementation.
  await page.evaluate(() => {
    class MockSpeechRecognition {
      constructor() {
        this.lang = "";
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 1;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }

      start() {
        setTimeout(() => {
          this.onresult?.({
            results: [
              [
                {
                  transcript: window.__GHARLIST_TEST_PHRASE
                }
              ]
            ]
          });

          this.onend?.();
        }, 50);
      }

      stop() {
        this.onend?.();
      }
    }

    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });

  await page.evaluate((value) => {
    window.__GHARLIST_TEST_PHRASE = value;
  }, phrase);

  // Reload so Voice sees the injected SpeechRecognition API.
  await page.reload({
    waitUntil: "networkidle"
  });

  await page.waitForTimeout(500);

  // Select language again after reload.
  await page.getByRole("button", {
    name: new RegExp(label, "i")
  }).first().click();

  const mic = page.locator("button.big-mic").first();

  if (!(await mic.count())) {
    fail(`${label}: microphone`);
    return;
  }

  await mic.click();

  await page.waitForTimeout(1000);

  const transcript = await page.locator(
    ".voice-transcript p"
  ).innerText();

  if (
    transcript
      .toLowerCase()
      .includes(phrase.toLowerCase())
  ) {
    pass(
      `${label}: transcript`,
      `"${transcript}"`
    );
  } else {
    fail(
      `${label}: transcript`,
      `Expected "${phrase}", got "${transcript}"`
    );
  }

  const matches = page.locator(
    ".voice-result-card"
  );

  const matchCount = await matches.count();

  if (matchCount > 0) {
    pass(
      `${label}: product matching`,
      `${matchCount} match(es)`
    );
  } else {
    fail(
      `${label}: product matching`,
      "No matching products"
    );
  }

  const addAll = page.getByRole("button", {
    name: /Add All/i
  });

  if (matchCount > 0 && await addAll.count()) {
    await addAll.click();

    await page.waitForTimeout(400);

    const addedButtons = page.locator(
      ".voice-result-card .added-button"
    );

    const addedCount = await addedButtons.count();

    if (addedCount === matchCount) {
      pass(
        `${label}: Add All`,
        `${addedCount} added`
      );
    } else {
      fail(
        `${label}: Add All`,
        `${addedCount}/${matchCount} added`
      );
    }
  } else {
    fail(`${label}: Add All`, "Button unavailable");
  }
}

async function main() {
  console.log("");
  console.log("============================================================");
  console.log(" GHARLIST — VOICE E2E TEST V3");
  console.log("============================================================");
  console.log("");

  server = spawn(
    process.platform === "win32" ? "cmd.exe" : "npm",
    process.platform === "win32"
      ? [
          "/c",
          "npm",
          "run",
          "dev",
          "--",
          "--host",
          "127.0.0.1",
          "--port",
          "5173"
        ]
      : [
          "run",
          "dev",
          "--",
          "--host",
          "127.0.0.1",
          "--port",
          "5173"
        ],
    {
      cwd: process.cwd(),
      stdio: "ignore",
      windowsHide: true
    }
  );

  if (!(await waitForServer())) {
    throw new Error("Vite server failed to start.");
  }

  pass("Vite server");

  browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 900
    }
  });

  await context.addInitScript(() => {
    class MockSpeechRecognition {
      constructor() {
        this.lang = "";
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 3;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }

      start() {
        const phrase =
          window.__GHARLIST_TEST_PHRASE ||
          "Premia Badam";

        setTimeout(() => {
          if (typeof this.onresult === "function") {
            this.onresult({
              results: {
                0: {
                  0: {
                    transcript: phrase
                  },
                  length: 1
                },
                length: 1
              }
            });
          }

          if (typeof this.onend === "function") {
            this.onend();
          }
        }, 100);
      }

      stop() {
        if (typeof this.onend === "function") {
          this.onend();
        }
      }
    }

    Object.defineProperty(
      window,
      "SpeechRecognition",
      {
        configurable: true,
        writable: true,
        value: MockSpeechRecognition
      }
    );

    Object.defineProperty(
      window,
      "webkitSpeechRecognition",
      {
        configurable: true,
        writable: true,
        value: MockSpeechRecognition
      }
    );
  });

  const page = await context.newPage();

  await testLanguage(
    page,
    "English",
    "en-IN",
    "Premia Badam"
  );

  await testLanguage(
    page,
    "Hindi",
    "hi-IN",
    "Premia Badam"
  );

  await testLanguage(
    page,
    "Kannada",
    "kn-IN",
    "Premia Badam"
  );

  // ----------------------------------------------------------
  // VIEW MY LIST
  // ----------------------------------------------------------

  await page.goto(`${BASE}/my-list`, {
    waitUntil: "networkidle"
  });

  const listItems = await page.locator(
    ".shopping-list-item"
  ).count();

  if (listItems > 0) {
    pass(
      "Voice → My List",
      `${listItems} item(s)`
    );
  } else {
    fail(
      "Voice → My List",
      "No items found"
    );
  }

  console.log("");
  console.log("============================================================");
  console.log(" VOICE E2E FINAL RESULT");
  console.log("============================================================");

  const passCount = results.filter(
    item => item.status === "PASS"
  ).length;

  const failCount = results.filter(
    item => item.status === "FAIL"
  ).length;

  console.log(`PASS : ${passCount}`);
  console.log(`FAIL : ${failCount}`);

  if (failCount === 0) {
    console.log("");
    console.log("DECISION : VOICE_E2E_HEALTHY");
  } else {
    console.log("");
    console.log("DECISION : VOICE_E2E_FIX_REQUIRED");
  }

  console.log("============================================================");
}

main()
  .catch(error => {
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

