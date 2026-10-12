# 🌿 Vijaya Nursery — Vercel & MongoDB Atlas Deployment Guide

This guide walks you through deploying the complete **Vijaya Nursery POS & Billing System** to **Vercel** with a free cloud **MongoDB Atlas** database.

---

## 📋 Overview of What's Pre-Configured

- **Root `vercel.json`**: Pre-configured to build both backend and frontend, route all `/api/*` requests to serverless functions, and serve the React/Vite SPA with proper client-side route fallback.
- **Serverless API (`api/index.js`)**: Wraps the Express backend and handles database connection caching across serverless invocations.
- **Automated First-Run Seeding**: When connected to a fresh MongoDB Atlas database, the system **automatically seeds** all nursery categories, initial plant catalog, stock ledgers, settings, and staff accounts on the very first API request!
- **Default Login**: `admin` / `Admin@123` (Manager: `manager` / `Manager@123`, Cashier: `cashier` / `Cashier@123`).

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up or log in.
2. Click **"Create a Database"** and select the **M0 Free** shared cluster (choose any cloud provider/region close to you, e.g., Mumbai `ap-south-1`).
3. Under **Security Quickstart**:
   - **Database User**: Create a username (e.g. `nursery_admin`) and a secure password (note this down).
   - **Network Access / IP Access List**:
     - Click **"Add IP Access List Entry"**.
     - Choose **"Allow Access from Anywhere"** (`0.0.0.0/0`).
     - *Note: This is required because Vercel serverless functions run on dynamic IP addresses.*
4. Click **"Connect"** on your Cluster overview:
   - Choose **"Drivers"** (Node.js).
   - Copy your connection string. It will look like this:
     ```text
     mongodb+srv://nursery_admin:<password>@cluster0.abcde.mongodb.net/vijaya-nursery?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and ensure the database name at the end is `/vijaya-nursery`.

---

## 🚀 Step 2: Deploy to Vercel (1-Click Monorepo)

### Method A: Via GitHub & Vercel Dashboard (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Vijaya Nursery POS - Ready for Vercel"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **"Add New..."** → **"Project"**.
   - Select your GitHub repository.

3. **Project Configuration in Vercel**:
   - **Framework Preset**: Leave as **Other** (or **Vite**; `vercel.json` handles the build and output automatically).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`

4. **Add Environment Variables**:
   In the **Environment Variables** section, add the following:

   | Variable Name | Example / Recommended Value | Description |
   |---------------|-----------------------------|-------------|
   | `MONGODB_URI` | `mongodb+srv://.../vijaya-nursery?retryWrites=true&w=majority` | Your MongoDB Atlas connection string from Step 1 |
   | `JWT_SECRET` | `vijaya-super-secret-key-2026-production` | Any 32+ character random string for signing JWT tokens |
   | `NODE_ENV` | `production` | Production environment flag |
   | `BUSINESS_NAME` | `Vijaya Nursery` | Nursery Business Name |
   | `INVOICE_PREFIX` | `VN` | Tax Invoice serial prefix |

5. **Click "Deploy"**:
   - Vercel will build both the TypeScript backend and the Vite frontend.
   - Once completed, you will receive a production URL (e.g. `https://vijaya-nursery.vercel.app`).

---

### Method B: Via Vercel CLI (Quick Terminal Deployment)

If you have the Vercel CLI installed:
```bash
npm i -g vercel
vercel login
vercel
```
When prompted:
- Set up and deploy? **Yes**
- Link to existing project? **No**
- What's your project's name? **vijaya-nursery**
- In which directory is your code located? **`./`**
- Want to modify settings? **No**

Then add your environment variables:
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NODE_ENV
```
And trigger production deploy:
```bash
vercel --prod
```

---

## 🔑 Step 3: First Login & Verification

1. Open your deployed Vercel URL in your web browser.
2. Log in with the pre-seeded admin credentials:
   - **Login ID / Username**: `admin`
   - **Password**: `Admin@123`
3. Upon first login:
   - The database will automatically initialize all 7 nursery categories (*Fruit Plants, Flowering, Indoor, Palms, Avenue, Pots, Fertilizers*), 21 pre-configured plants, and nursery settings.
   - You can go to **Settings & Administration** (`/settings`) to:
     - Change the admin password or manager/cashier passwords.
     - Create new Billing Agent and Nursery Manager accounts.
     - Customize the Nursery Address, Phone Number, GSTIN, and Bank Details.

---

## 🌐 Alternative Option: Separate Frontend & Backend Deployment

If you prefer running the backend as a continuous long-running Node service (e.g. on [Render.com](https://render.com) or [Railway.app](https://railway.app)) and only hosting the frontend on Vercel:

1. **Deploy Backend to Render or Railway**:
   - Set Root Directory to `backend`.
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=5000`).
   - Copy the backend URL (e.g. `https://nursery-api.onrender.com`).

2. **Deploy Frontend to Vercel**:
   - Set Root Directory to `frontend`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add Environment Variable:
     - `VITE_API_BASE_URL` = `https://nursery-api.onrender.com/api`
