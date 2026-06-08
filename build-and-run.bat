@echo off
echo 1. Building all services locally...

for %%s in (eureka-server user-service product-catalog-service product-recommendation-service order-service payment-service notification-service api-gateway) do (
    echo ----------------------------------------
    echo Packaging %%s...
    echo ----------------------------------------
    cd %%s
    call mvnw.cmd clean package -Dmaven.test.skip=true
    if errorlevel 1 (
        echo [ERROR] Build failed for %%s
        cd ..
        exit /b 1
    )
    cd ..
)

echo ----------------------------------------
echo 2. Running Docker Compose...
echo ----------------------------------------
docker compose up --build -d
