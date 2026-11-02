# CityCare Hospital Appointment Booking & Management System (HMS)

> A production-grade, concurrency-safe, full-stack Hospital Management System designed around real clinical workflows, atomic time slot allocation, persistent real-time token queues, and verified medical practitioner access control.

---

## 🌟 Key Highlights & Engineering Features

1. **Atomic Concurrency-Safe Scheduling Ledger:**
   - Database-level compound unique constraint `(doctorId, date, startTime)` eliminates race condition double-booking.
   - Atomic 10-minute slot locking (`LOCKED_PENDING_PAYMENT`) during reservation.
   - Idempotency key tracking prevents duplicate bookings on network retries.

2. **Real-Time Token Queue & Live Wait Tracker:**
   - Powered by authenticated **Socket.io** WebSocket broadcasting.
   - Sequential token number generation with rolling average consultation wait-time estimates.
   - Anonymized token boards prevent exposing private patient medical details to waiting rooms.
   - Instant client alerts and audio chime when a patient's token is called.

3. **Medical Practitioner Verification & RBAC:**
   - Strict 5-tier role hierarchy: `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`.
   - Medical practitioner license IDs verified by hospital administration before accepting appointments.
   - Resource-level authorization: patients can only access their own medical history.

4. **Integrated Payment Ledger & Razorpay Integration:**
   - Backend order creation in INR.
   - HMAC-SHA256 signature verification for client submissions and automated webhook events.
   - Resilient sandbox fallback for testing and CI without external gateway dependencies.

5. **AI-Assisted Symptom Triage & Emergency Red Flag Guidance:**
   - Natural language symptom evaluation using Google Gemini API with clinical rule-based keyword fallback.
   - Automated detection of emergency red flags (e.g. chest pain, stroke symptoms, respiratory distress).
   - Emergency banner immediately directs urgent cases to emergency helplines (112 / 108).

6. **Automated Slot Waitlist with 15-Minute Exclusive Claim Window:**
   - Persistent waitlist ordering by priority and timestamp.
   - Automated detection of cancellations triggers exclusive time-limited offers to waitlisted patients.

7. **Encrypted WebRTC Teleconsultation:**
   - In-browser camera and microphone controls with DTLS-SRTP encryption standards.
   - Live clinical notes panel during consultation.

---

## 🔐 Production Authentication & Role-Based Access Control

CityCare HMS uses production authentication with password hashing (bcrypt, salt factor 10) and signed JWT tokens with 7-day expiration.

### Supported Clinical Roles:
1. **Patient:** Books doctor appointments, tracks live token queues, views digital prescriptions, and completes online consultations.
2. **Doctor:** Manages OPD daily consultations, calls/updates queue tokens, writes and digitally signs prescriptions, and reviews clinical histories.
3. **Hospital Administrator:** Reviews practitioner credentials, verifies doctor registrations, monitors department performance, and audits security events.
4. **Receptionist:** Checks in arriving patients, issues queue tokens, and assists front-desk triage.
5. **Super Administrator:** Complete system administration and global compliance management.

---

## 🏗️ Architecture & Technology Stack

```
HMS/
├── backend/                  # Express.js + TypeScript REST API
│   ├── src/
│   │   ├── config/          # Environment & MongoDB configuration
│   │   ├── controllers/     # REST route controllers
│   │   ├── middlewares/     # JWT authentication, RBAC, Zod validation
│   │   ├── models/          # 13 Mongoose schemas with compound indexes
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Domain business logic (Booking, Queue, Payment, AI)
│   │   ├── sockets/         # Socket.io live queue & WebRTC signaling
│   │   └── utils/           # Database seeder, audit logger, response helpers
│   ├── tests/               # Automated integration & concurrency tests (Vitest)
│   └── package.json
│
└── frontend/                 # Next.js 15 App Router + React 19 + TypeScript
    ├── src/
    │   ├── app/             # App Router pages (Landing, Doctors, Dashboard, Queue)
    │   ├── components/      # UI components, Hero, AI Triage, Modals
    │   ├── context/         # AuthContext & Demo switchers
    │   ├── lib/             # API client & Socket.io client
    │   └── types/           # Shared TypeScript interfaces
    ├── tailwind.config.js
    └── package.json
```

---

## 🧪 Automated Testing Verification

The project includes an end-to-end automated test suite executed with `vitest` against an in-memory MongoDB engine (`mongodb-memory-server`):

1. **Authentication & Authorization Suite (`tests/auth.test.ts`):** Validates registration, bcrypt hashing, JWT issuance, and unauthenticated access blocking.
2. **Doctor Verification & Access Control (`tests/doctorVerification.test.ts`):** Verifies that pending doctors cannot receive bookings until an administrator approves their medical credentials.
3. **Concurrency & Double-Booking Protection (`tests/concurrencyBooking.test.ts`):** Simulates simultaneous requests attempting to reserve the exact same slot; guarantees that exactly one succeeds and the second receives a conflict response.
4. **Real-Time Queue & Token Management (`tests/queueAndTokens.test.ts`):** Tests check-in, sequential token assignment, privacy anonymization, and status transitions (`WAITING` → `CALLED` → `IN_CONSULTATION` → `COMPLETED`).
5. **Payment & Webhook Integrity (`tests/paymentWebhook.test.ts`):** Tests Razorpay order creation, cryptographic HMAC-SHA256 signature verification, and duplicate webhook idempotency.

Run tests:
```bash
cd backend
npm test
```

---

## 🚀 Local Quickstart Guide

### Prerequisites
- Node.js v18+ or v20+
- MongoDB instance (or MongoDB Atlas connection string)

### 1. Clone & Install Dependencies
```bash
# Backend installation
cd backend
npm install

# Frontend installation
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cd backend
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://127.0.0.1:27017/hms
JWT_SECRET=hms-dev-jwt-super-secret-key-32-chars-long!
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=rzp_test_secret_placeholder
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_placeholder
GEMINI_API_KEY=your_gemini_api_key_optional
```

### 3. Run Development Servers
You can start both the backend API and frontend portal concurrently with a single command from the root directory:
```bash
npm run dev
```

Or run them in separate terminals if preferred:
```bash
# Terminal 1: Start Backend (Port 5002)
cd backend
npm run dev

# Terminal 2: Start Frontend (Port 3001)
cd frontend
npm run dev
```

Visit **http://localhost:3001** in your web browser.
API Health Check is available at **http://localhost:5002/health**.
Interactive API documentation is at **http://localhost:5002/api/docs**.

---

## 🛡️ Security & Clinical Compliance Checklist

- [x] Passwords salted and hashed with `bcryptjs` (work factor 10).
- [x] JWT tokens with 7-day expiration and role payloads.
- [x] Server-side validation via `zod` schemas.
- [x] Strict CORS policy whitelisting allowed client origins.
- [x] HTTP security headers enforced by `helmet`.
- [x] Cryptographic HMAC-SHA256 signature verification for payments & webhooks.
- [x] Patient medical privacy: names and diagnoses are never leaked to public Socket.io rooms.
- [x] Immutable Audit Log collection tracking sensitive administrative and clinical actions.
- [x] Emergency triage banner with immediate guidance for life-threatening symptoms.

