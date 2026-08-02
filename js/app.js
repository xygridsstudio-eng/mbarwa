/**
 * app.js
 * ---------------------------------------------------------
 * Application entry point + view router. Each "view" is a
 * <section> in index.html toggled via navigateTo(viewName).
 * State (selected month/year, cached lists) is kept in the
 * `State` object below.
 * ---------------------------------------------------------
 */

const State = {
  month: getCurrentMonthName(),
  year: getCurrentYear(),
  residents: [],
  paymentStatusRows: []
};

document.addEventListener("DOMContentLoaded", () => {
  buildYearOptions();
  wireNav();
  wireAdminUi();
  document.getElementById("appName").textContent = CONFIG.ASSOCIATION_NAME;
  document.getElementById("footerAppName").textContent = CONFIG.ASSOCIATION_NAME;
  navigateTo("dashboard");
});

// ---------------------------------------------------------
// Navigation
// ---------------------------------------------------------
function wireNav() {
  document.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(el.getAttribute("data-view"));
      closeSidebar();
    });
  });

  document.getElementById("sidebarToggleBtn")?.addEventListener("click", openSidebar);
  document.getElementById("sidebarCloseBtn")?.addEventListener("click", closeSidebar);
  document.getElementById("sidebarBackdrop")?.addEventListener("click", closeSidebar);
}

function openSidebar() {
  document.getElementById("appSidebar")?.classList.add("show");
  document.getElementById("sidebarBackdrop")?.classList.add("show");
}

function closeSidebar() {
  document.getElementById("appSidebar")?.classList.remove("show");
  document.getElementById("sidebarBackdrop")?.classList.remove("show");
}

/** If the active view lives inside a collapsible sidebar group (Residents,
 * Financials, Admin), expand that group and highlight its header — so landing
 * directly on e.g. "Register" still shows which section you're in. */
function highlightSidebarGroup(view) {
  document.querySelectorAll(".sidebar-group-toggle").forEach((t) => t.classList.remove("active"));
  const activeLink = document.querySelector('.sidebar-nav [data-view="' + view + '"]');
  const group = activeLink ? activeLink.closest(".sidebar-group") : null;
  if (!group) return;
  const toggle = group.querySelector(".sidebar-group-toggle");
  const submenu = group.querySelector(".sidebar-subnav");
  toggle.classList.add("active");
  if (submenu && !submenu.classList.contains("show")) {
    bootstrap.Collapse.getOrCreateInstance(submenu, { toggle: false }).show();
  }
}

function navigateTo(view) {
  document.querySelectorAll(".app-view").forEach((v) => v.classList.add("d-none"));
  document.querySelectorAll("[data-view]").forEach((v) => v.classList.remove("active"));
  const target = document.getElementById("view-" + view);
  if (target) target.classList.remove("d-none");
  document.querySelectorAll('[data-view="' + view + '"]').forEach((v) => v.classList.add("active"));
  highlightSidebarGroup(view);

  if (view === "dashboard") renderDashboard();
  if (view === "payments") renderPaymentStatus();
  if (view === "reports") renderReports();
  if (view === "expenses") renderExpenses();
  if (view === "bank") renderBankBalance();
  if (view === "admin") renderAdmin();
}

function buildYearOptions() {
  const selects = document.querySelectorAll(".year-select");
  const thisYear = getCurrentYear();
  const years = [];
  for (let y = thisYear - CONFIG.YEAR_RANGE_BACK; y <= thisYear + CONFIG.YEAR_RANGE_FORWARD; y++) years.push(y);
  selects.forEach((sel) => {
    sel.innerHTML = years.map((y) => `<option value="${y}" ${y === thisYear ? "selected" : ""}>${y}</option>`).join("");
  });
  document.querySelectorAll(".month-select").forEach((sel) => {
    sel.innerHTML = CONFIG.MONTHS.map((m) => `<option value="${m}" ${m === State.month ? "selected" : ""}>${m}</option>`).join("");
  });
}

