/**
 * property.js
 * ---------------------------------------------------------
 * Public "My Property" view. No admin login is required —
 * a resident verifies their own record with House Number +
 * Phone Number (must match what's on file in the Residents
 * sheet), then can submit, edit, or delete their one-time
 * property details. The server re-verifies the same match on
 * every write, so this is safe even without a login system.
 * ---------------------------------------------------------
 */

const PropertyView = (function () {
  let current = null; // { residentId, houseNumber, phone, ...propertyFields }

  function init() {
    document.getElementById("propertyVerifyForm").addEventListener("submit", onVerify);
    document.getElementById("propertyDetailsForm").addEventListener("submit", onSave);
    document.getElementById("propertySearchAgain").addEventListener("click", reset);
    document.getElementById("propertyDeleteBtn").addEventListener("click", onDelete);
    populatePropertyTypeOptions();
  }

  function populatePropertyTypeOptions() {
    const sel = document.querySelector('#propertyDetailsForm select[name="propertyType"]');
    sel.innerHTML = '<option value="">Select...</option>' +
      CONFIG.PROPERTY_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("");
  }

  function reset() {
    current = null;
    document.getElementById("propertyVerifyForm").reset();
    document.getElementById("propertyDetailsForm").reset();
    document.getElementById("propertyStep1").classList.remove("d-none");
    document.getElementById("propertyStep2").classList.add("d-none");
  }

  async function onVerify(e) {
    e.preventDefault();
    const houseNumber = document.getElementById("propHouseNumber").value.trim();
    const phone = document.getElementById("propPhone").value.trim();
    const btn = document.getElementById("propertyVerifyBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Checking...';
    try {
      const record = await Api.verifyResident(houseNumber, phone);
      current = Object.assign({ phone }, record);
      showStep2(record);
    } catch (err) {
      showError(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = "Find My Record";
    }
  }

  function showStep2(record) {
    document.getElementById("propertyStep1").classList.add("d-none");
    document.getElementById("propertyStep2").classList.remove("d-none");

    document.getElementById("propResidentSummary").innerHTML =
      `<strong>${escapeHtml(record.ownerName)}</strong> — House ${escapeHtml(record.houseNumber)}, ${escapeHtml(record.phase)}`;

    const form = document.getElementById("propertyDetailsForm");
    form.propertyType.value = record.propertyType || "";
    form.familyMembers.value = record.familyMembers || "";
    form.vehicles.value = record.vehicles || "";
    form.email.value = record.email || "";
    form.emergencyContactName.value = record.emergencyContactName || "";
    form.emergencyContactPhone.value = record.emergencyContactPhone || "";
    form.notes.value = record.notes || "";

    const badge = document.getElementById("propertyStatusBadge");
    const deleteBtn = document.getElementById("propertyDeleteBtn");
    const saveBtn = document.getElementById("propertySaveBtn");
    if (record.propertyId) {
      badge.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i>Submitted (ID: ${escapeHtml(record.propertyId)})`;
      badge.className = "badge badge-paid mb-3";
      deleteBtn.classList.remove("d-none");
      saveBtn.textContent = "Update My Details";
      document.getElementById("propertyMeta").textContent =
        `Submitted ${record.propertySubmittedDate || "-"} · Last updated ${record.propertyUpdatedDate || "-"}`;
      document.getElementById("propertyMeta").classList.remove("d-none");
    } else {
      badge.innerHTML = '<i class="bi bi-exclamation-circle-fill me-1"></i>Not submitted yet';
      badge.className = "badge badge-pending mb-3";
      deleteBtn.classList.add("d-none");
      saveBtn.textContent = "Submit My Details";
      document.getElementById("propertyMeta").classList.add("d-none");
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!current) return;
    const form = e.target;
    const payload = {
      residentId: current.residentId,
      houseNumber: current.houseNumber,
      phone: current.phone,
      propertyType: form.propertyType.value,
      familyMembers: form.familyMembers.value,
      vehicles: form.vehicles.value,
      email: form.email.value,
      emergencyContactName: form.emergencyContactName.value,
      emergencyContactPhone: form.emergencyContactPhone.value,
      notes: form.notes.value
    };
    const btn = document.getElementById("propertySaveBtn");
    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
    try {
      await Api.saveMyPropertyDetails(payload);
      showToast("Your property details have been saved. Thank you!", "success");
      const refreshed = await Api.verifyResident(current.houseNumber, current.phone);
      current = Object.assign({ phone: current.phone }, refreshed);
      showStep2(refreshed);
    } catch (err) {
      showError(err);
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  }

  async function onDelete() {
    if (!current) return;
    if (!confirm("This will permanently delete your submitted property details (your resident record itself is kept). Continue?")) return;
    try {
      await Api.deleteMyPropertyDetails({
        residentId: current.residentId, houseNumber: current.houseNumber, phone: current.phone
      });
      showToast("Your property details have been deleted.", "success");
      const refreshed = await Api.verifyResident(current.houseNumber, current.phone);
      current = Object.assign({ phone: current.phone }, refreshed);
      showStep2(refreshed);
    } catch (err) {
      showError(err);
    }
  }

  return { init, reset };
})();

document.addEventListener("DOMContentLoaded", () => PropertyView.init());
