import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './features/auth/contexts/AuthContext.jsx';
import AuthModalRoute from './features/auth/components/AuthModalRoute.jsx';
import { CartProvider } from './features/cart/contexts/CartContext.jsx';
import { WishlistProvider } from './features/wishlist/index.js';
import { CompareProvider } from './features/compare/index.js';
import { AdminRoute, ProtectedRoute } from './components/navigation/index.js';
import { AdminLayout, ClientLayout } from './components/layout/index.js';

import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PaymentResultPage from './pages/PaymentResultPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import Dashboard from './features/admin/pages/Dashboard.jsx';
import Products from './features/admin/pages/Products.jsx';
import Orders from './features/admin/pages/Orders.jsx';
import Users from './features/admin/pages/Users.jsx';
import Reviews from './features/admin/pages/Reviews.jsx';
import Payments from './features/admin/pages/Payments.jsx';
import Inventory from './features/admin/pages/Inventory.jsx';
import Coupons from './features/admin/pages/Coupons.jsx';
import ContentPages from './features/admin/pages/ContentPages.jsx';
import Categories from './features/admin/pages/Categories.jsx';
import Notifications from './features/admin/pages/Notifications.jsx';
import AdminChat from './features/admin/pages/AdminChat.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <ScrollToTop />
      <Routes location={backgroundLocation || location}>
        {/* Public storefront routes wrapped in ClientLayout */}
        <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
        <Route path="/catalog" element={<ClientLayout><CatalogPage /></ClientLayout>} />
        <Route path="/san-pham/:slug" element={<ClientLayout><CategoryPage /></ClientLayout>} />
        <Route path="/products/:id" element={<ClientLayout><ProductDetailPage /></ClientLayout>} />
        <Route path="/compare" element={<ClientLayout><ComparePage /></ClientLayout>} />
        <Route path="/collections" element={<ClientLayout><ContentPage slug="bo-suu-tap" /></ClientLayout>} />
        <Route path="/about" element={<ClientLayout><ContentPage slug="gioi-thieu" /></ClientLayout>} />
        <Route path="/showroom" element={<ClientLayout><ContentPage slug="showroom" /></ClientLayout>} />
        <Route path="/contact" element={<ClientLayout><ContentPage slug="lien-he" /></ClientLayout>} />
        <Route path="/policies" element={<ClientLayout><ContentPage slug="chinh-sach-giao-hang" /></ClientLayout>} />
        <Route path="/pages/:slug" element={<ClientLayout><ContentPage /></ClientLayout>} />
        <Route path="/cart" element={<ClientLayout><CartPage /></ClientLayout>} />
        <Route path="/payment/result" element={<ClientLayout><PaymentResultPage /></ClientLayout>} />

        {/* Protected storefront routes wrapped in ClientLayout */}
        <Route path="/checkout" element={
          <ProtectedRoute><ClientLayout><CheckoutPage /></ClientLayout></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ClientLayout><ProfilePage /></ClientLayout></ProtectedRoute>
        } />

        {/* Admin routes wrapped in AdminLayout */}
        <Route path="/admin" element={
          <AdminRoute><AdminLayout /></AdminRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="payments" element={<Payments />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="content" element={<ContentPages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>

        {/* Customer auth uses routed popups; admin login remains standalone. */}
        <Route path="/login" element={<AuthModalRoute mode="login" withFallback />} />
        <Route path="/register" element={<AuthModalRoute mode="register" withFallback />} />
        <Route path="/admin/login" element={<LoginPage adminOnly />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/search" element={<ClientLayout><SearchPage /></ClientLayout>} />
        <Route path="/orders" element={
          <ProtectedRoute><ClientLayout><OrderHistoryPage /></ClientLayout></ProtectedRoute>
        } />
        <Route path="/orders/:orderId" element={
          <ProtectedRoute><ClientLayout><OrderDetailPage /></ClientLayout></ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="/login" element={<AuthModalRoute mode="login" />} />
          <Route path="/register" element={<AuthModalRoute mode="register" />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CompareProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </CompareProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
