# Technology Stack

**Analysis Date:** 2026-06-08

## Languages

**Primary:**
- Java 12 / 1.8 - All application logic and tests across microservices.
  - `user-service`, `product-catalog-service`, `order-service`, `api-gateway` specify `<java.version>12</java.version>` in `pom.xml`.
  - `product-recommendation-service` specifies `<java.version>1.8</java.version>` in `pom.xml`.

**Secondary:**
- SQL - Schema definition and database queries.
- XML - Maven `pom.xml` build configuration files.
- Batch/Bash - Maven Wrapper scripts (`mvnw`, `mvnw.cmd`).

## Runtime

**Environment:**
- Java SE Runtime Environment (LTS 21 installed on host, targets Java 12 / 1.8 in compiled bytecode).
- Redis 6.x+ - Used for session caching and data persistence in shopping carts.
- Microsoft SQL Server 2016+ - Database engine used by the services.

**Package Manager:**
- Maven 3.6.0 (via Maven Wrapper `mvnw`).
- Dependency lockfile: None (standard Maven pom.xml).

## Frameworks

**Core:**
- Spring Boot 2.1.5.RELEASE - Underpins all microservices.
- Spring Cloud Greenwich.SR1 - Provides microservice patterns (Zuul, Eureka, Feign, Hystrix).
- Netflix Eureka Server/Client - Service registration and discovery (`eureka-server` and clients).
- Netflix Zuul - API Gateway routing and filtering (`api-gateway`).
- Spring Data JPA - Database ORM layer.
- Spring Session Data Redis - Shared session manager.

**Testing:**
- JUnit 4 / 5 (via `spring-boot-starter-test`).
- Hoverfly Java 0.12.0 - Used for API simulation/mocking in `product-recommendation-service` tests.

**Build/Dev:**
- Maven Compiler Plugin - compiles Java source code.
- Lombok - boilerplate code reduction (getters/setters, constructors).

## Key Dependencies

**Critical:**
- `spring-cloud-starter-netflix-eureka-server` - Service Registry.
- `spring-cloud-starter-netflix-zuul` - Gateway proxy.
- `spring-cloud-starter-openfeign` - Declarative REST clients.
- `spring-session-data-redis` & `jedis` - Session clustering.
- `spring-boot-starter-data-jpa` - Relational mapping.
- `mssql-jdbc` - Microsoft SQL Server database connectivity.
- `lombok` - Annotation library for boilerplate removal.
- `hoverfly-java` - API mocking library in tests.

## Configuration

**Environment:**
- All settings configured via static `application.properties` files inside `src/main/resources/` in each service.
- Properties include server ports, database connection details, Eureka zone configuration, Redis hosts, and Zuul routes.

**Build:**
- Individual `pom.xml` files in each service directory.
- Maven wrapper configuration under `.mvn/wrapper/`.

## Platform Requirements

**Development:**
- Windows/Linux/macOS with Java 21 (or Java 12+ compatibility).
- Local SQL Server instance running with database credentials (`sa`/`Test1`).
- Local Redis instance running on port `6379`.

**Production:**
- Standalone runnable JAR files deployed via Docker containers/Kubernetes.
- Externalized database (SQL Server) and Cache (Redis).

---

*Stack analysis: 2026-06-08*
*Update after major dependency changes*
