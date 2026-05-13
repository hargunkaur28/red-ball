import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import useAuthStore from './store/authStore';
import ErrorBoundary from './components/shared/ErrorBoundary';
import RouteLoader from './components/shared/RouteLoader';

// Layouts (loaded eagerly — they're the app shell)
import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';
import RestaurantLayout from './components/layout/RestaurantLayout';
import ReceptionLayout from './components/layout/ReceptionLayout';

// Auth (loaded eagerly — it's the entry point)
import Login from './pages/auth/Login';
import Home from './pages/Home';

// ── Lazy-loaded Pages ──────────────────────────────────────────────
// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Admissions = lazy(() => import('./pages/admin/Admissions'));
const MembershipPlans = lazy(() => import('./pages/admin/MembershipPlans'));
const StudentMemberships = lazy(() => import('./pages/admin/StudentMemberships'));
const OneTimePlay = lazy(() => import('./pages/admin/OneTimePlay'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const UsersRoles = lazy(() => import('./pages/admin/UsersRoles'));
const Settings = lazy(() => import('./pages/admin/Settings'));

// User
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const UserMembership = lazy(() => import('./pages/user/Membership'));
const FoodOrdering = lazy(() => import('./pages/user/FoodOrdering'));
const OrderHistory = lazy(() => import('./pages/user/OrderHistory'));
const Profile = lazy(() => import('./pages/user/Profile'));

// Restaurant
const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard'));
const RestaurantOrders = lazy(() => import('./pages/restaurant/Orders'));
const RestaurantMenu = lazy(() => import('./pages/restaurant/Menu'));
const RestaurantInventory = lazy(() => import('./pages/restaurant/Inventory'));
const RestaurantTables = lazy(() => import('./pages/restaurant/Tables'));

// Reception
const ReceptionDashboard = lazy(() => import('./pages/reception/Dashboard'));

// Public
const TableOrder = lazy(() => import('./pages/table/TableOrder'));

// ── Auth Guard ─────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-[#111111] rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" />;
  return children;
}

// ── App ────────────────────────────────────────────────────────────
export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/table/:tableId" element={<TableOrder />} />

              {/* Admin Panel */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['superadmin', 'admin']}><AdminLayout /></ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="admissions" element={<Admissions />} />
                <Route path="memberships" element={<StudentMemberships />} />
                <Route path="plans" element={<MembershipPlans />} />
                <Route path="one-time-play" element={<OneTimePlay />} />
                <Route path="payments" element={<Payments />} />
                <Route path="restaurant" element={<RestaurantOrders />} />
                <Route path="inventory" element={<RestaurantInventory />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="users" element={<UsersRoles />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* User/Student Panel */}
              <Route path="/user" element={
                <ProtectedRoute roles={['student', 'customer']}><UserLayout /></ProtectedRoute>
              }>
                <Route index element={<UserDashboard />} />
                <Route path="membership" element={<UserMembership />} />
                <Route path="food" element={<FoodOrdering />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Restaurant Manager Panel */}
              <Route path="/restaurant" element={
                <ProtectedRoute roles={['manager', 'superadmin', 'admin']}><RestaurantLayout /></ProtectedRoute>
              }>
                <Route index element={<RestaurantDashboard />} />
                <Route path="orders" element={<RestaurantOrders />} />
                <Route path="menu" element={<RestaurantMenu />} />
                <Route path="inventory" element={<RestaurantInventory />} />
                <Route path="tables" element={<RestaurantTables />} />
              </Route>

              {/* Reception Panel */}
              <Route path="/reception" element={
                <ProtectedRoute roles={['receptionist', 'superadmin', 'admin']}><ReceptionLayout /></ProtectedRoute>
              }>
                <Route index element={<ReceptionDashboard />} />
                <Route path="admissions" element={<Admissions />} />
                <Route path="memberships" element={<StudentMemberships />} />
                <Route path="one-time-play" element={<OneTimePlay />} />
                <Route path="payments" element={<Payments />} />
              </Route>

              {/* Redirect root */}
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #EAEAEA',
            color: '#111111',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
