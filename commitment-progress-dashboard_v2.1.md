# Product Requirements Document (PRD)
## Commitment Progress Dashboard

<!-- [AI-ANNOTATION: DOCUMENT REVISION SUMMARY v2.1]
MAJOR REVISIONS APPLIED IN THIS VERSION:
1. All active commitments are reset to empty initially on the dashboard, while preserving all historical data and previous progress history in the database without deletion.
2. User clicks "Add my Commitment" button when submitting their initial commitment.
3. Removed Admin direct editing of user commitments (`commitment_revisions`). All text updates to commitments are done strictly by the User.
4. Removed `NEW_USER` flag and its special scenarios.
5. New Review Workflow: User inputs new commitment -> Status displays as "On Review" -> Admin reviews ("Accept" or "Reject") and leaves a mandatory general comment -> Dashboard displays status according to Admin review results -> Once accepted, standard progress tracking ("In Progress", "Achieved") unlocks.
6. Removed hardcoded review reason enum flags (`NOT_MEASURABLE`, `TOO_OPTIMISTIC`, `NEW_USER`). `review_reason` is now general text filled by the Admin reviewer and displayed in the user's notification banner/form area (NOT shown in dashboard tooltips).
7. [CORRECTION v2.1]: Removed "Not Started" status completely (strictly using "Accepted"). Commitment text field is strictly read-only when status is "On Review" or "Accepted". Review comments are not shown in dashboard hover tooltips.
-->

---

## 1. Application Title
**Commitment Progress Dashboard** (An independent application decoupled from the Digima 10th Event Hub).

---

## 2. Introduction & Purpose
### 2.1 Background
In a previous company activity, all Digimers wrote down their personal commitments related to the **HEART** values (Harmony, Excellence, Accelerate Growth, Reliable, Teamwork) on a physical "Commitment Tree". To ensure these commitments transform from wall displays into actionable goals, an internal information system is required to track, measure, and document their tangible impact on daily operations over a 6-month period.

### 2.2 Purpose
To unite all Digimers under a collaborative vision, emphasizing that company growth is the direct result of the collective knowledge and energy pumped by every individual through a transparent and accountable public dashboard.

---

## 3. Requirements (MoSCoW Method)

### 3.1 Must Have (MVP)
* **Secure Gateway via PIN:** A minimalist login page using the unique 4-digit PIN data mirrored from the Event Hub database.
* **Transparent Main Dashboard:** Once authenticated, all internal users can view a public list of names, commitments, latest statuses, and measurable impacts of all Digimers.
    * <!-- [AI-ANNOTATION: REVISION 1 - EMPTY INITIAL STATE WITH PRESERVED HISTORY] -->
    * **[UPDATED v2.0 - Empty Initial State & History Preservation]:** All active commitments for the new cycle will initially be reset to **empty** (displayed as blank/empty on the dashboard). However, **existing historical data and previous progress history in the database must not be deleted**; past logs and records are preserved intact for audit and historical reference.
* **Search & Filter Features:** Ability to search data using a *Search Bar* by Name and a *Dropdown Filter* strictly based on Status.
    * <!-- [AI-ANNOTATION: REVISION 5 & 7 - UPDATED STATUS FILTERS (ONLY ACCEPTED, NO NOT STARTED)] -->
    * **[UPDATED v2.1 - Status Filter Options]:** Dropdown options strictly include `On Review`, `Accepted`, `In Progress`, `Achieved`, and `Rejected`. (Removed `Not Started`).
* **Conditional Update Form:**
    * <!-- [AI-ANNOTATION: REVISION 2, 4, 5 & 7 - ADD COMMITMENT & READ-ONLY RULES WHEN ON REVIEW] -->
    * **[UPDATED v2.1 - Add Commitment & Read-Only Rules]:** 
        * Users starting without an active commitment click the **"Add my Commitment"** button to input and submit their 6-month commitment text.
        * *Read-Only Fields:* Name field is auto-filled and read-only. **When the status is `On Review` or `Accepted`, the Commitment text field is strictly read-only.** The Commitment text field is only editable when the commitment is initially empty (before first submission) OR when the status is `Rejected` (allowing the user to revise and resubmit).
    * *Status Radio Buttons / Progress Tracking:* Once a commitment has been **Accepted** by an Admin, the user can select status choices among `In Progress` and `Achieved`. (Removed `Not Started`).
    * *Conditional Logic:*
        * Selecting `In Progress` dynamically displays the **Obstacles/Challenges Faced** field (saved to DB, hidden from the public main dashboard).
        * Selecting `Achieved` dynamically displays the **Measurable Impact** field with a general guidance placeholder.
* **Audit Trail & Logging System:** Continuous logging of all progress history entries from users (changes to status, challenges, or impacts), initial commitment submissions, and Admin review decisions.
    * <!-- [AI-ANNOTATION: REVISION 1 & 3 - PRESERVED HISTORY & REMOVED ADMIN DIRECT EDITING] -->
    * **[UPDATED v2.0 - Audit & History Integrity]:** All historical records across cycles are preserved without overwriting or deletion. Admins no longer directly revise user commitment texts; the system instead logs Admin review actions (`Accept` or `Reject` along with the general review comment).
