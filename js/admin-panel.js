/**
 * admin-panel.js
 * ---------------------------------------------------------
 * Renders the Admin view: a login gate, then tabs for managing
 * Payments, Expenses, Residents, and Bank Balance. All writes
 * go through Api.* functions which attach the admin password
 * (see admin.js / api.js).
 * ---------------------------------------------------------
 */

function renderAdmin() {
  const gate = document.getElementById("adminLoginGate");
  const panel = document.getElementById("adminPanel");
  if (AdminAuth.isLoggedIn()) {
    gate.classList.add("d-none");
    panel.classList.remove("d-none");
    loadAdminResidents();
    loadAdminPayments();
    loadAdminExpenses();
    loadAdminBank();
  } else {
    gate.classList.remove("d-none");
    panel.classList.add("d-none");
  }
}

function wireAdminUi() {
  document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("adminPasswordInput").value;
    const btn = document.getElementById("adminLoginBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Signing in...';
    try {
      await AdminAuth.login(password);
      showToast("Welcome, admin!", "success");
      document.getElementById("adminPasswordInput").value = "";
      renderAdmin();
    } catch (err) {
      showError(new Error("Incorrect password."));
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Sign in";
    }
  });

  document.getElementById("adminLogoutBtn").addEventListener("click", () => {
    AdminAuth.logout();
    showToast("Signed out.", "info");
    renderAdmin();
  });

  // Add Payment
  document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      paymentId: form.paymentId.value || "",
      residentId: form.residentId.value,
      month: form.month.value,
      year: form.year.value,
      amount: form.amount.value,
      datePaid: form.datePaid.value,
      paymentMode: form.paymentMode.value,
      referenceNumber: form.referenceNumber.value,
      remarks: form.remarks.value
    };
    try {
      if (payload.paymentId) {
        await Api.updatePayment(payload);
        showToast("Payment updated.", "success");
      } else {
        await Api.addPayment(payload);
        showToast("Payment recorded.", "success");
      }
      bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
      form.reset();
      loadAdminPayments();
    } catch (err) { showError(err); }
  });

  // Add Expense
  document.getElementById("expenseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      expenseId: form.expenseId.value || "",
      date: form.date.value,
      category: form.category.value,
      description: form.description.value,
      amount: form.amount.value
    };
    try {
      if (payload.expenseId) {
        await Api.updateExpense(payload);
        showToast("Expense updated.", "success");
      } else {
        await Api.addExpense(payload);
        showToast("Expense added.", "success");
      }
      bootstrap.Modal.getInstance(document.getElementById("expenseModal")).hide();
      form.reset();
      loadAdminExpenses();
    } catch (err) { showError(err); }
  });

  // Add/Edit Resident
  document.getElementById("residentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      residentId: form.residentId.value || "",
      houseNumber: form.houseNumber.value,
      ownerName: form.ownerName.value,
      phoneNumber: form.phoneNumber.value,
      phase: form.phase.value,
      status: form.status.value
    };
    try {
      if (payload.residentId) {
        await Api.updateResident(payload);
        showToast("Resident updated.", "success");
      } else {
        await Api.addResident(payload);
        showToast("Resident added.", "success");
      }
      bootstrap.Modal.getInstance(document.getElementById("residentModal")).hide();
      form.reset();
      loadAdminResidents();
    } catch (err) { showError(err); }
  });

  // Update Bank Balance
  document.getElementById("bankForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      date: form.date.value,
      openingBalance: form.openingBalance.value,
      income: form.income.value,
      expense: form.expense.value,
      closingBalance: form.closingBalance.value
    };
    try {
      await Api.updateBankBalance(payload);
      showToast("Bank balance updated.", "success");
      bootstrap.Modal.getInstance(document.getElementById("bankModal")).hide();
      form.reset();
      loadAdminBank();
    } catch (err) { showError(err); }
  });

  // Admin: edit a resident's property details on their behalf
  document.getElementById("adminPropertyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      residentId: form.residentId.value,
      propertyType: form.propertyType.value,
      familyMembers: form.familyMembers.value,
      vehicles: form.vehicles.value,
      email: form.email.value,
      emergencyContactName: form.emergencyContactName.value,
      emergencyContactPhone: form.emergencyContactPhone.value,
      notes: form.notes.value
    };
    try {
      await Api.updateResidentProperty(payload);
      showToast("Property details saved.", "success");
      bootstrap.Modal.getInstance(document.getElementById("adminPropertyModal")).hide();
      loadAdminResidents();
    } catch (err) { showError(err); }
  });

  document.getElementById("adminPropertyDeleteBtn").addEventListener("click", async () => {
    const residentId = document.getElementById("adminPropertyForm").residentId.value;
    if (!residentId) return;
    if (!confirm("Delete this resident's submitted property details? Their resident record itself is kept.")) return;
    try {
      await Api.deleteResidentProperty(residentId);
      showToast("Property details deleted.", "success");
      bootstrap.Modal.getInstance(document.getElementById("adminPropertyModal")).hide();
      loadAdminResidents();
    } catch (err) { showError(err); }
  });

  // Delete buttons (event delegation)
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".delete-payment-btn")) {
      const id = e.target.closest(".delete-payment-btn").dataset.id;
      if (!confirm("Delete this payment record?")) return;
      try { await Api.deletePayment(id); showToast("Payment deleted.", "success"); loadAdminPayments(); }
      catch (err) { showError(err); }
    }
    if (e.target.closest(".delete-expense-btn")) {
      const id = e.target.closest(".delete-expense-btn").dataset.id;
      if (!confirm("Delete this expense record?")) return;
      try { await Api.deleteExpense(id); showToast("Expense deleted.", "success"); loadAdminExpenses(); }
      catch (err) { showError(err); }
    }
    if (e.target.closest(".edit-payment-btn")) {
      const btn = e.target.closest(".edit-payment-btn");
      const form = document.getElementById("paymentForm");
      form.paymentId.value = btn.dataset.id;
      form.residentId.value = btn.dataset.residentid;
      form.month.value = btn.dataset.month;
      form.year.value = btn.dataset.year;
      form.amount.value = btn.dataset.amount;
      form.datePaid.value = btn.dataset.datepaid;
      form.paymentMode.value = btn.dataset.mode;
      form.referenceNumber.value = btn.dataset.ref;
      form.remarks.value = btn.dataset.remarks;
      new bootstrap.Modal(document.getElementById("paymentModal")).show();
    }
    if (e.target.closest(".edit-resident-btn")) {
      const btn = e.target.closest(".edit-resident-btn");
      const form = document.getElementById("residentForm");
      form.residentId.value = btn.dataset.id;
      form.houseNumber.value = btn.dataset.house;
      form.ownerName.value = btn.dataset.owner;
      form.phoneNumber.value = btn.dataset.phone;
      form.phase.value = btn.dataset.phase;
      form.status.value = btn.dataset.status;
      new bootstrap.Modal(document.getElementById("residentModal")).show();
    }
    if (e.target.closest(".view-property-btn")) {
      const residentId = e.target.closest(".view-property-btn").dataset.id;
      openAdminPropertyModal(residentId);
    }
    if (e.target.id === "newPaymentBtn") {
      document.getElementById("paymentForm").reset();
      document.getElementById("paymentForm").paymentId.value = "";
    }
    if (e.target.id === "newExpenseBtn") {
      document.getElementById("expenseForm").reset();
      document.getElementById("expenseForm").expenseId.value = "";
    }
    if (e.target.id === "newResidentBtn") {
      document.getElementById("residentForm").reset();
      document.getElementById("residentForm").residentId.value = "";
    }
  });
}

