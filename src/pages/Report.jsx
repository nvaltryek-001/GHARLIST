import {
  useEffect,
  useState
} from "react";

import {
  NavLink,
  useLocation
} from "react-router-dom";

import {
  Share2,
  Printer,
  History,
  Plus
} from "lucide-react";

import {
  loadHistory,
  getStorageItem
} from "../services/storageService.js";

import {
  normalizeReport
} from "../services/reportService.js";

import {
  printReport
} from "../services/shareService.js";

export default function Report() {
  const location =
    useLocation();

  const [
    report,
    setReport
  ] = useState(null);

  useEffect(() => {
    const source =
      location.state?.report ||
      getStorageItem(
        "gharlist-last-report",
        null
      ) ||
      loadHistory()?.[0] ||
      null;

    setReport(
      normalizeReport(source)
    );
  }, [location.state]);

  if (!report) {
    return (
      <main className="page">
        <section className="report-page">
          <h1>
            No shopping report
          </h1>

          <NavLink
            to="/products"
            className="primary-button"
          >
            Start Shopping
          </NavLink>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="report-page">

        <div className="report-header">
          <span className="eyebrow">
            GHARLIST
          </span>

          <h1>
            Shopping Report
          </h1>

          <p>
            {new Date(
              report.createdAt
            ).toLocaleString(
              "en-IN"
            )}
          </p>
        </div>

        <div className="report-total-grid">

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

        <div className="report-items">

          {report.items.map(
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
                <article
                  className="report-item"
                  key={
                    product.id ||
                    `${index}-${product.name}`
                  }
                >

                  <div className="report-item-image">
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

                  <div className="report-item-info">

                    <span className="report-index">
                      {index + 1}
                    </span>

                    <h2>
                      {product.name}
                    </h2>

                    <p>
                      Brand:{" "}
                      {product.brand ||
                        "—"}
                    </p>

                    <p>
                      Pack:{" "}
                      {product.quantity ||
                        "—"}
                    </p>

                  </div>

                  <div className="report-item-price">

                    <span>
                      Qty: {quantity}
                    </span>

                    <strong>
                      ₹{(
                        price *
                        quantity
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                </article>
              );
            }
          )}

        </div>

        <div className="report-grand-total">

          <span>
            💰 Total Amount
          </span>

          <strong>
            ₹{Number(
              report.totalAmount
            ).toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>

        <div className="report-actions">

          <NavLink
            to="/share"
            state={{ report }}
            className="primary-button"
          >
            <Share2 size={18} />
            Share Report
          </NavLink>

          <button
            className="secondary-button"
            onClick={() =>
              printReport(report)
            }
          >
            <Printer size={18} />
            Print / PDF
          </button>

          <NavLink
            to="/history"
            className="secondary-button"
          >
            <History size={18} />
            History
          </NavLink>

          <NavLink
            to="/new-list"
            className="secondary-button"
          >
            <Plus size={18} />
            New List
          </NavLink>

        </div>

      </section>
    </main>
  );
}