* **Review Status & Notifications:**
    * <!-- [AI-ANNOTATION: REVISION 5, 6 & 7 - GENERAL REVIEW COMMENTS & NO DASHBOARD TOOLTIPS] -->
    * **[UPDATED v2.1 - General Review Comments & No Dashboard Tooltips]:** 
        * Commitments currently `On Review` or `Rejected` will display an appropriate status badge/icon (`⏳ On Review` or `⚠️ Rejected`) on the dashboard.
        * **No Dashboard Tooltips:** When hovering over the status icon on the main dashboard, Admin review comments will **NOT** be shown in tooltips. 
        * Instead, whatever **general review comment (`review_comment` / `review_reason`)** the Admin filled in during the review process will be displayed directly inside the user's notification banner and update form area when they open their form workspace. The previous hardcoded enum reasons (`NOT_MEASURABLE`, `TOO_OPTIMISTIC`, `NEW_USER`) are completely removed.
* **Modul Admin (Superuser):**
    * <!-- [AI-ANNOTATION: REVISION 3 & 5 - ADMIN ACCEPT/REJECT REVIEW MODULE] -->
    * **[UPDATED v2.0 - Admin Review Module]:**
        * A dedicated Admin View equipped with an `"On Review"` filter to easily isolate newly submitted or resubmitted user commitments awaiting evaluation.
        * **Accept / Reject Actions:** Admins review each commitment and select either **"Accept"** or **"Reject"**.
        * **Mandatory Review Comment:** Admins must leave a general comment to the User explaining the decision (`review_comment`).
        * **Review Notification:** Displaying a banner on the specific user's form expressing the Admin's review result: *"Your commitment review result ([Accepted/Rejected]) by [Admin Name]: [Admin Comment]"*. (Admins no longer modify user text directly).

### 3.2 Should Have
* **Session Persistence:** Utilizing `localStorage` or React Context so users do not have to re-enter their PIN multiple times during an active browser session.
* **Export to Excel (Admin):** A button for Admins to download a full progress history report in `.xlsx` format for management review.

### 3.3 Could Have
* **Dashboard Summary Statistics:** A small pie chart or metric block at the top of the main dashboard showing the global percentage breakdown of statuses (`On Review`, `Accepted`, `In Progress`, `Achieved`, `Rejected`).

### 3.4 Won't Have
* **Filtering by Team Name:** The main dashboard will not display team names and will not provide filters for divisions/teams.
* **Real-Time Live Event Integration:** This application will not stream data or connect directly to the main stage screens of the Event Hub during the anniversary event day.

---

## 4. User Flow

### 4.1 Standard User Flow (Digimers)
1. **Access Link:** The user opens the application URL. The system redirects them to the **Secure Login** page.
2. **PIN Authentication:** The user enters their unique 4-digit PIN (distributed beforehand by the committee via *Internal Email, Physical Slips, or Line Managers* before the dashboard goes live).
3. **Main Dashboard Access:** Upon a valid PIN check, the user enters the Main Dashboard where they can browse all Digimers' commitments, status badges, and measurable impacts. Initially, active commitments appear empty until submitted. They can use the *Search Bar* or *Status Filter*.
4. <!-- [AI-ANNOTATION: REVISION 2, 3, 4, 5 & 7 - ADD COMMITMENT BUTTON & READ-ONLY WHEN ON REVIEW] -->
   **[UPDATED v2.1] Submit / Add Commitment:** 
   * The user clicks the **"Add my Commitment"** button (or *"Update My Commitment Progress"* if updating an already accepted commitment). The system auto-fills their Name.
   * If their active commitment is empty, the user inputs their new 6-month commitment text and submits.
   * **Read-Only When On Review:** Once submitted, the status becomes `On Review` and the Commitment text field becomes **read-only** while awaiting Admin evaluation.
   * *(Note: Special scenarios for Admin revisions and `NEW_USER` flags have been removed. All commitment text updates and inputs are performed directly by the User).*
5. **[NEW v2.1] Admin Review Status & Revisions:**
   * Upon submitting a new commitment, the status on the dashboard and user form becomes **`On Review`**.
   * **If Rejected:** The dashboard displays the `Rejected` status. When the user opens their form, they see the Admin's general review comment (`review_comment`). The Commitment text field unlocks so the user can edit their text and resubmit, returning the status to `On Review`.
   * **If Accepted:** The dashboard displays the status as **`Accepted`**, unlocking the standard progress tracking flow. (Removed `Not Started`).
6. **Conditional Form Input (Post-Acceptance Progress Tracking):**
   * Selects `In Progress` → Fills out *Obstacles/Challenges* → Saves.
   * Selects `Achieved` → Fills out *Measurable Impact* (guided by the general placeholder) → Saves.
