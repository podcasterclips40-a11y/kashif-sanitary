# Kashif Sanitary Supplies 🚿

> **Tagline:** Quality Products. Reliable Supply.  
> **اردو:** کاشف سینیٹری سپلائیز — اعلیٰ معیار کی مصنوعات، قابل اعتماد سپلائی

A modern, mobile-friendly, dual-language (English & Urdu with native Right-to-Left RTL support) website and wholesale management system built for **Kashif Sanitary Supplies**.

---

## 🌟 Key Features

### 🛒 Customer Facing Website
- **Mobile-First & Responsive:** Clean, modern interface designed specifically for phones, tablets, and desktop computers.
- **Dual-Language & True RTL Support:** Instant switching between English (LTR) and Urdu (RTL with Noto Nastaliq Urdu typography).
- **Dynamic Catalog:** Browse editable categories (Pipes & Fittings, Faucets & Taps, Bathroom Accessories, Sanitary Ware, Valves & Connections).
- **Variant & Size Selection:** Clear size and variant selectors (e.g. `1/2 inch (20mm)`, `3/4 inch`, `1 inch`, `4 inch (110mm)`, etc.).
- **Pricing & Request Price:** Displays transparent prices or "Request Price" badges for items with fluctuating wholesale rates.
- **Easy Order Placement:** Cart / Order Drawer with complete customer fields:
  - Customer Full Name
  - Shop Name or Shop Number
  - Phone / WhatsApp Number
  - City / Area
  - Full Delivery Address
  - Special Delivery / Cargo Instructions
- **Unique Order Confirmation:** Generates unique order numbers (`KSS-YYYYMMDD-XXXX`) and provides a 1-tap **Send on WhatsApp** button pre-filled with the order breakdown, plus direct click-to-call dialing.
- **Floating Contact Hub:** Permanent floating WhatsApp and Phone buttons for direct customer communication.

---

### 🔒 Secure Admin Authentication
- **Protected Admin Panel:** Accessible at the Admin Portal tab.
- **Modern Password Hashing:** Uses **bcrypt** with salt rounds for secure password storage.
- **No Hardcoded Passwords or Public Registration:** New admin accounts can only be created via the secure CLI setup script.
- **Secure Sessions:** Signed JSON Web Tokens (JWT) verified on every private backend API route.
- **Admin Password Reset:** Documented CLI tool for the owner (`npm run reset-password`) and in-dashboard password manager.

---

### 📦 Admin Orders & Delivery Management
- **Search & Filter:** Search orders by order number, customer name, shop name, or phone number.
- **Filter by Status & Date:** Statuses include `New`, `Confirmed`, `Contacted`, `Preparing`, `Completed`, and `Cancelled`.
- **New Order Arrival Notifications:** Real-time polling with an audible browser chime and visual flashing badge when a new order arrives.
- **Printable Delivery Slip / Challan:** Open any customer's order and print a clean packing challan for the delivery driver or warehouse packer with one click (`window.print()`).
- **Thermal Printer Receipts (58 mm & 80 mm POS):** Print compact, ink-free thermal receipts formatted specifically for standard 58 mm and 80 mm point-of-sale thermal printers. Supports English and Urdu (RTL) with paper-width toggles and reprint options.

---

### 🧾 Thermal POS Receipt Printing (58 mm & 80 mm)
- **Dedicated POS Layout:** Pure high-contrast black-on-white formatting without graphics, shadows, or ink-wasting colors.
- **58 mm & 80 mm Width Switcher:** One-click toggle in the preview dialog that configures the layout and CSS `@page` dimensions for standard POS roll sizes.
  - **58 mm (32 columns):** Compact two-line per-item structure (`[Item Description]` on line 1, `[Qty x Rate = Total]` on line 2) to eliminate text truncation or clipping.
  - **80 mm (48 columns):** Wide tabular layout with item, size/variant, quantity, unit rate, and line total.
- **Urdu & English Dual Support:** Urdu receipts automatically render with right-to-left (`dir="rtl"`) layout and clean Urdu typography.
- **Reprint Counter & Controls:** Print immediately or reprint the receipt as many times as needed.
- **Preserved Existing Workflow:** The full-size Delivery Challan remains untouched; thermal receipts are added as a fast additional option accessible from each order's invoice/slip, order detail view, and order table.

---

