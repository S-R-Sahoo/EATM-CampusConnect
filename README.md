# EATM CampusConnect

> **"Connect • Collaborate • Grow"**  
> A private, production-grade digital campus social network and academic collaboration platform built specifically for **Einstein Academy of Technology and Management (EATM)**.

---

## 📸 Visual Design System & Reference Architecture

EATM CampusConnect was designed following the official campus platform visual guidelines:
- **Primary Color Palette**: EATM Deep Forest Green (`#0b4627` / `#062615`), EATM Emerald (`#10b981`), Crisp White (`#ffffff`), and EATM Crimson Accent Red (`#dc2626` / `#b91c1c`).
- **Typography & Surfaces**: Modern typography (Inter), rounded 2xl/3xl card containers, subtle borders (`border-gray-200/80`), and glassmorphism headers.
- **Portals**: Dedicated, isolated role layouts for **Students**, **Faculty**, and **Administrators** with route guards, real-time Firestore listeners, and Firebase Security Rules.

---

## 🚀 Key Features

### 1. Public Gateway
- **Landing Page (`/`)**: Hero section featuring high-resolution EATM campus imagery, "Connect • Collaborate • Grow" branding, video tour modal, 4 quick feature highlights, "Explore EATM" academic cards, and campus banner footer.
- **Split-Screen Login (`/login`)**: Left campus imagery with institutional values, right authentication form with email/roll-number sign in, show/hide password, Google Sign-In, and instant 1-click Demo Persona switcher.
- **Role-Based Registration (`/register`)**: Split registration with dedicated tabbed forms for **Students** (Full Name, Roll Number, Department, Year, Semester, Phone) and **Faculty** (Employee ID, Designation, Department). Enforces strict role validation preventing public admin self-elevation.
- **Password Recovery (`/forgot-password`)**: Firebase Auth reset email trigger.

### 2. Student Community & Social Network (`/student/*`)
- **Dashboard (`/student/dashboard`)**:
  - Greeting header: *"Good Morning, Soumyaranjan! Keep learning, keep growing."*
  - 4 Real-time Metric Cards: Upcoming Events (3), Unread Messages (5), New Opportunities (8), Notifications (12).
  - Create Post card: Multimedia posting with photo previews, video/file attachments, feeling emoji tags, and campus vs. connections visibility.
  - Social Feed: Campus posts with live like/unlike toggles synced to Firestore, expandable comment threads, share link copying, bookmarking, and moderation reporting.
  - Right Sidebar: Live upcoming events with instant registration toggles + quick links.
- **Student Profile (`/student/profile`)**:
  - Campus cover image banner, verified student badge, departmental details, roll number.
  - Stats bar: Connections (128), Posts (24), Clubs (4), Achievements (6).
  - Skills pills (C++, Java, Python, React, Web Dev, UI/UX), About Me, Interests, Projects showcase, Campus Honors, and interactive Edit Profile modal.
- **Discover People (`/student/discover`)**:
  - Search by student name, department, or technical skills.
  - Department filter chips: *All, CSE, ECE, EEE, Mech, Civil*.
  - Student cards with interactive `Connect` ➔ `Pending` ➔ `Connected` status flow.
- **Connections Manager (`/student/connections`)**:
  - Tabs: *All Connections*, *Requests Received*, *Requests Sent*.
  - Real-time `Accept` and `Decline` controls with instant notifications.
- **Real-Time Campus Chat (`/student/messages`)**:
  - Two-pane messaging interface matching the reference design.
  - Direct 1-on-1 chats and club group channels.
  - Speech bubble streams with timestamps and double-check read receipts.
  - Emoji picker, media attachment action, and real-time synchronization.
- **Clubs & Communities (`/student/communities`)**:
  - Chartered societies: Coding Club, Robotics Club, Photography Club, Cultural Club, Sports Club, Entrepreneurship Club.
  - Live member count counters, `Join` / `Joined` toggles.
  - Modal to charter a new student society.
- **Campus Events (`/student/events`)**:
  - Hackathon 2025, Robotics Competition, Cultural Fest, AI & Deep Learning Workshop.
  - Category filters, date/location tags, live `Register` / `Registered` button with confetti celebration and seat reservation.
- **Study Materials & Question Banks (`/student/study-materials`)**:
  - Course notes, PowerPoint presentations, PDF handouts, and BPUT previous year question papers.
  - Filter pills (*All, Notes, PPT, PDF, Question Papers*), download trigger buttons, and faculty/student upload dialog.
- **Internship & Placement Drives (`/student/opportunities`)**:
  - Opportunities from Google, Microsoft, TCS, Zoho, and regional startups.
  - Stipend details, eligibility criteria, duration, deadline, Save/Bookmark toggle, and modal application submitter.
- **Notifications Hub (`/student/notifications`)**:
  - Filter by category (*Messages, Connections, Events, System*).
  - Unread indicators, direct actionable links, and "Mark all as read".
- **Settings & Privacy (`/student/settings`)**:
  - Profile visibility options, messaging permissions, notification digest preferences, password reset, and light/dark display themes.

