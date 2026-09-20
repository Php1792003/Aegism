# Bảng Ánh Xạ Đổi Tên & Di Chuyển File (Rename Map)

Tài liệu này ghi lại toàn bộ các thay đổi về đường dẫn file và tên file trong đợt tái cấu trúc dự án Aegism Platform theo chuẩn `Skill_rename.md`.

---

## 1. Client (`client/src/`)

### 1.1 Phân hệ Pages (`pages/`)

| Tên & Đường dẫn cũ | Tên & Đường dẫn mới | Ghi chú & Lý do chuẩn hoá |
|---|---|---|
| **Public / Marketing** | | |
| `pages/LandingPage.tsx` | `pages/public/LandingPage.tsx` | Gom nhóm phân hệ Public |
| `pages/AboutPage.tsx` | `pages/public/AboutPage.tsx` | Gom nhóm phân hệ Public |
| `pages/FeaturesPage.tsx` | `pages/public/FeaturesPage.tsx` | Gom nhóm phân hệ Public |
| `pages/PricingPage.tsx` | `pages/public/PricingPage.tsx` | Gom nhóm phân hệ Public |
| `pages/ContactPage.tsx` | `pages/public/ContactPage.tsx` | Gom nhóm phân hệ Public |
| `pages/DownloadPage.tsx` | `pages/public/DownloadPage.tsx` | Gom nhóm phân hệ Public |
| `pages/PolicyPage.tsx` | `pages/public/PolicyPage.tsx` | Gom nhóm phân hệ Public |
| `pages/TermsPage.tsx` | `pages/public/TermsPage.tsx` | Gom nhóm phân hệ Public |
| `pages/RequestDemoPage.tsx` | `pages/public/RequestDemoPage.tsx` | Gom nhóm phân hệ Public |
| **Xác thực (Auth)** | | |
| `pages/Login.tsx` | `pages/auth/LoginPage.tsx` | Thêm hậu tố `Page`, component đổi thành `LoginPage` |
| `pages/RegisterPage.tsx` | `pages/auth/RegisterPage.tsx` | Gom nhóm vào `auth/` |
| `pages/ForgotPassword.tsx` | `pages/auth/ForgotPasswordPage.tsx` | Thêm hậu tố `Page`, component đổi thành `ForgotPasswordPage` |
| **Ứng dụng Tenant / Dashboard** | | |
| `pages/Dashboard.tsx` | `pages/dashboard/TenantDashboardPage.tsx` | Đổi tên phân biệt với SuperAdmin, component `TenantDashboardPage` |
| `pages/Project.tsx` | `pages/dashboard/ProjectListPage.tsx` | Đổi tên mô tả chức năng, component `ProjectListPage` |
| `pages/Task.tsx` | `pages/dashboard/TaskListPage.tsx` | Đổi tên mô tả chức năng, component `TaskListPage` |
| `pages/Staff.tsx` | `pages/dashboard/StaffPage.tsx` | Thêm hậu tố `Page`, component `StaffPage` |
| `pages/Chat.tsx` | `pages/dashboard/ChatPage.tsx` | Thêm hậu tố `Page`, component `ChatPage` |
| `pages/Helpdesk.tsx` | `pages/dashboard/HelpdeskPage.tsx` | Thêm hậu tố `Page`, component `HelpdeskPage` |
| `pages/QrCodes.tsx` | `pages/dashboard/QrCodeListPage.tsx` | Đổi tên mô tả danh sách QR, component `QrCodeListPage` |
| `pages/AuditLog.tsx` | `pages/dashboard/AuditLogPage.tsx` | Thêm hậu tố `Page`, component `AuditLogPage` |
| `pages/ReportDashboard.tsx` | `pages/dashboard/ReportDashboardPage.tsx` | Thêm hậu tố `Page`, component `ReportDashboardPage` |
| `pages/ProfilePage.tsx` | `pages/dashboard/ProfilePage.tsx` | Gom nhóm vào `dashboard/` |
| `pages/Branding.tsx` | `pages/dashboard/BrandingPage.tsx` | Thêm hậu tố `Page`, component `BrandingPage` |
| `pages/ApiIntegration.tsx` | `pages/dashboard/ApiIntegrationPage.tsx` | Thêm hậu tố `Page`, component `ApiIntegrationPage` |
| **Quản trị hệ thống (Super Admin)** | | |
| `pages/SuperAdminDashboard.tsx` | `pages/admin/SuperAdminDashboardPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminDashboardPage` |
| `pages/SuperAdminCustomers.tsx` | `pages/admin/SuperAdminCustomersPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminCustomersPage` |
| `pages/SuperAdminUsers.tsx` | `pages/admin/SuperAdminUsersPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminUsersPage` |
| `pages/SuperAdminRevenue.tsx` | `pages/admin/SuperAdminRevenuePage.tsx` | Thêm hậu tố `Page`, component `SuperAdminRevenuePage` |
| `pages/SuperAdminPlans.tsx` | `pages/admin/SuperAdminPlansPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminPlansPage` |
| `pages/SuperAdminPromo.tsx` | `pages/admin/SuperAdminPromoPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminPromoPage` |
| `pages/SuperAdminSecurity.tsx` | `pages/admin/SuperAdminSecurityPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminSecurityPage` |
| `pages/SuperAdminApiKeys.tsx` | `pages/admin/SuperAdminApiKeysPage.tsx` | Thêm hậu tố `Page`, component `SuperAdminApiKeysPage` |
| **Trang hệ thống (System & Errors)** | | |
| `pages/Scanredirect.tsx` | `pages/system/ScanRedirectPage.tsx` | Sửa lỗi chính tả/casing `Scanredirect` -> `ScanRedirectPage` |
| `components/NotFound.tsx` | `pages/system/NotFoundPage.tsx` | Chuyển trang lỗi 404 thực tế từ components sang pages/system |
| `components/ServerError.tsx` | `pages/system/ServerErrorPage.tsx` | Chuyển trang lỗi 500 thực tế từ components sang pages/system |
| `pages/NotFoundPage.tsx` | `_review/NotFoundPage.unused.tsx` | File cũ không được router sử dụng, cô lập vào `_review/` |

