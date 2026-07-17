src/
├── main.jsx                      # Entry point
├── App.jsx                       # Root component với routing
│
├── 📁 api/                       # API configuration
│   ├── client.js                 # Axios instance với interceptors
│   ├── endpoints.js              # Định nghĩa tất cả API endpoints
│   └── index.js                  # Export all
│
├── 📁 assets/                    # Static assets
│   ├── fonts/
│   ├── images/
│   │   ├── hero.png
│   │   ├── logo.svg
│   │   └── ...
│   └── styles/
│       ├── global.css            # Global styles, CSS variables
│       └── bauhaus.css           # Bauhaus theme tokens
│
├── 📁 features/                  # ❗ Cốt lõi: các tính năng nghiệp vụ
│   │
│   ├── 📁 auth/                  # 🔐 Tính năng xác thực
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useLogin.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── types/
│   │   │   └── index.js          # Types/Interfaces (User, LoginPayload...)
│   │   └── index.js              # Public exports của feature
│   │
│   ├── 📁 products/              # 📦 Tính năng quản lý sản phẩm
│   │   ├── components/
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   └── ProductFilter.jsx
│   │   ├── hooks/
│   │   │   ├── useProducts.js
│   │   │   └── useProductDetail.js
│   │   ├── services/
│   │   │   └── productService.js
│   │   ├── contexts/
│   │   │   └── ProductContext.jsx (optional)
│   │   ├── types/
│   │   │   └── index.js          # Product, Category types
│   │   └── index.js
│   │
│   ├── 📁 cart/                  # 🛒 Tính năng giỏ hàng
│   │   ├── components/
│   │   │   ├── CartSidebar.jsx
│   │   │   ├── CartItem.jsx
│   │   │   └── CartSummary.jsx
│   │   ├── hooks/
│   │   │   └── useCart.js
│   │   ├── services/
│   │   │   └── cartService.js
│   │   ├── contexts/
│   │   │   └── CartContext.jsx
│   │   ├── types/
│   │   │   └── index.js
│   │   └── index.js
│   │
│   ├── 📁 orders/                # 📋 Tính năng đơn hàng
│   │   ├── components/
│   │   │   ├── OrderList.jsx
│   │   │   ├── OrderItem.jsx
│   │   │   └── CheckoutForm.jsx
│   │   ├── hooks/
│   │   │   ├── useOrders.js
│   │   │   └── useCheckout.js
│   │   ├── services/
│   │   │   └── orderService.js
│   │   ├── types/
│   │   │   └── index.js
│   │   └── index.js
│   │
│   ├── 📁 recommendations/       # 💡 Tính năng đề xuất sản phẩm
│   │   ├── components/
│   │   │   └── RecommendationList.jsx
│   │   ├── hooks/
│   │   │   └── useRecommendations.js
│   │   ├── services/
│   │   │   └── recommendationService.js
│   │   └── index.js
│   │
│   ├── 📁 admin/                 # 👑 Tính năng quản trị
│   │   ├── components/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   └── AdminHeader.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx       # CRUD sản phẩm
│   │   │   ├── Orders.jsx         # Quản lý đơn hàng
│   │   │   └── Users.jsx          # Quản lý người dùng
│   │   ├── hooks/
│   │   │   ├── useAdminProducts.js
│   │   │   └── useAdminOrders.js
│   │   ├── services/
│   │   │   └── adminService.js
│   │   ├── types/
│   │   │   └── index.js
│   │   └── index.js
│   │
│   ├── 📁 payment/               # 💳 Tính năng thanh toán (optional)
│   │   ├── components/
│   │   │   └── PaymentForm.jsx
│   │   ├── hooks/
│   │   │   └── usePayment.js
│   │   ├── services/
│   │   │   └── paymentService.js
│   │   └── index.js
│   │
│   └── 📁 notification/          # 🔔 Tính năng thông báo (optional)
│       ├── components/
│       │   └── NotificationToast.jsx
│       ├── hooks/
│       │   └── useNotification.js
│       └── index.js
│
├── 📁 components/                # 🧩 Shared/Common components
│   ├── 📁 ui/                    # UI components tái sử dụng
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   ├── Table.jsx
│   │   ├── Badge.jsx
│   │   └── Spinner.jsx
│   ├── 📁 layout/                # Layout components
│   │   ├── ClientLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── 📁 navigation/            # Navigation components
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   └── index.js                  # Export tất cả component
│
├── 📁 hooks/                     # 🪝 Custom hooks toàn cục
│   ├── useLocalStorage.js
│   ├── useDebounce.js
│   ├── useMediaQuery.js
│   └── index.js
│
├── 📁 utils/                     # 🛠️ Utility functions
│   ├── formatters.js             # formatVND, formatDate, formatNumber
│   ├── validators.js             # validateEmail, validatePassword...
│   ├── constants.js              # APP_NAME, API_BASE, ROLES...
│   ├── helpers.js                # các hàm tiện ích chung
│   └── index.js
│
├── 📁 config/                    # ⚙️ Cấu hình ứng dụng
│   ├── routes.js                 # Định nghĩa tất cả routes
│   └── env.js                    # Biến môi trường, fallback
│
├── 📁 store/                     # 🗃️ Global state (nếu dùng Redux/Zustand)
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── cartSlice.js
│   │   └── productsSlice.js
│   └── store.js
│
├── 📁 layouts/                   # 📐 Layout pages (có thể chuyển vào features)
│   ├── ClientLayout.jsx
│   └── AdminLayout.jsx
│
└── 📁 pages/                     # 📄 Các trang (có thể chuyển vào features/pages)
    ├── HomePage.jsx
    ├── ProductDetailPage.jsx
    ├── CartPage.jsx
    ├── CheckoutPage.jsx
    ├── ProfilePage.jsx
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── Admin/
    │   ├── DashboardPage.jsx
    │   ├── ProductsPage.jsx
    │   ├── OrdersPage.jsx
    │   └── UsersPage.jsx
    └── index.js 