# BDD – Bihar Digital Data
## Vercel + Neon PostgreSQL Deployment Guide

---

## 📁 Project Structure

```
bdd-vercel/
├── api/
│   └── enroll.js        ← Serverless function (handles form POST)
├── public/
│   └── index.html       ← Your website
├── package.json
├── vercel.json
└── README.md
```

---

## 🚀 Step-by-Step Deployment

### Step 1 — Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2 — Install project dependencies
```bash
npm install
```

### Step 3 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial BDD website with Neon DB"
git remote add origin https://github.com/YOUR_USERNAME/bdd-website.git
git push -u origin main
```

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Click **Deploy** (default settings are fine)

### Step 5 — Add Environment Variable (CRITICAL)
After deployment:
1. Go to your project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:YOUR_PASSWORD@ep-dark-leaf-am4x18s5-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
3. Click **Save**
4. Go to **Deployments** → click the 3 dots → **Redeploy**

> ⚠️ NEVER put the connection string in code — always use environment variables!

---

## 🗄️ Database

The `enrollments` table is **auto-created** on first form submission:

```sql
CREATE TABLE IF NOT EXISTS enrollments (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  course     TEXT NOT NULL,
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

To view submissions, connect to your Neon console at https://console.neon.tech and run:
```sql
SELECT * FROM enrollments ORDER BY created_at DESC;
```

---

## 🔁 How It Works

```
User fills form → fetch POST /api/enroll
                          ↓
               Vercel Serverless Function
                          ↓
            Neon PostgreSQL (via DATABASE_URL)
                          ↓
               JSON response back to browser
                          ↓
                Toast notification shown
```

---

## ✅ Local Development

```bash
vercel dev
```
This runs the serverless functions locally. Set your env variable:
```bash
export DATABASE_URL="postgresql://..."
```

---

## 📞 Support
Bihar Digital Data | Darbhanga, Bihar | 9955889177
