import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { FloatingVoiceAssistant } from './components/FloatingVoiceAssistant.js';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center text-[#1E4620] text-lg font-bold">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-[#1E4620] border-t-transparent rounded-full animate-spin" />
          <span>{t('app_loading', 'Loading AgriAdvisor...')}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Distinct Sub-routes for Dashboard (Part 4 Mandate) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage section="overview" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/overview"
            element={
              <ProtectedRoute>
                <DashboardPage section="overview" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/farms"
            element={
              <ProtectedRoute>
                <DashboardPage section="farms" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/farms/:farmId"
            element={
              <ProtectedRoute>
                <DashboardPage section="farm-detail" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/weather"
            element={
              <ProtectedRoute>
                <DashboardPage section="weather" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/market"
            element={
              <ProtectedRoute>
                <DashboardPage section="market" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ai-predictions"
            element={
              <ProtectedRoute>
                <DashboardPage section="ai-predictions" />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingVoiceAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
