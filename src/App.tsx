import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { FacultyLayout } from './components/layout/FacultyLayout';

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

const ProfileRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role === 'faculty' ? 'faculty' : 'student';
  return <Navigate to={`/${role}/profile/${id}`} replace />;
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf9] dark:bg-[#0a120d]">
        <div className="w-10 h-10 border-4 border-[#0b4627] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-[#0b4627] tracking-wider uppercase">Loading EATM CampusConnect...</p>
      </div>
    );
  }

  const getDashboardPath = () => {
    if (user?.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <Routes>
      {/* Public Routes: Authenticated users are routed straight to their official dashboard! */}
      <Route path="/" element={user ? <Navigate to={getDashboardPath()} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardPath()} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getDashboardPath()} replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Direct Post Share Routes (both clean /post/:id and legacy /post-:id) */}
      <Route path="/post/:id" element={<PostDetailPage />} />
      <Route path="/post-:id" element={<PostDetailPage />} />

      {/* Direct Profile Route with Auto-Role Redirect */}
      <Route path="/profile/:id" element={<ProfileRedirect />} />

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
              <Route path="profile/:id" element={<StudentProfile />} />
              <Route path="post/:id" element={<PostDetailPage />} />
              <Route path="post-:id" element={<PostDetailPage />} />
            </Route>

      {/* Legacy Admin Route Fallback */}
      <Route path="/admin/*" element={<Navigate to="/" replace />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;
