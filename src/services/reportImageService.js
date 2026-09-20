import {
  getImageCandidates
} from "./imageService.js";

const WIDTH = 1080;

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  const r = Math.min(
    radius,
    width / 2,
    height / 2
  );

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r
  );
  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r
  );
  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r
  );
  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r
  );
  ctx.closePath();
}

function wrapText(
  ctx,
  text,
  maxWidth
) {
  const words =
    String(text || "").split(" ");

  const lines = [];
  let line = "";

  for (const word of words) {
    const test =
      line ? `${line} ${word}` : word;

    if (
      ctx.measureText(test).width >
        maxWidth &&
      line
    ) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function imageProxyUrl(url) {
  return `/api/image-proxy?url=${encodeURIComponent(
    url
  )}`;
}

async function loadImage(url) {
  if (!url) {
    return null;
  }

  try {
    const response =
      await fetch(
        imageProxyUrl(url)
      );

    if (!response.ok) {
      throw new Error(
        `Image proxy ${response.status}`
      );
    }

    const blob =
      await response.blob();

    const objectUrl =
      URL.createObjectURL(blob);

    try {
      const image =
        await new Promise(
          (resolve, reject) => {
            const img =
              new Image();

            img.onload = () =>
              resolve(img);

            img.onerror = reject;

            img.src = objectUrl;
          }
        );

      return image;
    } finally {
      URL.revokeObjectURL(
        objectUrl
      );
    }
  } catch {
    /*
      Fallback for environments where
      the proxy is unavailable.
    */
    try {
      const image =
        await new Promise(
          (resolve, reject) => {
            const img =
              new Image();

            img.crossOrigin =
              "anonymous";

            img.onload = () =>
              resolve(img);

            img.onerror = reject;

            img.src = url;
          }
        );

      return image;
    } catch {
      return null;
    }
  }
}

function drawImageContain(
  ctx,
  image,
  x,
  y,
  width,
  height
) {
  if (!image) {
    return;
  }

  const imageRatio =
    image.width / image.height;

  const boxRatio =
    width / height;

  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > boxRatio) {
    drawHeight =
      width / imageRatio;
  } else {
    drawWidth =
      height * imageRatio;
  }

  const dx =
    x + (width - drawWidth) / 2;

  const dy =
    y + (height - drawHeight) / 2;

  ctx.drawImage(
    image,
    dx,
    dy,
    drawWidth,
    drawHeight
  );
}

export async function createReportImage(
  report
) {
  if (!report) {
    throw new Error(
      "No report available."
    );
  }

  const items =
    Array.isArray(report.items)
      ? report.items
      : [];

  const normalizedItems =
    items.map((item) => ({
      product:
        item?.product || item,
      quantity:
        Number(item?.quantity || 1)
    }));

  const itemHeight = 230;
  const headerHeight = 250;
  const totalsHeight = 260;
  const footerHeight = 150;

  const height =
    headerHeight +
    normalizedItems.length *
      itemHeight +
    totalsHeight +
    footerHeight;

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = WIDTH;
  canvas.height =
    Math.min(
      Math.max(height, 900),
      16000
    );

  const ctx =
    canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /*
    Header
  */
  const headerGradient =
    ctx.createLinearGradient(
      0,
      0,
      WIDTH,
      0
    );

  headerGradient.addColorStop(
    0,
    "#056b35"
  );

  headerGradient.addColorStop(
    1,
    "#18a957"
  );

  ctx.fillStyle =
    headerGradient;

  ctx.fillRect(
    0,
    0,
    WIDTH,
    190
  );

  ctx.fillStyle = "#ffffff";
  ctx.font =
    "700 54px Arial";

  ctx.fillText(
    "🛒 GHARLIST",
    60,
    82
  );

  ctx.font =
    "400 25px Arial";

  ctx.fillText(
    "Smart Family Shopping Assistant",
    64,
    125
  );

  ctx.font =
    "700 48px Arial";

  ctx.fillText(
    "SHOPPING REPORT",
    60,
    220
  );

  ctx.fillStyle =
    "#eaf8ef";

  roundedRect(
    ctx,
    60,
    235,
    WIDTH - 120,
    65,
    22
  );

  ctx.fill();

  ctx.fillStyle =
    "#123b2a";

  ctx.font =
    "500 26px Arial";

  ctx.fillText(
    new Date(
      report.createdAt ||
      Date.now()
    ).toLocaleString("en-IN"),
    85,
    278
  );

  /*
    Product cards
  */

  let y = headerHeight;

  for (
    let index = 0;
    index <
    normalizedItems.length;
    index++
  ) {
    const {
      product,
      quantity
    } =
      normalizedItems[index];

    const cardX = 40;
    const cardW =
      WIDTH - 80;
    const cardH =
      itemHeight - 20;

    ctx.fillStyle =
      "#f8fbf9";

    roundedRect(
      ctx,
      cardX,
      y,
      cardW,
      cardH,
      24
    );

    ctx.fill();

    ctx.strokeStyle =
      "#dcebe2";

    ctx.lineWidth = 2;

    ctx.stroke();

    const photoX = 65;
    const photoY = y + 20;
    const photoW = 200;
    const photoH = 170;

    ctx.fillStyle =
      "#eef6f0";

    roundedRect(
      ctx,
      photoX,
      photoY,
      photoW,
      photoH,
      18
    );

    ctx.fill();

    const candidates =
      getImageCandidates(
        product
      );

    const image =
      await loadImage(
        candidates?.[0] ||
        product?.image
      );

    drawImageContain(
      ctx,
      image,
      photoX + 8,
      photoY + 8,
      photoW - 16,
      photoH - 16
    );

    if (!image) {
      ctx.fillStyle =
        "#718477";

      ctx.font =
        "600 18px Arial";

      ctx.textAlign =
        "center";

      ctx.fillText(
        "Image unavailable",
        photoX +
          photoW / 2,
        photoY +
          photoH / 2
      );

      ctx.textAlign =
        "left";
    }

    const textX = 305;

    ctx.fillStyle =
      "#0a5a35";

    ctx.font =
      "700 30px Arial";

    const nameLines =
      wrapText(
        ctx,
        `${index + 1}. ${
          product?.name ||
          "Product"
        }`,
        470
      );

    nameLines
      .slice(0, 2)
      .forEach(
        (line, lineIndex) => {
          ctx.fillText(
            line,
            textX,
            y +
              55 +
              lineIndex * 35
          );
        }
      );

    ctx.fillStyle =
      "#45564d";

    ctx.font =
      "500 22px Arial";

    ctx.fillText(
      `Brand: ${
        product?.brand ||
        "—"
      }`,
      textX,
      y + 125
    );

    ctx.fillText(
      `Pack: ${
        product?.quantity ||
        "—"
      }`,
      textX,
      y + 157
    );

    const price =
      Number(
        product?.salePrice ??
        product?.mrp ??
        0
      );

    const lineTotal =
      price * quantity;

    ctx.fillStyle =
      "#e8f8ec";

    roundedRect(
      ctx,
      790,
      y + 45,
      210,
      110,
      20
    );

    ctx.fill();

    ctx.fillStyle =
      "#0b6b3d";

    ctx.font =
      "600 19px Arial";

    ctx.fillText(
      `Qty: ${quantity}`,
      815,
      y + 80
    );

    ctx.font =
      "700 27px Arial";

    ctx.fillText(
      money(lineTotal),
      815,
      y + 120
    );

    y += itemHeight;
  }

  /*
    Totals
  */

  const totalItems =
    normalizedItems.length;

  const totalUnits =
    normalizedItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 1
        ),
      0
    );

  const totalAmount =
    normalizedItems.reduce(
      (sum, item) => {
        const price =
          Number(
            item.product?.salePrice ??
            item.product?.mrp ??
            0
          );

        return sum +
          price *
          Number(
            item.quantity || 1
          );
      },
      0
    );

  ctx.fillStyle =
    "#eaf9ed";

  roundedRect(
    ctx,
    40,
    y + 10,
    WIDTH - 80,
    totalsHeight - 20,
    28
  );

  ctx.fill();

  ctx.fillStyle =
    "#0b6b3d";

  ctx.font =
    "700 30px Arial";

  ctx.fillText(
    "🛍️ Total Items",
    80,
    y + 75
  );

  ctx.fillText(
    String(totalItems),
    600,
    y + 75
  );

  ctx.fillText(
    "📦 Total Quantity",
    80,
    y + 135
  );

  ctx.fillText(
    String(totalUnits),
    600,
    y + 135
  );

  ctx.font =
    "700 36px Arial";

  ctx.fillText(
    "💰 Total Amount",
    80,
    y + 200
  );

  ctx.fillText(
    money(totalAmount),
    560,
    y + 200
  );

  /*
    Footer
  */

  y += totalsHeight;

  ctx.fillStyle =
    "#f5fbf6";

  ctx.fillRect(
    40,
    y,
    WIDTH - 80,
    footerHeight
  );

  ctx.fillStyle =
    "#0b6b3d";

  ctx.font =
    "700 27px Arial";

  ctx.fillText(
    "Generated by GHARLIST",
    75,
    y + 55
  );

  ctx.fillStyle =
    "#52665a";

  ctx.font =
    "500 21px Arial";

  ctx.fillText(
    "Shop Smart • Save Time • Better Tomorrow",
    75,
    y + 95
  );

  ctx.font =
    "600 18px Arial";

  ctx.fillText(
    "Smart Family Shopping Assistant",
    75,
    y + 125
  );

  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Could not generate report image."
              )
            );
            return;
          }

          resolve(blob);
        },
        "image/png",
        0.94
      );
    }
  );
}

export async function downloadReportImage(
  report
) {
  const blob =
    await createReportImage(
      report
    );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download =
    `GHARLIST-Report-${Date.now()}.png`;

  document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);

  return true;
}