# 🎓 EATM CampusConnect

<div align="center">
  <img src="public/eatm-official-logo.png" alt="EATM CampusConnect Logo" width="130" />
  
  ### **"Connect • Collaborate • Grow"**
  
  A modern, high-performance digital campus social network and academic collaboration platform designed specifically for **Einstein Academy of Technology and Management (EATM)**, Bhubaneswar.

  [![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg?logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3ecf8e.svg?logo=supabase)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 🏛️ About EATM CampusConnect

**EATM CampusConnect** unifies campus life into a secure, single-sign-on institutional platform. Students and faculty can exchange study materials, collaborate on engineering projects, form chartered clubs, discover campus placement drives, and communicate in real-time with zero friction.

### 🎨 Visual Identity & Brand System
- **Primary Color Palette**: 
  - Deep Institutional Forest Green (`#0b4627` / `#062615`)
  - Vibrant Emerald (`#10b981` / `#22c55e`)
  - Accent Crimson Red (`#dc2626` / `#b91c1c`)
  - Clean Surface White & Dark Slate (`#111d15` / `#16251c`)
- **Design Tokens**: Rounded `2xl`/`3xl` surfaces, subtle borders, glassmorphic headers, responsive bottom navigation for mobile, and calibrated Instagram-style active green presence dots.
- **Portals**: Role-based access control protecting **Student** and **Faculty** experiences with Supabase Auth session management.

---

## ✨ Features Overview

### 1. 🌐 Public Gateway & Institutional Identity
- **Landing Page (`/`)**: 
  - Hero banner with official EATM crest and collegiate photography.
  - Interactive video tour modal exploring the EATM campus infrastructure.
  - 4 quick feature highlights, academic program cards, and institutional contact footer.
- **Role-Based Authentication (`/login` & `/register`)**:
  - Secure email & password authentication powered by **Supabase Auth**.
  - Sign in using either **Institutional Email** or **BPUT Registration / Roll Number**.
  - Student registration form collecting Full Name, Roll Number, Branch (CSE, EEE, MECH, CIVIL, etc.), Year, Semester, and Phone.
  - Faculty registration form collecting Employee ID, Designation, and Department.
  - **Quick Demo Switcher (`DemoAccountBar`)**: One-tap instant testing between student and faculty personas.
- **Password Recovery (`/forgot-password`)**: Automated reset link dispatch via Supabase Auth.

---

### 2. 🎒 Student Social & Academic Portal (`/student/*`)

| Page | Route | Highlights |
| :--- | :--- | :--- |
| **Dashboard** | `/student/dashboard` | Personalized morning greeting, real-time KPI counters (Events, Messages, Opportunities), multimedia post composer (images, videos, attachments, feeling tags, campus vs. connections visibility), social feed with live like/unlike toggles, comment threads, and shareable permalinks (`/post/:id`). |
| **Student Profile** | `/student/profile` | Custom cover photos, profile avatar upload, roll number verification badges, skills pills, project portfolio showcase, campus honors, and interactive profile editor. |
| **Discover People** | `/student/discover` | Search peers by student name, roll number, or technical skills with departmental filter chips (*CSE, ECE, EEE, Mech, Civil*). Send instant connection requests. |
| **Connections Manager** | `/student/connections` | Manage incoming and sent connection requests with real-time `Accept` and `Decline` controls. |
| **Real-time Encrypted Chat** | `/student/messages` | Full-fledged WhatsApp-style campus messaging with Realtime broadcast sync, live voice notes recorder (`ChatAudioPlayer`), camera snapshot modal, file attachment preview lightbox, deduplication engine, typing indicators, active presence green dots, and "Delete for everyone". |
| **Clubs & Communities** | `/student/communities` | Chartered student clubs (Coding, Robotics, Photography, Cultural, Sports, Entrepreneurship) with live member counts, join toggles, and new club charter modal. |
| **Campus Events** | `/student/events` | Tech fests, workshops, hackathons, and cultural fests with category filters, seat reservations, and confetti celebration triggers. |
| **Study Materials** | `/student/study-materials` | BPUT previous year question papers, PowerPoint lecture slides, course notes, and lab manuals with file upload and instant download. |
| **Opportunities Hub** | `/student/opportunities` | Curated campus placement drives, regional startup internships, stipend details, eligibility criteria, and application submitter. |
| **Notifications** | `/student/notifications` | Categorized real-time notifications for messages, connection requests, and event announcements. |
| **Settings & Privacy** | `/student/settings` | Comprehensive controls for profile visibility, messaging permissions, activity status, dark mode theme toggle, and password updates. |

---

### 3. 👨‍🏫 Faculty Portal (`/faculty/*`)

- **Faculty Dashboard (`/faculty/dashboard`)**:
  - Live metric counters: Total Students, Active Events, Assignments, Pending Reports.
  - **Campus Notice Publisher**: Broadcast departmental notices with priority badges (*Urgent*, *Important*, *Normal*).
- **Coursework & Assignments (`/faculty/assignments`)**:
  - Assignment creator with target semester, due date, rubrics, and submission tracking.
- **Student Cohorts Directory (`/faculty/students`)**:
  - Searchable departmental student directory displaying roll numbers, semester, and academic standing.

---

### 4. 🛡️ Developer & Administrator Backend Governance

Administration is conducted directly via the **[Supabase Dashboard](https://supabase.com/dashboard)**:
- **User & Roll Number Verification**: Manage profiles, verify registration numbers, and toggle account status in the `profiles` / `users` table.
- **Authentication & Security**: Monitor registered users, inspect last login timestamps, and manage sessions in **Authentication &rarr; Users** and **Auth Logs**.
- **Content & Community Moderation**: Moderate posts, manage comments, review student club charters, and handle reported content with full PostgreSQL control or custom SQL queries.
- **Zero Exposed Admin Attack Surface**: No client `/admin` route or credentials exposed in the frontend bundle.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, PostCSS, Lucide React Icons
- **Real-Time Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
  - **Database**: PostgreSQL with Row-Level Security (RLS)
  - **Auth**: Supabase Auth (Email & Password, Metadata)
  - **Storage**: Supabase Storage (`campus-uploads` bucket)
  - **Realtime**: Supabase Realtime Channels (Broadcast & Postgres Changes)
- **Effects**: Canvas Confetti
- **Routing**: React Router DOM v6

---

## 📁 Project Directory Structure

```text
EATM CampusConnect/
├── .env.example                         # Environment variables template
├── index.html                           # HTML5 template with Inter font & meta tags
├── package.json                         # Dependencies and build scripts
├── tailwind.config.js                   # EATM institutional color palette & design tokens
├── tsconfig.json                        # TypeScript compiler options
├── vite.config.ts                       # Vite build configuration
├── public/
│   ├── eatm-official-logo.png           # Official EATM emblem
│   └── eatm-emblem.png                  # Collegiate crest
└── src/
    ├── main.tsx                         # React application entry point
    ├── App.tsx                          # App router with student & faculty layouts
    ├── index.css                        # Tailwind directives and custom scrollbars
    ├── types/
    │   └── index.ts                     # TypeScript interfaces (User, Post, Message, Event, etc.)
    ├── contexts/
    │   ├── AuthContext.tsx              # Auth state, login/register, demo switcher
    │   └── ToastContext.tsx             # Notification toast provider
    ├── components/
    │   ├── ui/                          # Avatar, Button, Card, Badge, Modal, Input, etc.
    │   ├── layout/                      # Navbar, Sidebar, RightSidebar, MobileBottomNav, Layouts
    │   ├── chat/                        # CameraModal, ChatAudioPlayer, MediaLightbox
    │   ├── posts/                       # CreatePostCard, PostCard, CommentSection
    │   └── common/                      # DemoAccountBar, GlobalSearchModal, ReportModal
    ├── pages/
    │   ├── public/                      # LandingPage, LoginPage, RegisterPage, ForgotPasswordPage
    │   ├── student/                     # StudentDashboard, Profile, Messages, Communities, Events, etc.
    │   ├── faculty/                     # FacultyDashboard, FacultyAssignments, FacultyStudents
    │   └── common/                      # PostDetailPage, AccessDenied, NotFound
    └── supabase/
        ├── client.ts                    # Supabase client initialization & connection checks
        ├── auth.ts                      # Supabase Auth operations & credential resolution
        ├── db.ts                        # Centralized database CRUD, queries & real-time sync
        ├── presence.ts                  # Real-time online presence, heartbeats & typing indicators
        ├── storage.ts                   # Supabase Storage file uploader (campus-uploads)
        ├── schema.sql                   # Complete PostgreSQL schema, tables, policies & realtime
        └── seedData.ts                  # Realistic campus seed data (students, clubs, events, posts)
```

---

## ⚙️ Environment Configuration

1. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

> **Zero-Config Sandbox Mode**:  
> If Supabase credentials are not provided, the application will automatically run in **Local Persistence Mode** with preloaded campus seed data. All features (posting, liking, messaging, connections, events) will work out of the box for testing and evaluation!

---

## 🗄️ Database Setup (Supabase)

To link your live Supabase project:
1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** &rarr; **New Query**.
3. Copy the entire contents of [`src/supabase/schema.sql`](src/supabase/schema.sql) and click **Run**.
4. This script automatically:
   - Creates the public storage bucket `campus-uploads` with public read/write policies.
   - Creates tables: `users`, `posts`, `comments`, `communities`, `conversations`, `messages`, `connections`, `notifications`, `reports`.
   - Enables Row-Level Security (RLS) policies.
   - Activates PostgreSQL publications for `supabase_realtime` on messages, posts, comments, connections, and notifications.

---

## 💻 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/S-R-Sahoo/EATM-CampusConnect.git
   cd EATM-CampusConnect
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` (or the port shown in terminal).

4. **Verify the production build**:
   ```bash
   npm run build
   ```

---

## 🚢 Production Deployment

The project builds standard optimized static assets in `dist/`. It can be deployed to:
- **Vercel**: Import the GitHub repo and deploy with default Vite preset.
- **Netlify**: Connect repository, set build command `npm run build` and publish directory `dist`.
- **Cloudflare Pages / GitHub Pages**: Deploy the `dist` directory with SPA rewrite rules (`/*` &rarr; `/index.html`).

---

## 📄 License

This project is licensed under the **MIT License**.

<div align="center">
  <sub>Built with ❤️ for Einstein Academy of Technology and Management (EATM), Bhubaneswar.</sub>
</div>