### 3. Faculty Portal (`/faculty/*`)
- **Dashboard (`/faculty/dashboard`)**:
  - Metrics: Total Students (324), Active Events (8), Assignments (12), Pending Reports (3).
  - Quick action shortcuts: Broadcast Notice, Upload Material, Create Assignment, Create Event.
  - Notice Publisher with priority badges (*Urgent*, *Important*, *Normal*).
- **Coursework & Assignments (`/faculty/assignments`)**:
  - Assignment creator with target semester, due date, rubrics, and submission tracking.
- **Student Cohorts Directory (`/faculty/students`)**:
  - Searchable departmental directory with academic standing and student roll numbers.

### 4. Admin Portal (`/admin/*`)
- **Executive Analytics (`/admin/dashboard`)**:
  - High-level KPIs: Students (1,248), Faculty (86), Active Clubs (24), Activities (18).
  - Interactive SVG User Growth & Enrollment trend chart.
  - Real-time campus activity audit trail.
- **User Governance (`/admin/students` & `/admin/faculty`)**:
  - Search and filter accounts across all 6 engineering branches.
  - Deactivate / Activate accounts and grant official Campus Verification Badges.
- **Community Moderation Queue (`/admin/reports`)**:
  - Review flagged posts, abusive comments, and fake profiles.
  - Status management: *Pending*, *Under Review*, *Resolved*, *Dismissed*.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti, Tailwind CSS transitions
- **Backend & Cloud Database**: Firebase Modular SDK v11 (Authentication, Cloud Firestore, Firebase Storage)
- **Deployment**: Firebase Hosting

---

## 📁 Project Structure

```text
EATM CampusConnect/
├── .env.example                     # Environment variables template
├── firebase.json                    # Firebase hosting, firestore, and storage config
├── firestore.rules                  # Production Cloud Firestore security rules
├── storage.rules                    # Production Firebase Storage security rules
├── index.html                       # HTML5 template with Inter font
├── package.json                     # Dependencies and build scripts
├── tailwind.config.js               # EATM forest green & crimson design tokens
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite configuration
├── public/
│   └── eatm-logo.svg                # Official EATM shield crest SVG
└── src/
    ├── main.tsx                     # React DOM entry point
    ├── App.tsx                      # Main application router with role layouts
    ├── index.css                    # Tailwind directives and custom scrollbars
    ├── types/
    │   └── index.ts                 # Full TypeScript interfaces
    ├── firebase/
    │   ├── config.ts                # Firebase modular initialization & detection
    │   ├── auth.ts                  # Authentication service
    │   ├── firestore.ts             # Centralized Firestore & persistent fallback service
    │   ├── storage.ts               # Storage file upload with progress tracking
    │   └── seedData.ts              # Authentic campus data (students, clubs, events, posts)
    ├── contexts/
    │   ├── AuthContext.tsx          # Auth state, login/register, demo persona switcher
    │   └── ToastContext.tsx         # Notification toast system
    ├── components/
    │   ├── ui/                      # Button, Input, Select, Card, Avatar, Badge, Tabs, Modal, Skeleton
    │   ├── layout/                  # Navbar, Sidebar, RightSidebar, MobileBottomNav, Layouts
    │   ├── posts/                   # CreatePostCard, PostCard, CommentSection
    │   └── common/                  # DemoAccountBar, GlobalSearchModal, ReportModal
    └── pages/
        ├── public/                  # LandingPage, LoginPage, RegisterPage, ForgotPasswordPage
        ├── student/                 # StudentDashboard, StudentProfile, DiscoverPeople, Connections, etc.
        ├── faculty/                 # FacultyDashboard, FacultyAssignments, FacultyStudents
        ├── admin/                   # AdminDashboard, AdminUserManagement, AdminReports
        └── common/                  # AccessDenied, NotFound
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note on Zero-Config Sandbox Mode**:  
> If you have not created a Firebase project yet, **the application will automatically run in Sandbox Persistence Mode** with realistic seed data preloaded! All features (posting, liking, messaging, connecting, registering, uploading) function out of the box. Once you add your live `.env` credentials, it connects seamlessly to your live Firebase backend.

## 💻 Running the Application Locally

1. **Clone or navigate to the workspace directory**:
   ```bash
   cd "EATM CampusConnect"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

4. **Verify production bundle**:
   ```bash
   npm run build
   ```

---

## 🛡️ Creating the First Firebase Admin

To designate an administrator in your live Firebase project:
1. Register an account with an institutional email (e.g. `admin.dean@eatm.in`) through the app or Firebase Console Authentication.
2. In Firebase Console, navigate to **Cloud Firestore** ➔ `users` collection.
3. Locate the user document corresponding to the account's UID.
4. Set the field `role` to `'admin'`.
5. The user will immediately be granted access to `/admin/*` dashboards.

---

## ☁️ Deploying to Firebase Hosting

1. **Install the Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy security rules and frontend**:
   ```bash
   npm run build
   firebase deploy
   ```

The application is now live on your Firebase domain!
