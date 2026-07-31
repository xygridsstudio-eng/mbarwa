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
      const navbar = document.getElementById("navbarNav");
      if (navbar && navbar.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(navbar).hide();
      }
    });
  });
}

function navigateTo(view) {
  document.querySelectorAll(".app-view").forEach((v) => v.classList.add("d-none"));
  document.querySelectorAll("[data-view]").forEach((v) => v.classList.remove("active"));
  const target = document.getElementById("view-" + view);
  if (target) target.classList.remove("d-none");
  document.querySelectorAll('[data-view="' + view + '"]').forEach((v) => v.classList.add("active"));

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
    document.getElementById("headerBankBalance").textContent = formatCurrency(data.bankBalance);
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
          <div class="phase-amount">${formatCurrency(p.collected)}</div>
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
      const net = data.collectionThisMonth - expenseData.total;
      box.innerHTML = `
        <div class="row g-3" id="reportPrintable">
          <div class="col-12"><h5 class="mb-0">Report for ${escapeHtml(month)} ${escapeHtml(String(year))}</h5></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Total Collected</div><div class="stat-value text-success">${formatCurrency(data.collectionThisMonth)}</div></div></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Pending</div><div class="stat-value text-danger">${formatCurrency(data.pendingAmount)}</div></div></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Expenses</div><div class="stat-value text-warning">${formatCurrency(expenseData.total)}</div></div></div>
          <div class="col-6 col-md-3"><div class="stat-box"><div class="stat-label">Net Balance</div><div class="stat-value ${net >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(net)}</div></div></div>
        </div>
      `;
      State.lastReport = { month, year, data, expenseData };
    } catch (err) {
      renderEmpty(box, err.message);
      showError(err);
    }
  }

  if (e.target && e.target.id === "downloadReportCsv") {
    if (!State.lastReport) { showToast("Generate a report first.", "warning"); return; }
    const { month, year, data, expenseData } = State.lastReport;
    exportToCsv(`report-${month}-${year}.csv`, [{
      Month: month, Year: year,
      TotalCollected: data.collectionThisMonth,
      Pending: data.pendingAmount,
      Expenses: expenseData.total,
      NetBalance: data.collectionThisMonth - expenseData.total
    }]);
  }
  if (e.target && e.target.id === "downloadReportPdf") {
    if (!State.lastReport) { showToast("Generate a report first.", "warning"); return; }
    exportToPdf("reportPrintable", "Monthly Report");
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
    setTimeout(() => {
      document.getElementById("psSearch").value = q;
      drawPaymentStatusTable();
    }, 50);
  }
});
