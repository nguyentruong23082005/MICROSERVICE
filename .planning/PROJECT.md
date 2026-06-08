# E-commerce Microservices Upgrade

## What This Is
Dự án nâng cấp và hoàn thiện hệ thống thương mại điện tử dựa trên kiến trúc microservices sử dụng Spring Boot và Spring Cloud. Hệ thống bao gồm các dịch vụ đăng ký khám phá (Eureka), cổng API (Gateway), quản lý người dùng (User), danh mục sản phẩm (Catalog), giỏ hàng/đặt hàng (Order) và gợi ý sản phẩm (Recommendation).

## Core Value
Nâng cấp thành công lên Java 21, Spring Boot 3.x, PostgreSQL và tích hợp giao tiếp bất đồng bộ qua Apache Kafka để đảm bảo hệ thống microservices hoạt động ổn định và bảo mật.

## Requirements

### Validated
- ✓ Đăng ký và quản lý khám phá dịch vụ qua Eureka Server — existing
- ✓ Cổng API định tuyến cơ bản — existing
- ✓ CRUD người dùng và chi tiết người dùng — existing
- ✓ CRUD sản phẩm và lấy danh sách sản phẩm — existing
- ✓ Quản lý giỏ hàng lưu trữ trên Redis — existing
- ✓ Đặt hàng và tính tổng tiền đơn hàng cơ bản — existing
- ✓ Gợi ý sản phẩm dựa trên đánh giá sản phẩm — existing

### Active
- [ ] **UPGRADE-01**: Nâng cấp toàn bộ hệ thống lên Java 21 và Spring Boot 3.x (Spring Cloud 2023.0.x)
- [ ] **DB-01**: Chuyển đổi toàn bộ CSDL sang sử dụng PostgreSQL (thay thế SQL Server)
- [ ] **GATEWAY-01**: Chuyển đổi API Gateway từ Zuul sang Spring Cloud Gateway chạy trên WebFlux
- [ ] **SECURITY-01**: Triển khai Spring Security và JWT (JSON Web Token) để xác thực và phân quyền người dùng
- [ ] **KAFKA-01**: Tích hợp Apache Kafka để truyền tin nhắn bất đồng bộ giữa các dịch vụ
- [ ] **PAYMENT-01**: Phát triển Payment Service mới lắng nghe sự kiện từ Kafka và thực hiện thanh toán giả định
- [ ] **NOTIFY-01**: Phát triển Notification Service mới lắng nghe sự kiện từ Kafka để giả lập gửi thông báo đơn hàng
- [ ] **PRODUCT-01**: Bổ sung hình ảnh sản phẩm thực tế và các dữ liệu liên quan
- [ ] **UI-01**: Xây dựng giao diện web người dùng (Client Storefront) và quản trị (Admin Dashboard) hoàn chỉnh

### Out of Scope
- Tích hợp cổng thanh toán thật (Stripe, Paypal) — Chỉ dùng mock payment event để mô phỏng
- Máy chủ gửi Email/SMS thật — Chỉ dùng log console để mô phỏng việc gửi thông báo

## Context
Dự án được xây dựng từ một codebase microservices cũ (Spring Boot 2.1.5, Java 12/8). Khi nâng cấp lên Spring Boot 3.x, các thư viện Netflix cũ (Zuul, Ribbon, Hystrix) sẽ bị loại bỏ và thay thế bằng các giải pháp hiện đại hơn của Spring Cloud. Hệ thống sử dụng Redis để lưu trữ giỏ hàng và chia sẻ Session.

## Constraints
- **Tech Stack**: Bắt buộc Java 21, Spring Boot 3.x, Spring Cloud 2023.0.x, PostgreSQL, Redis, Kafka.
- **Compatibility**: Các bài test phải chạy thành công mà không phụ thuộc vào thư viện Hoverfly cũ.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Chuyển đổi sang PostgreSQL | Người dùng yêu cầu sử dụng PostgreSQL thay vì SQL Server / MySQL | — Pending |
| Dùng Spring Cloud Gateway WebFlux | Spring Boot 3.x không hỗ trợ Zuul; Gateway WebFlux là giải pháp mặc định hiệu năng cao | — Pending |
| Dùng WireMock thay thế Hoverfly | Hoverfly không tương thích tốt với Java 17/21 và Spring Boot 3 | — Pending |

## Evolution

Tài liệu này sẽ tiến hóa tại các biên của phase và milestone.

**Sau mỗi pha chuyển đổi:**
1. Requirements bị vô hiệu hóa? → Di chuyển sang Out of Scope kèm lý do
2. Requirements được kiểm chứng thành công? → Di chuyển sang Validated kèm tham chiếu phase
3. Requirements mới phát sinh? → Thêm vào Active
4. Quyết định mới? → Thêm vào Key Decisions
5. Phần mô tả còn chính xác không? → Cập nhật nếu bị chệch hướng

**Sau mỗi cột mốc (milestone):**
1. Xem xét lại toàn bộ các mục
2. Kiểm tra Giá trị Cốt lõi — còn là ưu tiên đúng không?
3. Kiểm tra Out of Scope — các lý do loại trừ còn đúng không?
4. Cập nhật bối cảnh với trạng thái hiện tại

---
*Last updated: 2026-06-08 sau khi khởi tạo dự án*
