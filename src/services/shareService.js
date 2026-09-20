import {
  normalizeReport,
  reportToText
} from "./reportService.js";

import {
  createReportImage,
  downloadReportImage
} from "./reportImageService.js";

function getReport(report) {
  return normalizeReport(report);
}

export async function copyReport(report) {
  const normalized =
    getReport(report);

  const text =
    reportToText(normalized);

  try {
    await navigator.clipboard.writeText(
      text
    );

    alert(
      "GHARLIST report copied!"
    );

    return true;
  } catch {
    alert(
      "Copy failed. Please try again."
    );

    return false;
  }
}

export async function shareWhatsApp(
  report
) {
  const normalized =
    getReport(report);

  const text =
    reportToText(normalized);

  /*
    Best path:
    native share + actual PNG file.
  */
  try {
    const blob =
      await createReportImage(
        normalized
      );

    const file =
      new File(
        [blob],
        "GHARLIST-Shopping-Report.png",
        {
          type: "image/png"
        }
      );

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file]
      })
    ) {
      await navigator.share({
        title:
          "GHARLIST Shopping Report",
        text,
        files: [file]
      });

      return "native";
    }
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      return "cancelled";
    }

    console.warn(
      "Native image share unavailable:",
      error
    );
  }

  /*
    Browser fallback:
    WhatsApp opens with formatted
    report text.
  */
  const encoded =
    encodeURIComponent(text);

  window.open(
    `https://wa.me/?text=${encoded}`,
    "_blank",
    "noopener,noreferrer"
  );

  /*
    Also make the actual visual report
    available locally so the user can
    attach it in WhatsApp.
  */
  try {
    await downloadReportImage(
      normalized
    );
  } catch {
    // Text sharing still succeeded.
  }

  return "whatsapp-link";
}

export async function shareReportImage(
  report
) {
  const normalized =
    getReport(report);

  try {
    const blob =
      await createReportImage(
        normalized
      );

    const file =
      new File(
        [blob],
        "GHARLIST-Shopping-Report.png",
        {
          type: "image/png"
        }
      );

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        files: [file]
      })
    ) {
      await navigator.share({
        title:
          "GHARLIST Shopping Report",
        text:
          "GHARLIST Shopping Report",
        files: [file]
      });

      return true;
    }
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      return false;
    }
  }

  return downloadReportImage(
    normalized
  );
}

export async function shareReport(
  report
) {
  const normalized =
    getReport(report);

  if (
    navigator.share
  ) {
    try {
      const blob =
        await createReportImage(
          normalized
        );

      const file =
        new File(
          [blob],
          "GHARLIST-Shopping-Report.png",
          {
            type: "image/png"
          }
        );

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file]
        })
      ) {
        await navigator.share({
          title:
            "GHARLIST Shopping Report",
          text:
            reportToText(
              normalized
            ),
          files: [file]
        });

        return true;
      }

      await navigator.share({
        title:
          "GHARLIST Shopping Report",
        text:
          reportToText(
            normalized
          )
      });

      return true;
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        return false;
      }
    }
  }

  return copyReport(
    normalized
  );
}

export function shareEmail(
  report
) {
  const normalized =
    getReport(report);

  const subject =
    encodeURIComponent(
      "GHARLIST Shopping Report"
    );

  const body =
    encodeURIComponent(
      reportToText(
        normalized
      )
    );

  window.location.href =
    `mailto:?subject=${subject}&body=${body}`;

  return true;
}

export function printReport(
  report
) {
  const normalized =
    getReport(report);

  if (!normalized) {
    alert(
      "No shopping report available."
    );

    return;
  }

  const printWindow =
    window.open(
      "",
      "_blank",
      "width=1000,height=900"
    );

  if (!printWindow) {
    alert(
      "Please allow pop-ups to print the report."
    );

    return;
  }

  const items =
    normalized.items || [];

  const rows =
    items
      .map((item) => {
        const product =
          item.product || {};

        const quantity =
          Number(
            item.quantity || 1
          );

        const price =
          Number(
            product.salePrice ??
            product.mrp ??
            0
          );

        const total =
          price * quantity;

        const image =
          product.image || "";

        return `
          <div class="item">
            <div class="photo">
              ${
                image
                  ? `<img src="${image}" alt="">`
                  : `<span>Image unavailable</span>`
              }
            </div>

            <div class="details">
              <h2>${escapeHtml(
                product.name ||
                  "Product"
              )}</h2>

              <p>
                Brand:
                ${escapeHtml(
                  product.brand ||
                    "—"
                )}
              </p>

              <p>
                Pack:
                ${escapeHtml(
                  product.quantity ||
                    "—"
                )}
              </p>
            </div>

            <div class="numbers">
              <strong>
                Qty: ${quantity}
              </strong>

              <strong>
                ₹${total.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          </div>
        `;
      })
      .join("");

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>GHARLIST Shopping Report</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #173e2e;
            background: #fff;
          }

          .header {
            background:
              linear-gradient(
                90deg,
                #056b35,
                #18a957
              );
            color: white;
            padding: 30px;
            border-radius: 24px;
          }

          .header h1 {
            margin: 0;
            font-size: 42px;
          }

          .header p {
            margin: 8px 0 0;
          }

          .item {
            display: grid;
            grid-template-columns:
              180px
              1fr
              180px;

            gap: 24px;
            align-items: center;

            margin-top: 20px;
            padding: 18px;

            border: 1px solid #dcebe2;
            border-radius: 20px;
          }

          .photo {
            width: 180px;
            height: 160px;

            display: flex;
            align-items: center;
            justify-content: center;

            background: #f2f8f4;
            border-radius: 16px;
            overflow: hidden;
          }

          .photo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .photo span {
            color: #718477;
          }

          .details h2 {
            margin: 0 0 12px;
            color: #075f38;
          }

          .details p {
            margin: 5px 0;
            color: #53645a;
          }

          .numbers {
            display: flex;
            flex-direction: column;
            gap: 15px;
            font-size: 20px;
          }

          .totals {
            margin-top: 24px;
            padding: 28px;
            border-radius: 22px;
            background: #eaf9ed;
          }

          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            font-size: 21px;
          }

          .grand {
            font-size: 30px;
            font-weight: 800;
            color: #075f38;
          }

          .footer {
            margin-top: 28px;
            text-align: center;
            color: #64756b;
          }

          @media print {
            body {
              padding: 12px;
            }

            .item {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>

        <div class="header">
          <h1>🛒 GHARLIST</h1>
          <p>SHOPPING REPORT</p>
          <p>
            ${new Date(
              normalized.createdAt
            ).toLocaleString(
              "en-IN"
            )}
          </p>
        </div>

        ${rows}

        <div class="totals">

          <div class="total-line">
            <span>🛍️ Total Items</span>
            <strong>
              ${normalized.totalItems}
            </strong>
          </div>

          <div class="total-line">
            <span>📦 Total Quantity</span>
            <strong>
              ${normalized.totalUnits}
            </strong>
          </div>

          <div class="total-line grand">
            <span>💰 Total Amount</span>
            <strong>
              ₹${Number(
                normalized.totalAmount
              ).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        <div class="footer">
          Generated by GHARLIST
          <br>
          Smart Family Shopping Assistant
        </div>

        <script>
          window.onload = function () {
            setTimeout(
              function () {
                window.print();
              },
              500
            );
          };
        <\/script>

      </body>
    </html>
  `);

  printWindow.document.close();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export {
  downloadReportImage
};