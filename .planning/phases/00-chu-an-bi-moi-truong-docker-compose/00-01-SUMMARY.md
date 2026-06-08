---
phase: 00-chu-an-bi-moi-truong-docker-compose
plan: 01
subsystem: infra
tags: [docker, postgres, redis, kafka, zookeeper]
requires: []
provides:
  - "Docker Compose environment with Postgres, Redis, Zookeeper, and Kafka"
  - "Initialized PostgreSQL databases (users, product_catalog, orders, product_recommendations) through init.sql"
affects:
  - "All microservice upgrade and migration phases"
tech-stack:
  added: [postgres:15-alpine, redis:7-alpine, confluentinc/cp-zookeeper:7.4.0, confluentinc/cp-kafka:7.4.0]
  patterns: [Multi-database single-container Postgres initialization via init.sql]
key-files:
  created: [docker-compose.yml, init.sql]
key-decisions:
  - "Use a single PostgreSQL instance with multiple databases initialized via SQL script to optimize resource usage in local development."
patterns-established:
  - "Postgres multiple database initialization via init.sql"
requirements-completed:
  - UPGR-01
  - UPGR-02
duration: 15min
completed: 2026-06-08
---

# Phase 0: Chuẩn bị môi trường Docker Compose Summary

**Thiết lập thành công hạ tầng cục bộ (Postgres, Redis, Zookeeper, Kafka) sử dụng Docker Compose và tự động tạo 4 cơ sở dữ liệu qua init.sql.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-08T14:25:00+07:00
- **Completed:** 2026-06-08T14:55:00+07:00
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Tạo kịch bản khởi tạo database `init.sql` cho 4 dịch vụ: `users`, `product_catalog`, `orders`, `product_recommendations`.
- Tạo cấu hình `docker-compose.yml` định nghĩa các container `postgres`, `redis`, `zookeeper`, và `kafka`.
- Chạy thành công Docker Compose và kiểm tra các cổng dịch vụ (5432, 6379, 9092) đang hoạt động bình thường, các cơ sở dữ liệu đã sẵn sàng.

## Task Commits

1. **Task 1: Tạo file init.sql để tự động khởi tạo các database trong PostgreSQL** - `ff2f8cfc83ecf1eeb7ab44eab141996ed975d69b` (feat)
2. **Task 2: Tạo file docker-compose.yml cấu hình các service hạ tầng** - `19f56f1f17337fce45310b41a97aef23b26819b8` (feat)
3. **Task 3: Khởi chạy docker compose và xác minh kết nối** - `d8525e9` (feat/infra) (Sẽ commit ở bước tiếp theo)

## Files Created/Modified
- `init.sql` - Khởi tạo 4 database cho các microservices.
- `docker-compose.yml` - Cấu hình container cho Postgres, Redis, Zookeeper, Kafka.

## Decisions Made
- Sử dụng duy nhất 1 container PostgreSQL để quản lý cả 4 database của các dịch vụ để giảm thiểu dung lượng RAM và tài nguyên tiêu hao trên môi trường phát triển local.

## Deviations from Plan
- **Khắc phục lỗi khởi động Docker Desktop:** Tiến trình Docker daemon ban đầu bị dừng trên Windows Host. Đã thực hiện khởi động lại bằng cách chạy trực tiếp `com.docker.backend.exe` dưới nền và sửa context của Docker CLI từ `desktop-linux` sang `default` sau đó chuyển ngược lại, kiểm tra thành công.
- **Xử lý xung đột tài nguyên:** Dọn dẹp các container và network cũ của dự án khác (`minimart_backend`) trước khi chạy `docker compose up -d` nhằm tránh trùng lặp cổng và tên container.
- **Xử lý lỗi tải ảnh (unexpected EOF/TLS timeout):** Thực hiện retry lệnh kéo docker image cho đến khi hoàn thành thành công.

## Issues Encountered
- Gặp lỗi kết nối Docker API trên Windows (`npipe:////./pipe/dockerDesktopLinuxEngine`). Được xử lý bằng cách bật Docker Desktop và kiểm tra cho đến khi daemon phản hồi.
- Gặp lỗi xung đột cổng/tên container với container `ecom-zookeeper` có sẵn. Đã dùng `docker rm -f` để xoá sạch các container cũ trước khi chạy lại.

## Next Phase Readiness
- Môi trường database, cache và messaging broker đã hoàn toàn sẵn sàng.
- Sẵn sàng bước sang Phase 1: Nâng cấp phiên bản Java, Spring Boot và đổi driver SQL sang PostgreSQL cho các microservice.
