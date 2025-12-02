
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerLogin from './pages/PartnerLogin';
import ResetPassword from './pages/ResetPassword';
import PartnerCoupons from './pages/PartnerCoupons';
import PartnerEarnings from './pages/PartnerEarnings';
import PartnerLayout from './components/PartnerLayout';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Routes>
            <Route path="/login" element={<PartnerLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={
              <ProtectedRoute>
                <PartnerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PartnerDashboard />} />
              <Route path="coupons" element={<PartnerCoupons />} />
              <Route path="earnings" element={<PartnerEarnings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
