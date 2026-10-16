'use client';
// ============================================================
// FISENT - APP (Router + Auth Provider + Layout)
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppLayout, ProtectedRoute, PublicRoute } from './components/layout/Layout';

// Pages
import LoginPage from './screens/LoginPage';
import DashboardPage from './screens/DashboardPage';
import PatientsPage from './screens/patients/PatientsPage';
import PackagesPage from './screens/PackagesPage';
import AppointmentsPage from './screens/appointments/AppointmentsPage';
import CalendarPage from './screens/CalendarPage';
import HistoryPage from './screens/history/HistoryPage';
import PaymentsPage from './screens/PaymentsPage';
import ProfessionalsPage from './screens/ProfessionalsPage';
import Cie10Page from './screens/Cie10Page';
import ReportsPage from './screens/ReportsPage';
import CheckInPage from './screens/CheckInPage';
import TariffsPage from './screens/TariffsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PatientsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PackagesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AppointmentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PaymentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionals"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfessionalsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cie10"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Cie10Page />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/check-in"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CheckInPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tariffs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TariffsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
