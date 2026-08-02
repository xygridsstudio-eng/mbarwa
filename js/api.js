/**
 * api.js
 * ---------------------------------------------------------
 * All communication with the Google Apps Script backend goes
 * through this file. Every call is a plain GET request with
 * query-string parameters. This is deliberate: Apps Script
 * Web Apps do not implement CORS preflight (OPTIONS) handling,
 * so POST requests with JSON bodies fail from a different
 * origin (GitHub Pages). Plain GET / form-encoded POST requests
 * are treated as "simple requests" by the browser and do not
 * trigger a preflight, so they work reliably.
 * ---------------------------------------------------------
 */

const Api = (function () {
  /**
   * Builds a full request URL from an action name and a params object.
   */
  function buildUrl(action, params) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set("action", action);
    Object.keys(params || {}).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, params[key]);
      }
    });
    return url.toString();
  }

  /**
   * Low-level request helper. Every backend response is expected to be
   * JSON in the shape { success: true/false, data: ..., message: "" }
   */
  async function request(action, params) {
    if (!CONFIG.API_URL || CONFIG.API_URL.indexOf("PASTE_YOUR") === 0) {
      throw new Error(
        "API_URL is not configured yet. Open js/config.js and paste your Apps Script Web App URL."
      );
    }
    const url = buildUrl(action, params);
    let response;
    try {
      response = await fetch(url, { method: "GET", redirect: "follow" });
    } catch (networkErr) {
      throw new Error("Network error while contacting the server. Please check your connection.");
    }
    if (!response.ok) {
      throw new Error("Server returned an error (HTTP " + response.status + ").");
    }
    let json;
    try {
      json = await response.json();
    } catch (parseErr) {
      throw new Error("Server response could not be read. Please try again.");
    }
    if (!json.success) {
      throw new Error(json.message || "Request failed.");
    }
    return json.data;
  }

  // ---------- Read-only endpoints — require the viewer OR admin password ----------
  // Send whichever credential this session holds; the server accepts either.
  function withView(params) {
    const pwd = AdminAuth.isLoggedIn() ? AdminAuth.getPassword() : ViewerAuth.getPassword();
    return Object.assign({}, params, { viewerPassword: pwd });
  }

  const getResidents = () => request("getResidents", withView({}));
  const getPayments = (month, year) => request("getPayments", withView({ month, year }));
  const getExpenses = (month, year) => request("getExpenses", withView({ month, year }));
  const getDashboard = (month, year) => request("getDashboard", withView({ month, year }));
  const getBankBalance = () => request("getBankBalance", withView({}));

  // ---------- Admin (write) endpoints — require adminPassword ----------
  function withAuth(params) {
    const pwd = AdminAuth.getPassword();
    return Object.assign({}, params, { adminPassword: pwd });
  }

  const login = (password) => request("login", { adminPassword: password });
  const viewerLogin = (password) => request("viewerLogin", { viewerPassword: password });

  const addPayment = (payment) => request("addPayment", withAuth(payment));
  const updatePayment = (payment) => request("updatePayment", withAuth(payment));
  const deletePayment = (paymentId) => request("deletePayment", withAuth({ paymentId }));

  const addExpense = (expense) => request("addExpense", withAuth(expense));
  const updateExpense = (expense) => request("updateExpense", withAuth(expense));
  const deleteExpense = (expenseId) => request("deleteExpense", withAuth({ expenseId }));

  const addResident = (resident) => request("addResident", withAuth(resident));
  const updateResident = (resident) => request("updateResident", withAuth(resident));
  const deleteResident = (residentId) => request("deleteResident", withAuth({ residentId }));

  const updateBankBalance = (entry) => request("updateBankBalance", withAuth(entry));

  // ---------- Public resident self-registration (no login) ----------
  const registerResident = (payload) => request("registerResident", payload);

  // ---------- Public "My Property" self-service (phone-verified, no login) ----------
  const verifyResident = (houseNumber, phone) => request("verifyResident", { houseNumber, phone });
  const saveMyPropertyDetails = (payload) => request("saveMyPropertyDetails", payload);
  const deleteMyPropertyDetails = (payload) => request("deleteMyPropertyDetails", payload);

  // ---------- Admin: manage a resident's property details on their behalf ----------
  const getResidentProperty = (residentId) => request("getResidentProperty", withAuth({ residentId }));
  const updateResidentProperty = (payload) => request("updateResidentProperty", withAuth(payload));
  const deleteResidentProperty = (residentId) => request("deleteResidentProperty", withAuth({ residentId }));

  return {
    getResidents, getPayments, getExpenses, getDashboard, getBankBalance,
    login, viewerLogin, addPayment, updatePayment, deletePayment,
    addExpense, updateExpense, deleteExpense,
    addResident, updateResident, deleteResident, updateBankBalance,
    registerResident,
    verifyResident, saveMyPropertyDetails, deleteMyPropertyDetails,
    getResidentProperty, updateResidentProperty, deleteResidentProperty
  };
})();
