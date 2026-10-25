import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';

// Route Guards
import ProtectedRoute from './components/routing/ProtectedRoute';

// Pages - Public
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const StaffLayout = lazy(() => import('./layouts/StaffLayout'));
const Home = lazy(() => import('./pages/public/Home'));
const Packages = lazy(() => import('./pages/public/Packages'));
const PackageDetail = lazy(() => import('./pages/public/PackageDetail'));
const CustomPlanner = lazy(() => import('./pages/public/CustomPlanner'));
const ExploreMap = lazy(() => import('./pages/public/ExploreMap'));
const CarRentals = lazy(() => import('./pages/public/CarRentals'));
const CarBooking = lazy(() => import('./pages/public/CarBooking'));
const AboutUs = lazy(() => import('./pages/public/AboutUs'));
const Profile = lazy(() => import('./pages/public/Profile'));
const Review = lazy(() => import('./pages/public/Review'));
const RescheduleTrip = lazy(() => import('./pages/public/RescheduleTrip'));
const Wishlist = lazy(() => import('./pages/public/Wishlist'));
const SupportChat = lazy(() => import('./pages/public/SupportChat'));
const Booking = lazy(() => import('./pages/public/Booking'));

// Pages - Auth
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const EmailVerification = lazy(() => import('./pages/auth/EmailVerification'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));

// Pages - Admin Dashboard
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const SalesReports = lazy(() => import('./pages/admin/SalesReports'));
const ExpenseReports = lazy(() => import('./pages/admin/ExpenseReports'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSchedule = lazy(() => import('./pages/admin/Schedule'));
const AdminBookings = lazy(() => import('./pages/admin/Bookings'));
const ManageServices = lazy(() => import('./pages/admin/ManageServices'));
const ServiceDetailPage = lazy(() => import('./pages/admin/ServiceDetailPage'));
const ManageTourPackages = lazy(() => import('./pages/admin/ManageTourPackages'));
const ManageTuktripPackages = lazy(() => import('./pages/admin/ManageTuktripPackages'));
const ManageCarRentals = lazy(() => import('./pages/admin/ManageCarRentals'));
const AddTourPackagePage = lazy(() => import('./pages/admin/AddTourPackagePage'));
const AddTuktripPage = lazy(() => import('./pages/admin/AddTuktripPage'));
const AddCarRentalPage = lazy(() => import('./pages/admin/AddCarRentalPage'));
const EditTourPackagePage = lazy(() => import('./pages/admin/EditTourPackagePage'));
const EditTuktripPage = lazy(() => import('./pages/admin/EditTuktripPage'));
const EditCarRentalPage = lazy(() => import('./pages/admin/EditCarRentalPage'));
const CarRentalDetailPage = lazy(() => import('./pages/admin/CarRentalDetailPage'));
const TourPackageDetailPage = lazy(() => import('./pages/admin/TourPackageDetailPage'));
const AddServicePage = lazy(() => import('./pages/admin/AddServicePage'));
const ManageCustomizations = lazy(() => import('./pages/admin/ManageCustomizations'));
const ManageAccounts = lazy(() => import('./pages/admin/ManageAccounts'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const Inquiries = lazy(() => import('./pages/admin/Inquiries'));

// Pages - Staff Dashboard
const StaffDashboard = lazy(() => import('./pages/staff/Dashboard'));
const MyTours = lazy(() => import('./pages/staff/MyTours'));
const Calendar = lazy(() => import('./pages/staff/Calendar'));

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfirmationProvider>
          <BrowserRouter>
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading...</div>}>
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
              <Route
                path="car-rentals/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                    <CarBooking />
                  </ProtectedRoute>
                }
              />
              <Route path="about" element={<AboutUs />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="support/chat" element={<SupportChat />} />
              
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
              
              <Route 
                path="reschedule/:id" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                    <RescheduleTrip />
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
              <Route path="reviews" element={<AdminReviews />} />
            <Route path="inquiries" element={<Inquiries />} />
              <Route path="services" element={<ManageServices />} />
              <Route path="services/:category/:id" element={<ServiceDetailPage />} />
              <Route path="tour-packages" element={<ManageTourPackages />} />
              <Route path="tour-packages/add" element={<AddTourPackagePage />} />
              <Route path="tour-packages/edit/:id" element={<EditTourPackagePage />} />
              <Route path="tour-packages/:id" element={<TourPackageDetailPage />} />
              <Route path="tuktrip" element={<ManageTuktripPackages />} />
              <Route path="tuktrip/add" element={<AddTuktripPage />} />
              <Route path="tuktrip/edit/:id" element={<EditTuktripPage />} />
              <Route path="car-rentals" element={<ManageCarRentals />} />
              <Route path="car-rentals/add" element={<AddCarRentalPage />} />
              <Route path="car-rentals/edit/:id" element={<EditCarRentalPage />} />
              <Route path="car-rentals/:id" element={<CarRentalDetailPage />} />
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
              <Route path="inquiries" element={<Inquiries />} />
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          </BrowserRouter>
        </ConfirmationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