// ---------------------------------------------------------
// DASHBOARD (Home)
// ---------------------------------------------------------
async function renderDashboard() {
  const container = document.getElementById("dashboardCards");
  renderLoading(container);
  try {
    const data = await Api.getDashboard(State.month, State.year);

    document.getElementById("headerMonthYear").textContent = State.month + " " + State.year;
    document.getElementById("headerLastUpdated").textContent = data.lastUpdated || "-";

    container.innerHTML = `
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-blue">
          <i class="bi bi-people-fill kpi-icon"></i>
          <div class="kpi-value">${data.totalFamilies}</div>
          <div class="kpi-label">Total Families</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-green">
          <i class="bi bi-check-circle-fill kpi-icon"></i>
          <div class="kpi-value">${data.familiesPaid}</div>
          <div class="kpi-label">Families Paid</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-red">
          <i class="bi bi-exclamation-circle-fill kpi-icon"></i>
          <div class="kpi-value">${data.familiesPending}</div>
          <div class="kpi-label">Families Pending</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-blue">
          <i class="bi bi-cash-coin kpi-icon"></i>
          <div class="kpi-value">${formatCurrency(data.collectionThisMonth)}</div>
          <div class="kpi-label">Collection This Month</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-orange">
          <i class="bi bi-hourglass-split kpi-icon"></i>
          <div class="kpi-value">${formatCurrency(data.pendingAmount)}</div>
          <div class="kpi-label">Pending Amount</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-blue">
          <i class="bi bi-bank kpi-icon"></i>
          <div class="kpi-value">${formatCurrency(data.bankBalance)}</div>
          <div class="kpi-label">Bank Balance</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-orange">
          <i class="bi bi-receipt kpi-icon"></i>
          <div class="kpi-value">${formatCurrency(data.monthlyExpenses)}</div>
          <div class="kpi-label">Monthly Expenses</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="kpi-card kpi-green">
          <i class="bi bi-graph-up-arrow kpi-icon"></i>
          <div class="kpi-value">${data.collectionPercent}%</div>
          <div class="kpi-label">Collection %</div>
        </div>
      </div>
    `;

    // Phase summary cards
    const phaseContainer = document.getElementById("phaseSummaryCards");
    phaseContainer.innerHTML = data.phaseSummary.map((p, i) => `
      <div class="col-6 col-md-4 col-lg-2-4">
        <div class="phase-card" style="border-top-color:${PALETTE[i % PALETTE.length]}">
          <div class="phase-title">${escapeHtml(p.phase)}</div>
          <div class="phase-residents">${p.residentCount} resident${p.residentCount === 1 ? '' : 's'} registered</div>
          <div class="phase-amount">${formatCurrency(p.collected)} <span class="phase-expected">of ${formatCurrency(p.expected)}</span></div>
          <div class="phase-pending">Pending ${formatCurrency(p.pending)}</div>
          <div class="progress phase-progress">
            <div class="progress-bar" role="progressbar" style="width:${p.percent}%; background:${PALETTE[i % PALETTE.length]}"></div>
          </div>
          <div class="phase-percent">${p.percent}% collected</div>
        </div>
      </div>
    `).join("");

    // Charts
    renderPhasePieChart("phasePieChart", data.phaseSummary);
    renderTrendBarChart("trendBarChart", data.trend);
    renderCollectionGauge("collectionGauge", data.collectionPercent);
    document.getElementById("gaugeValueLabel").textContent = data.collectionPercent + "%";

  } catch (err) {
    renderEmpty(container, err.message);
    showError(err);
  }
}

document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "dashboardMonth") {
    State.month = e.target.value;
    renderDashboard();
  }
  if (e.target && e.target.id === "dashboardYear") {
    State.year = Number(e.target.value);
    renderDashboard();
  }
});

// ---------------------------------------------------------
// PAYMENT STATUS
// ---------------------------------------------------------
async function renderPaymentStatus() {
  const tbody = document.getElementById("paymentStatusBody");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
  try {
    const month = document.getElementById("psMonth").value || State.month;
    const year = document.getElementById("psYear").value || State.year;
    const rows = await Api.getPayments(month, year);
    State.paymentStatusRows = rows;
    drawPaymentStatusTable();
  } catch (err) {
    tbody.innerHTML = "";
    renderEmpty(document.getElementById("paymentStatusEmpty"), err.message);
    showError(err);
  }
}

