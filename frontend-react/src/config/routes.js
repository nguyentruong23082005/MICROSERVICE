export const appRoutes = {
  home: '/',
  productDetail: (id = ':id') => `/products/${id}`,
  cart: '/cart',
  checkout: '/checkout',
  profile: '/profile',
  admin: '/admin',
  adminProducts: '/admin/products',
  adminOrders: '/admin/orders',
  adminUsers: '/admin/users',
};

export default appRoutes;
