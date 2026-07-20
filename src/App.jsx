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
import CarRentals from './pages/public/CarRentals';
import CarBooking from './pages/public/CarBooking';
import AboutUs from './pages/public/AboutUs';
import Profile from './pages/public/Profile';
import Review from './pages/public/Review';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import EmailVerification from './pages/auth/EmailVerification';
import ChangePassword from './pages/auth/ChangePassword';

// Pages - Admin Dashboard
import AdminDashboard from './pages/admin/Dashboard';
import SalesReports from './pages/admin/SalesReports';
import ExpenseReports from './pages/admin/ExpenseReports';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSchedule from './pages/admin/Schedule';
import AdminBookings from './pages/admin/Bookings';
import ManageServices from './pages/admin/ManageServices';
import ServiceDetailPage from './pages/admin/ServiceDetailPage';
import ManageTourPackages from './pages/admin/ManageTourPackages';
import ManageTuktripPackages from './pages/admin/ManageTuktripPackages';
import ManageCarRentals from './pages/admin/ManageCarRentals';
import AddTourPackagePage from './pages/admin/AddTourPackagePage';
import AddTuktripPage from './pages/admin/AddTuktripPage';
import AddCarRentalPage from './pages/admin/AddCarRentalPage';
import EditTourPackagePage from './pages/admin/EditTourPackagePage';
import EditTuktripPage from './pages/admin/EditTuktripPage';
import EditCarRentalPage from './pages/admin/EditCarRentalPage';
import AddServicePage from './pages/admin/AddServicePage';
import ManageCustomizations from './pages/admin/ManageCustomizations';
import ManageAccounts from './pages/admin/ManageAccounts';

// Pages - Staff Dashboard
import StaffDashboard from './pages/staff/Dashboard';
import MyTours from './pages/staff/MyTours';
import Calendar from './pages/staff/Calendar';

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
              <Route path="gallery" element={<Navigate to="/explore" replace />} />
              <Route path="customize" element={<CustomPlanner />} />
              <Route path="explore" element={<ExploreMap />} />
              <Route path="car-rentals" element={<CarRentals />} />
              <Route path="car-rentals/:id" element={<CarBooking />} />
              <Route path="about" element={<AboutUs />} />
              
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="review/:id" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Review />
                  </ProtectedRoute>
                } 
              />
              
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
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="verify-email" element={<EmailVerification />} />
              <Route path="change-password" element={<ChangePassword />} />
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
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="services" element={<ManageServices />} />
              <Route path="services/:category/:id" element={<ServiceDetailPage />} />
              <Route path="tour-packages" element={<ManageTourPackages />} />
              <Route path="tour-packages/add" element={<AddTourPackagePage />} />
              <Route path="tour-packages/edit/:id" element={<EditTourPackagePage />} />
              <Route path="tuktrip" element={<ManageTuktripPackages />} />
              <Route path="tuktrip/add" element={<AddTuktripPage />} />
              <Route path="tuktrip/edit/:id" element={<EditTuktripPage />} />
              <Route path="car-rentals" element={<ManageCarRentals />} />
              <Route path="car-rentals/add" element={<AddCarRentalPage />} />
              <Route path="car-rentals/edit/:id" element={<EditCarRentalPage />} />
              <Route path="services/add-tour-package" element={<AddTourPackagePage />} />
              <Route path="services/add-tuktrip" element={<AddTuktripPage />} />
              <Route path="services/add-car-rental" element={<AddCarRentalPage />} />
              <Route path="services/add-service" element={<AddServicePage />} />
              <Route path="services/edit-tour-package/:id" element={<EditTourPackagePage />} />
              <Route path="services/edit-tuktrip/:id" element={<EditTuktripPage />} />
              <Route path="services/edit-car-rental/:id" element={<EditCarRentalPage />} />
              <Route path="packages" element={<Navigate to="/admin/tour-packages" replace />} />
              <Route path="customizations" element={<ManageCustomizations />} />
              <Route path="accounts" element={<ManageAccounts />} />
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
              <Route path="my-tours" element={<MyTours />} />
              <Route path="calendar" element={<Calendar />} />
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