function populateAdminPropertyTypeOptions() {
  const sel = document.querySelector('#adminPropertyForm select[name="propertyType"]');
  if (!sel || sel.options.length) return; // populate once
  sel.innerHTML = '<option value="">Select...</option>' +
    CONFIG.PROPERTY_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("");
}

async function openAdminPropertyModal(residentId) {
  populateAdminPropertyTypeOptions();
  const form = document.getElementById("adminPropertyForm");
  form.reset();
  form.residentId.value = residentId;
  const modal = new bootstrap.Modal(document.getElementById("adminPropertyModal"));
  modal.show();
  document.getElementById("adminPropertyMeta").textContent = "Loading...";
  try {
    const record = await Api.getResidentProperty(residentId);
    document.getElementById("adminPropertySummary").innerHTML =
      `<strong>${escapeHtml(record.ownerName)}</strong> — House ${escapeHtml(record.houseNumber)}, ${escapeHtml(record.phase)}`;
    form.propertyType.value = record.propertyType || "";
    form.familyMembers.value = record.familyMembers || "";
    form.vehicles.value = record.vehicles || "";
    form.email.value = record.email || "";
    form.emergencyContactName.value = record.emergencyContactName || "";
    form.emergencyContactPhone.value = record.emergencyContactPhone || "";
    form.notes.value = record.notes || "";
    document.getElementById("adminPropertyDeleteBtn").classList.toggle("d-none", !record.propertyId);
    document.getElementById("adminPropertyMeta").textContent = record.propertyId
      ? `Submitted ${record.propertySubmittedDate || "-"} · Last updated ${record.propertyUpdatedDate || "-"}`
      : "Not submitted yet by the resident.";
  } catch (err) {
    showError(err);
  }
}

