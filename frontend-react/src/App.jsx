import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import ClientLayout from './layouts/ClientLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import AdminProducts from './pages/Admin/AdminProducts.jsx';
import AdminOrders from './pages/Admin/AdminOrders.jsx';
import AdminUsers from './pages/Admin/AdminUsers.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public storefront routes wrapped in ClientLayout */}
            <Route path="/" element={<ClientLayout><HomePage /></ClientLayout>} />
            <Route path="/products/:id" element={<ClientLayout><ProductDetailPage /></ClientLayout>} />
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
              <AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>
            }>
              <Route index element={<Navigate to="products" replace />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
