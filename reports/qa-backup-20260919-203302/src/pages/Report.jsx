import {
  Share2,
  Printer,
  History,
  ShoppingBag
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  loadHistory,
  getStorageItem
} from "../services/storageService.js";

function productOf(item) {
  return item?.product || item;
}

export default function Report() {

  const location = useLocation();
  const navigate = useNavigate();

  const report =
    location.state?.report ||
    getStorageItem(
      "gharlist-last-report",
      null
    ) ||
    loadHistory()[0];

  if (!report) {

    return (

      <main className="page-shell">

        <section className="list-empty">

          <ShoppingBag size={40} />

          <h1>
            No report yet
          </h1>

          <p>
            Complete a shopping list to generate your report.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Start Shopping
          </Link>

        </section>

      </main>

    );
  }

  const items =
    report.items || [];

  return (

    <main className="page-shell report-page">

      <section className="report-header">

        <div>

          <span className="eyebrow">
            GHARLIST DIGITAL REPORT
          </span>

          <h1>
            Shopping Complete
          </h1>

          <p>
            {new Date(
              report.createdAt
            ).toLocaleString("en-IN")}
          </p>

        </div>

        <div className="report-actions">

          <button
            className="primary-button"
            onClick={() =>
              navigate("/share", {
                state: { report }
              })
            }
          >
            <Share2 size={18} />
            Share
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              window.print()
            }
          >
            <Printer size={18} />
            Print
          </button>

        </div>

      </section>

      <section className="report-summary">

        <div>
          <span>Products</span>
          <strong>{items.length}</strong>
        </div>

        <div>
          <span>Total Units</span>
          <strong>
            {report.totalUnits}
          </strong>
        </div>

        <div>
          <span>Total Amount</span>
          <strong>
            ₹{Number(
              report.totalAmount || 0
            ).toLocaleString("en-IN")}
          </strong>
        </div>

      </section>

      <section className="report-table">

        <div className="report-table-head">
          <span>Product</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>

        {items.map((item, index) => {

          const product =
            productOf(item);

          const quantity =
            Number(item.quantity || 1);

          const price =
            Number(
              product.salePrice ??
              product.mrp ??
              0
            );

          return (

            <div
              className="report-row"
              key={
                product.id ||
                index
              }
            >

              <div className="report-product">

                <strong>
                  {product.name}
                </strong>

                <small>
                  {product.brand || ""}
                  {product.quantity
                    ? ` · ${product.quantity}`
                    : ""}
                </small>

              </div>

              <span>
                {quantity}
              </span>

              <span>
                ₹{price.toLocaleString("en-IN")}
              </span>

              <strong>
                ₹{(
                  price * quantity
                ).toLocaleString("en-IN")}
              </strong>

            </div>

          );

        })}

      </section>

      <div className="report-bottom">

        <Link
          to="/history"
          className="secondary-button"
        >
          <History size={18} />
          View History
        </Link>

        <Link
          to="/new-list"
          className="primary-button"
        >
          <ShoppingBag size={18} />
          Start New List
        </Link>

      </div>

    </main>

  );
}
