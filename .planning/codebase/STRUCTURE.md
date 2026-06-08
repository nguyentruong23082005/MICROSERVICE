# Codebase Structure

**Analysis Date:** 2026-06-08

## Directory Layout

```
e-commerce-microservices/
├── api-gateway/                      # API Gateway Proxy (Zuul Router)
│   ├── src/main/java/                # Java source files
│   └── src/main/resources/           # Properties configurations
├── eureka-server/                    # Discovery Service Server
│   ├── src/main/java/
│   └── src/main/resources/
├── order-service/                    # Shopping Cart (Redis) & Orders Service
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── src/test/java/                # Unit & integration tests
├── product-catalog-service/          # Product Catalog Service
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── src/test/java/
├── product-recommendation-service/   # Recommendations Service
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── src/test/java/
├── user-service/                     # User Registry & Details Service
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── src/test/java/
└── README.md                         # Project documentation
```

## Directory Purposes

**api-gateway/**
- Purpose: Handles client API routing and shares HTTP sessions down-stream.
- Key files:
  - `ApiGatewayApplication.java` - Application entry point.
  - `WebSecurityConfig.java` - Security routing rules.
  - `SessionFilter.java` - Zuul filter propagating sessions.

**eureka-server/**
- Purpose: Service Discovery Server that registers all microservices.
- Key files:
  - `EurekaServerApplication.java` - Eureka starter boot class.

**user-service/**
- Purpose: User management, details, and authentication logic.
- Subdirectories:
  - `controller/` - REST Controllers (`UserController.java`, `RegisterController.java`).
  - `entity/` - Database entities (`User.java`, `UserDetails.java`, `UserRole.java`).
  - `repository/` - Database interfaces (`UserRepository.java`, `UserDetailsRepository.java`).
  - `service/` - Business logic interfaces & implementation.

**product-catalog-service/**
- Purpose: Exposes product information to shoppers and administration.
- Key files:
  - `ProductController.java` - Product API endpoints.
  - `AdminProductController.java` - Back-office APIs.
  - `Product.java` - Product JPA entity.

**order-service/**
- Purpose: Maintains Giỏ hàng (Redis) and processes Đơn hàng (Order).
- Key files:
  - `CartController.java` - REST actions for giỏ hàng.
  - `OrderController.java` - Order checkout operations.
  - `CartRedisRepositoryImpl.java` - Redis wrapper for cart state.

**product-recommendation-service/**
- Purpose: Generates product recommendations based on ratings and comments.
- Key files:
  - `RecommendationController.java` - Recommendations API.
  - `ProductClient.java` & `UserClient.java` - OpenFeign interfaces.

## Key File Locations

**Entry Points:**
- `api-gateway/src/main/java/com/rainbowforest/apigateway/ApiGatewayApplication.java`
- `eureka-server/src/main/java/com/rainbowforest/eurekaserver/EurekaServerApplication.java`
- `user-service/src/main/java/com/rainbowforest/userservice/UserServiceApplication.java`
- `product-catalog-service/src/main/java/com/rainbowforest/productcatalogservice/ProductCatalogServiceApplication.java`
- `product-recommendation-service/src/main/java/com/rainbowforest/recommendationservice/ProductRecommendationServiceApplication.java`
- `order-service/src/main/java/com/rainbowforest/orderservice/OrderServiceApplication.java`

**Configuration:**
- `[service]/src/main/resources/application.properties` - Configuration properties for each microservice.

**Core Logic Packages:**
- `com.rainbowforest.[service].controller` - Web Controllers.
- `com.rainbowforest.[service].service` - Business logic implementation.
- `com.rainbowforest.[service].repository` - Database queries.

**Testing:**
- Located inside `[service]/src/test/java/com/rainbowforest/[service]/`.

## Naming Conventions

**Files:**
- PascalCase for Java files (`UserController.java`).
- `*Tests.java` or `*Test.java` for testing suites (`OrderControllerTest.java`).
- `pom.xml` in lowercase.

**Directories:**
- kebab-case for directories in workspace (`product-catalog-service`).
- All lowercase for java packages (`com.rainbowforest.orderservice.feignclient`).

## Where to Add New Code

**New Microservice (e.g., payment-service or notification-service):**
- Create folder `payment-service/` at workspace root.
- Initialize `pom.xml` with dependencies.
- Add Maven wrappers `.mvn/`, `mvnw`, `mvnw.cmd`.
- Follow directories `src/main/java/com/rainbowforest/paymentservice/` and `src/main/resources/application.properties`.

**New API Endpoint in User Service:**
- Controller code: `user-service/src/main/java/com/rainbowforest/userservice/controller/`
- Service code: `user-service/src/main/java/com/rainbowforest/userservice/service/`
- DB fields: `user-service/src/main/java/com/rainbowforest/userservice/entity/`

---

*Structure analysis: 2026-06-08*
*Update when directory structure changes*
