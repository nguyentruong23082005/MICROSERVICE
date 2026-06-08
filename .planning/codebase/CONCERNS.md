# Codebase Concerns

**Analysis Date:** 2026-06-08

## Tech Debt

**Deprecated API Gateway (Netflix Zuul):**
- Issue: `api-gateway` uses `spring-cloud-starter-netflix-zuul`, which is completely removed in Spring Boot 2.4+ and Spring Boot 3.x.
- File: `api-gateway/pom.xml` (line 62), `ApiGatewayApplication.java` (line 11).
- Why: Legacy project structure using Netflix stack.
- Impact: Blocks upgrading the project to Spring Boot 3.x and Java 21.
- Fix approach: Replace Netflix Zuul with **Spring Cloud Gateway** and rewrite the routing configurations.

**Deprecated WebSecurityConfigurerAdapter:**
- Issue: `WebSecurityConfig` extends `WebSecurityConfigurerAdapter`, which has been removed in Spring Security 6.x.
- File: `api-gateway/src/main/java/com/rainbowforest/apigateway/config/WebSecurityConfig.java` (line 8).
- Why: Outdated security configuration style.
- Impact: Compiling errors during the Spring Boot 3.x upgrade.
- Fix approach: Refactor class to define a `SecurityFilterChain` bean instead.

**Field-level Injection:**
- Issue: Excessive use of `@Autowired` on private class fields.
- Files: Most Controller and Service implementation classes (e.g., `UserController.java` line 16, `CartController.java` line 15).
- Why: Common shortcut in older Spring tutorials.
- Impact: Makes unit testing harder (requires Mockito annotations or reflection) and violates encapsulation.
- Fix approach: Refactor classes to use constructor-based dependency injection.

**JUnit 4 and Legacy Test Annotations:**
- Issue: Test suites use `@RunWith(SpringRunner.class)` (JUnit 4) and old MediaType structures (`MediaType.APPLICATION_JSON_UTF8`).
- Files: All test classes under `src/test/java/`.
- Why: Written when JUnit 4 was default.
- Impact: Incompatibilities with modern test frameworks and JUnit 5.
- Fix approach: Update test files to use JUnit Jupiter (`org.junit.jupiter.api.*`) and standard assertion APIs.

## Known Bugs & Gaps

**Missing Business Services:**
- Issue: The project does not contain Payment, Notification, or Inventory services.
- Files: Workspace root directory.
- Impact: The project cannot fulfill the assignment requirements for end-to-end checkout, payment processing, or notifications.
- Fix approach: Create new microservices (`payment-service`, `notification-service`) and integrate them.

**Missing Kafka Integration:**
- Issue: Currently, no Kafka messaging exists. All communications are synchronous (OpenFeign).
- Files: Workspace root directory.
- Impact: Fails the requirement "Tích hợp Apache Kafka để giao tiếp giữa các Services (Order, Payment, Notification, Inventory,...)".
- Fix approach: Add Spring Kafka dependencies to `order-service` and new services, and write producers/consumers.

**Missing Frontend Application:**
- Issue: No user storefront or admin interface codebase exists in the workspace.
- Files: Workspace root directory.
- Impact: Fails the requirement "Xây dựng giao diện người dùng và trang quản trị hoàn chỉnh".
- Fix approach: Create a web application (e.g. using ReactJS/Next.js) or HTML/JS templates to serve as the user interface.

## Security Considerations

**Wide-Open Endpoint Configuration:**
- Risk: `api-gateway` has CSRF disabled and permits all requests.
- File: `api-gateway/src/main/java/com/rainbowforest/apigateway/config/WebSecurityConfig.java` (line 12).
- Current mitigation: None. Anyone can access any API without authentication.
- Recommendations: Implement Spring Security JWT validation on the gateway or client services to protect sensitive APIs.

**Hardcoded Database Passwords:**
- Risk: Cleartext database credentials are saved inside properties files.
- Files: `application.properties` in `user-service`, `product-catalog-service`, `product-recommendation-service`, `order-service`.
- Current mitigation: None.
- Recommendations: Externalize credentials using environment variables (e.g., `${SPRING_DATASOURCE_PASSWORD}`).

## Dependencies at Risk

**Removed Netlix Stack Packages:**
- Risk: `spring-cloud-starter-netflix-eureka-client`, `spring-cloud-starter-netflix-hystrix`, `spring-cloud-starter-netflix-ribbon`, `spring-cloud-starter-netflix-zuul` are unmaintained/deprecated.
- Impact: Gateway fails to compile or start in Spring Boot 3.x.
- Migration plan: Move from Zuul to Spring Cloud Gateway, Ribbon to Spring Cloud LoadBalancer, Hystrix to Spring Cloud CircuitBreaker (Resilience4j).

**Jakarta EE Namespace Migration:**
- Risk: Old packages (`javax.persistence.*`, `javax.servlet.*`, `javax.validation.*`) are replaced with `jakarta.*` in Spring Boot 3.x.
- Impact: Global compile errors across all microservice Java files.
- Migration plan: Automate global replacement of `javax` imports to `jakarta`.

## Test Coverage Gaps

**Lack of End-to-End Testing:**
- What's not tested: Whole-system integration of request flow (Client → Gateway → Auth → Catalog/Cart → Order → Database).
- Risk: Changes in gateway routing or feign clients could break service-to-service calls without failing unit tests.
- Priority: Medium.

---

*Concerns audit: 2026-06-08*
*Update as issues are fixed or new ones discovered*
