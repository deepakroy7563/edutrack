# 🎓 EduTrack – School Management & Attendance System

EduTrack is a premium, full-stack MERN application that provides a comprehensive platform for modern school administration, classroom management, academic tracking, and parent engagement. It features robust role-based access control (RBAC), interactive analytics dashboards, automated weekly timetables, tuition billing logs with professional PDF receipts, and an advanced automated classroom attendance module powered by facial recognition.

---

## 🚀 Key Features

### 🔐 1. Multi-role Authentication & RBAC
- **Four Dedicated Roles**: Admin, Teacher, Student, and Parent.
- **Secure Sessions**: JSON Web Token (JWT) stateless authorization, hashed passcodes utilizing `bcryptjs`, protected routing layers, and secure HTTP-proxy integration.
- **Profile Customization**: Dashboard forms for updating contact information and profile avatars.

### 📊 2. Premium Analytics Dashboards
- **Dynamic Indicators**: Real-time statistical counters (total pupils, staff counts, classes, billing ratios).
- **Data Visualizations**: Overall student attendance rates and performance distribution rings.

### 👤 3. Directory & Profile Management (CRUD)
- **User CRUD Control**: Interactive data tables with search filters to enroll new students, register teachers, and link students to parents.
- **Biometric Profiles**: Admin/Teachers can upload a profile photo for students. The frontend analyzes facial features and saves a 128-dimensional biometric coordinate array to the database.

### 📷 4. Automated Biometric Attendance
- **Live Stream Scanner**: Fully responsive camera scanner utilizing `react-webcam`.
- **Client-Side Face Detection**: Powered by `@vladmandic/face-api` (built on TensorFlow.js). Detects bounding box shapes, extracts biometric vectors, and compares them using Euclidean distance algorithms.
- **Instant Check-in**: Recognizes the student matching the webcam stream and records attendance instantly as present, late, or absent.

### 📅 5. Weekly Timetables & Notices
- **Scheduler**: Admin can allocate timetables (subjects, timeslots, rooms, and class teachers).
- **Notice Bulletin**: School-wide bulletin board where Admins and Teachers post notices.

### 💳 6. Invoicing & Fee Tracking
- **Billing Log**: Create fee statements with paid/pending states and automatic invoice numbering.
- **Billing Status**: Seamless invoice processing for administrators.

### 📄 7. Professional PDF Exports
- **Academic Report Cards**: Subject-wise mark statements, averages, and auto-generated letter grades.
- **Tuition Fee Receipts**: Formal receipts with slate branding, billing metadata, and items.
- **Attendance Registers**: Spreadsheet-style reports detailing presence history.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS v3 (Custom Glassmorphic styles), Axios, Lucide Icons.
- **Face Recognition**: `@vladmandic/face-api` (TensorFlow.js engine).
- **Backend**: Node.js, Express.js (MVC architectural pattern), Multer file uploads.
- **Database**: MongoDB, Mongoose ODM.
- **Document Rendering**: `jsPDF` and `jspdf-autotable`.

---

## 📂 Project Structure

```
Edutrack/
├── backend/
│   ├── config/             # Database connection setup
│   ├── controllers/        # Express MVC controllers
│   ├── middleware/         # Auth verification and file upload setups
│   ├── models/             # Mongoose schemas (User, Student, Teacher, etc.)
│   ├── routes/             # REST API routing endpoints
│   ├── seeds/              # Database seeder and face weight downloader
│   ├── uploads/            # Static storage for profile pictures
│   ├── .env                # Environment variables configuration
│   ├── server.js           # Server startup entry point
│   └── package.json
└── frontend/
    ├── public/
    │   └── models/         # Pre-trained face-api.js model weights
    ├── src/
    │   ├── context/        # Auth Context session management
    │   ├── hooks/          # Custom hooks (biometrics processing)
    │   ├── layouts/        # Sidebar and top navbar shell
    │   ├── pages/          # Pages (Login, Dashboard, Admin/Teacher panels)
    │   ├── utils/          # Axios configuration and PDF exports
    │   ├── App.jsx         # Routing mapping and route guards
    │   ├── index.css       # Tailwind entry point with glassmorphic cards
    │   └── main.jsx        # DOM mounting
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 💻 Local Setup & Installation

### Prerequisite Checklist
- **Node.js**: v16+ or newer installed.
- **MongoDB**: Community server running locally on port `27017` or a MongoDB Atlas connection string.

### Step 1: Clone and Set Up Environment
Configure the environment variables in `backend/.env`:
```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/edutrack
JWT_SECRET=edutrack_secret_key_for_jwt_auth_12345
NODE_ENV=development
```

### Step 2: Install Backend Dependencies & Seed
Open a terminal in the `/backend` folder:
```bash
cd backend
npm install
```

To fetch the required pre-trained neural network weights for **face-api.js** and populate your database with full demo profiles, timetables, classes, grades, and notice boards, execute:
```bash
# Downloads biometric weights and saves them directly in frontend/public/models
node seeds/download_models.js