7. <!-- [AI-ANNOTATION: REVISION 1 - PRESERVING HISTORY] -->
   **[UPDATED v2.0] History & Activity Logging:** The system inserts a new entry into the progress history table **without overwriting or deleting any past updates or historical cycle data**. The main dashboard updates immediately. The user can view their complete personal timeline of changes (status updates, added challenges, impacts, or review feedback) directly under their form workspace.

### 4.2 Superuser Flow (Admin)
1. **Admin Login:** The Admin authenticates using a dedicated Admin PIN.
2. <!-- [AI-ANNOTATION: REVISION 3 & 5 - REPLACED DIRECT EDITING WITH ACCEPT/REJECT REVIEW] -->
   **[UPDATED v2.0] Dashboard Review (`On Review` Filter):** The Admin toggles the `On Review` filter to isolate newly submitted or resubmitted user commitments awaiting evaluation.
3. **[UPDATED v2.0] Accept / Reject & Leave Comment:** The Admin evaluates the commitment text. Instead of editing the user's text directly, the Admin clicks **Accept** or **Reject** and inputs a **general review comment (`review_comment`)** explaining their evaluation to the user.
4. **[UPDATED v2.0] Audit Trail Entry:** The system automatically logs the review action (`Accept`/`Reject`), Admin name, timestamp, and the general review comment into the review history table.

---

## 5. Technology Stack
* **Frontend:** React.js + Vite (for high performance and fast build times), Tailwind CSS (for modern UI styling), Axios (for API communication).
* **Backend:** Node.js + Express.js (a RESTful API architecture decoupled from the Event Hub server).
* **Database:** PostgreSQL (utilizing a separate database instance from the Event Hub but cloning the `users` table structure initially).
* **Deployment:** Railway (independent deployment managing separate server and database instances).

---

## 6. Success Metrics & Release Criteria

### 6.1 Success Metrics
* **100% Adoption Rate:** Every registered Digimer successfully logs into the dashboard using their respective PIN within the first week of deployment.
* <!-- [AI-ANNOTATION: REVISION 1 - DATA INTEGRITY & HISTORY PRESERVATION] -->
* **[UPDATED v2.0] Data Integrity & History Preservation:** Zero loss, accidental overwriting, or deletion of historical progress entries and past commitment cycles when resetting active commitments or performing periodic updates.
* **[UPDATED v2.0] Review Completion:** All commitments marked as `On Review` or `Rejected` are successfully reviewed by Admins or resubmitted by users before the mid-term review (Month 3).

### 6.2 Release Criteria
* Conditional form fields operate with 100% functional accuracy across both desktop and mobile viewports (fully responsive).
* The Challenges/Obstacles input field remains completely hidden from the public-facing dashboard under any circumstance to ensure internal privacy.
* Search queries and status filter transitions resolve with an API latency below 200ms.

---

## 7. Timeline & Release Plan

* **Week 1: Data Preparation & Backend Architecture**
    * Initialize the new repositories (React & Node.js) on Railway.
    * Clone the identity data (`users` and `pins`) from the Event Hub database into this new instance.
    * <!-- [AI-ANNOTATION: REVISION 1 & 6 - EMPTY COMMITMENT INITIALIZATION] -->
    * **[UPDATED v2.0]:** Initialize active commitments for all users as **empty/blank** while ensuring historical data tables remain preserved. (Removed batch importing of initial spreadsheet commitments and hardcoded `review_reason` assignment).
    * Launch the PIN distribution protocol to employees via automated internal emails or physical desk slips.
* **Week 2: UI Development & Conditional Form Logic**
    * Complete UI slicing for the Secure Login gateway and the Main Dashboard table (incorporating Search, Status Filter for `On Review`/`Accepted`/`Rejected`/`In Progress`/`Achieved`, and status badge rendering without hover tooltips for comments).
    * <!-- [AI-ANNOTATION: REVISION 2, 4, 5 & 7 - UI FOR ADD COMMITMENT & READ-ONLY WHEN ON REVIEW] -->
    * **[UPDATED v2.1]:** Build the **"Add my Commitment"** button, new submission input flow, read-only locking during `On Review` states, and conditional rendering logic for progress updates (`In Progress`/`Achieved`). (Removed `Not Started` and `NEW_USER` unlock logic).
* **Week 3: Admin Module & Audit Trail Implementation**
    * <!-- [AI-ANNOTATION: REVISION 3, 5, & 6 - ADMIN ACCEPT/REJECT & COMMENT MODULE] -->
    * **[UPDATED v2.0]:** Develop the Admin **Accept / Reject** review module equipped with mandatory general comment inputs (`review_comment`) and hook it up to user notifications and review logs. (Removed inline Admin text editing).
    * Implement the admin dashboard's `On Review` filter view and personal activity timeline logs.
* **Week 4: Testing & Official Launch (Go-Live)**
    * Conduct end-to-end integration testing, focusing on the new submission/review workflow (`On Review` -> `Accept/Reject`), conditional progress updates, and PIN security gates.
    * Officially release the dashboard link to all Digimers prior to the main anniversary event schedule.