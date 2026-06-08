# RainbowForest Frontend

Static HTML/CSS/JavaScript UI for testing the e-commerce microservices through `api-gateway`.

## Run

```powershell
python -m http.server 3000
```

Open:

```text
http://localhost:3000
```

## Backend expected

- API Gateway: `http://localhost:8900`
- Catalog route: `/api/catalog/products`
- Login route: `/api/accounts/login`
- Payment route: `/api/payments/payments`
- Notification route: `/api/notifications/notifications`

Checkout uses the existing Redis cart backend. Use the main README test guide for the real cart/checkout PowerShell commands.
