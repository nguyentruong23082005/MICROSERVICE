@echo off
echo ==============================================================
echo 1. Khoi dong ha tang (Postgres, Redis, Kafka) qua Docker...
echo ==============================================================
docker compose up -d postgres redis zookeeper kafka mongo

echo.
echo ==============================================================
echo 2. Khoi dong cac microservices Java trong terminal rieng...
echo ==============================================================

echo Khoi dong eureka-server (Port 8761)...
start "eureka-server (8761)" cmd /k "cd eureka-server && .\mvnw.cmd spring-boot:run"
echo Doi 5 giay cho Eureka khoi dong...
timeout /t 5 >nul

echo Khoi dong user-service (Port 8811)...
start "user-service (8811)" cmd /k "cd user-service && .\mvnw.cmd spring-boot:run"

echo Khoi dong product-catalog-service (Port 8812)...
start "product-catalog-service (8812)" cmd /k "cd product-catalog-service && .\mvnw.cmd spring-boot:run"

echo Khoi dong product-recommendation-service (Port 8814)...
start "product-recommendation-service (8814)" cmd /k "cd product-recommendation-service && .\mvnw.cmd spring-boot:run"

echo Khoi dong order-service (Port 8813)...
start "order-service (8813)" cmd /k "cd order-service && .\mvnw.cmd spring-boot:run"

echo Khoi dong payment-service (Port 8815)...
start "payment-service (8815)" cmd /k "cd payment-service && .\mvnw.cmd spring-boot:run"

echo Khoi dong notification-service (Port 8816)...
start "notification-service (8816)" cmd /k "cd notification-service && .\mvnw.cmd spring-boot:run"

echo Khoi dong api-gateway (Port 8900)...
start "api-gateway (8900)" cmd /k "cd api-gateway && .\mvnw.cmd spring-boot:run"

echo.
echo ==============================================================
echo 3. Khoi dong Frontend (Port 3000)...
echo ==============================================================
start "frontend (3000)" cmd /k "cd frontend && python -m http.server 3000"

echo.
echo ==============================================================
echo Da mo 9 cua so terminal cho cac services va frontend local!
echo Ha tang Postgres, Redis, Kafka van dang chay trong Docker.
echo ==============================================================
pause
