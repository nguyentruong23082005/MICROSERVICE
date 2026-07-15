export const ENDPOINTS = {
  // Auth
  login: '/accounts/auth/login',
  register: '/accounts/auth/registration',
  refresh: '/accounts/auth/refresh',
  logout: '/accounts/auth/logout',
  forgotPassword: '/accounts/auth/forgot-password',
  resetPassword: '/accounts/auth/reset-password',

  // Users
  users: '/accounts/users',
  adminUsers: '/accounts/admin/users',

  // Products
  products: '/catalog/products',
  adminProducts: '/catalog/admin/products',
  categories: '/catalog/categories',
  adminCategories: '/catalog/admin/categories',
  uploads: '/catalog/uploads',

  // Cart & Orders
  cart: '/shop/cart',
  order: '/shop/order',
  orders: '/shop/orders',
  orderHistory: (id) => `/shop/order/${id}/history`,
  adminOrders: '/shop/admin/orders',

  // Payments
  payments: '/payments',
  paymentById: (id) => `/payments/${id}`,
  adminPayments: '/payments/admin',
  vnpay: {
    create: '/payments/vnpay/create',
    return: '/payments/vnpay/return',
    ipn: '/payments/vnpay/ipn',
  },
  momo: {
    create: '/payments/momo/create',
    return: '/payments/momo/return',
    ipn: '/payments/momo/ipn',
  },

  // Notifications
  notifications: '/notifications',
  notificationsByUser: (userId) => `/notifications/user/${userId}`,
  notificationUnreadCount: (userId) => `/notifications/user/${userId}/unread-count`,
  markNotificationRead: (id) => `/notifications/${id}/read`,
  markAllNotificationsRead: (userId) => `/notifications/user/${userId}/read-all`,

  // Reviews & Recommendations
  reviews: '/review/reviews',
  reviewById: (id) => `/review/reviews/${id}`,
  recommendations: '/review/recommendations',
  recommendationsByProduct: (productId) => `/review/recommendations/product/${productId}`,

  // Wishlist
  wishlist: '/shop/wishlist',
  wishlistItems: (userId) => `/shop/wishlist/${userId}`,
};

// Legacy export for backward compat
export const endpoints = {
  accounts: {
    auth: '/accounts/auth',
    users: '/accounts/users',
    adminUsers: '/accounts/admin/users',
    forgotPassword: '/accounts/auth/forgot-password',
  },
  catalog: {
    products: '/catalog/products',
    adminProducts: '/catalog/admin/products',
    categories: '/catalog/categories',
  },
  shop: {
    cart: '/shop/cart',
    order: '/shop/order',
    orders: '/shop/orders',
    wishlist: '/shop/wishlist',
  },
  recommendations: {
    byProduct: '/review/recommendations',
  },
  payments: '/payments',
  notifications: '/notifications',
  reviews: '/review/reviews',
};

export default endpoints;
