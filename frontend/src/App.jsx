import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AlumniPage from './pages/AlumniPage';
import MentorshipPage from './pages/MentorshipPage';
import MessagesPage from './pages/MessagesPage';
import JobsPage from './pages/JobsPage';
import EventsPage from './pages/EventsPage';
import CareerAIPage from './pages/CareerAIPage';
import ProfilePage from './pages/ProfilePage';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="spinner" />
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        Loading AlumniConnect...
      </motion.span>
    </motion.div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }) => (
  <>
    <Sidebar />
    <Navbar />
    <main className="main-content">{children}</main>
  </>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} />
      <Route path="/alumni" element={<PrivateRoute><AppLayout><AlumniPage /></AppLayout></PrivateRoute>} />
      <Route path="/mentorship" element={<PrivateRoute><AppLayout><MentorshipPage /></AppLayout></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><AppLayout><MessagesPage /></AppLayout></PrivateRoute>} />
      <Route path="/messages/:userId" element={<PrivateRoute><AppLayout><MessagesPage /></AppLayout></PrivateRoute>} />
      <Route path="/jobs" element={<PrivateRoute><AppLayout><JobsPage /></AppLayout></PrivateRoute>} />
      <Route path="/events" element={<PrivateRoute><AppLayout><EventsPage /></AppLayout></PrivateRoute>} />
      <Route path="/career-ai" element={<PrivateRoute><AppLayout><CareerAIPage /></AppLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><AppLayout><ProfilePage /></AppLayout></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0d1120',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0d1120' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0d1120' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
