# Bhoomi Real Estate Marketplace (नागपूर & वर्धा)

> Production-grade, full-stack Real Estate Marketplace connecting buyers directly with genuine owners, verified brokers, and builders across Nagpur, Wardha, and the Samruddhi Expressway corridor. Features an AI-grounded listing advisor, isolated mortgage finance engine, and strict DPDP Act compliance with AES-256-GCM encryption.

[![CI](https://github.com/bhoomi-realty/bhoomi-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/bhoomi-realty/bhoomi-marketplace/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

---

## 1. Monorepo Architecture

```
bhoomi-marketplace/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript REST API (/api/v1)
│   │   ├── prisma/              # Schema, migrations & seed script (32+ rich listings)
│   │   ├── src/                 # Controllers, services, security, OTP, Claude LLM
│   │   └── tests/               # Unit & integration tests
│   └── web/                     # React 18 + Vite + TypeScript + Tailwind CSS
│       ├── src/                 # Mobile-first components, pages, context, i18n
│       └── tests/               # Playwright E2E role flow tests
├── packages/
│   └── finance/                 # @bhoomi/finance isolated, mergeable mortgage & tax engine
│       ├── src/                 # EMI, amortization schedule, LTV limits, bank quotes
│       └── tests/               # Unit mathematical precision tests
├── infra/
│   ├── docker/                  # Dockerfile.api, Dockerfile.web, nginx.conf
│   ├── docker-compose.yml       # Local PostgreSQL + API + Web container stack
│   ├── vercel.json              # Vercel deployment configuration
│   └── .env.example             # Exhaustive environment variable guide
└── package.json                 # Monorepo root workspaces
```

---

## 2. Core Features & Module Walkthrough

### 1. Public Homepage & Search Experience
- **Hero Search Widget**: Switch between **Buy / Outright Sale** and **Rental**; filter by category (**Plots, Flats, Bungalows, Villas**), BHK (**1, 2, 3, 3.5, 4**), and City (**Nagpur vs Wardha**).
- **Interactive Map Pinning**: Every listing includes precise GPS coordinates (e.g., Ramdaspeth, MIHAN, Sevagram).
- **URL-Synced Search**: All filter queries sync into browser URL query parameters for bookmarking and sharing.
- **Sorting & Pagination**: Sort by price, square-footage, newest, or popularity with server-side pagination.

### 2. Registration & OTP Authentication
- **Secure 6-Digit OTP**: SHA-256 hashed at rest, strict 60-second expiration, 3-attempt lockout, 60-second resend cooldown.
- **Pluggable Provider Architecture**: Defaults to `ConsoleDevOtpProvider` for zero-friction local testing; pluggable with `TwilioOtpProvider`, `Msg91OtpProvider` (Indian domestic DLT flow), and `SmtpEmailOtpProvider`.
- **Role Enforcement & Switching**:
  - **Buyer and Seller are interchangeable**: Switch between them anytime in the header.
  - **Broker/Dealer and Builder are permanent commercial accounts**: Cannot switch roles.
- **DPDP Act 2023 Consent**: Mandatory affirmative consent agreement prior to account registration.

### 3. Contact Gating & Media Privacy
- **Privacy Toggles for Sellers**: Sellers can selectively hide their direct phone number and lock interior photos for guest visitors.
- **Unlocking Flow**: Guest visitors see masked phone numbers (`Login to unlock contact`) and blurred media. Logging in via mobile OTP unlocks full resolution photos and direct calling.

### 4. Grounded AI Chatbot (`Bhoomi AI`)
- **Strict Database Grounding**: Retrieves exact database listing records (carpet area, price per sq.ft., total cost, amenities, coordinates).
- **Statutory Stamp Duty & Tax Calculation**: Answers queries on Maharashtra stamp duty (urban vs rural rates) and registration fee caps with statutory disclaimers.
- **Broker Handoff Action**: Detects visit/inspection intent and provides an interactive "Call Broker" button.
- **Session Persistence**: Stores conversation history per user and listing in database.

### 5. Isolated Mortgage Finance Package (`@bhoomi/finance`)
- **Pluggable & Mergeable Interface**: Isolated standalone TypeScript package (`/packages/finance`) with zero framework coupling.
- **RBI Guideline Slabs**: Automatically applies RBI Loan-to-Value (LTV) limits (90% for affordable $\le$ ₹30 Lakhs, 80% for $\le$ ₹75 Lakhs, 75% for luxury $>$ ₹75 Lakhs).
- **Amortization Schedules**: Produces both Year-by-Year summaries and Month-by-Month amortization payment tables.
- **Config-Driven Bank Quotes**: Instant comparisons across SBI, HDFC Bank, ICICI Bank, Bank of Maharashtra, and Axis Bank.
- **Borrower Affordability (FOIR)**: Computes maximum permissible loan eligibility based on net in-hand income and existing EMIs.

### 6. Agent / Owner Dashboard
- **Interactive Deals Pipeline**: Kanban stages: `Inquiry` $\to$ `Negotiation` $\to$ `Agreement` $\to$ `Closed`.
- **Encrypted KYC Collection**: When a deal reaches `Closed`, the system collects the buyer's Aadhaar and PAN.
  - Encrypted at rest using **AES-256-GCM** with 96-bit initialization vectors and authentication tags.
  - Stored and displayed as masked values: `XXXX-XXXX-1234` and `ABCDE****F`.
  - Decrypted view restricted strictly to `ADMIN` / `OWNER` role.
  - Every decryption triggers an immutable, audited entry in `AuditLog`.
- **Central Contact Directory**: Filterable directory of all buyers and sellers with instant **CSV Export** (`GET /api/v1/dashboard/export/contacts.csv`).

### 7. DPDP Compliance & Self-Service Data Rights
- Self-service **Data Portability Export** (`GET /api/v1/compliance/export`) producing a structured JSON payload of all personal data.
- Self-service **Data Erasure Request** (`POST /api/v1/compliance/delete-request`).

---

## 3. Quickstart & Local Setup

### Prerequisites
- Node.js $\ge$ 18.x (Node 20 or 24 recommended)
- npm $\ge$ 9.x

### Step 1: Install Dependencies
```bash
git clone https://github.com/bhoomi-realty/bhoomi-marketplace.git
cd bhoomi-marketplace
npm install
```

### Step 2: Initialize Database & Seed Demo Data
The project includes a ready-to-use SQLite setup for zero-friction local execution (no PostgreSQL installation required for immediate testing):
```bash
# Generate Prisma Client & Push Schema
npm run db:generate
npm run db:push

# Seed 32+ authentic Nagpur & Wardha listings, demo users, and encrypted KYC records
npm run db:seed
```

### Step 3: Run Unit Tests
```bash
npm run test --workspace=packages/finance
npm run test --workspace=apps/api
```

### Step 4: Start Development Servers
```bash
# Runs API server on port 4000 and Vite web on port 3000
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 4. Demo Accounts for Instant Role Testing

| Role | Email / Target | Password / OTP | Description |
| :--- | :--- | :--- | :--- |
| **👑 Admin / Owner** | `admin@bhoomi.in` | Any OTP or Quick-Login button | Accesses full Dashboard, encrypted KYC decryption, CSV export |
| **🤝 Broker / Dealer** | `broker.nagpur@bhoomi.in` | Any OTP or Quick-Login button | Manages listings, reviews inquiries, advances pipeline deals |
| **🏗️ Builder** | `builder@bhoomi.in` | Any OTP or Quick-Login button | Manages large residential/commercial projects in Nagpur |
| **🏡 Seller** | `seller.wardha@bhoomi.in` | Any OTP or Quick-Login button | Direct property owner (can switch to Buyer anytime) |
| **🔍 Buyer** | `buyer.vidarbha@bhoomi.in` | Any OTP or Quick-Login button | Explores listings, unlocks gated phone numbers, requests callbacks |

> **Tip**: The login modal includes a **One-Click Quick Login** bar allowing reviewers to switch between any of the 5 roles with a single click.

---

## 5. Cloud & Deployment Guide

### A. Deploy Frontend on Vercel
1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select `bhoomi-marketplace`.
3. Set the Root Directory to `apps/web` or leave at root (Vercel automatically detects `infra/vercel.json`).
4. Set Build Command: `npm run build --workspace=packages/finance && npm run build --workspace=apps/web`.
5. Set Output Directory: `apps/web/dist`.
6. Add Environment Variable:
   - `VITE_API_URL`: Your deployed API URL (e.g., `https://bhoomi-api.up.railway.app`).

### B. Deploy Backend API on Railway / Render
1. Create a new service from GitHub repository.
2. Set Root Directory to `apps/api`.
3. Provision a managed **PostgreSQL** instance on Railway / Render / Neon / Supabase.
4. Set environment variables from `apps/api/.env.example`:
   - `DATABASE_URL`: `postgresql://postgres:password@host:5432/bhoomi_marketplace`
   - `JWT_SECRET`: (64-char random string)
   - `JWT_REFRESH_SECRET`: (64-char random string)
   - `ENCRYPTION_KEY`: (64-character hex key)
   - `ANTHROPIC_API_KEY`: (Your Anthropic Claude API Key)
   - `CORS_ORIGIN`: Your Vercel frontend domain (`https://bhoomi-marketplace.vercel.app`)
5. In build phase, run: `npx prisma db push --schema=prisma/schema.postgres.prisma && npx tsx prisma/seed.ts`.
6. Start command: `node dist/src/index.js`.

### C. Run with Docker Compose (Local Containerized)
```bash
cd infra
docker-compose up --build
```
This starts PostgreSQL on `5432`, the Express API on `4000`, and the React frontend on `3000`.

---

## 6. Architecture & Security Assumptions

1. **Database Multi-Engine Compatibility**:
   - For immediate local zero-dependency evaluation, Prisma is configured with SQLite (`file:./dev.db`) so reviewers do not need to install Docker or PostgreSQL on Windows.
   - For cloud production (Render/Railway/Vercel/AWS RDS), the PostgreSQL schema is provided at `apps/api/prisma/schema.postgres.prisma` with identical field mappings.
2. **Claude API Grounding Fallback**:
   - When `ANTHROPIC_API_KEY` is provided, queries are sent to Claude 3 with strict database context prompts.
   - When no API key is configured (local dev/test), an intelligent deterministic grounding engine evaluates property attributes, statutory taxes, and broker handoffs directly from database records without throwing external errors.
3. **Regional Real-Estate Assumptions (Maharashtra)**:
   - Stamp duty: 7% for urban municipal areas (Nagpur NMC/NIT) and 6% for rural/Grampanchayat jurisdictions (Wardha/peripheral Nagpur).
   - Concession: 1% discount for women property purchasers.
   - Registration fee: 1% capped at ₹30,000 for properties valued above ₹30 Lakhs.
4. **Encryption Key Rotation**:
   - The `ENCRYPTION_KEY` environment variable must be a 256-bit hexadecimal key. In production AWS deployments, this key can be stored in AWS Secrets Manager or KMS.
