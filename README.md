# 🌿 VIJAYA NURSERY — Complete Enterprise POS, Billing & Inventory System

A production-grade, full-stack Point of Sale (POS), Inventory Control, Customer Credit Ledger, Purchase Management, and GST Billing software built specifically for **Vijaya Nursery** (NH-16 Bypass Road, Kadiyam, Rajahmundry, Andhra Pradesh).

> 🚀 **Ready for Cloud Deployment**: Follow the [Complete Vercel & MongoDB Atlas Deployment Guide](./DEPLOYMENT_GUIDE.md) to launch the app online in under 5 minutes.

---

## 🚀 Key Highlights & Capabilities

- **Zero-Setup Database Resiliency**: Connects to your local or cloud MongoDB (`mongodb://localhost:27017/vijaya-nursery`) automatically, and features an **automatic embedded in-memory MongoDB fallback** so it runs immediately out-of-the-box on any computer without manual database installs!
- **Fast Nursery POS Terminal**:
  - Live bilingual plant search (English common name, Telugu local name e.g., *బంగినపల్లి మామిడి*, Botanical name, and SKU).
  - Category pill tabs (Fruit Plants, Flowering, Indoor & Air Purifying, Pots & Planters, Soils & Organic Fertilizers, Tools).
  - Quantity controls, line-item discounts, and bill-level percentage/flat discounts.
  - Park / Hold bills feature to serve multiple queueing walk-in customers simultaneously.
  - Multi-mode tender: Cash (with Cash Tendered & Change Returned calculator), Dynamic UPI QR Code, Card/POS, and Customer Credit.
- **Instant Printable 80mm/58mm GST Thermal Receipts**:
  - Tax Invoices & Bills of Supply formatted for standard thermal receipt printers or regular browser printing (`window.print()`).
  - HSN codes, CGST, SGST, IGST breakdown, Amount in Words (INR), and Nursery footer.
- **Stock & Inventory Control**:
  - Live stock level badges (In Stock, Low Stock Alert, Out of Stock).
  - Append-only immutable `StockLedger` audit trail for every inward, sale, return, damage, and physical reconciliation.
- **Customer CRM & Credit Ledger**:
  - Statement of Account (Running Ledger) showing date-by-date debits (invoices) and credits (receipts) with running balance.
  - Outstanding balances and credit limit protection.
- **Supervisor Security**:
  - 4-digit Manager Override PIN (`9900`) for zero-stock bypass and negotiated customer discounts.
- **GST Filings & Business Intelligence**:
  - GSTR-1 preparation (B2B invoices with GSTIN, B2C retail, and Table 12 HSN Summary).
  - Day-End Cash Reconciliation (Daily Register Closing).
  - Inventory valuation (Total Acquisition Cost vs. Retail Selling Potential).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QRCode |
| **Backend** | Node.js, Express, TypeScript, Mongoose |
| **Precision** | `decimal.js` for floating-point-safe financial math |
| **Security** | JWT, bcryptjs, Helmet, CORS, Account Lockout Protection |
| **Database** | MongoDB / Mongoose with embedded `mongodb-memory-server` fallback |

---

## 🔑 Default Credentials & Access

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin` | `Admin@123` | Full access, settings, user management |
| **Manager** | `manager` | `Manager@123` | Operations, stock inwarding, report viewing |
| **Cashier 1** | `cashier` | `Cashier@123` | POS billing counter operator |
| **Cashier 2** | `cashier2` | `Cashier@123` | Secondary counter operator |

> **Manager Override PIN**: `9900` *(Can be updated in Admin Settings)*

---

## 💻 How to Run Locally

### 1. Start Both Backend & Frontend Concurrently (Root Directory)
```bash
npm run dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### 2. Or Run Separately in Individual Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

---

### 3. Re-seed Demo Data:
To seed or refresh the database with plants, categories, customers, and tax rules:
```bash
cd backend
npm run seed
```

To perform a clean reset and fresh re-seed:
```bash
cd backend
npm run seed:reset
```

---

### 4. Production Build:
```bash
# Build both frontend and backend
npm run build
```
Frontend bundle outputs to `frontend/dist/` and backend compiles to `backend/dist/`.

---

© 2026 Vijaya Nursery • Rajahmundry, Andhra Pradesh. All rights reserved.
