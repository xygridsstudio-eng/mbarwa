/**
 * admin.js
 * ---------------------------------------------------------
 * Handles the simple admin login flow described in the brief.
 * The admin password is verified by the backend (login action).
 * On success we keep the password in sessionStorage only for
 * the current browser tab session, and attach it to every
 * write request. This is intentionally simple, matching a
 * volunteer-run residents' association's needs — it is not
 * meant to be bank-grade security.
 * ---------------------------------------------------------
 */

const AdminAuth = (function () {
  function isLoggedIn() {
    return sessionStorage.getItem(CONFIG.ADMIN_SESSION_KEY) !== null;
  }

  function getPassword() {
    return sessionStorage.getItem(CONFIG.ADMIN_SESSION_KEY) || "";
  }

  function setPassword(password) {
    sessionStorage.setItem(CONFIG.ADMIN_SESSION_KEY, password);
  }

  function logout() {
    sessionStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
  }

  async function login(password) {
    await Api.login(password); // throws if invalid
    setPassword(password);
  }

  return { isLoggedIn, getPassword, setPassword, logout, login };
})();
