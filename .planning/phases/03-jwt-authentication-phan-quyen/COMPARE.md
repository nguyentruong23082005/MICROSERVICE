# So sanh JWT tu xay dung vs Keycloak (OAuth2 / OIDC)

Day la ban so sanh chi tiet giua phuong phap bao mat JWT tu xay dung (dang trien khai o Cau 1) va tich hop Keycloak (Cau 2) de phuc vu cho bao cao Lab 3.

## Bang so sanh chi tiet

| Tieu chi so sanh | JWT tu xay dung (Custom JWT) | Keycloak (OAuth2 / OIDC Server) |
| :--- | :--- | :--- |
| **Co che hoat dong** | Tu viet code phat hanh, xac thuc JWT, su dung co so du lieu cua user-service va quan ly Refresh/Blacklist tren Redis. | Su dung mot may chu Keycloak rieng biet (Identity Provider) lam ben thu 3 dang ky, cap token va quan ly phan quyen. |
| **Kiem soat ma nguon** | Kiem soat hoan toan 100% logic ma hoa, cấu trúc token va luong xac thuc trong ma nguon du an. | Phiet lap cau hinh tren Keycloak Server; ma nguon ung dung chi can tich hop Spring Security OAuth2 Client/Resource Server. |
| **Kha nang mo rong** | Kho khan khi muon tich hop Single Sign-On (SSO), Social Login (Google, Facebook) hoac Multi-Factor Authentication (MFA). | Ho tro san co cac tinh nang SSO, Social Login, MFA, tu dong dong bo tai khoan va Key Rotation. |
| **Bao tri va quan tri** | Phai tu code va thiet ke UI quan tri user, tu quan ly ma hoa mat khau (BCrypt), co che blacklist va xoa session. | Cung cap san mot giao dien quan tri Admin Console cuc ky manh me de cap quyen, quan ly Realm, Client va User. |
| **Do phuc tap luc bat dau** | De dang va don gian khi trien khai tren quy mo nho, phu hop cho muc dich hoc tap va nghien cuu. | Can chay mot server rieng biet (qua Docker hoac bare-metal) va cau hinh kieu client-realm phuc tap hon. |

## Ket luan va Khuyen nghi

- **JWT tu xay dung (Cau 1):** Rieu qua voi cac he thong vua va nho, khi ban muon kiem soat hoan toan du lieu nguoi dung ma khong muon ton them tai nguyen chay mot Identity Provider doc lap nhu Keycloak.
- **Keycloak (Cau 2):** La lua chon hang dau cho kien truc Microservices dat chuan doanh nghiep, ho tro Single Sign-On phan tan cho nhieu service khac nhau va giai quyet toan bo van de ve bao mat, phan quyen, MFA, Social Login ma khong can phai viet code thu cong.
