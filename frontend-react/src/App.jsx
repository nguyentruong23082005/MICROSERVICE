import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/contexts/AuthContext.jsx';
import { CartProvider } from './features/cart/contexts/CartContext.jsx';
import { WishlistProvider } from './features/wishlist/index.js';
import { CompareProvider } from './features/compare/index.js';
import { AdminRoute, ProtectedRoute } from './components/navigation/index.js';
import { AdminLayout, ClientLayout } from './components/layout/index.js';

import HomePage from './pages/HomePage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
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



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CompareProvider>
          <CartProvider>
            <Routes>
              {/* Public storefront routes wrapped in ClientLayout */}
              <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
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
              </Route>

              {/* Auth routes (public, no layout) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </CartProvider>
          </CompareProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
