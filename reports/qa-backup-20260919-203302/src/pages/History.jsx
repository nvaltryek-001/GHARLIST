import {
  History as HistoryIcon,
  Eye,
  Trash2,
  Plus,
  Package
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  loadHistory,
  deleteHistory,
  clearHistory
} from "../services/storageService.js";

export default function History() {

  const navigate =
    useNavigate();

  const [history, setHistory] =
    useState([]);

  function refresh() {
    setHistory(
      loadHistory() || []
    );
  }

  useEffect(() => {
    refresh();
  }, []);

  function remove(id) {
    deleteHistory(id);
    refresh();
  }

  function clearAll() {

    if (
      window.confirm(
        "Clear all shopping history?"
      )
    ) {
      clearHistory();
      refresh();
    }

  }

  if (!history.length) {

    return (

      <main className="page-shell">

        <section className="list-empty">

          <div className="empty-icon">
            <HistoryIcon size={35} />
          </div>

          <span className="eyebrow">
            SHOPPING HISTORY
          </span>

          <h1>
            No shopping history yet
          </h1>

          <p>
            Completed shopping lists will appear here.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/products")
            }
          >
            <Plus size={18} />
            Create Shopping List
          </button>

        </section>

      </main>

    );
  }

  return (

    <main className="page-shell history-page">

      <div className="history-header">

        <div>

          <span className="eyebrow">
            SHOPPING HISTORY
          </span>

          <h1>
            Previous Lists
          </h1>

          <p>
            {history.length} completed lists
          </p>

        </div>

        <button
          className="secondary-button danger"
          onClick={clearAll}
        >
          Clear History
        </button>

      </div>

      <section className="history-grid">

        {history.map((report, index) => {

          const items =
            report.items || [];

          return (

            <article
              className="history-card"
              key={
                report.id ||
                report.createdAt ||
                index
              }
            >

              <div className="history-card-top">

                <div className="history-date">
                  <HistoryIcon size={18} />

                  <span>
                    {new Date(
                      report.createdAt
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                <button
                  className="icon-button danger"
                  onClick={() =>
                    remove(
                      report.id ||
                      report.createdAt
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>

              </div>

              <div className="history-stats">

                <div>
                  <small>Products</small>
                  <strong>
                    {items.length}
                  </strong>
                </div>

                <div>
                  <small>Units</small>
                  <strong>
                    {report.totalUnits || 0}
                  </strong>
                </div>

                <div>
                  <small>Total</small>
                  <strong>
                    ₹{Number(
                      report.totalAmount || 0
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>

              </div>

              <div className="history-preview">

                {items
                  .slice(0, 3)
                  .map((item, itemIndex) => {

                    const product =
                      item.product || item;

                    return (
                      <span
                        key={
                          product.id ||
                          itemIndex
                        }
                      >
                        {product.name}
                      </span>
                    );

                  })}

                {items.length > 3 && (
                  <span>
                    +{items.length - 3} more
                  </span>
                )}

              </div>

              <button
                className="secondary-button full"
                onClick={() =>
                  navigate("/report", {
                    state: {
                      report
                    }
                  })
                }
              >
                <Eye size={17} />
                View Report
              </button>

            </article>

          );

        })}

      </section>

    </main>

  );
}
