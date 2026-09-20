import {
  Copy,
  MessageCircle,
  Mail,
  Printer,
  ArrowLeft
} from "lucide-react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  getStorageItem
} from "../services/storageService.js";

import {
  shareReport,
  copyReport,
  shareWhatsApp,
  shareEmail,
  printReport
} from "../services/shareService.js";

import {
  reportToText
} from "../services/reportService.js";

export default function Share() {

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const report =
    location.state?.report ||
    getStorageItem(
      "gharlist-last-report",
      null
    );

  if (!report) {

    return (

      <main className="page-shell">

        <section className="list-empty">

          <h1>
            No report available
          </h1>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/products")
            }
          >
            Start Shopping
          </button>

        </section>

      </main>

    );
  }

  const text =
    reportToText(report);

  return (

    <main className="page-shell share-page">

      <section className="share-header">

        <span className="eyebrow">
          SHARE YOUR LIST
        </span>

        <h1>
          Share & Print
        </h1>

        <p>
          Send your GHARLIST shopping report anywhere.
        </p>

      </section>

      <section className="share-grid">

        <button
          className="share-card"
          onClick={() =>
            shareReport(report)
          }
        >
          <span className="share-icon">
            <Copy size={25} />
          </span>
          <strong>Share</strong>
          <small>
            Use your device share menu
          </small>
        </button>

        <button
          className="share-card"
          onClick={() =>
            copyReport(report)
          }
        >
          <span className="share-icon">
            <Copy size={25} />
          </span>
          <strong>Copy Report</strong>
          <small>
            Copy shopping details
          </small>
        </button>

        <button
          className="share-card"
          onClick={() =>
            shareWhatsApp(report)
          }
        >
          <span className="share-icon">
            <MessageCircle size={25} />
          </span>
          <strong>WhatsApp</strong>
          <small>
            Send to family
          </small>
        </button>

        <button
          className="share-card"
          onClick={() =>
            shareEmail(report)
          }
        >
          <span className="share-icon">
            <Mail size={25} />
          </span>
          <strong>Email</strong>
          <small>
            Send shopping report
          </small>
        </button>

        <button
          className="share-card"
          onClick={() =>
            printReport(report)
          }
        >
          <span className="share-icon">
            <Printer size={25} />
          </span>
          <strong>Print</strong>
          <small>
            Print your list
          </small>
        </button>

      </section>

      <details className="share-preview">

        <summary>
          Preview report
        </summary>

        <pre>
          {text}
        </pre>

      </details>

      <button
        className="back-button"
        onClick={() =>
          navigate("/report", {
            state: { report }
          })
        }
      >
        <ArrowLeft size={17} />
        Back to Report
      </button>

    </main>

  );
}
