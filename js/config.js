/**
 * config.js
 * ---------------------------------------------------------
 * Central configuration for the Manibarathi Avenue RWA app.
 * Change API_URL after you deploy the Google Apps Script
 * Web App (see DEPLOYMENT_GUIDE.md, Step 2).
 * ---------------------------------------------------------
 */
const CONFIG = {
  // Paste your deployed Apps Script Web App URL here.
  // Example: "https://script.google.com/macros/s/AKfycb.../exec"
  API_URL: "https://script.google.com/macros/s/AKfycbxDHywpsj5X-cPW7M6LBF9WT4ghwg8GUaOPzE8c4YrME2swxiYEY2WPtuK4L1En28dP/exec",

  // Association constants
  ASSOCIATION_NAME: "Manibarathi Avenue Residents Welfare Association",
  MAINTENANCE_AMOUNT: 300, // ₹ per family per month
  TOTAL_FAMILIES: 75, // 15 families x 5 phases — keep in sync with FAMILIES_PER_PHASE in apps-script/Code.gs
  PHASES: ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5"],

  // Shown in the WhatsApp payment reminder message (Admin → Payments → Reminder)
  SITE_URL: "https://xygridsstudio-eng.github.io/mbarwa/",

  // Shown at the bottom of the Monthly Report — update names as the committee changes.
  COMMITTEE: [
    { role: "President", name: "ABC" },
    { role: "Secretary", name: "DEF" },
    { role: "Treasurer", name: "XYZ" }
  ],

  PROPERTY_CATEGORIES: ["House", "Open Plot"],
  PROPERTY_TYPES: ["Owner-Occupied", "Rented Out", "Vacant"],

  MONTHS: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],

  // How many years back/forward to offer in year dropdowns
  YEAR_RANGE_BACK: 2,
  YEAR_RANGE_FORWARD: 0,

  // Where the admin session flag lives in the browser
  ADMIN_SESSION_KEY: "mbrwa_admin_session",
  // Read-only viewer session (the password shared with all residents)
  VIEWER_SESSION_KEY: "mbrwa_viewer_session",

  // Currency formatting
  CURRENCY_LOCALE: "en-IN",
  CURRENCY_CODE: "INR"
};

// Small helper so every file can format ₹ amounts consistently
function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return "₹" + value.toLocaleString(CONFIG.CURRENCY_LOCALE, {
    maximumFractionDigits: 0
  });
}

function getCurrentMonthName() {
  return CONFIG.MONTHS[new Date().getMonth()];
}

function getCurrentYear() {
  return new Date().getFullYear();
}
