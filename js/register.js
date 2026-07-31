/**
 * register.js
 * ---------------------------------------------------------
 * Public "Register" view. No admin login is required — a new
 * resident submits House Number, Owner Name, Phone Number, and
 * Phase. The server rejects duplicates against any existing
 * Active/Pending house number, and saves the new row with
 * status "Pending" so a committee member must review and
 * activate it (via Admin → Residents) before it counts toward
 * dues or appears in Payment Status.
 * ---------------------------------------------------------
 */

const RegisterView = (function () {
  function init() {
    document.getElementById("registerForm").addEventListener("submit", onSubmit);
    document.getElementById("registerAnotherBtn").addEventListener("click", reset);
  }

  function reset() {
    document.getElementById("registerForm").reset();
    document.getElementById("registerFormWrap").classList.remove("d-none");
    document.getElementById("registerSuccess").classList.add("d-none");
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      houseNumber: form.houseNumber.value.trim(),
      ownerName: form.ownerName.value.trim(),
      phoneNumber: form.phoneNumber.value.trim(),
      phase: form.phase.value
    };
    const btn = document.getElementById("registerSubmitBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';
    try {
      await Api.registerResident(payload);
      document.getElementById("registerFormWrap").classList.add("d-none");
      document.getElementById("registerSuccess").classList.remove("d-none");
    } catch (err) {
      showError(err);
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit Registration";
    }
  }

  return { init, reset };
})();

document.addEventListener("DOMContentLoaded", () => RegisterView.init());