# Seeds database with initial data
npm run seed
```

### Step 3: Install Frontend Dependencies
Open a second terminal inside the `/frontend` directory:
```bash
cd frontend
npm install
```

### Step 4: Run the Development Servers
In the `/backend` terminal:
```bash
npm run dev
```

In the `/frontend` terminal:
```bash
npm run dev
```

Your browser will automatically launch the login interface on **`http://localhost:5173/`**.

---

## 🔑 Demo Login Credentials

For testing and demonstrating the distinct features of the role-based dashboard screens, log in with the following seeded accounts (all use the password `password123`):

1. **System Administrator**
   - **Email**: `admin@edutrack.com`
   - **Password**: `password123`
   - *Key Actions*: Manage all users (CRUD), register classrooms, view global statistics, post school notices, set fee balances, compile class timetables.

2. **Class Teacher (Grade 10-A)**
   - **Email**: `john.miller@edutrack.com`
   - **Password**: `password123`
   - *Key Actions*: Launch face-recognition attendance camera, review classroom grids, upload exams/marks, post class announcements.

3. **Student (Alex Davis, Grade 10-A)**
   - **Email**: `student1@edutrack.com`
   - **Password**: `password123`
   - *Key Actions*: Review personal attendance percentages, check class timetables, view notices, download academic report cards.

4. **Parent (Michael Davis - Father of Alex)**
   - **Email**: `parent1@edutrack.com`
   - **Password**: `password123`
   - *Key Actions*: Monitor kid's academic marks, review attendance calendars, print tuition invoices and receipts.

---

## 🌐 Production Deployment Guide

### Part 1: Database Setup on MongoDB Atlas
1. Sign up/Log in on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. `Cluster0`) in your preferred region.
3. Under **Database Access**, create a user account with read/write privileges (note the password).
4. Under **Network Access**, whitelist access from anywhere (`0.0.0.0/0`) or configure secure integration.
5. Click **Connect**, choose **Connect your application**, and copy the connection string:
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/edutrack?retryWrites=true&w=majority`

### Part 2: Deployment on Render

#### Step 1: Deploying the Node/Express Backend
1. Sign up/Log in on [Render](https://render.com/).
2. Create a **New Web Service** and connect your GitHub repository.
3. Configure the following values:
   - **Name**: `edutrack-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Expand the **Advanced** section and define the **Environment Variables**:
   - `PORT`: `5000`
   - `MONGO_URI`: `mongodb+srv://your_username:your_password@cluster0.xxxx.mongodb.net/edutrack?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_custom_production_secret_key`
   - `NODE_ENV`: `production`
5. Click **Create Web Service**. Note the backend URL (e.g. `https://edutrack-backend.onrender.com`).

#### Step 2: Deploying the React Frontend
1. Create a **New Static Site** on Render and select the same repository.
2. Configure the following:
   - **Name**: `edutrack-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Expand **Advanced** and set up routing rewrite rules to avoid React Router browser refresh issues:
   - *Source*: `/*`
   - *Destination*: `/index.html`
   - *Action*: `Rewrite`
4. Set up an environment file or change the API base URL in `frontend/src/utils/api.js` to target your production backend URL:
   `const API_BASE_URL = 'https://edutrack-backend.onrender.com/api';`
5. Deploy the Static Site. Your EduTrack production platform is live!
