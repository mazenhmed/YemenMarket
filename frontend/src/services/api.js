import axios from 'axios';


const baseURL = import.meta.env.VITE_API_URL 
  || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : 'https://yemenmarket.onrender.com/api');

const API = axios.create({
  baseURL,
  timeout: 30000, // 30 ثانية - مهم لتطبيق الجوال مع شبكات بطيئة
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${baseURL}/users/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          if (res.data.refresh) {
            localStorage.setItem('refresh_token', res.data.refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return API(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== Auth ==========
export const loginUser = (data) => API.post('/users/login/', data);
export const registerUser = (data) => API.post('/users/register/', data);
export const getMe = () => API.get('/users/me/');
export const updateProfile = (data) => API.patch('/users/me/', data);
export const firebaseLogin = (idToken) => API.post('/users/firebase-auth/', { id_token: idToken });
export const phoneLogin = (phone, password) => API.post('/users/phone-login/', { phone, password });
export const phoneRegister = (data) => API.post('/users/phone-register/', data);
export const linkPhone = (phone, otpCode) => API.post('/users/link-phone/', { phone, otp_code: otpCode });
// WhatsApp OTP
export const sendWhatsAppOTP = (phone) => API.post('/users/send-otp/', { phone });

// ========== Products ==========
export const getProducts = (params) => API.get('/products/items/', { params });
export const getProductDetails = (id) => API.get(`/products/items/${id}/`);
export const getProduct = (id) => API.get(`/products/items/${id}/`);
export const getFeaturedProducts = () => API.get('/products/items/featured/');
export const getCategories = () => API.get('/products/categories/');
export const createCategory = (data) => API.post('/products/categories/', data);
export const updateCategory = (id, data) => API.patch(`/products/categories/${id}/`, data);
export const deleteCategory = (id) => API.delete(`/products/categories/${id}/`);
export const createProduct = (data) => API.post('/products/items/', data);
export const updateProduct = (id, data) => API.patch(`/products/items/${id}/`, data);
export const deleteProduct = (id) => API.delete(`/products/items/${id}/`);
export const getVendorProducts = () => API.get('/products/items/vendor-products/');
export const updateProductStatus = (id, status) => API.patch(`/products/items/${id}/update-status/`, { status });
export const getPendingProducts = () => API.get('/products/items/pending/');

// ========== Reviews ==========
export const getProductReviews = (productId) => API.get(`/products/items/${productId}/reviews/`);
export const createReview = (productId, data) => API.post(`/products/items/${productId}/reviews/`, data);

// ========== Vendors / Stores ==========
export const getStores = (params) => API.get('/vendors/stores/', { params });
export const getStore = (id) => API.get(`/vendors/stores/${id}/`);
export const createStore = (data) => API.post('/vendors/stores/', data);
export const updateStore = (id, data) => API.patch(`/vendors/stores/${id}/`, data);
export const getMyStore = () => API.get('/vendors/stores/my-store/');
export const updateStoreStatus = (id, data) => API.patch(`/vendors/stores/${id}/update-status/`, data);
export const getPendingStores = () => API.get('/vendors/stores/pending/');

// ========== Orders ==========
export const createOrder = (data) => API.post('/orders/checkout/', data);
export const getOrders = () => API.get('/orders/checkout/');
export const getOrder = (id) => API.get(`/orders/checkout/${id}/`);
export const updateOrderStatus = (id, status) => API.patch(`/orders/checkout/${id}/update-status/`, { status });
export const validateCoupon = (code) => API.get(`/orders/checkout/validate-coupon/?code=${code}`);
export const confirmPayment = (id) => API.patch(`/orders/checkout/${id}/confirm-payment/`);
export const getOrderInvoice = (id) => API.get(`/orders/checkout/${id}/invoice/`);

// ========== Payment Accounts ==========
export const getPaymentAccounts = () => API.get('/orders/payment-accounts/');
export const updatePaymentAccount = (id, data) => API.patch(`/orders/payment-accounts/${id}/`, data);
export const createPaymentAccount = (data) => API.post('/orders/payment-accounts/', data);

// ========== Admin ==========
export const getAdminStats = () => API.get('/users/admin/stats/');
export const getAdminUsers = () => API.get('/users/admin/users/');
export const deleteAdminUser = (id) => API.delete(`/users/admin/users/${id}/`);
export const getTransactions = () => API.get('/orders/transactions/');

// ========== Wishlist ==========
export const getWishlist = () => API.get('/products/wishlist/');
export const addToWishlist = (productId) => API.post('/products/wishlist/', { product: productId });
export const removeFromWishlist = (id) => API.delete(`/products/wishlist/${id}/`);

// ========== Notifications ==========
export const getNotifications = (params) => API.get('/notifications/', { params });
export const getUnreadNotificationCount = () => API.get('/notifications/unread-count/');
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => API.post('/notifications/read-all/');

// ========== Shipping ==========
export const getShippingZones = () => API.get('/shipping/zones/');
export const calculateShipping = (city, subtotal) => API.get(`/shipping/zones/calculate/?city=${city}&subtotal=${subtotal}`);
export const trackShipment = (trackingNumber) => API.get(`/shipping/tracking/by-number/${trackingNumber}/`);
export const getShipmentTracking = (params) => API.get('/shipping/tracking/', { params });
export const updateShipmentTracking = (id, data) => API.patch(`/shipping/tracking/${id}/`, data);
export const createShipmentTracking = (data) => API.post('/shipping/tracking/', data);

// ========== Vendor Payment Accounts ==========
export const getVendorPaymentAccounts = () => API.get('/vendors/payment-accounts/');
export const createVendorPaymentAccount = (data) => API.post('/vendors/payment-accounts/', data);
export const updateVendorPaymentAccount = (id, data) => API.patch(`/vendors/payment-accounts/${id}/`, data);
export const deleteVendorPaymentAccount = (id) => API.delete(`/vendors/payment-accounts/${id}/`);
export const getVendorPublicPaymentAccounts = (vendorId) => API.get(`/vendors/payment-accounts/public/?vendor_id=${vendorId}`);

export default API;
