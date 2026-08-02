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
2. Now choose **setViewerPassword** from the same dropdown, edit its
   `NEW_PASSWORD` value, and click **Run**. This is the **read-only**
   password you share with all residents so they can view the dashboard
   and payment status. See "The two passwords" below for what each unlocks.
3. Click **Deploy → New deployment**.
4. Click the gear icon next to "Select type" and choose **Web app**.
5. Fill in:
   - Description: `MBRWA API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, then **Authorize access** again if prompted.
7. Copy the **Web app URL** shown — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
8. Keep this tab open; you'll need the URL in Step 3.

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

## Step 5 — Share the dashboard with residents

- Share the GitHub Pages URL **and the viewer password** in your residents'
  WhatsApp group. It works on any phone browser.
- Residents can **view only**: Home Dashboard, Phase Summary, Expenses,
  Bank Balance, and **their own** payment history. There are no edit
  controls visible unless someone signs in as Admin.
- On **Payment Status**, a resident enters their house number and the
  phone number on file to see every month of the chosen year for their
  household alone. They never see other households, and the sidebar
  search is hidden from them. Admins see the usual month-by-month table
  covering everyone.
- Consider pinning the link and password in the WhatsApp group description
  so they're always easy to find.

### The two passwords

| | Viewer password | Admin password |
|---|---|---|
| Set with | `setViewerPassword` | `setAdminPassword` |
| Share with | All residents | Committee members only |
| Can view dashboard, expenses, bank balance | Yes | Yes |
| Can view payment status | Own household only | All households |
| Can see the household list and phone numbers | **No** | Yes |
| Can generate/download reports | No | Yes |
| Can add, edit or delete anything | **No** | Yes |

The admin password works everywhere the viewer password does, so committee
members only ever need to remember one. Both are checked on the server, so
the data cannot be read by skipping the screen.

**What stays open without any password:** the **Register** and **My
Property** pages. New residents have no password yet, and My Property
already proves identity by matching house number + phone against the
Residents sheet.

To change either password later, edit and re-run the matching function in
the Apps Script editor — no redeployment needed.

## Step 6 — Admin configuration (committee members only)

1. On the live site, click **Admin** in the navigation bar.
2. Sign in with the password you set in Step 2 (`setAdminPassword`).
3. From the Admin panel you can:
   - **Payments tab** — record a new payment, edit, or delete one. The
     bank balance is recalculated live from every recorded payment, so it
     always reflects the current total automatically.
   - **Expenses tab** — add, edit, or delete an expense. The bank balance
     is recalculated live here too.
   - **Residents tab** — add a new resident or edit an existing one
   - **Bank Balance tab** — add a fresh balance entry when you reconcile
     with the actual bank statement (e.g. once a month); this becomes the
     new starting point that future payments/expenses are added to and
     subtracted from
4. Share the admin password only with trusted committee members. To
   change it later, re-run `setAdminPassword` in the Apps Script editor
   with a new value.

---

## Monthly workflow for the treasurer

1. As payments come in (cash/UPI/bank transfer), open **Admin → Payments**
   and record each one against the resident and month.
2. As bills are paid, open **Admin → Expenses** and log each expense
   under its category.
3. The bank balance is never manually maintained day-to-day — it's always
   computed live as: the opening balance from your last reconciliation,
   plus every payment recorded since, minus every expense recorded since.
   No separate update step is needed for step 1 or 2 to be reflected.
4. Periodically (e.g. once a month), reconcile against the actual bank
   statement: open **Admin → Bank Balance** and add a fresh entry with the
   real opening balance for that period (income/expense/closing balance can
   be left as your record of that reconciliation). This corrects for
   anything the app doesn't otherwise know about (bank interest, charges,
   manual corrections) and becomes the new starting point that future
   payments/expenses are computed from.
5. The Home Dashboard, Phase Summary, Bank Balance, and charts update
   automatically — no manual recalculation needed.

## "Register" — new resident self-sign-up form

New residents who aren't yet in the Residents sheet can add themselves via the
**Register** tab of the live site — no login required.

**How it works:**
1. A resident enters House Number, Owner Name, Phone Number, and Phase.
2. The server rejects the submission if that house number already has an
   Active or Pending entry (pointing them to **My Property** instead, so
   existing households can't be overwritten by a stranger).
3. Otherwise a new row is appended to the **Residents** sheet with status
   **Pending** — it does **not** count toward dues, dashboards, or Payment
   Status until a committee member reviews it.
4. In **Admin → Residents**, edit the new entry and change its status to
   **Active** to bring it into the maintenance cycle (or **Inactive** to
   reject it).

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
   never exposed on the dashboard or Payment Status page — not even to
   someone holding the viewer password. They are visible only to the
   resident themselves (via the phone match) or to a signed-in Admin.

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
- **"Passwords are not configured on the server yet"** — you skipped
  Step 2; run `setViewerPassword` (and `setAdminPassword`) once in the
  Apps Script editor.
- **Residents see "Password required" and the viewer password is
  rejected** — re-run `setViewerPassword` with the password you actually
  shared, and make sure you deployed a **new version** after updating
  `Code.gs`.
- **Changes in Google Sheets don't show up** — the dashboard reads data
  live on every page load/filter change, so a browser refresh is enough;
  no caching layer is used.
- **"Unknown action" errors after pulling code updates** — editing
  `apps-script/Code.gs` locally does not update the live backend. Paste the
  updated file into the Apps Script editor, then **Deploy → Manage
  deployments → pencil icon → New version** (see Step 2).
