import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { FacultyLayout } from './components/layout/FacultyLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { AccessDenied } from './pages/common/AccessDenied';
import { NotFound } from './pages/common/NotFound';
import { PostDetailPage } from './pages/common/PostDetailPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { DiscoverPeople } from './pages/student/DiscoverPeople';
import { ConnectionsPage } from './pages/student/ConnectionsPage';
import { MessagesPage } from './pages/student/MessagesPage';
import { CommunitiesPage } from './pages/student/CommunitiesPage';
import { EventsPage } from './pages/student/EventsPage';
import { StudyMaterialsPage } from './pages/student/StudyMaterialsPage';
import { OpportunitiesPage } from './pages/student/OpportunitiesPage';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { StudentSettings } from './pages/student/StudentSettings';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyStudents } from './pages/faculty/FacultyStudents';
import { FacultyAssignments } from './pages/faculty/FacultyAssignments';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminReports } from './pages/admin/AdminReports';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Direct Post Share Routes (both clean /post/:id and legacy /post-:id) */}
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/post-:id" element={<PostDetailPage />} />

            {/* Student Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="profile/:id" element={<StudentProfile />} />
              <Route path="discover" element={<DiscoverPeople />} />
              <Route path="connections" element={<ConnectionsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="study-materials" element={<StudyMaterialsPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="post/:id" element={<PostDetailPage />} />
              <Route path="post-:id" element={<PostDetailPage />} />
            </Route>

            {/* Faculty Routes */}
            <Route path="/faculty" element={<FacultyLayout />}>
              <Route index element={<Navigate to="/faculty/dashboard" replace />} />
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="announcements" element={<FacultyDashboard />} />
              <Route path="students" element={<FacultyStudents />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="study-materials" element={<StudyMaterialsPage />} />
              <Route path="assignments" element={<FacultyAssignments />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="post/:id" element={<PostDetailPage />} />
              <Route path="post-:id" element={<PostDetailPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminUserManagement />} />
              <Route path="faculty" element={<AdminUserManagement />} />
              <Route path="posts" element={<StudentDashboard />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="announcements" element={<FacultyDashboard />} />
              <Route path="settings" element={<StudentSettings />} />
              <Route path="post/:id" element={<PostDetailPage />} />
              <Route path="post-:id" element={<PostDetailPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </HashRouter>
  );
};

export default App;