### 📊 Product-Wise Purchasing Summary (Wholesale Procurement)
A dedicated aggregate procurement view built specifically for wholesale bulk purchasing:
- **Combines quantities from selected active customer orders** into one aggregated total for each product and exact variant/color.
  - *Example:* If **Shop 1** orders 2 Chrome Faucets and 1 Black Faucet, and **Shop 2** orders 3 Black Faucets, the Purchasing Summary totals them separately:
    - `Luxury Basin Faucet (Variant: Chrome Finish • Color: Chrome): 2 Pieces`
    - `Luxury Basin Faucet (Variant: Matte Black • Color: Matte Black): 4 Pieces`
- **Dynamic Recalculation:** Select or deselect individual orders or filter by order status (`New`, `Confirmed`, `Preparing`). Cancelled orders are excluded automatically.
- **Different Colors & Variants Kept Separate:** Guaranteed separate totals for variants with different colors or sizes.
- **Client Breakdown:** Expand any product to see exactly which shops and customer orders contributed to the total.
- **Printable Procurement Sheet:** One-click print for taking to factory suppliers or warehouse shelves.
- **Dynamic Product Compatibility:** Seamlessly works with all newly created categories, subcategories, products, and color variants without code changes.

---

### 🗂️ Nested Product Categories & Subcategories
- **Multi-Level Hierarchy:** Organize the catalog into main categories and subcategories with arbitrary depth (e.g., `Sanitary Ware → Wash Basins → Wall Hung` or `Sanitary Ware → Wash Basins → Counter Top`).
- **Admin Management:** Create, rename, reorder (display order), and delete categories and subcategories directly in the Admin Portal under the **Categories** tab.
- **Safe Category Deletion & Reassignment:** When deleting a category that contains products or child subcategories, the admin is prompted to:
  1. **Reassign:** Move all products and child subcategories safely to another chosen category.
  2. **Detach:** Keep products as uncategorized and promote child subcategories to top-level.
  - *Products are never silently or accidentally erased from the database!*
- **Customer Navigation & Breadcrumbs:**
  - Primary category pill bar displays main top-level categories.
  - Selecting a category reveals an interactive subcategory drill-down bar for quick filtering.
  - Clickable breadcrumbs (`Home → Sanitary Ware → Wash Basins → Wall Hung`) enable one-tap navigation back up the tree.
  - Selecting a parent category automatically includes all products under its descendant subcategories.

---

### 🎨 Product Variants, Colors & Options
- **Multi-Variant Products Without Duplication:** A single product can hold multiple sizes, colors, models, or materials without creating clutter or duplicate product listings.
- **Rich Variant Properties:**
  - **Color & Swatch:** Color name (e.g., `Chrome`, `Matte Black`, `Gold`, `White`) and visual color code/hex (e.g., `#C0C0C0`, `#1A1A1A`) rendered as interactive visual color swatches.
  - **Size / Model:** Size specifications (e.g., `1/2 inch (20mm)`, `3/4 inch`, `Wall Hung`, `Tall Body`).
  - **SKU / Code:** Unique barcode or model code per variant (e.g., `FAU-CHR-01`, `FAU-BLK-01`).
  - **Price & Request Price:** Individual price override per variant or inheritance of the product base price, plus individual "Price on Request" toggles.
  - **Stock Tracking:** Optional stock tracking per variant with live remaining stock counts.
  - **Variant Images:** Individual image URLs for different color variants, dynamically swapping the main product preview when a customer picks that color.
- **Customer Order Integration:** The selected color and variant are saved with each customer order line item and displayed across invoices, delivery challans, 58mm/80mm thermal POS receipts, and the Purchasing Summary.

---

### ✏️ Editable Website (Persistent in Turso DB)
- Edit business name, tagline, phone number, WhatsApp number, email, physical warehouse address, and homepage hero texts in both English and Urdu.
- Add, edit, and delete products, categories, images, prices, variants, and stock availability.
- All changes are stored persistently in the database and reflect immediately on the customer store.

---

## 🏗️ Architecture & Tech Stack

