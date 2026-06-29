# Phase 3: JWT Authentication & Phan quyen - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning
**Source:** Lab 3 Security Requirements with Design Refinements (V2)

<domain>
## Phase Boundary

Trien khai he thong bao mat va xac thuc nguoi dung su dung JWT, Refresh Token va Redis. Bao ve API tai API Gateway va cac service noi bo, phan quyen USER va ADMIN, kiem tra quyen so huu don hang o order-service (tra ve 404 neu khong hop le bang cach so sanh truc tiep userId ma khong dung Feign), truyen token qua OpenFeign va cau hinh Swagger/OpenAPI de kiem thu.

</domain>

<decisions>
## Implementation Decisions

### Auth Service (User Service)
- **Khai bao Controller**:
  - RegisterController chi dam nhan dang ky tai khoan (POST /auth/registration).
  - AuthController dam nhan dang nhap (POST /auth/login), lam moi token (POST /auth/refresh), va dang xuat (POST /auth/logout).
- **Dang ky**: Tu dong ma hoa mat khau truoc khi luu tru bang BCryptPasswordEncoder.
- **Dang nhap**: Kiem tra mat khau da ma hoa, sinh ra cap Access Token (roles claim) va Refresh Token.
- **Luu tru Refresh Token**: Luu Refresh Token trong Redis voi dinh dang:
  - Key: efresh:<userId>
  - Value: efreshTokenString
  - TTL: 7 ngay (604800 giay).
- **API cap lai Access Token**: Post mapping /auth/refresh nhan vao userId va efreshToken, kiem tra khop tren Redis va cap access token moi.
- **API logout**: Post mapping /auth/logout xoa Refresh Token khoi Redis va dua Access Token hien tai vao Blacklist tren Redis:
  - Key: lacklist:<accessToken>
  - Value: 	rue
  - TTL: Khoang thoi gian con lai cua Access Token (tinh dong tu claim exp).

### API Gateway
- **Xac minh JWT**: Xac minh tinh hop le cua JWT (chu ky, het han). Neu co loi hoac het han, tra ve 401 Unauthorized.
- **Kiem tra Blacklist**: Dung ReactiveRedisTemplate kiem tra key lacklist:<accessToken>. Neu ton tai, tu choi request voi 401.
- **Phan quyen**: Cho phep public cac route login/register/refresh (/api/accounts/auth/**). Chan va yeu cau quyen ADMIN cho cac route /api/catalog/admin/**.
- **Downstream Headers**: Mutate request de truyen X-User-Id va X-User-Roles xuong cac service phia sau.

### Internal Services Protection (order-service, product-catalog-service)
- **Bao ve API o Service**: Them dependency spring-boot-starter-security vao cac service noi bo.
- **Spring Security Config**: Cau hinh SecurityFilterChain them mot GatewayHeaderFilter dung truoc UsernamePasswordAuthenticationFilter.
- **GatewayHeaderFilter**:
  - Kiem tra neu thieu header X-User-Id, tra ve **401 Unauthorized** ngay lap tuc de ngan chan nguoi dung goi truc tiep vao service noi bo bypass qua Gateway.
  - Neu co header X-User-Id, tu dong dong goi thong tin user va roles tu header X-User-Roles vao SecurityContext de phan quyen.

### Order Service (Quyen so huu & OpenFeign)
- **Entity mapping**:
  - Loai bo @GeneratedValue khoi local User entity trong order-service de cho phep luu tru trung ID goc cua user-service.
  - Tao UserRepository tai order-service de dong bo user ma khong set ID null khi checkout.
- **Kiem tra quyen so huu**:
  - Khi xem hoac huy don hang tai GET /order/{orderId}, lay X-User-Id tu request va so sanh truc tiep voi ID cua order.getUser().getId() (la ID goc).
  - Khong thuc hien cac cuoc goi Feign phu tro trong qua trinh check de tang toc do va loai bo nguy co chet nghiep vu neu service User down.
  - Tra ve **404 Not Found** neu khong khop va nguoi dung khong co vai tro ADMIN.
- **Bao ve api tao don**: Chi cho phep tao don neu X-User-Id trung voi userId trong path variable (hoac user la ADMIN).
- **OpenFeign**: Them RequestInterceptor de tu dong truyen Authorization header va cac headers context xuong downstream.

### Swagger & Testing
- **Swagger/OpenAPI**: Cau hinh Swagger de ho tro Authorize Bearer Token.
- **Kiem thu**: Xay dung test cases verify 13 tinh huong bao mat (tieu bieu: test blacklist Access Token cu va Refresh Token sau khi logout).

### Keycloak Comparison
- Tai lieu hoa su khac nhau giua JWT tu xay dung va Keycloak trong COMPARE.md.

</decisions>

<canonical_refs>
## Canonical References

No external specs - requirements fully captured in decisions above.

</canonical_refs>
