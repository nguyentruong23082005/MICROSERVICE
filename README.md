# REST Microservices Architecture for E-commerce

Production-ready learning project for an e-commerce system using Spring Boot microservices, API Gateway, Eureka, PostgreSQL, Redis, Kafka and a React/Vite frontend.

## Architecture

```text
frontend-react :5173
  ↓
api-gateway :8900
  ├─ user-service :8811            login/register/JWT
  ├─ product-catalog-service :8812 catalog + inventory consumer
  ├─ order-service :8813           Redis cart + checkout + order-created producer
  ├─ product-recommendation-service :8814
  ├─ payment-service :8815         order-created consumer + payment-completed producer
  └─ notification-service :8816    payment-completed consumer

Kafka topics:
  order-created → payment-service, product-catalog-service
  payment-completed → notification-service
```

## Services

| Service | Purpose | Port | Gateway route |
| --- | --- | ---: | --- |
| Eureka Server | Service discovery | 8761 | - |
| API Gateway | JWT filter + routing | 8900 | `/api/**` |
| User Service | Register/login/JWT | 8811 | `/api/accounts/**` |
| Product Catalog Service | Products/category/inventory | 8812 | `/api/catalog/**` |
| Order Service | Cart and checkout | 8813 | `/api/shop/**` |
| Product Recommendation Service | Reviews/recommendations | 8814 | `/api/review/**` |
| Payment Service | Payment automation | 8815 | `/api/payments/**` |
| Notification Service | User notifications | 8816 | `/api/notifications/**` |

## Tech stack

- Java 21
- Spring Boot 3.2.5
- Spring Cloud 2023.0.1
- Spring Cloud Gateway
- Spring Security + JWT
- Spring Data JPA + PostgreSQL
- Redis cart storage
- Apache Kafka event flow
- Eureka discovery
- React/Vite frontend

## Environment Configuration

Before running the infrastructure or services, copy the environment template:

```powershell
cp .env.example .env
```

The system uses the following environment variables (with defaults):
- `DB_PASSWORD` (default: `postgres`)
- `REDIS_HOST` (default: `localhost`)
- `KAFKA_SERVERS` (default: `localhost:9092`)
- `MONGO_HOST` (default: `localhost`)
- `JWT_SECRET` (default: `change-me-in-production`)

## Run infrastructure

```powershell
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5434`
- Redis on `localhost:6379`
- Kafka on `localhost:9092`

> If PostgreSQL was already initialized before `payments` and `notifications` databases were added, recreate the volume/container or manually create those databases.

## Run services

Open separate PowerShell terminals:

```powershell
cd C:\e-commerce-microservices\eureka-server
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\user-service
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\product-catalog-service
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\order-service
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\product-recommendation-service
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\payment-service
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\notification-service
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

```powershell
cd C:\e-commerce-microservices\api-gateway
.\mvnw.cmd "-Dmaven.test.skip=true" spring-boot:run
```

## Run frontend

```powershell
cd C:\e-commerce-microservices\frontend-react
npm install
npm run dev
```

Open `http://localhost:5173`.

## End-to-end test guide

### 1. Check Gateway

```powershell
Invoke-WebRequest http://localhost:8900/actuator/health
```

Expected: HTTP 200 if actuator is exposed, or use Eureka UI at `http://localhost:8761` to verify services are registered.

### 2. Register or login

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:8900/api/accounts/auth/login `
  -ContentType 'application/json' `
  -Body '{"userName":"admin","password":"admin"}'

$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
```

Expected: response contains a JWT token.

### 3. Load products

```powershell
Invoke-RestMethod -Method Get `
  -Uri http://localhost:8900/api/catalog/products `
  -Headers $headers
```

Expected: product list with `imageUrl`, `price`, `availability`, `category`.

### 4. Add product to Redis cart

Use any numeric cart cookie value, for example `1001`:

```powershell
$cartHeaders = @{ Authorization = "Bearer $token"; Cookie = "1001" }

Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:8900/api/shop/cart/1001/items?productId=1&quantity=2' `
  -Headers $headers
```

Expected: cart item is created in Redis.

### 5. Checkout

```powershell
Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:8900/api/shop/order/1/cart/1001' `
  -Headers $headers
```

Expected:

- Order is created with status `PAYMENT_EXPECTED`
- `order-created` Kafka event is published
- Cart is deleted

### 6. Verify payment automation

Wait a few seconds, then:

```powershell
Invoke-RestMethod -Method Get `
  -Uri http://localhost:8900/api/payments `
  -Headers $headers
```

Expected: payment row with status `COMPLETED` for the order.

### 7. Verify notification automation

```powershell
Invoke-RestMethod -Method Get `
  -Uri http://localhost:8900/api/notifications `
  -Headers $headers
```

Expected: notification row with status `SENT`.

### 8. Verify inventory reduction

```powershell
Invoke-RestMethod -Method Get `
  -Uri http://localhost:8900/api/catalog/products `
  -Headers $headers
```

Expected: purchased product `availability` decreases by checkout quantity.

## Success criteria

The project meets the requested completion requirements when:

- All services compile successfully on Java 21 / Spring Boot 3.2.5.
- API Gateway authenticates protected routes using JWT.
- Products include image support and seed data.
- Checkout creates an order and publishes `order-created` to Kafka.
- Payment service consumes `order-created` and creates completed payments.
- Notification service consumes `payment-completed` and creates notifications.
- Catalog service consumes `payment-completed` and reduces inventory.
- Frontend can display products, login, preview cart and inspect payments/notifications.