function drawPaymentStatusTable() {
  const tbody = document.getElementById("paymentStatusBody");
  const phase = document.getElementById("psPhaseFilter").value;
  const status = document.getElementById("psStatusFilter").value;
  const search = (document.getElementById("psSearch").value || "").toLowerCase().trim();

  let rows = State.paymentStatusRows.filter((r) => {
    if (phase && r.phase !== phase) return false;
    if (status && r.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const hay = (r.houseNumber + " " + r.owner).toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    return true;
  });

  if (!rows.length) {
    tbody.innerHTML = "";
    document.getElementById("paymentStatusEmpty").classList.remove("d-none");
    return;
  }
  document.getElementById("paymentStatusEmpty").classList.add("d-none");

  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td>${escapeHtml(r.houseNumber)}</td>
      <td>${escapeHtml(r.owner)}</td>
      <td>${escapeHtml(r.phase)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${escapeHtml(r.paidDate || "-")}</td>
      <td>${r.amount ? formatCurrency(r.amount) : "-"}</td>
      <td>${escapeHtml(r.phone || "-")}</td>
    </tr>
  `).join("");
}

["psPhaseFilter", "psStatusFilter", "psSearch"].forEach((id) => {
  document.addEventListener("input", (e) => { if (e.target && e.target.id === id) drawPaymentStatusTable(); });
  document.addEventListener("change", (e) => { if (e.target && e.target.id === id) drawPaymentStatusTable(); });
});
document.addEventListener("change", (e) => {
  if (e.target && (e.target.id === "psMonth" || e.target.id === "psYear")) renderPaymentStatus();
});
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "psExportCsv") {
    exportToCsv("payment-status.csv", State.paymentStatusRows);
  }
});

// ---------------------------------------------------------
// MONTHLY REPORT
// ---------------------------------------------------------
async function renderReports() {
  const box = document.getElementById("reportResult");
  box.classList.add("d-none");
}

// Report generation and downloads are committee-only. These buttons are
// intercepted in the capture phase below: if there's no admin session, the
// click is cancelled and the password modal is shown instead. After a
// successful sign-in the original button is clicked again, which then passes
// the gate and runs the real handler.
//
// Note this gates the reports themselves, not the underlying data — the
// dashboard, payment status and expenses pages are public by design, so the
// same figures remain visible there without a password.
const GATED_REPORT_BUTTONS = [
  "generateReportBtn", "downloadReportCsv", "downloadReportPdf",
  "generateResidentReportBtn", "downloadResidentReportCsv", "downloadResidentReportPdf"
];
let pendingReportButtonId = null;

document.addEventListener("click", (e) => {
  const btn = e.target && e.target.closest ? e.target.closest("button") : null;
  if (!btn || GATED_REPORT_BUTTONS.indexOf(btn.id) === -1) return;
  if (AdminAuth.isLoggedIn()) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  pendingReportButtonId = btn.id;
  document.getElementById("reportAuthPassword").value = "";
  new bootstrap.Modal(document.getElementById("reportAuthModal")).show();
}, true);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reportAuthForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("reportAuthPassword").value;
    const btn = document.getElementById("reportAuthSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Checking...';
    try {
      await AdminAuth.login(password);
      bootstrap.Modal.getInstance(document.getElementById("reportAuthModal")).hide();
      const resume = pendingReportButtonId && document.getElementById(pendingReportButtonId);
      pendingReportButtonId = null;
      if (resume) resume.click();
    } catch (err) {
      showError(new Error("Incorrect password."));
    } finally {
      btn.disabled = false;
      btn.textContent = "Continue";
    }
  });
});

document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "generateReportBtn") {
    const month = document.getElementById("reportMonth").value;
    const year = document.getElementById("reportYear").value;
    const box = document.getElementById("reportResult");
    renderLoading(box);
    box.classList.remove("d-none");
    try {
      const data = await Api.getDashboard(month, year);
      const expenseData = await Api.getExpenses(month, year);
      const paymentRows = await Api.getPayments(month, year);
      const net = data.collectionThisMonth - expenseData.total;

      // Paid vs not-paid counts per phase, to go alongside the amounts already
      // in data.phaseSummary (which are computed against the fixed 15/phase target).
      const phaseBreakdown = data.phaseSummary.map((p) => {
        const rows = paymentRows.filter((r) => r.phase === p.phase);
        const paidCount = rows.filter((r) => r.status === "Paid").length;
        const notPaidCount = rows.length - paidCount;
        return Object.assign({ paidCount, notPaidCount }, p);
      });

      const paidRows = paymentRows.filter((r) => r.status === "Paid");
      const expenseRows = expenseData.rows || [];

      box.innerHTML = `
        <div class="row g-3" id="reportPrintable">

          <!-- Header / letterhead -->
          <div class="col-12 text-center border-bottom pb-3">
            <h4 class="mb-1">${escapeHtml(CONFIG.ASSOCIATION_NAME)}</h4>
            <div class="text-muted small">Monthly Financial Report</div>
          </div>

          <!-- Summary -->
          <div class="col-12">
            <h5 class="mb-0">Summary for ${escapeHtml(month)} ${escapeHtml(String(year))}</h5>
          </div>
          <div class="col-6 col-md-4 col-lg-2-4"><div class="stat-box"><div class="stat-label">Total Collected</div><div class="stat-value text-success">${formatCurrency(data.collectionThisMonth)}</div></div></div>
          <div class="col-6 col-md-4 col-lg-2-4"><div class="stat-box"><div class="stat-label">Pending</div><div class="stat-value text-danger">${formatCurrency(data.pendingAmount)}</div></div></div>
          <div class="col-6 col-md-4 col-lg-2-4"><div class="stat-box"><div class="stat-label">Expenses</div><div class="stat-value text-warning">${formatCurrency(expenseData.total)}</div></div></div>
          <div class="col-6 col-md-4 col-lg-2-4"><div class="stat-box"><div class="stat-label">Net Balance</div><div class="stat-value ${net >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(net)}</div></div></div>
          <div class="col-6 col-md-4 col-lg-2-4"><div class="stat-box"><div class="stat-label">Bank Balance</div><div class="stat-value text-primary">${formatCurrency(data.bankBalance)}</div></div></div>

          <!-- Details -->
          <div class="col-12 mt-2">
            <h5 class="mb-2">Details</h5>
          </div>
          <div class="col-12 col-lg-6">
            <h6 class="small text-muted text-uppercase">Payments Received</h6>
            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle mb-0">
                <thead><tr><th>House</th><th>Owner</th><th>Amount</th><th>Date Paid</th><th>Mode</th></tr></thead>
                <tbody>
                  ${paidRows.length ? paidRows.map((r) => `
                    <tr>
                      <td>${escapeHtml(r.houseNumber)}</td>
                      <td>${escapeHtml(r.owner)}</td>
                      <td class="text-success">${formatCurrency(r.amount)}</td>
                      <td>${escapeHtml(r.paidDate || "-")}</td>
                      <td>${escapeHtml(r.paymentMode || "-")}</td>
                    </tr>
                  `).join("") : '<tr><td colspan="5" class="text-center text-muted py-3">No payments recorded.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-12 col-lg-6">
            <h6 class="small text-muted text-uppercase">Expenses</h6>
            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle mb-0">
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                  ${expenseRows.length ? expenseRows.map((r) => `
                    <tr>
                      <td>${escapeHtml(r.date)}</td>
                      <td>${escapeHtml(r.category)}</td>
                      <td>${escapeHtml(r.description)}</td>
                      <td class="text-danger">${formatCurrency(r.amount)}</td>
                    </tr>
                  `).join("") : '<tr><td colspan="4" class="text-center text-muted py-3">No expenses recorded.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Phase-wise split -->
          <div class="col-12 mt-2">
            <h5 class="mb-2">Phase-wise Split</h5>
            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Phase</th><th>Registered</th><th>Paid</th><th>Not Paid</th>
                    <th>Collected</th><th>Pending</th><th>Phase Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${phaseBreakdown.map((p) => `
                    <tr>
                      <td>${escapeHtml(p.phase)}</td>
                      <td>${p.residentCount}</td>
                      <td><span class="badge badge-paid">${p.paidCount}</span></td>
                      <td><span class="badge badge-pending">${p.notPaidCount}</span></td>
                      <td class="text-success">${formatCurrency(p.collected)}</td>
                      <td class="text-danger">${formatCurrency(p.pending)}</td>
                      <td>${formatCurrency(p.expected)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Association Committee -->
          <div class="col-12 mt-3 pt-3 border-top">
            <h6 class="text-muted text-uppercase small mb-3">Association Committee</h6>
            <div class="row g-3">
              ${CONFIG.COMMITTEE.map((c) => `
                <div class="col-6 col-md-4">
                  <div class="small text-muted">${escapeHtml(c.role)}</div>
                  <div class="fw-semibold">${escapeHtml(c.name)}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
      State.lastReport = { month, year, data, expenseData, phaseBreakdown };
    } catch (err) {
      renderEmpty(box, err.message);
      showError(err);
    }
  }

  if (e.target && e.target.id === "downloadReportCsv") {
    if (!State.lastReport) { showToast("Generate a report first.", "warning"); return; }
    const { phaseBreakdown } = State.lastReport;
    exportToCsv(`report-phase-breakdown-${State.lastReport.month}-${State.lastReport.year}.csv`, phaseBreakdown.map((p) => ({
      Phase: p.phase,
      Registered: p.residentCount,
      Paid: p.paidCount,
      NotPaid: p.notPaidCount,
      Collected: p.collected,
      Pending: p.pending,
      PhaseTotal: p.expected
    })));
  }
  if (e.target && e.target.id === "downloadReportPdf") {
    if (!State.lastReport) { showToast("Generate a report first.", "warning"); return; }
    exportToPdf("reportPrintable", "Monthly Report");
  }

  // ---- Resident details report ----
  // Deliberately limited to the roster fields already shown publicly on Payment
  // Status (house, owner, phone, phase, status). Property details (email,
  // emergency contact, etc.) stay admin-only, since this view isn't login-gated.
  if (e.target && e.target.id === "generateResidentReportBtn") {
    const box = document.getElementById("residentReportResult");
    const phase = document.getElementById("residentReportPhase").value;
    const status = document.getElementById("residentReportStatus").value;
    renderLoading(box);
    box.classList.remove("d-none");
    try {
      const all = await Api.getResidents();
      const rows = all.filter((r) => (!phase || r.phase === phase) && (!status || r.status === status));

      const byPhase = CONFIG.PHASES.map((p) => ({ phase: p, count: rows.filter((r) => r.phase === p).length }))
        .filter((p) => p.count > 0);
      const scopeLabel = [phase || "All Phases", status || "All Status"].join(" · ");

      box.innerHTML = `
        <div id="residentReportPrintable">
          <div class="text-center border-bottom pb-3 mb-3">
            <h4 class="mb-1">${escapeHtml(CONFIG.ASSOCIATION_NAME)}</h4>
            <div class="text-muted small">Resident Details Report</div>
          </div>
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
            <span class="small text-muted">${escapeHtml(scopeLabel)}</span>
            <span class="small text-muted">${rows.length} resident${rows.length === 1 ? "" : "s"}${byPhase.length ? " — " + byPhase.map((p) => escapeHtml(p.phase) + ": " + p.count).join(", ") : ""}</span>
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0">
              <thead><tr><th>#</th><th>House</th><th>Owner</th><th>Phone</th><th>Phase</th><th>Status</th></tr></thead>
              <tbody>
                ${rows.length ? rows.map((r, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${escapeHtml(r.houseNumber)}</td>
                    <td>${escapeHtml(r.ownerName)}</td>
                    <td>${escapeHtml(String(r.phoneNumber || "-"))}</td>
                    <td>${escapeHtml(r.phase)}</td>
                    <td><span class="badge ${r.status === 'Active' ? 'text-bg-success' : r.status === 'Pending' ? 'text-bg-warning' : 'text-bg-secondary'}">${escapeHtml(r.status)}</span></td>
                  </tr>
                `).join("") : '<tr><td colspan="6" class="text-center text-muted py-3">No residents match this filter.</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="mt-3 pt-3 border-top">
            <h6 class="text-muted text-uppercase small mb-3">Association Committee</h6>
            <div class="row g-3">
              ${CONFIG.COMMITTEE.map((c) => `
                <div class="col-6 col-md-4">
                  <div class="small text-muted">${escapeHtml(c.role)}</div>
                  <div class="fw-semibold">${escapeHtml(c.name)}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
      State.lastResidentReport = { rows, phase, status };
    } catch (err) {
      renderEmpty(box, err.message);
      showError(err);
    }
  }

  if (e.target && e.target.id === "downloadResidentReportCsv") {
    if (!State.lastResidentReport) { showToast("Generate the resident report first.", "warning"); return; }
    exportToCsv("resident-details.csv", State.lastResidentReport.rows.map((r) => ({
      HouseNumber: r.houseNumber,
      OwnerName: r.ownerName,
      PhoneNumber: r.phoneNumber,
      Phase: r.phase,
      Status: r.status
    })));
  }
  if (e.target && e.target.id === "downloadResidentReportPdf") {
    if (!State.lastResidentReport) { showToast("Generate the resident report first.", "warning"); return; }
    exportToPdf("residentReportPrintable", "Resident Details Report");
  }
});

// ---------------------------------------------------------
// EXPENSES
// ---------------------------------------------------------
async function renderExpenses() {
  const tbody = document.getElementById("expensesBody");
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
  try {
    const data = await Api.getExpenses("", ""); // all expenses
    State.allExpenses = data.rows;
    tbody.innerHTML = data.rows.length ? data.rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td><span class="badge text-bg-light border">${escapeHtml(r.category)}</span></td>
        <td>${escapeHtml(r.description)}</td>
        <td class="text-end">${formatCurrency(r.amount)}</td>
      </tr>
    `).join("") : '<tr><td colspan="4" class="text-center text-muted py-4">No expenses recorded yet.</td></tr>';
    document.getElementById("expensesTotal").textContent = formatCurrency(data.total);
    renderExpenseDonutChart("expenseDonutChart", data.byCategory);
  } catch (err) {
    tbody.innerHTML = "";
    showError(err);
  }
}
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "expensesExportCsv") {
    exportToCsv("expenses.csv", State.allExpenses || []);
  }
});

// ---------------------------------------------------------
// BANK BALANCE
// ---------------------------------------------------------
async function renderBankBalance() {
  const container = document.getElementById("bankBalanceCards");
  renderLoading(container);
  try {
    const data = await Api.getBankBalance();
    container.innerHTML = `
      <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Opening Balance</div><div class="stat-value">${formatCurrency(data.openingBalance)}</div></div></div>
      <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Income</div><div class="stat-value text-success">${formatCurrency(data.income)}</div></div></div>
      <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Expenses</div><div class="stat-value text-danger">${formatCurrency(data.expense)}</div></div></div>
      <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Current Balance</div><div class="stat-value text-primary">${formatCurrency(data.closingBalance)}</div></div></div>
    `;
    renderTrendBarChart("bankTrendChart", data.history.map((h) => ({ label: h.date, collected: h.balance })));
  } catch (err) {
    renderEmpty(container, err.message);
    showError(err);
  }
}

// ---------------------------------------------------------
// SEARCH (global quick search on payment status data)
// ---------------------------------------------------------
document.addEventListener("submit", (e) => {
  if (e.target && e.target.id === "globalSearchForm") {
    e.preventDefault();
    const q = document.getElementById("globalSearchInput").value;
    navigateTo("payments");
    closeSidebar();
    setTimeout(() => {
      document.getElementById("psSearch").value = q;
      drawPaymentStatusTable();
    }, 50);
  }
});
