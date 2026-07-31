/**
 * utils.js
 * ---------------------------------------------------------
 * Shared UI helper functions used across every view:
 * toasts, loading indicators, status badges, and CSV/print
 * export helpers.
 * ---------------------------------------------------------
 */

/** Shows a Bootstrap toast notification. type: 'success' | 'danger' | 'warning' | 'info' */
function showToast(message, type) {
  type = type || "success";
  const container = document.getElementById("toastContainer");
  const id = "toast-" + Date.now();
  const icon = {
    success: "bi-check-circle-fill",
    danger: "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info: "bi-info-circle-fill"
  }[type] || "bi-info-circle-fill";

  const toastEl = document.createElement("div");
  toastEl.className = "toast align-items-center text-bg-" + type + " border-0";
  toastEl.id = id;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML =
    '<div class="d-flex">' +
      '<div class="toast-body"><i class="bi ' + icon + ' me-2"></i>' + escapeHtml(message) + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
    '</div>';
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function showError(err) {
  const message = (err && err.message) ? err.message : String(err);
  showToast(message, "danger");
}

/** Renders a Bootstrap spinner inside a container while data loads. */
function renderLoading(container) {
  container.innerHTML =
    '<div class="d-flex justify-content-center align-items-center py-5 text-muted">' +
      '<div class="spinner-border text-primary me-2" role="status"></div>' +
      '<span>Loading...</span>' +
    '</div>';
}

function renderEmpty(container, message) {
  container.innerHTML =
    '<div class="text-center text-muted py-5"><i class="bi bi-inbox fs-1 d-block mb-2"></i>' +
    escapeHtml(message || "No data found.") + '</div>';
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Returns a Bootstrap badge span for Paid / Pending status */
function statusBadge(status) {
  if (String(status).toLowerCase() === "paid") {
    return '<span class="badge badge-paid"><i class="bi bi-check-circle-fill me-1"></i>Paid</span>';
  }
  return '<span class="badge badge-pending"><i class="bi bi-exclamation-circle-fill me-1"></i>Pending</span>';
}

/** Exports an array of row-objects as a downloadable CSV file. */
function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    showToast("Nothing to export.", "warning");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(",")];
  rows.forEach((row) => {
    const line = headers.map((h) => {
      let val = row[h] === undefined || row[h] === null ? "" : String(row[h]);
      if (val.indexOf(",") !== -1 || val.indexOf('"') !== -1) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    csvLines.push(line.join(","));
  });
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

/** Very light "export to Excel": Excel opens CSV files natively, so we reuse the CSV export. */
function exportToExcel(filename, rows) {
  exportToCsv(filename.replace(/\.xlsx$/, ".csv"), rows);
}

/** Uses the browser's print dialog (Save as PDF) against a printable section. */
function exportToPdf(sectionId, title) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(
    "<html><head><title>" + escapeHtml(title) + "</title>" +
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">' +
    "</head><body class='p-4'><h4 class='mb-3'>" + escapeHtml(title) + "</h4>" +
    section.innerHTML + "</body></html>"
  );
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 400);
}

function triggerDownload(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
