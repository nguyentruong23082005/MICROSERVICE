# External Integrations

**Analysis Date:** 2026-06-08

## APIs & External Services

**Service Registry:**
- **Eureka Server** - Discovery service for microservices communication.
  - Client registration URL: `http://localhost:8761/eureka`
  - Used by: `api-gateway`, `user-service`, `product-catalog-service`, `product-recommendation-service`, `order-service`.

**Gateway Proxy:**
- **Zuul API Gateway** - Proxy routing requests to specific microservices based on path mapping.
  - Routes:
    - `/api/accounts/**` → `user-service`
    - `/api/catalog/**` → `product-catalog-service`
    - `/api/shop/**` → `order-service`
    - `/api/review/**` → `product-recommendation-service`

**Microservice RPC Communication:**
- **Spring Cloud OpenFeign** - Declarative HTTP client for inter-service communication.
  - Client mappings:
    - `order-service` calls `user-service` (`UserClient.java`) and `product-catalog-service` (`ProductClient.java`).
    - `product-recommendation-service` calls `user-service` (`UserClient.java`) and `product-catalog-service` (`ProductClient.java`).

## Data Storage

**Databases:**
- **Microsoft SQL Server** - Relational data storage, separate database instance configured per service.
  - Connection details (in `application.properties`):
    - Driver: `com.microsoft.sqlserver.jdbc.SQLServerDriver`
    - URL: `jdbc:sqlserver://localhost;databaseName=[db_name]`
    - Credentials: `sa` / `Test1`
  - Databases:
    - `users` (used by `user-service`)
    - `product_catalog` (used by `product-catalog-service`)
    - `product_recommendations` (used by `product-recommendation-service`)
    - `orders` (used by `order-service`)
  - Client ORM: Spring Data JPA (Hibernate) with `SQLServer2016Dialect`.

**Caching & Session Storage:**
- **Redis** - Key-value store for session management and transient cart data.
  - Connection details: `localhost:6379` via Jedis driver.
  - Caching logic:
    - Shared Session: `api-gateway` uses `spring-session-data-redis` (namespace `session`).
    - Shopping Cart: `order-service` uses `CartRedisRepositoryImpl` to store cart contents under Redis hashes (prefix `CART`).

## Authentication & Identity

**Current Pattern:**
- Basic Spring Security in `api-gateway` (`WebSecurityConfig.java`) with CSRF disabled and all requests permitted (`.antMatchers("/").permitAll()`).
- Shared session cookies are propagated from `api-gateway` to downstream microservices using a Zuul filter (`SessionFilter.java`) which copies the session cookie.
- No JWT or token-based authentication is currently implemented (target requirement for upgrade).

## Environment Configuration

**Development:**
- Local servers: SQL Server on port `1433`, Redis on port `6379`, Eureka Server on port `8761`.
- Hardcoded parameters in `application.properties` of each service.

---

*Integration audit: 2026-06-08*
*Update when adding/removing external services*