---

### 1.2 Hooks, Utils & Shared Components

| Tên & Đường dẫn cũ | Tên & Đường dẫn mới | Ghi chú & Lý do chuẩn hoá |
|---|---|---|
| `utils/useTenantLimits.ts` | `hooks/useTenantLimits.ts` | Custom hook chuyển về đúng thư mục `hooks/` |
| `utils/helpers.ts` | `utils/formatters.ts` | Đổi tên chung chung `helpers.ts` thành tên cụ thể `formatters.ts` |
| `components/Header.tsx` | `components/navigation/Header.tsx` | Gom nhóm component điều hướng |
| `components/Footer.tsx` | `components/navigation/Footer.tsx` | Gom nhóm component điều hướng |
| `components/SEO.tsx` | `components/seo/SEO.tsx` | Gom nhóm component SEO metadata |
| `components/StructuredData.tsx` | `components/seo/StructuredData.tsx` | Gom nhóm component JSON-LD schema |
| `components/PromoSystem.tsx` | `components/promo/PromoSystem.tsx` | Gom nhóm Context & Modal khuyến mãi |
| `components/PaymentModal.tsx` | `components/modals/PaymentModal.tsx` | Gom nhóm Modal thanh toán |

---

## 2. Server (`server/`)

| Tên & Đường dẫn cũ | Tên & Đường dẫn mới | Ghi chú & Lý do chuẩn hoá |
|---|---|---|
| `server/src/project/projectWithCounts.ts` | `server/src/_review/projectWithCounts.ts` | Dead code (logic đã có trong `project.types.ts`) |
| `server/src/project/projectWithDetails.ts` | `server/src/_review/projectWithDetails.ts` | Dead code (logic đã có trong `project.types.ts`) |
| `server/src/payment/payos.service.ts.save` | `server/src/_review/payos.service.ts.save` | File backup rác, chuyển vào `_review/` |
| `server/check_db.js` | `server/scripts/check_db.js` | Gom script kiểm tra database vào `scripts/` |
| `server/test-db.js` | `server/scripts/test-db.js` | Gom script kiểm tra database vào `scripts/` |
| `server/lint_output.txt` | `server/_review/lint_output.txt` | File log tạm, chuyển vào `_review/` |

---

## 3. Path Alias Cấu Hình

Đã cấu hình Path Alias `@/*` trỏ vào `./src/*` trong:
- `client/vite.config.ts`: `resolve.alias: { '@': path.resolve(__dirname, './src') }`
- `client/tsconfig.app.json`: `"baseUrl": ".", "paths": { "@/*": ["src/*"] }`
