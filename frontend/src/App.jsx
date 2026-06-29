import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import BookRoom from './pages/BookRoom.jsx';
import CalendarView from './pages/CalendarView.jsx';
import BookingHistory from './pages/BookingHistory.jsx';
import RoomManagement from './pages/RoomManagement.jsx';
import EquipmentManagement from './pages/EquipmentManagement.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import RoomsView from './pages/RoomsView.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Private Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-room"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <BookRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <RoomsView />
              </ProtectedRoute>
            }
          />

          {/* Admin / Owner Private Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner']}>
                <RoomManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/equipment"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner']}>
                <EquipmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner']}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Unified Private Routes (Accessible by Students and Admins) */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'owner']}>
                <CalendarView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin', 'owner']}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