async function loadAdminResidents() {
  const tbody = document.getElementById("adminResidentsBody");
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></td></tr>';
  try {
    const residents = await Api.getResidents();
    State.residents = residents;
    populateResidentDropdown(residents);
    tbody.innerHTML = residents.map((r) => `
      <tr>
        <td>${escapeHtml(r.houseNumber)}</td>
        <td>${escapeHtml(r.ownerName)}</td>
        <td>${escapeHtml(r.phoneNumber)}</td>
        <td>${escapeHtml(r.phase)}</td>
        <td><span class="badge ${r.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}">${escapeHtml(r.status)}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary edit-resident-btn"
            data-id="${escapeHtml(r.residentId)}" data-house="${escapeHtml(r.houseNumber)}"
            data-owner="${escapeHtml(r.ownerName)}" data-phone="${escapeHtml(r.phoneNumber)}"
            data-phase="${escapeHtml(r.phase)}" data-status="${escapeHtml(r.status)}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary view-property-btn" data-id="${escapeHtml(r.residentId)}" title="View/edit property details">
            <i class="bi bi-house-gear"></i>
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) { showError(err); }
}

function populateResidentDropdown(residents) {
  const sel = document.querySelector('#paymentForm select[name="residentId"]');
  if (!sel) return;
  sel.innerHTML = residents.map((r) => `<option value="${escapeHtml(r.residentId)}">${escapeHtml(r.houseNumber)} - ${escapeHtml(r.ownerName)}</option>`).join("");
}

async function loadAdminPayments() {
  const tbody = document.getElementById("adminPaymentsBody");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></td></tr>';
  try {
    const rows = await Api.getPayments(State.month, State.year);
    const paidRows = rows.filter((r) => r.status === "Paid");
    tbody.innerHTML = paidRows.length ? paidRows.map((r) => `
      <tr>
        <td>${escapeHtml(r.houseNumber)}</td>
        <td>${escapeHtml(r.owner)}</td>
        <td>${formatCurrency(r.amount)}</td>
        <td>${escapeHtml(r.paidDate || "-")}</td>
        <td>${escapeHtml(r.paymentMode || "-")}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary edit-payment-btn"
            data-id="${escapeHtml(r.paymentId || '')}" data-residentid="${escapeHtml(r.residentId)}"
            data-month="${escapeHtml(State.month)}" data-year="${escapeHtml(String(State.year))}"
            data-amount="${escapeHtml(String(r.amount))}" data-datepaid="${escapeHtml(r.paidDate || '')}"
            data-mode="${escapeHtml(r.paymentMode || '')}" data-ref="${escapeHtml(r.referenceNumber || '')}"
            data-remarks="${escapeHtml(r.remarks || '')}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger delete-payment-btn" data-id="${escapeHtml(r.paymentId || '')}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join("") : '<tr><td colspan="6" class="text-center text-muted py-3">No payments recorded for this month.</td></tr>';
  } catch (err) { showError(err); }
}

async function loadAdminExpenses() {
  const tbody = document.getElementById("adminExpensesBody");
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></td></tr>';
  try {
    const data = await Api.getExpenses("", "");
    tbody.innerHTML = data.rows.length ? data.rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td>${escapeHtml(r.category)}</td>
        <td>${escapeHtml(r.description)}</td>
        <td class="text-end">${formatCurrency(r.amount)}</td>
        <td><button class="btn btn-sm btn-outline-danger delete-expense-btn" data-id="${escapeHtml(r.expenseId)}"><i class="bi bi-trash"></i></button></td>
      </tr>
    `).join("") : '<tr><td colspan="5" class="text-center text-muted py-3">No expenses recorded yet.</td></tr>';
  } catch (err) { showError(err); }
}

async function loadAdminBank() {
  try {
    const data = await Api.getBankBalance();
    document.getElementById("adminBankSummary").textContent =
      `Current balance: ${formatCurrency(data.closingBalance)} (as of last update)`;
  } catch (err) { /* silent — summary line is non-critical */ }
}
