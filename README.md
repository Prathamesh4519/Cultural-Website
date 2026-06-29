# CultureSpace - College Cultural Room Booking Portal

CultureSpace is a modern, responsive full-stack web application designed for managing and reserving college Cultural Rooms (Music Room, Dance Room, Drama Room, etc.). 

---

## 🚀 Technology Stack

- **Frontend**: React.js (Vite) + Tailwind CSS + Lucide Icons + Recharts + FullCalendar
- **Backend**: Node.js + Express.js + Socket.io (for real-time updates)
- **Database**: MongoDB (Mongoose schemas, emulated locally using JSON files for zero-installation ease)
- **Email Service**: Nodemailer templates (SMTP/Gmail support, fallbacks logs directly to the server terminal)
- **Utilities**: QR Code Generator, ExcelJS (Excel exporter), and PDFKit (PDF report builder)

---

## ✨ Features

### 1. Student / User Roles
- **Verification OTP**: Sign up with college email verification (OTP logs to server terminal in mock mode).
- **Interactive Calendar**: Check room schedules in monthly/weekly views colored by booking status.
- **Rules Verification**: Overlap checks, timing validation, max booking durations, and maintenance blocks.
- **Receipt QR Code**: Auto-generates a check-in QR pass upon booking approval.
- **Feedback & Damages**: Leave comments/ratings and report broken equipment with photo uploads.
- **Profile Summary**: Check upcoming reservations, history, and edit preferences.

### 2. Room Owner / Admin Roles
- **Console desk**: Review pending booking requests, approve or reject slots (with custom reasons).
- **QR Check-in Simulator**: Scan or enter booking IDs to mark students as checked-in.
- **Room Asset Manager**: Add, edit, upload pictures, and toggle bookability.
- **Equipment Inventory Manager**: Track musical instruments, speakers, and projectors.
- **Maintenance Scheduler**: Define weekly closed days and schedule custom date blocks.
- **Analytics & Exports**: Visualize usage rates and download bookings summaries in **PDF** and **Excel** formats.
- **Audit Logging**: Logs all actions (creations, check-ins, approvals, blocks) for transparency.

---

## 🛠️ Local Startup Instructions

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed on your system.
*(Note: A local MongoDB installation is NOT required! The mock Mongoose driver will persist collections in local JSON database files automatically).*

### 2. Install Dependencies
Run the following script in the root directory of the project to download all frontend and backend node packages:
```bash
npm run install-all
```

### 3. Launch the Application
Start both backend API server and Vite frontend server concurrently:
```bash
npm run dev
```

- **Frontend Dashboard**: Open your browser to `http://localhost:5173/`
- **Backend Port**: REST APIs run on `http://localhost:5000/`

---

## 🔐 Testing Credentials

### 1. Administrator Account
Use the seeded super-admin credentials to log in:
- **Email**: `admin@culturespace.edu`
- **Password**: `adminpassword`

### 2. Student Account
- Click **Sign Up** on the login page.
- Enter a name, roll number, department, and email (e.g. `test@college.edu` or `test@gmail.com`).
- A 6-digit OTP will be printed **directly in the backend terminal logs**. Enter it in the OTP confirmation page to activate your account.
