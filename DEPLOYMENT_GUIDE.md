# Deployment Guide — Manibarathi Avenue RWA Dashboard

This app is 100% free to run: Google Sheets is the database, Google Apps
Script is the backend API, and GitHub Pages hosts the frontend. No paid
services, no server to install.

Everything referenced below is in this delivery:

```
index.html
css/style.css
js/config.js, api.js, admin.js, admin-panel.js, app.js, charts.js, utils.js
apps-script/Code.gs
apps-script/SheetSetup.gs
```

---

## Step 1 — Create the Google Sheet (database)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new
   blank spreadsheet. Name it **"Manibarathi Avenue RWA Data"**.
2. Open **Extensions → Apps Script**. This opens the Apps Script editor
   bound to your spreadsheet.
3. Delete the default `Code.gs` content, and create two script files that
   match the names in this delivery:
   - `Code.gs` — paste the contents of `apps-script/Code.gs`
   - `SheetSetup.gs` — paste the contents of `apps-script/SheetSetup.gs`
     (use the **+** next to "Files" to add a new script file)
4. Save the project (name it "MBRWA Backend").
5. In the function dropdown at the top, choose **setupSheets**, then click
   **Run**. The first time you run it, Google will ask you to authorize
   the script — click **Review permissions**, choose your account, click
   **Advanced → Go to MBRWA Backend (unsafe)** (this warning is normal for
   your own scripts), then **Allow**.
6. This creates four sheets automatically:
   - **Residents** (with 3 sample rows — replace with your real 70 families)
   - **Payments** (empty, ready for entries)
   - **Expenses** (empty)
   - **BankBalance** (with one sample opening entry)
7. Fill in the **Residents** sheet with all ~70 households: House Number,
   Owner Name, Phone Number, Phase (Phase 1–5), and Status (Active/Inactive).
   Keep the `Resident ID` column values unique (e.g. `P1-01`, `P1-02`, `P2-01`…).

## Step 2 — Publish the Apps Script as a Web App (backend API)

1. Still in the Apps Script editor, open the function dropdown and choose
   **setAdminPassword**. First edit the `NEW_PASSWORD` value inside that
   function to your real admin password, then click **Run**. This stores
   the password securely in Script Properties (never in the sheet itself).
2. Click **Deploy → New deployment**.
3. Click the gear icon next to "Select type" and choose **Web app**.
4. Fill in:
   - Description: `MBRWA API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access** again if prompted.
6. Copy the **Web app URL** shown — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
7. Keep this tab open; you'll need the URL in Step 3.

   **Updating the script later:** whenever you edit `Code.gs`, go to
   **Deploy → Manage deployments**, click the pencil icon on your existing
   deployment, and choose **New version** so the live URL picks up your
   changes (editing the code alone does not update a published Web App).

## Step 3 — Connect the frontend to your Web App

1. Open `js/config.js` in this delivery.
2. Replace:
   ```js
   API_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",
   ```
   with the URL you copied in Step 2, e.g.:
   ```js
   API_URL: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec",
   ```
3. Save the file.

## Step 4 — Host the frontend on GitHub Pages

1. Create a new **public** GitHub repository, e.g. `mbrwa-dashboard`.
2. Upload the entire contents of this delivery (`index.html`, the `css/`
   folder, and the `js/` folder) to the repository root. You do **not**
   need to upload the `apps-script/` folder — that code lives in Google
   Apps Script, not on GitHub.
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Choose branch **main** (or `master`) and folder **/ (root)**, then **Save**.
6. Wait 1–2 minutes. GitHub will show your live URL, typically:
   `https://<your-username>.github.io/mbrwa-dashboard/`
7. Open that URL — you should see the dashboard load live data from your
   Google Sheet.

## Step 5 — Share the read-only dashboard with residents

- Share the GitHub Pages URL directly in your residents' WhatsApp group —
  no login is required for the public dashboard, payment status, and
  reports views. It works on any phone browser.
- Residents can **view only**: Home Dashboard, Phase Summary, Payment
  Status, Monthly Report, Expenses, and Bank Balance. There are no edit
  controls visible unless someone signs in as Admin.
- Consider pinning the link in the WhatsApp group description so it's
  always easy to find.

## Step 6 — Admin configuration (committee members only)

1. On the live site, click **Admin** in the navigation bar.
2. Sign in with the password you set in Step 2 (`setAdminPassword`).
3. From the Admin panel you can:
   - **Payments tab** — record a new payment, edit, or delete one
   - **Expenses tab** — add, edit, or delete an expense
   - **Residents tab** — add a new resident or edit an existing one
   - **Bank Balance tab** — add a new balance entry after reconciling
     with the actual bank statement each month
4. Share the admin password only with trusted committee members. To
   change it later, re-run `setAdminPassword` in the Apps Script editor
   with a new value.

---

## Monthly workflow for the treasurer

1. As payments come in (cash/UPI/bank transfer), open **Admin → Payments**
   and record each one against the resident and month.
2. As bills are paid, open **Admin → Expenses** and log each expense
   under its category.
3. After reconciling with the bank statement, open **Admin → Bank
   Balance** and add the month's opening balance, income, expenses, and
   closing balance.
4. The Home Dashboard, Phase Summary, and charts update automatically —
   no manual recalculation needed.

## "My Property" — one-time resident self-service form

Every resident can submit their own property details once, then come back
anytime to edit or delete it — no login required. This lives in the
**My Property** tab of the live site.

**How it works:**
1. A resident enters their **House Number** and the **Phone Number** already
   on file in the Residents sheet.
2. If it matches, they see a form: Property Type (Owner-Occupied / Rented
   Out / Vacant), Family Members, Vehicles, Email, Emergency Contact
   Name/Phone, and Notes.
3. Submitting generates a unique **Property ID** automatically (e.g.
   `PROP-A1B2C3D4`) and saves everything into new columns on the same
   **Residents** sheet — no second sheet to manage.
4. They can return anytime with the same house number + phone to **edit**
   or **delete** their entry. Deleting only clears the property columns;
   their core resident row (house number, owner, phone, phase, status)
   is never removed.
5. The server re-checks the house number + phone match on every save or
   delete, even though there's no login — so one resident can't edit
   another's entry just by guessing a link.
6. **Privacy note:** these details (email, emergency contact, etc.) are
   never exposed on the public dashboard or Payment Status page — only
   to the resident themselves (via the phone match) or to a signed-in
   Admin.

**If your Residents sheet already existed before this feature:** open the
Apps Script editor, select **addPropertyColumns** from the function
dropdown, and click **Run** once. This safely appends the 10 new columns
to the end of your existing sheet without touching any data you already
have. (A brand-new sheet from `setupSheets()` already includes them.)

**Admin can help too:** in **Admin → Residents**, click the house icon
next to any resident to view, edit, or delete their property details on
their behalf — handy for residents who aren't comfortable filling the
form themselves.

---

## Troubleshooting

- **"API_URL is not configured yet"** — you skipped Step 3; paste your
  Web App URL into `js/config.js`.
- **Dashboard shows a network/server error** — re-check that the Apps
  Script deployment's "Who has access" is set to **Anyone**, and that you
  deployed a **new version** after any code changes.
- **Admin login says "Incorrect admin password"** — re-run
  `setAdminPassword` in the Apps Script editor with the password you're
  typing on the site.
- **Changes in Google Sheets don't show up** — the dashboard reads data
  live on every page load/filter change, so a browser refresh is enough;
  no caching layer is used.
