import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Route Guards
import ProtectedRoute from './components/routing/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';

// Pages - Public
import Home from './pages/public/Home';
import Packages from './pages/public/Packages';
import PackageDetail from './pages/public/PackageDetail';
import Gallery from './pages/public/Gallery';
import CustomPlanner from './pages/public/CustomPlanner';
import ExploreMap from './pages/public/ExploreMap';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages - Admin Dashboard
import AdminDashboard from './pages/admin/Dashboard';
import SalesReports from './pages/admin/SalesReports';
import ExpenseReports from './pages/admin/ExpenseReports';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSchedule from './pages/admin/Schedule';
import ManagePackages from './pages/admin/ManagePackages';
import ManageCustomizations from './pages/admin/ManageCustomizations';

// Pages - Staff Dashboard
import StaffDashboard from './pages/staff/Dashboard';
import BookingManagement from './pages/staff/BookingManagement';
import TripUploads from './pages/staff/TripUploads';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Tourist Journeys */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="packages" element={<Packages />} />
              <Route path="packages/:id" element={<PackageDetail />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="customize" element={<CustomPlanner />} />
              <Route path="explore" element={<ExploreMap />} />
              
              {/* Protected Tourist Booking */}
              <Route 
                path="booking/:packageId" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                    <Booking />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Authentication Split Screens */}
            <Route element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Admin Management Dashboard */}
            <Route 
              path="admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="sales" element={<SalesReports />} />
              <Route path="expenses" element={<ExpenseReports />} />
              <Route path="destinations" element={<AdminAnalytics />} />
              <Route path="schedule" element={<AdminSchedule />} />
              <Route path="packages" element={<ManagePackages />} />
              <Route path="customizations" element={<ManageCustomizations />} />
            </Route>

            {/* Staff Management Dashboard */}
            <Route 
              path="staff" 
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="bookings" element={<BookingManagement />} />
              <Route path="uploads" element={<TripUploads />} />
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

// Inline import helper since Booking is in same folder scope
import Booking from './pages/public/Booking';

export default App;