```mermaid
flowchart LR
    Customer["📱 Customer / Admin Browser"]
    Netlify["⚡ Netlify (Frontend React + Vite + Tailwind)"]
    Render["🚀 Render (Backend Node.js + Express API)"]
    Turso[("🗄️ Turso LibSQL Database\n(Data + Image Binary BLOBs)")]

    Customer -->|Visits / Orders / Image Uploads| Netlify
    Netlify -->|API Requests / Multipart Uploads| Render
    Render -->|LibSQL Protocol / BLOB Streams| Turso
```

| Component | Technology | Hosting Platform |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | **Netlify** |
| **Backend API** | Node.js, Express, bcryptjs, jsonwebtoken, CORS | **Render** |
| **Database** | Turso LibSQL (SQLite at the edge) | **Turso (app.turso.tech)** |

---

## 🚀 Setup & Deployment Guide

### 1. Database Setup: Turso (`app.turso.tech`)

1. Go to [app.turso.tech](https://app.turso.tech) and log in or create an account.
2. Create a new database:
   - Click **Create Database**.
   - Name your database: `kashif-sanitary-db`.
   - Choose a region close to your primary audience (e.g. Singapore `sin`, Frankfurt `fra`, or London `lhr`).
3. Obtain your Database URL and Auth Token:
   - Under database overview, copy the **Database URL** (starts with `libsql://...`).
   - Click **Generate Token** and copy the **Auth Token**.
4. Keep these two values ready for Render:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

---

### 2. Backend Deployment: Render (`render.com`)

1. Push this project repository to GitHub or GitLab.
2. Go to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name:** `kashif-sanitary-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Plan:** Free or Starter
6. Add the **Environment Variables** in Render:
   | Key | Value / Description |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (or leave default assigned by Render) |
   | `TURSO_DATABASE_URL` | Your Turso URL (`libsql://kashif-sanitary-db-username.turso.io`) |
   | `TURSO_AUTH_TOKEN` | Your Turso Auth Token |
   | `JWT_SECRET` | A strong random 32+ character string (e.g. generated via `openssl rand -hex 32`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | Your Netlify URL (e.g. `https://kashif-sanitary.netlify.app`) |
7. Click **Deploy Web Service**.
8. Once deployed, Render will provide a live URL (e.g. `https://kashif-sanitary-backend.onrender.com`).
   - Check `https://kashif-sanitary-backend.onrender.com/api/health` to confirm the database is connected.

---

### 3. Frontend Deployment: Netlify (`netlify.com`)

1. Go to [app.netlify.com](https://app.netlify.com).
2. Click **Add new site** > **Import an existing project**.
3. Select your GitHub repository.
4. Set the site build configuration:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Under **Environment variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | Your live Render backend URL (e.g. `https://kashif-sanitary-backend.onrender.com`) |
6. Click **Deploy Site**.
7. Netlify will build your site and give you a public URL (e.g. `https://kashif-sanitary.netlify.app`).
8. Copy your Netlify URL and update the `CORS_ORIGIN` variable in your Render backend settings so CORS allows requests.

---

### 4. Creating the First Admin Account (Secure Setup Process)

To ensure maximum security, admin accounts cannot be registered publicly via a form. Run the CLI tool:

#### Option A: Running locally with remote Turso credentials
In your terminal, navigate to the `backend/` directory:
```bash
cd backend
```
Ensure your `backend/.env` has your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
Run the interactive admin creation command:
```bash
npm run create-admin
```
Or run with non-interactive flags:
```bash
node scripts/create-admin.js --username kashif_owner --email owner@kashifsanitary.com --password YourStrongPassword123!
```

#### Option B: Running on Render Shell
In the Render dashboard for your web service, open the **Shell** tab and run:
```bash
node scripts/create-admin.js --username kashif_owner --email owner@kashifsanitary.com --password YourStrongPassword123!
```

---

### 5. Owner Password Reset Procedure

If the owner forgets their password, they can reset it using the owner recovery tool:

```bash
node scripts/reset-password.js --user kashif_owner --password NewSecurePassword456!
```
Or interactively:
```bash
npm run reset-password
```
*(Enter the username or email, then type the new password. The script hashes the password with bcrypt and updates the database immediately.)*

Additionally, logged-in admins can update their password anytime inside the Admin Portal under the **Account & Security** tab.

---

## 🧾 Thermal Printer Receipts Guide (58 mm & 80 mm POS)

The website includes a dedicated thermal receipt engine designed for standard 58 mm and 80 mm point-of-sale (POS) thermal receipt printers commonly used in wholesale shops, warehouses, and delivery counters.

### 🖨️ How to Print a Thermal Receipt

1. Log in to the **Admin Portal** (`/admin`).
2. Go to the **Orders Management** tab.
3. You can open a thermal receipt in any of these three convenient locations:
   - Click the **Receipt icon** (`🧾`) on any order row in the orders table.
   - Or open **View Details** (`👁️`) on an order and click **"Print Thermal Receipt"**.
   - Or open the regular **Delivery Slip** (`🖨️`) and click the **"Print Thermal Receipt"** button at the top.
4. In the preview window:
   - **Choose Paper Width:** Select **`58 mm`** or **`80 mm`**.
   - **Choose Language:** Select **`English`** or **`اردو`**.
   - Click **"Print Thermal Receipt"** (or **"Reprint"** to print again).
5. The native browser print dialog will appear.

---

### ⚙️ Browser Print Dialog Settings (Crucial for Thermal Printers)

To get perfect, crisp receipts without blank margins or cutoffs:

| Setting | Recommended Value | Why |
| :--- | :--- | :--- |
| **Destination / Printer** | Select your thermal printer *(e.g. XP-58, POS-80, Epson TM-T20, Xprinter, etc.)* | Sends output to the receipt printer instead of regular office printer |
| **Paper Size** | **58 mm / 80 mm / Roll Paper** *(defined by your printer driver)* | Matches the physical roll width installed in your printer |
| **Margins** | **None** *(or Minimum)* | Prevents the browser from adding default 0.5-inch page margins |
| **Headers and footers** | **Unchecked (Off)** | Prevents the browser from printing URLs, page numbers, or timestamps at the top/bottom |
| **Scale** | **Default (100%)** | Keeps fonts sharp and correctly scaled |

---

### 📱 Printing from Phones & Tablets (Android / iOS)

Standard browser printing via the system print dialog is the reliable, universal default. Here is how mobile printing works:

#### Android Phones & Tablets:
- **Wi-Fi / Network Thermal Printers:** When connected to the same Wi-Fi router, Android automatically detects network thermal printers supporting Mopria or IPP via Chrome's print dialog.
- **Bluetooth / USB Pocket Thermal Printers:** Standard Android browsers cannot send raw ESC/POS commands over Bluetooth directly without an Android print service. To print from Chrome to a Bluetooth POS printer:
  1. Install a print service app such as **RawBT Print Service** or your printer manufacturer's official Android driver app from the Google Play Store.
  2. Pair your printer in the app. The app registers a virtual print service in Android's system print spooler.
  3. When you tap "Print Thermal Receipt" in Chrome, choose the Bluetooth printer from Android's printer list and tap Print!

#### iPhones & iPads:
- **AirPrint-Enabled Thermal Printers:** Selected directly in Safari's native print dialog without additional software.
- **Non-AirPrint POS Printers:** Require a network AirPrint print server (such as CUPS/AirPrint on a local PC) or a specialized receipt utility.

> [!NOTE]
> Web Bluetooth and WebUSB browser APIs require unencrypted experimental flags and vary widely across printer firmware chipsets. Using the operating system print spooler (Windows/Mac printer driver or Android print service) ensures 100% compatibility with any thermal printer model.

---

## 🗂️ Managing Nested Categories, Subcategories & Product Variants

### 1. Creating Nested Categories & Subcategories
1. Log in to the **Admin Portal** (`/admin`).
2. Navigate to the **Categories** tab.
3. Click **"Add Category"** (or click the **`+`** icon on any existing category row to create a child under it).
4. In the category modal:
   - **Parent Category:**
     - Select **`-- Top-Level / Main Category (No Parent) --`** to create a root category (e.g. `Sanitary Ware`).
     - Or choose an existing category as the parent to create a subcategory (e.g. choose `Sanitary Ware` to create `Wash Basins`).
     - Or choose a subcategory as parent to create a 2nd-level subcategory (e.g. choose `Wash Basins` to create `Wall Hung`).
   - Enter **Category Name (English)** and **Category Name (Urdu)**.
   - Enter a clean URL slug (e.g. `wall-hung`) and display order number.
5. Click **"Save Category"**. The category immediately appears in the hierarchical tree table with its level badge (`L2 Sub`, `L3 Sub`).

### 2. Safely Deleting Categories Without Losing Products
1. In the **Categories** tab, click the **Trash icon** (`🗑️`) next to any category.
2. If the category contains products or subcategories, the **Safe Deletion Modal** will open displaying the exact product count and child subcategory count.
3. Choose one of two safe handling actions:
   - **Reassign products & subcategories (Recommended):** Select another target category from the dropdown. All products and subcategories will be moved cleanly.
   - **Detach items:** Detach products so they remain in the catalog as Uncategorized, while child subcategories are promoted to top-level categories.
4. Click **"Confirm & Delete Category"**. Products are never silently deleted.

### 3. Adding Products with Multiple Colors, Sizes & Variants
1. Navigate to the **Products Catalog** tab and click **"Add New Product"**.
2. Enter the product names in English and Urdu, select its category/subcategory from the nested hierarchy, and specify unit and base price.
3. In the **Product Variants, Colors & Sizes** section, click **"Add Variant / Color"**:
   - **Variant / Option Name:** e.g. `Chrome Finish` or `Matte Black`.
   - **Color Name:** e.g. `Chrome`, `Matte Black`, `Gold`, `White`.
   - **Color Code / Hex:** Pick or type a hex color (e.g. `#C0C0C0`, `#1A1A1A`) to show as an interactive color swatch on the store.
   - **Size / Model:** e.g. `Standard`, `1/2 inch`, `Wall Hung`.
   - **Variant SKU:** e.g. `BM-CHR-01`, `BM-BLK-01`.
   - **Price (PKR):** Set an individual price for this variant (or leave it to inherit base product price).
   - **Stock Quantity & Tracking:** Enable **Track Stock Quantity** to manage real inventory levels.
   - **Variant Image URL:** (Optional) Add a dedicated image for this specific color variant.
4. Click **"Save Product"**.

### 4. Customer Experience & Purchasing Summary Verification
1. On the customer website:
   - Customers see the main top-level category pills.
   - Selecting a category reveals the secondary subcategory pills and clickable breadcrumb navigation.
   - On the product card, customers can click interactive color swatches or the variant dropdown. The photo, price, and SKU update dynamically.
   - When added to the order, the exact color and variant are displayed in the cart drawer.
2. In the Admin **Purchasing Summary**:
   - Every product variant and color is automatically grouped and totaled separately (e.g., `Luxury Basin Faucet (Chrome)` and `Luxury Basin Faucet (Matte Black)` have separate aggregated quantities).
   - Expanding the row reveals the individual shops and customer orders that requested that exact variant.

---

## 📸 Product & Category Image Upload Guide (Turso Database BLOB Storage)

Product, variant, and category cover images are stored **directly inside your existing Turso LibSQL Database as binary BLOBs** (`uploaded_images` table). **No third-party image hosting (no Cloudinary, AWS S3, or Imgur) is needed**, keeping your hosting completely free, zero-maintenance, and consolidated within your existing Turso database account.

### 🗄️ Turso BLOB Storage Architecture & Performance

```
Admin Phone/PC ➔ Client-Side Resizing (Max 1200px @ 82% quality, ~60–250 KB)
              ➔ POST /api/admin/upload (Multer in-memory buffer)
              ➔ Stored as BLOB in Turso LibSQL (`uploaded_images` table)
              ➔ Served via GET /api/public/images/:uuid
              ➔ HTTP 304 Caching + 1-Year Browser Cache (`immutable`, `ETag`)
```

- **Table Schema (`uploaded_images`):**
  - `id`: Auto-incrementing primary key.
  - `uuid`: Secure generated identifier (e.g. `img_p_1794614982792_eeo3nu`), completely masking original filenames.
  - `entity_type`: `product`, `category`, or `variant`.
  - `entity_id`: Related product or category ID if associated.
  - `filename`: Sanitized original filename.
  - `mimetype`: `image/jpeg`, `image/png`, `image/webp`.
  - `size`: Exact byte size of the image payload.
  - `data`: Binary `BLOB` column containing the image raw bytes.
  - `created_at`: Upload timestamp.
- **Maximum File Limit & Automatic Compression:**
  - Hard server limit: **2.5 MB** per image.
  - Client-side auto-optimization: When you select a photo on your phone (which might be 5 MB to 15 MB from a modern mobile camera), the browser automatically scales it down on an HTML5 canvas to a maximum dimension of 1200px at 0.82 JPEG quality.
  - This shrinks typical mobile photos down to **60 KB – 250 KB** before sending over cellular data, resulting in lightning-fast uploads and crystal-clear display on retina screens.
- **Zero-Redundancy HTTP Caching:**
  - Image endpoint: `GET /api/public/images/:uuid`.
  - Headers: `Cache-Control: public, max-age=31536000, immutable` and `ETag: "<uuid>"`.
  - Supports `If-None-Match`: The browser downloads each image only once. Subsequent visits or page refreshes return an immediate `HTTP 304 Not Modified` without re-downloading image bytes from Turso.
- **Storage Capacity on Turso Free Tier:**
  - Turso's free tier provides **9 GB** of database storage.
  - At ~150 KB per compressed image, storing 200 high-res product and category covers uses only **~30 MB** (less than 0.35% of your available database quota).
- **Admin Storage Monitor:**
  - Check storage metrics anytime via the authenticated endpoint: `GET /api/admin/storage/status`.
  - Returns total image count, total database bytes consumed, and maximum file size limits.

---

### 📱 How to Upload or Replace a Product Cover Image from Your Phone

1. **Open the Admin Portal on Your Phone:**
   - Open Chrome, Safari, or any browser on your phone and go to your website: `https://your-site.netlify.app/admin` (or `http://<your-ip>:5173/admin` locally).
   - Log in with your admin credentials.
2. **Go to Products:**
   - Tap the **Products Catalog** tab.
   - Tap **"Add New Product"** (or tap the **Edit** pencil icon on an existing product).
3. **Upload the Image:**
   - Under **Product Cover Image**, tap the dashed box:
     > **"Tap to upload cover image (Phone Library, Camera, or Files)"**
   - Your phone will display its native selection sheet:
     - **Photo Library / Gallery:** Pick an existing photo of the sanitary product.
     - **Take Photo / Camera:** Snap a photo right from your warehouse or shop shelf!
     - **Browse / Files:** Pick an image from your downloads or cloud drive.
   - The image is automatically compressed in your phone's browser before upload (saving mobile data and ensuring instantaneous uploads), then saved directly into Turso.
   - A live preview appears immediately.
4. **Replace or Remove:**
   - Tap **"Replace Image"** if you want to pick another photo.
   - Tap **"Remove"** to clear the image (shows standard high-contrast placeholder).
5. **Save:**
   - Tap **"Save Product"**. The photo is immediately saved in Turso and visible across all customer product cards, search results, and cart items.

---

### 📁 How to Upload or Replace a Category Cover Image from Your Phone

1. In the **Admin Portal**, tap the **Categories** tab.
2. Tap **"Add Category"** (or tap the **Edit** pencil icon next to an existing category or subcategory).
3. Under **Category Cover Image**, tap the upload box and select a photo from your phone's gallery or camera.
4. A live 16:9 banner preview will appear.
5. Tap **"Save Category"**.
6. On the customer website:
   - The category thumbnail appears inside the navigation pills.
   - The category cover card appears in the homepage "Browse Categories" showcase.
   - When a customer clicks the category, the high-resolution category banner is displayed at the top of the section.

---

## 🛠️ Local Development Setup

To run the full stack locally on your computer:

### Step 1: Start Backend
```bash
cd backend
npm install
npm run seed       # Seeds realistic products, categories & default settings
npm run create-admin # Creates initial admin user
npm run dev        # Starts backend on http://localhost:5000
```

### Step 2: Start Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev        # Starts frontend on http://localhost:5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📝 Business Details & Placeholders Replacement Checklist

All business details can be edited directly inside the **Admin Panel > Website Settings** tab without touching any code:

- [ ] **Phone Number:** Update placeholder `+92 300 1234567` with your real office/sales phone number.
- [ ] **WhatsApp Number:** Update placeholder with your business WhatsApp number for direct customer orders.
- [ ] **Email Address:** Update placeholder `sales@kashifsanitary.com` with your real email.
- [ ] **Address (English & Urdu):** Update warehouse market address and city.
- [ ] **Hero Headline & Intro:** Customize website banner text in English and Urdu.
- [ ] **Products & Wholesale Prices:** Add new products, adjust rates, or set items to "Request Price".

---

## 📄 License
All rights reserved © Kashif Sanitary Supplies.
