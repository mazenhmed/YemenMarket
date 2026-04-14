import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Stores from './pages/Stores';
import StoreDetail from './pages/StoreDetail';
import VendorDashboard from './pages/VendorDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SalesReport from './pages/SalesReport';
import Notifications from './pages/Notifications';
import Invoice from './pages/Invoice';
import OrderTracking from './pages/OrderTracking';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <NotificationProvider>
              <div className="app">
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={
                      <ProtectedRoute><Checkout /></ProtectedRoute>
                    } />
                    <Route path="/stores" element={<Stores />} />
                    <Route path="/store/:id" element={<StoreDetail />} />
                    <Route path="/vendor/dashboard" element={
                      <ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
                    } />
                    <Route path="/sales-report" element={
                      <ProtectedRoute roles={['admin', 'vendor']}><SalesReport /></ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                      <ProtectedRoute><Notifications /></ProtectedRoute>
                    } />
                    <Route path="/invoice/:id" element={
                      <ProtectedRoute><Invoice /></ProtectedRoute>
                    } />
                    <Route path="/tracking/:trackingNumber" element={<OrderTracking />} />
                    <Route path="/tracking" element={<OrderTracking />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </NotificationProvider>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
