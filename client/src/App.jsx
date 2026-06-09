import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import useAuthStore from './store/authStore';
import ErrorBoundary from './components/shared/ErrorBoundary';
import RouteLoader from './components/shared/RouteLoader';

// Layouts (loaded eagerly — they're the app shell)
import UserLayout from './components/layout/UserLayout';
import RestaurantLayout from './components/layout/RestaurantLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';

// Auth (loaded eagerly — it's the entry point)
import Auth from './pages/auth/Auth';
import Home from './pages/Home';

// ── Lazy-loaded Pages ──────────────────────────────────────────────
// Admin
const Settings = lazy(() => import('./pages/admin/Settings'));

// Super Admin
const SADashboard = lazy(() => import('./pages/super-admin/Dashboard'));
const SASports = lazy(() => import('./pages/super-admin/Sports'));
const SAMemberships = lazy(() => import('./pages/super-admin/Memberships'));
const SASessionOvertime = lazy(() => import('./pages/super-admin/SessionOvertime'));
const SAOneTime = lazy(() => import('./pages/super-admin/OneTime'));
const SACommunication = lazy(() => import('./pages/super-admin/Communication'));
const SAOrderManagement = lazy(() => import('./pages/restaurant/RestaurantOrders'));
const SAMenuItems = lazy(() => import('./pages/restaurant/Menu'));

// User
const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const UserMembership = lazy(() => import('./pages/user/Membership'));
const OrderHistory = lazy(() => import('./pages/user/OrderHistory'));
const Profile = lazy(() => import('./pages/user/Profile'));
const UserReviews = lazy(() => import('./pages/user/Reviews'));
const ScanQR = lazy(() => import('./pages/user/ScanQR'));

// Restaurant
const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard'));
const LiveOrders = lazy(() => import('./pages/restaurant/Orders'));
const RestaurantOrderHistory = lazy(() => import('./pages/restaurant/RestaurantOrders'));
const RestaurantMenu = lazy(() => import('./pages/restaurant/Menu'));
const RestaurantTables = lazy(() => import('./pages/restaurant/Tables'));
const RestaurantSettings = lazy(() => import('./pages/restaurant/Settings'));

// Public
const TableOrder = lazy(() => import('./pages/table/TableOrder'));
const TablePortal = lazy(() => import('./pages/table/TablePortal'));
const OneTimeBookingPortal = lazy(() => import('./pages/OneTimeBookingPortal'));
const EntryPortal = lazy(() => import('./pages/EntryPortal'));
const MembershipPortal = lazy(() => import('./pages/MembershipPortal'));
const BookSlotsMarketplace = lazy(() => import('./pages/BookSlotsMarketplace'));
const SportDetailPage = lazy(() => import('./pages/SportDetailPage'));

// ── Auth Guard ─────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-[#111111] rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} />;
  }
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" />;
  return children;
}

import { connectSocket } from './lib/socket';

// ── App ────────────────────────────────────────────────────────────
export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Keep server warm — ping every 10 min to prevent cold starts on free hosting tiers
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const ping = () => fetch(`${apiBase}/health`).catch(() => {});
    ping();
    const keepAlive = setInterval(ping, 10 * 60 * 1000);

    // Connect socket on app load. Individual pages register their own targeted
    // socket listeners and invalidate only the queries they own. A blanket
    // onAny → invalidateQueries() here caused every event to cascade into
    // mass refetches, which in turn triggered more socket events (loop).
    connectSocket();

    return () => {
      clearInterval(keepAlive);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Auth />} />
              <Route path="/table-portal" element={<TablePortal />} />
              <Route path="/table/:tableId" element={<TableOrder />} />
              <Route path="/one-time-booking" element={<OneTimeBookingPortal />} />
              <Route path="/book-slots" element={<BookSlotsMarketplace />} />
              <Route path="/sports/:slug" element={<SportDetailPage />} />
              <Route path="/buy-membership" element={<MembershipPortal />} />
              <Route path="/entry/:qrSlug" element={<EntryPortal />} />

              {/* Super Admin Panel */}
              <Route path="/super-admin" element={
                <ProtectedRoute roles={['superadmin']}><SuperAdminLayout /></ProtectedRoute>
              }>
                <Route index element={<SADashboard />} />
                <Route path="sports" element={<SASports />} />
                <Route path="memberships" element={<SAMemberships />} />
                <Route path="session-overtime" element={<SASessionOvertime />} />
                <Route path="one-time" element={<SAOneTime />} />
                <Route path="communication" element={<SACommunication />} />
                <Route path="orders" element={<SAOrderManagement />} />
                <Route path="menu" element={<SAMenuItems />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* User/Student Panel */}
              <Route path="/user" element={
                <ProtectedRoute roles={['user']}><UserLayout /></ProtectedRoute>
              }>
                <Route index element={<UserDashboard />} />
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="scan" element={<ScanQR />} />
                <Route path="membership" element={<UserMembership />} />
                <Route path="book-slots" element={<BookSlotsMarketplace embedded />} />
                <Route path="one-time-booking" element={<OneTimeBookingPortal embedded />} />
                <Route path="sports/:slug" element={<SportDetailPage embedded />} />
                <Route path="buy-memberships" element={<MembershipPortal embedded />} />
                <Route path="table-portal" element={<TablePortal embedded />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="reviews" element={<UserReviews />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Restaurant Manager Panel */}
              <Route path="/restaurant" element={
                <ProtectedRoute roles={['manager', 'superadmin']}><RestaurantLayout /></ProtectedRoute>
              }>
                <Route index element={<RestaurantDashboard />} />
                <Route path="orders" element={<LiveOrders />} />
                <Route path="history" element={<RestaurantOrderHistory />} />
                <Route path="menu" element={<RestaurantMenu />} />
                <Route path="tables" element={<RestaurantTables />} />
                <Route path="settings" element={<RestaurantSettings />} />
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
