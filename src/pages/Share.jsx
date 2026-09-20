import {
  useEffect,
  useState
} from "react";

import {
  NavLink,
  useLocation
} from "react-router-dom";

import {
  MessageCircle,
  Mail,
  Copy,
  Printer,
  Image as ImageIcon,
  Share2,
  ArrowLeft
} from "lucide-react";

import {
  loadHistory,
  getStorageItem
} from "../services/storageService.js";

import {
  normalizeReport,
  reportToText
} from "../services/reportService.js";

import {
  shareWhatsApp,
  shareEmail,
  copyReport,
  printReport,
  shareReportImage,
  shareReport
} from "../services/shareService.js";

export default function Share() {
  const location =
    useLocation();

  const [
    report,
    setReport
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    action,
    setAction
  ] = useState("");

  useEffect(() => {
    const stateReport =
      location.state?.report;

    const storedReport =
      getStorageItem(
        "gharlist-last-report",
        null
      );

    const history =
      loadHistory();

    const source =
      stateReport ||
      storedReport ||
      history?.[0] ||
      null;

    setReport(
      normalizeReport(source)
    );

    setLoading(false);
  }, [location.state]);

  async function run(
    name,
    callback
  ) {
    if (!report) {
      return;
    }

    setAction(name);

    try {
      await callback(report);
    } finally {
      setTimeout(
        () => setAction(""),
        600
      );
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="share-page">
          Loading report...
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="page">
        <section className="share-page">
          <div className="report-empty">
            <h1>
              No report available
            </h1>

            <p>
              Complete a shopping list
              first.
            </p>

            <NavLink
              to="/products"
              className="primary-button"
            >
              Browse Products
            </NavLink>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="share-page">

        <div className="share-topbar">
          <NavLink
            to="/report"
            state={{ report }}
            className="back-button"
          >
            <ArrowLeft size={18} />
            Report
          </NavLink>
        </div>

        <div className="share-header">
          <span className="eyebrow">
            GHARLIST
          </span>

          <h1>
            Share Shopping Report
          </h1>

          <p>
            Share your complete
            shopping report with
            product photos and totals.
          </p>
        </div>

        <div className="share-total-card">

          <div>
            <span>
              Items
            </span>
            <strong>
              {report.totalItems}
            </strong>
          </div>

          <div>
            <span>
              Quantity
            </span>
            <strong>
              {report.totalUnits}
            </strong>
          </div>

          <div>
            <span>
              Total
            </span>
            <strong>
              ₹{Number(
                report.totalAmount
              ).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        <div className="share-actions">

          <button
            className="share-action whatsapp"
            onClick={() =>
              run(
                "whatsapp",
                shareWhatsApp
              )
            }
          >
            <MessageCircle size={25} />
            <span>
              WhatsApp
            </span>
            <small>
              Image + report text
            </small>
          </button>

          <button
            className="share-action email"
            onClick={() =>
              run(
                "email",
                shareEmail
              )
            }
          >
            <Mail size={25} />
            <span>
              Email
            </span>
            <small>
              Open mail composer
            </small>
          </button>

          <button
            className="share-action"
            onClick={() =>
              run(
                "image",
                shareReportImage
              )
            }
          >
            <ImageIcon size={25} />
            <span>
              Share Image
            </span>
            <small>
              GHARLIST visual report
            </small>
          </button>

          <button
            className="share-action"
            onClick={() =>
              run(
                "copy",
                copyReport
              )
            }
          >
            <Copy size={25} />
            <span>
              Copy Report
            </span>
            <small>
              Copy formatted text
            </small>
          </button>

          <button
            className="share-action"
            onClick={() =>
              run(
                "print",
                printReport
              )
            }
          >
            <Printer size={25} />
            <span>
              Print / PDF
            </span>
            <small>
              Printable report
            </small>
          </button>

          <button
            className="share-action"
            onClick={() =>
              run(
                "share",
                shareReport
              )
            }
          >
            <Share2 size={25} />
            <span>
              More Share Options
            </span>
            <small>
              Device share sheet
            </small>
          </button>

        </div>

        {action && (
          <div className="share-status">
            Preparing {action}...
          </div>
        )}

        <div className="share-preview">

          <div className="share-preview-header">
            <span>
              REPORT PREVIEW
            </span>

            <span>
              GHARLIST
            </span>
          </div>

          {(report.items || []).map(
            (item, index) => {
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

              return (
                <div
                  className="share-preview-item"
                  key={
                    product.id ||
                    `${index}-${product.name}`
                  }
                >
                  <div className="share-preview-image">
                    {product.image ? (
                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name ||
                          "Product"
                        }
                      />
                    ) : (
                      <span>
                        Image unavailable
                      </span>
                    )}
                  </div>

                  <div>
                    <strong>
                      {product.name}
                    </strong>

                    <p>
                      {product.brand ||
                        "—"}
                    </p>

                    <p>
                      Pack:{" "}
                      {product.quantity ||
                        "—"}
                    </p>

                    <p>
                      Qty: {quantity}
                    </p>
                  </div>

                  <strong>
                    ₹{(
                      price *
                      quantity
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              );
            }
          )}

          <div className="share-preview-total">
            <span>
              🛍️ Items
            </span>

            <strong>
              {report.totalItems}
            </strong>

            <span>
              📦 Quantity
            </span>

            <strong>
              {report.totalUnits}
            </strong>

            <span>
              💰 Total
            </span>

            <strong>
              ₹{Number(
                report.totalAmount
              ).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <div className="share-preview-footer">
            Generated by GHARLIST
          </div>

        </div>

        <div className="share-note">
          <strong>
            💡 GHARLIST sharing
          </strong>

          <p>
            On supported phones,
            WhatsApp can receive the
            generated report image
            together with the formatted
            shopping text.
          </p>

          <p>
            On desktop browsers,
            WhatsApp opens with the
            formatted report and the
            report image is downloaded
            for attachment.
          </p>
        </div>

      </section>
    </main>
  );
}