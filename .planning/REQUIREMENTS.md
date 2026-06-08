# Requirements: E-commerce Microservices Upgrade

**Defined:** 2026-06-08
**Core Value:** Nâng cấp thành công lên Java 21, Spring Boot 3.x, PostgreSQL và tích hợp giao tiếp bất đồng bộ qua Apache Kafka để đảm bảo hệ thống microservices hoạt động ổn định và bảo mật.

## v1 Requirements

### 1. Nâng cấp & Cơ sở dữ liệu (Upgrade & DB)
- [ ] **UPGR-01**: Tất cả các microservices chạy trên Java 21 và Spring Boot 3.2.5 (Spring Cloud 2023.0.1)
- [ ] **UPGR-02**: Chuyển đổi toàn bộ CSDL của các service sang PostgreSQL
- [ ] **UPGR-03**: Loại bỏ thư viện test Hoverfly cũ và thay thế bằng WireMock

### 2. Cổng API & Bảo mật (Gateway & Security)
- [ ] **SEC-01**: Chuyển đổi api-gateway sang Spring Cloud Gateway (WebFlux)
- [ ] **SEC-02**: Triển khai Spring Security WebFlux trên Gateway chặn/cho phép các route phù hợp
- [ ] **SEC-03**: Phát triển tính năng đăng nhập và phát hành JWT Token tại `user-service`
- [ ] **SEC-04**: Xác thực JWT token tại api-gateway và chuyển tiếp thông tin User ID / Roles xuống các service nội bộ

### 3. Đặt hàng & Giao tiếp Sự kiện (Order & Event Messaging)
- [ ] **MSG-01**: Tích hợp Kafka Broker phục vụ truyền sự kiện bất đồng bộ
- [ ] **MSG-02**: `order-service` phát sự kiện `OrderCreatedEvent` sang Kafka khi tạo đơn hàng
- [ ] **MSG-03**: Phát triển `payment-service` lắng nghe `OrderCreatedEvent`, thanh toán mô phỏng và phát lại sự kiện `PaymentProcessedEvent`
- [ ] **MSG-04**: Phát triển `notification-service` lắng nghe `PaymentProcessedEvent` và in log gửi thông báo
- [ ] **MSG-05**: `product-catalog-service` lắng nghe `OrderCreatedEvent` để cập nhật/trừ số lượng tồn kho sản phẩm

### 4. Giao diện & Hiển thị (UI & Assets)
- [ ] **PROD-01**: Bổ sung trường hình ảnh (`imageUrl`) và hiển thị hình ảnh sản phẩm đầy đủ
- [ ] **UI-01**: Xây dựng giao diện Client Storefront (Razor Pages, React hoặc HTML/JS thuần) cho người dùng duyệt hàng, thêm giỏ, đặt hàng
- [ ] **UI-02**: Xây dựng giao diện Admin Dashboard quản lý người dùng, sản phẩm, đơn đặt hàng

## Out of Scope
- Tích hợp cổng thanh toán thực tế (Stripe, Paypal) - dùng payment giả định.
- Máy chủ gửi thư/SMS thực tế - dùng logging console.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPGR-01 | Phase 1 | Pending |
| UPGR-02 | Phase 1 | Pending |
| UPGR-03 | Phase 1 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 3 | Pending |
| SEC-04 | Phase 3 | Pending |
| MSG-01 | Phase 4 | Pending |
| MSG-02 | Phase 4 | Pending |
| MSG-03 | Phase 4 | Pending |
| MSG-04 | Phase 4 | Pending |
| MSG-05 | Phase 4 | Pending |
| PROD-01 | Phase 5 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 sau khi khởi tạo*
