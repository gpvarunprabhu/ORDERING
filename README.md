# Campus Food Ordering System

Welcome to the **Campus Food Ordering System**, a centralized digital platform that streamlines food ordering within campus boundaries. The application connects students, canteen vendors, and campus administrators into a unified, single-page workflow.

## 🚀 Getting Started

No third-party packages or server configurations are required! The project features a built-in, dependency-free development server written in native Node.js.

### Steps to Run:
1. Open a terminal/command prompt.
2. Navigate to the project directory:
   ```bash
   cd "C:\Users\Admin\OneDrive\Desktop\ORDERING APP"
   ```
3. Start the local server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🏗️ Project Architecture

The application is structured as a premium, high-fidelity Single-Page Application (SPA) powered by standard web technologies:

* **`index.html`**: Core HTML5 grid layout containing modular portals for the three roles, modals, receipt views, and the digital token display board.
* **`index.css`**: Styling system utilizing a glassmorphic dark theme, layout grids, responsive design variables, and smooth transitions.
* **`database.js`**: Client-side relational database manager. Seeds initial data into `localStorage` (students, canteens, menus, and orders) and aggregates real-time metrics.
* **`app.js`**: Core UI router, cart operations manager, Kanban board controller, simulated QR verification logic, SVG analytics plotting, and CSV/Text ledger report downloader.
* **`server.js`**: Standard Node.js file server that handles routing and appropriate MIME types.

---

## ⚡ The "Golden Path" - End-to-End Walkthrough Guide

To verify the app operations, follow this complete checkout-to-handover cycle:

### 1. Unified Login
* Upon landing, select the **Student**, **Manager**, or **Admin** tab.
* Log in using these credentials:
  - **Student**: ID `STU001` and Email `arun.cse@campus.edu`
  - **Canteen Manager**: Select **Classic Food Court** and enter Security PIN `1234`
  - **Admin**: Email `admin@campus.edu` and Password `admin123`

### 2. Administrator Dashboard
* Log in as **Super Admin** using `admin@campus.edu` / `admin123`.
* Observe campus-wide metrics: Gross Merchandise Value (GMV), Total Orders, and User Adoption.
* Explore the **Canteen Management** page (e.g. register a new canteen) and **Student Directory** (e.g. view student details or toggle account blocks).
* Navigate to **Report Generator** ➔ click **Generate Report** ➔ click **Export Excel (.CSV)** or **Export PDF Ledger** to download real transaction records.

### 3. Inventory Modification
* Switch view by clicking the floating **⚙️ Role Bypass** at the bottom-right ➔ Select **Canteen Operator** (automatically logs into MR. RAMESH - Classic Food Court).
* Navigate to the **Menu & Inventory** tab.
* Toggle the stock status of **Veg Sandwich** to *Out of Stock* (or adjust prices).
* Go to the **Promotions** tab and launch a new coupon (e.g., "15% discount combo").

### 4. Student Remote Ordering
* Use **⚙️ Role Bypass** ➔ Select **Student Portal** (Arun Kumar).
* Notice the **Veg Sandwich** status immediately updates across the system.
* Add available items (e.g., South Indian Meals, Filter Coffee) to your **Smart Cart**.
* Click the **Cart** tab, select a pickup time (Immediate or class break time), select payment (UPI/Cash), and click **Place Digital Order**.
* You will be redirected to the **Track** tab, which displays a visual progress stepper and your unique **Token #111**.

### 5. Canteen Order Operations
* Use **⚙️ Role Bypass** ➔ Select **Canteen Operator**.
* On the **Live Orders** Kanban board, see the new order card in the **New Orders** column.
* Click **Accept Order** (moves card to *Preparing*).
* Once ready, click **Mark Ready** (moves card to *Ready for Collection*).
* *Note: Switch back to Student view to see the live stepper update to "Ready" and render a secure verification QR code.*

### 6. Verification and Collection Handover
* In the **Canteen Operator** view, navigate to **Handover (QR)**.
* Simulating the collection counter: either select the active order from the dropdown and click *Simulate QR Scan*, or type token number `111` and click *Verify Token*.
* The system validates the code, marks the order as *Completed*, displays a green "Access Verified - Release Food" confirmation badge, and moves the order to the *Completed Today* column.

### 7. Feedback and Ratings
* Return to the **Student Portal** ➔ Navigate to **History**.
* Click **Invoice** to view/print the digital receipt, and click **Leave Review** to submit a 5-star rating.
* Return to **Canteen Operator** ➔ **Store Analytics** or **Super Admin** ➔ **KPI Analytics** to verify that GMV, AOV, and rating scores have instantly updated to reflect the new sale.
