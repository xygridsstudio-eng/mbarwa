/**
 * charts.js
 * ---------------------------------------------------------
 * Chart.js chart builders. Each function destroys any existing
 * chart on the canvas before drawing a new one, so views can be
 * re-rendered safely when filters change.
 * ---------------------------------------------------------
 */

const ChartRegistry = {}; // canvasId -> Chart instance

function destroyChart(canvasId) {
  if (ChartRegistry[canvasId]) {
    ChartRegistry[canvasId].destroy();
    delete ChartRegistry[canvasId];
  }
}

const PALETTE = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

/** Pie chart: collection amount by phase */
function renderPhasePieChart(canvasId, phaseSummaries) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "pie",
    data: {
      labels: phaseSummaries.map((p) => p.phase),
      datasets: [{
        data: phaseSummaries.map((p) => p.collected),
        backgroundColor: PALETTE
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/** Bar chart: monthly collection trend (last N months) */
function renderTrendBarChart(canvasId, trend) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: trend.map((t) => t.label),
      datasets: [{
        label: "Collected (₹)",
        data: trend.map((t) => t.collected),
        backgroundColor: "#2563eb",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

/** Donut chart: expense breakdown by category */
function renderExpenseDonutChart(canvasId, expensesByCategory) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(expensesByCategory),
      datasets: [{
        data: Object.values(expensesByCategory),
        backgroundColor: [
          "#2563eb", "#16a34a", "#f59e0b", "#dc2626",
          "#7c3aed", "#0891b2", "#db2777", "#65a30d"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/** Gauge-style doughnut: collection percentage */
function renderCollectionGauge(canvasId, percentage) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const pct = Math.max(0, Math.min(100, percentage));
  const color = pct >= 90 ? "#16a34a" : pct >= 70 ? "#f59e0b" : "#dc2626";
  ChartRegistry[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [pct, 100 - pct],
        backgroundColor: [color, "#e5e7eb"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      circumference: 180,
      rotation: 270,
      cutout: "75%",
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
  });
}
