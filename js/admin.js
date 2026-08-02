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

/**
 * Read-only viewer session. This is the password shared with every resident so
 * they can view the dashboard, payment status, expenses and bank balance. It
 * carries no edit rights — writes always go through AdminAuth above.
 *
 * The server accepts the admin password wherever a viewer password is required,
 * so a signed-in admin never has to enter both.
 */
const ViewerAuth = (function () {
  function isLoggedIn() {
    return sessionStorage.getItem(CONFIG.VIEWER_SESSION_KEY) !== null;
  }

  function getPassword() {
    return sessionStorage.getItem(CONFIG.VIEWER_SESSION_KEY) || "";
  }

  function setPassword(password) {
    sessionStorage.setItem(CONFIG.VIEWER_SESSION_KEY, password);
  }

  function logout() {
    sessionStorage.removeItem(CONFIG.VIEWER_SESSION_KEY);
  }

  async function login(password) {
    const result = await Api.viewerLogin(password); // throws if invalid
    setPassword(password);
    // If they typed the admin password here, promote them so they aren't asked again.
    if (result && result.isAdmin) AdminAuth.setPassword(password);
    return result;
  }

  return { isLoggedIn, getPassword, setPassword, logout, login };
})();

/** True when the current session may read the association's data at all. */
function hasViewAccess() {
  return AdminAuth.isLoggedIn() || ViewerAuth.isLoggedIn();
}
