# Roadmap: E-commerce Microservices Upgrade

## Overview
Lộ trình nâng cấp hệ thống microservices lên Java 21 và Spring Boot 3.x, thay thế Zuul bằng Spring Cloud Gateway, chuyển CSDL sang PostgreSQL, cài đặt bảo mật JWT và giao tiếp bất đồng bộ qua Kafka, kết thúc bằng việc xây dựng một giao diện người dùng và quản trị hoàn chỉnh.

## Phases

- [ ] **Phase 0: Chuẩn bị môi trường & Docker Compose** - Thiết lập container PostgreSQL, Redis, Kafka local.
- [ ] **Phase 1: Nâng cấp Java 21, Spring Boot 3.x & PostgreSQL** - Nâng cấp dependencies và di chuyển namespace javax sang jakarta cho các dịch vụ theo thứ tự phụ thuộc.
- [ ] **Phase 2: Di chuyển Gateway (Zuul -> Spring Cloud Gateway)** - Tái cấu trúc api-gateway sang dùng gateway reactive (WebFlux) và cấu hình bảo mật tương thích.
- [ ] **Phase 3: JWT Authentication & Phân quyền** - Triển khai luồng đăng ký/đăng nhập JWT tại user-service và xác thực tại Gateway.
- [ ] **Phase 4: Tích hợp Apache Kafka** - Triển khai các dịch vụ payment-service, notification-service mới và đồng bộ kho sản phẩm bất đồng bộ.
- [ ] **Phase 5: Giao diện và Hình ảnh sản phẩm** - Cập nhật hình ảnh sản phẩm và phát triển giao diện bán hàng / quản trị.

---

## Phase Details

### Phase 0: Chuẩn bị môi trường & Docker Compose
**Goal**: Thiết lập hạ tầng local ổn định chạy PostgreSQL, Redis và Kafka.
**Depends on**: Nothing
**Success Criteria**:
  1. File `docker-compose.yml` chạy thành công.
  2. Kết nối được tới database PostgreSQL cổng `5432` với các database được khởi tạo tự động.
  3. Kết nối được tới Redis cổng `6379` và Kafka cổng `9092`.
**Plans**: 1 plan

Plans:
- [ ] 00-01: Tạo file docker-compose.yml và khởi chạy các container.

### Phase 1: Nâng cấp Java 21, Spring Boot 3.x & PostgreSQL
**Goal**: Nâng cấp dependencies pom.xml, đổi namespace `javax.*` sang `jakarta.*`, đổi kết nối sang PostgreSQL cho tất cả các service, thay thế Hoverfly bằng WireMock.
**Depends on**: Phase 0
**Requirements**: [UPGR-01, UPGR-02, UPGR-03]
**Success Criteria**:
  1. Tất cả 6 service compile thành công sử dụng Java 21 và Spring Boot 3.2.5.
  2. Các service khởi tạo database thành công trong PostgreSQL.
  3. Chạy test của `product-recommendation-service` thành công với WireMock.
**Plans**: 6 plans

Plans:
- [ ] 01-01: Nâng cấp và cấu hình eureka-server.
- [ ] 01-02: Cấu hình dependencies postgresql và webflux cho api-gateway.
- [ ] 01-03: Nâng cấp và di chuyển database user-service sang PostgreSQL.
- [ ] 01-04: Nâng cấp và di chuyển database product-catalog-service sang PostgreSQL.
- [ ] 01-05: Nâng cấp, thay thế Redis/JPA và di chuyển database order-service sang PostgreSQL.
- [ ] 01-06: Nâng cấp, di chuyển database và cấu hình WireMock cho product-recommendation-service.

### Phase 2: Di chuyển Gateway (Zuul -> Spring Cloud Gateway)
**Goal**: Di chuyển api-gateway từ Zuul sang Spring Cloud Gateway WebFlux, cấu hình WebFlux Security.
**Depends on**: Phase 1
**Requirements**: [SEC-01, SEC-02]
**Success Criteria**:
  1. `api-gateway` khởi động bình thường trên port `8900`.
  2. Định tuyến chính xác các yêu cầu `/api/accounts/**`, `/api/catalog/**` xuống các service nội bộ.
  3. WebFlux Security filter cho phép truy cập public qua permitAll().
**Plans**: 2 plans

Plans:
- [ ] 02-01: Cấu hình Spring Cloud Gateway routes trong application.properties.
- [ ] 02-02: Tạo cấu hình Reactive Security và chuyển đổi SessionFilter sang WebFilter của WebFlux.

### Phase 3: JWT Authentication & Phân quyền
**Goal**: Triển khai đăng nhập, sinh token JWT và bộ lọc kiểm tra JWT tại Gateway.
**Depends on**: Phase 2
**Requirements**: [SEC-03, SEC-04]
**Success Criteria**:
  1. Gửi request POST đến `/api/accounts/login` trả về token JWT hợp lệ.
  2. Gửi request có kèm token JWT được Gateway giải mã chính xác thông tin User ID và Roles chuyển tiếp xuống header downstream.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Triển khai phát hành JWT tại user-service.
- [ ] 03-02: Triển khai Custom JWT Gateway Filter tại api-gateway.

### Phase 4: Tích hợp Apache Kafka
**Goal**: Tích hợp liên lạc bất đồng bộ qua Kafka giữa Order, Payment, Notification và Catalog.
**Depends on**: Phase 3
**Requirements**: [MSG-01, MSG-02, MSG-03, MSG-04, MSG-05]
**Success Criteria**:
  1. Khi gửi request checkout đơn hàng, `order-service` phát event `OrderCreatedEvent` lên Kafka.
  2. `payment-service` tiêu thụ event, tạo giao dịch thanh toán thành công và phát lại `PaymentProcessedEvent`.
  3. `notification-service` và `product-catalog-service` lắng nghe các event tương ứng và xử lý logic (trừ kho, in log thông báo).
**Plans**: 3 plans

Plans:
- [ ] 04-01: Cấu hình Kafka Producer trong order-service và tạo model Event Schemas.
- [ ] 04-02: Xây dựng payment-service và notification-service mới với Kafka consumers.
- [ ] 04-03: Cấu hình product-catalog-service tiêu thụ event trừ kho và hoàn thiện luồng thanh toán.

### Phase 5: Giao diện và Hình ảnh sản phẩm
**Goal**: Cập nhật ảnh sản phẩm và tạo trang Client Storefront và Admin Dashboard.
**Depends on**: Phase 4
**Requirements**: [PROD-01, UI-01, UI-02]
**Success Criteria**:
  1. Các sản phẩm có trường hình ảnh hợp lệ hiển thị lên giao diện.
  2. Khách hàng có thể thao tác mua sắm, thêm giỏ hàng, đặt hàng trên giao diện web.
  3. Admin có thể quản lý danh sách sản phẩm và đơn hàng trên giao diện quản trị.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Cập nhật cơ sở dữ liệu ảnh sản phẩm và viết các trang Razor/HTML/JS cho Client.
- [ ] 05-02: Viết giao diện Admin quản lý sản phẩm và đơn đặt hàng.

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Chuẩn bị môi trường & Docker Compose | 0/1 | Not started | - |
| 1. Nâng cấp Java 21, Spring Boot 3.x & PostgreSQL | 0/6 | Not started | - |
| 2. Di chuyển Gateway (Zuul -> Spring Cloud Gateway) | 0/2 | Not started | - |
| 3. JWT Authentication & Phân quyền | 0/2 | Not started | - |
| 4. Tích hợp Apache Kafka | 0/3 | Not started | - |
| 5. Giao diện và Hình ảnh sản phẩm | 0/2 | Not started | - |
