Write-Host "1. Building all services locally..." -ForegroundColor Green
$services = @("eureka-server", "user-service", "product-catalog-service", "product-recommendation-service", "order-service", "payment-service", "notification-service", "api-gateway")
foreach ($service in $services) {
    Write-Host "Packaging $service..." -ForegroundColor Cyan
    Push-Location $service
    Start-Process .\mvnw.cmd -ArgumentList "clean package -Dmaven.test.skip=true" -NoNewWindow -Wait
    Pop-Location
}

Write-Host "2. Running Docker Compose..." -ForegroundColor Green
docker compose up --build -d
