# config/test-rules.md

Tài liệu mô tả business rules, permissions, và scenarios cho **Upmount Custody Platform**.
**QUAN TRỌNG**: AI dùng file này để sinh integration tests và RBAC tests.

---

## 1. Business Rules

### Authentication Rules
- Register yêu cầu email + password, trả về OTP để verify
- Login yêu cầu email + password đã verified, trả về accessToken + refreshToken
- Email phải verified trước khi login (POST /verify-email với OTP)
- Refresh token dùng để lấy accessToken mới khi hết hạn
- Forgot password gửi OTP qua email, reset password cần OTP + newPassword
- 2FA (TOTP) bắt buộc cho các thao tác nhạy cảm (vault, withdrawal)
- Enable 2FA: generate secret → verify OTP → enabled
- Disable 2FA: yêu cầu OTP hiện tại

### KYC Rules (Know Your Customer)
- KYC init qua Sumsub, trả về token + userId cho SDK
- KYC status: init → pending → completed/failed/onHold/awaitingUser/awaitingService/in_review
- User phải hoàn thành KYC trước khi thực hiện giao dịch (assumption)
- KYC status chỉ có thể query, không thể update thủ công bởi user

### KYB Rules (Know Your Business)
- KYB yêu cầu đầy đủ business info: legalBusinessName, countryId, contactEmail, businessAddress, businessDescription, registrationNumber, dateOfIncorporation
- KYB phải có ít nhất 1 ownership (primary_owner)
- KYB phải đính kèm fileIds (legal documents)
- KYB status: submitted → approved/rejected
- businessType enum: company | partnership | other
- ownerRole enum: primary_owner | beneficial_owner
- Không thể sửa KYB sau khi đã submitted (assumption)

### Vault Account Rules
- Tạo vault account yêu cầu 2FA OTP + name
- Vault name bắt buộc, không được rỗng
- Có thể gán assetIds và userIds khi tạo vault
- Update vault chỉ đổi được name, yêu cầu OTP
- Add assets vào vault yêu cầu OTP + assetIds
- Assign/Remove users yêu cầu OTP + userIds
- Mỗi vault có unique ID (UUID format)

### Transaction Rules
- Transaction types: deposit | withdrawal | sweep | rebalance | faucet
- Transaction statuses: pending → approved → processing → confirmed → completed
- Transaction statuses (negative): pending → rejected | failed
- Transaction statuses (org flow): pending → organization_review → pending_approval → approved | organization_rejected
- Withdrawal yêu cầu 2FA OTP
- Transaction có fee (string, vd: "0.01")
- Transaction amount phải > 0
- Mỗi transaction gắn với 1 asset (symbol + network)
- Transaction có thể có fromAddress, toAddress, txHash
- System wallet types: hot | cold | warm

### Organization Rules
- Organization profile: id, name, email, avatar, websiteUrl
- Update org chỉ cho phép đổi name và avatar
- Organization có KYB status array (multiple tiers)
- Organization có sumsubReviewResult và status

### Asset Rules
- Asset = Symbol + Network (vd: BTC trên mạng Bitcoin)
- Symbol: id, symbol, name, iconUrl
- Network: id, name, explorerUrl (nullable), iconUrl
- Asset ID là unique

### File Upload Rules
- Pre-signed URL: yêu cầu type (enum: "kyb") + fileName
- Upload trả về id, url, fields cho S3 upload
- Image upload chỉ chấp nhận: jpg, jpeg, png, heic, heif
- File size limits (assumption: server-side validation)

---

## 2. Resource Relations

### User → Organization (N-1)
- User thuộc 1 Organization
- Organization có nhiều users
- Organization profile quản lý bởi admin/owner

### Organization → KYB (1-N)
- Organization có thể có nhiều KYB submissions (multiple tiers: basic, vip)
- KYB status independent cho mỗi tier

### Organization → Vault Accounts (1-N)
- Organization (1) → Vault Accounts (N)
- Vault accounts scoped theo organization

### Vault Account → Assets (N-N)
- Vault Account có thể chứa nhiều assets
- Asset có thể thuộc nhiều vault accounts
- Add/Remove assets thông qua vault API

### Vault Account → Users (N-N)
- Vault Account có thể assigned cho nhiều users
- User có thể access nhiều vault accounts
- Assign/Remove users thông qua vault API

### Vault Account → Transactions (1-N)
- Transaction gắn với fromVaultAccount và/hoặc toVaultAccount
- Transaction có statusHistory (array of status changes with timestamps)

### Asset → Symbol + Network (composition)
- Asset = Symbol (BTC, ETH) + Network (Bitcoin, Ethereum)
- Symbol và Network là lookup entities

---

## 3. Validation Rules

### Field Validations
- **Email**: format email hợp lệ (RFC 5322), unique trong hệ thống
- **Password**: string, minimum length (assumption: 8+ chars)
- **OTP**: string 6 digits (vd: "123456")
- **Vault name**: string, không rỗng
- **Transaction amount**: string số dương (vd: "1000")
- **businessType**: enum ["company", "partnership", "other"]
- **ownerRole**: enum ["primary_owner", "beneficial_owner"]
- **Transaction type**: enum ["deposit", "withdrawal", "sweep", "rebalance", "faucet"]
- **Transaction status**: enum ["pending", "completed", "failed", "rejected", "approved", "processing", "confirmed", "verifying", "organization_review", "organization_rejected", "pending_approval", "in_progress"]
- **System wallet type**: enum ["hot", "cold", "warm"]
- **File type for presigned**: enum ["kyb"]
- **Country ID**: number, phải tồn tại trong danh sách countries
- **Date formats**: YYYY-MM-DD (dateOfBirth, dateOfIncorporation)
- **DateTime format**: ISO 8601 (createdAt, updatedAt)

### Cross-field Validations
- **KYB ownerships**: phải có ít nhất 1 entry, mỗi entry cần fullName + dateOfBirth + countryId + email + ownerRole + organizationRole
- **KYB fileIds**: array không rỗng, mỗi fileId phải valid (đã upload qua presigned URL)
- **Vault assetIds**: mỗi assetId phải tồn tại trong hệ thống
- **Vault userIds**: mỗi userId phải thuộc cùng organization

### Unique Constraints
- Email unique globally
- Vault Account ID unique (UUID)
- Transaction ID unique (UUID)
- Asset ID unique

---

## 4. Permission Matrix

> Roles: admin (organization admin), user (regular member), guest (no token)
> Security: Bearer token (JWT) via Authorization header

| Endpoint | Method | admin | user | guest |
|---|---|---|---|---|
| **Health** |
| /api/health | GET | ✅ | ✅ | ✅ |
| /api/health/ready | GET | ✅ | ✅ | ✅ |
| **Users Auth** |
| /api/users/auth/register | POST | — | — | ✅ |
| /api/users/auth/login | POST | — | — | ✅ |
| /api/users/auth/verify-email | POST | — | — | ✅ |
| /api/users/auth/refresh-token | POST | ✅ | ✅ | ❌ |
| /api/users/auth/forgot-password | POST | — | — | ✅ |
| /api/users/auth/reset-password | POST | — | — | ✅ |
| /api/users/auth/resend-otp | POST | — | — | ✅ |
| **2FA** |
| /api/users/2fa/generate | POST | ✅ | ✅ | ❌ |
| /api/users/2fa/verify | POST | ✅ | ✅ | ❌ |
| /api/users/2fa/disable | POST | ✅ | ✅ | ❌ |
| **User Profile** |
| /api/users/profile | GET | ✅ | ✅ | ❌ |
| /api/users/profile | PUT | ✅ | ✅ | ❌ |
| /api/users/profile/upload-avatar | POST | ✅ | ✅ | ❌ |
| /api/users/primary-owner | GET | ✅ | ✅ | ❌ |
| **KYC** |
| /api/users/kyc | POST | ✅ | ✅ | ❌ |
| /api/users/kyc/status | GET | ✅ | ✅ | ❌ |
| **KYB** |
| /api/users/organization/kyb | POST | ✅ | ❌ | ❌ |
| /api/users/organization/kyb/status | GET | ✅ | ✅ | ❌ |
| /api/users/organization/kyb/detail | GET | ✅ | ✅ | ❌ |
| **Vault Accounts** |
| /api/vault | POST | ✅ | ❌ | ❌ |
| /api/vault | GET | ✅ | ✅ | ❌ |
| /api/vault/{id} | GET | ✅ | ✅ | ❌ |
| /api/vault/{id} | PUT | ✅ | ❌ | ❌ |
| /api/vault/{id}/add-assets | POST | ✅ | ❌ | ❌ |
| /api/vault/{id}/assign-users | POST | ✅ | ❌ | ❌ |
| /api/vault/{id}/remove-users | POST | ✅ | ❌ | ❌ |
| /api/vault/{id}/assets | GET | ✅ | ✅ | ❌ |
| /api/vault/deposit-address/{id} | GET | ✅ | ✅ | ❌ |
| /api/vault/withdrawal | POST | ✅ | ❌ | ❌ |
| **Transactions** |
| /api/transactions | GET | ✅ | ✅ | ❌ |
| /api/transactions/{id} | GET | ✅ | ✅ | ❌ |
| **Organization** |
| /api/organization/profile | GET | ✅ | ✅ | ❌ |
| /api/organization/profile | PUT | ✅ | ❌ | ❌ |
| **Assets** |
| /api/assets | GET | ✅ | ✅ | ❌ |
| **Countries** |
| /api/countries | GET | ✅ | ✅ | ✅ |
| **Files** |
| /api/files/presigned-post | POST | ✅ | ✅ | ❌ |
| /api/files/presigned-get/{id} | GET | ✅ | ✅ | ❌ |

> **Ghi chú**: admin = organization admin (có quyền quản lý vault, KYB, org profile). user = member thường (chỉ xem, không tạo/sửa vault hay submit KYB).

---

## 5. Field-level Permissions

| Field | admin (read) | admin (write) | user (read) | user (write) |
|---|---|---|---|---|
| **User Profile** |
| email | ✅ | ❌ | ✅ | ❌ |
| firstName, lastName | ✅ | ✅ | ✅ | ✅ |
| avatar | ✅ | ✅ | ✅ | ✅ |
| **Vault Account** |
| id | ✅ | — | ✅ | — |
| name | ✅ | ✅ | ✅ | ❌ |
| assets | ✅ | ✅ (add) | ✅ | ❌ |
| users | ✅ | ✅ (assign/remove) | ✅ | ❌ |
| **Organization** |
| name | ✅ | ✅ | ✅ | ❌ |
| email | ✅ | ❌ | ✅ | ❌ |
| avatar | ✅ | ✅ | ✅ | ❌ |
| **Transaction** |
| all fields | ✅ | — | ✅ | — |

---

## 6. State Machines

### Transaction Status
```
Transaction lifecycle (deposit):
  pending → processing → confirmed → completed
  pending → failed

Transaction lifecycle (withdrawal):
  pending → organization_review → pending_approval → approved → processing → confirmed → completed
  pending → organization_review → organization_rejected
  pending → rejected
  pending → failed

  Invalid transitions (expect 400/422):
  completed → pending       (không thể quay lại)
  rejected → approved       (không thể approve sau reject)
  failed → processing       (không thể retry tự động)
  completed → failed        (final state)
```

### KYB Status
```
KYB lifecycle:
  (none) → submitted    (user submit KYB form)
  submitted → approved   (admin/compliance approve)
  submitted → rejected   (admin/compliance reject)

  Invalid transitions:
  approved → submitted   (không thể re-submit sau approve)
  rejected → approved    (phải submit lại KYB mới)
```

### KYC (Sumsub) Status
```
KYC lifecycle:
  init → pending → completed
  init → pending → failed
  init → pending → onHold
  pending → awaitingUser → pending → completed
  pending → in_review → completed/failed

  Note: KYC managed by Sumsub, status transitions handled externally
```

### 2FA Status
```
2FA lifecycle:
  disabled → generate (secret created)
  generate → verify (OTP confirmed) → enabled
  enabled → disable (OTP confirmed) → disabled

  Conditions:
  - Generate trả về secret + QR code URI
  - Verify yêu cầu valid TOTP code
  - Disable yêu cầu valid TOTP code (phải enabled trước)
```

---

## 7. Integration Scenarios

### Scenario 1: User registration và email verification
**Actor**: guest
**Mô tả**: Complete registration flow từ signup đến verified account
**Steps**:
1. Guest POST /api/users/auth/register với email + password
2. Verify response 200, nhận được OTP reference
3. Guest POST /api/users/auth/verify-email với email + OTP
4. Verify response 200, email verified
5. Guest POST /api/users/auth/login với email + password
6. Verify response 200, nhận accessToken + refreshToken
7. User GET /api/users/profile với Bearer token
8. Verify response 200, profile data returned
**Expected**: Tài khoản tạo thành công, login OK, profile accessible

---

### Scenario 2: Token refresh flow
**Actor**: user (authenticated)
**Mô tả**: Refresh access token khi hết hạn
**Steps**:
1. User POST /api/users/auth/refresh-token với refreshToken
2. Verify response 200, nhận accessToken mới + refreshToken mới
3. User GET /api/users/profile với accessToken mới
4. Verify response 200, profile accessible với token mới
**Expected**: Token refresh thành công, new tokens valid

---

### Scenario 3: Forgot password flow
**Actor**: guest
**Mô tả**: Reset password khi quên
**Steps**:
1. Guest POST /api/users/auth/forgot-password với email
2. Verify response 200, OTP sent
3. Guest POST /api/users/auth/reset-password với email + OTP + newPassword
4. Verify response 200
5. Guest POST /api/users/auth/login với email + newPassword
6. Verify response 200, login thành công với password mới
**Expected**: Password reset flow hoàn chỉnh

---

### Scenario 4: Enable 2FA và verify
**Actor**: user (authenticated)
**Mô tả**: Setup TOTP 2FA cho tài khoản
**Steps**:
1. User POST /api/users/2fa/generate
2. Verify response 200, nhận secret + otpauthUrl
3. User POST /api/users/2fa/verify với valid OTP từ authenticator app
4. Verify response 200, 2FA enabled
**Expected**: 2FA enabled thành công
**Note**: Test environment có thể cần mock TOTP generation

---

### Scenario 5: KYB submission flow
**Actor**: admin (organization admin)
**Mô tả**: Submit KYB cho organization
**Steps**:
1. Admin GET /api/countries → lấy countryId
2. Admin POST /api/files/presigned-post với type="kyb", fileName="business_license.pdf"
3. Verify response 200, nhận presigned URL + fields
4. Admin POST /api/users/organization/kyb với đầy đủ business info + ownerships + fileIds
5. Verify response 200/201, KYB submitted
6. Admin GET /api/users/organization/kyb/status
7. Verify response 200, status = "submitted"
8. Admin GET /api/users/organization/kyb/detail
9. Verify response 200, business info matches submitted data
**Expected**: KYB submitted thành công, status trackable

---

### Scenario 6: Vault account lifecycle
**Actor**: admin (organization admin)
**Mô tả**: Tạo vault, add assets, assign users
**Steps**:
1. Admin GET /api/assets → lấy danh sách available assets
2. Admin POST /api/vault với OTP + name + assetIds + userIds
3. Verify response 200/201, vault created với ID
4. Admin GET /api/vault/{id} → verify vault details
5. Admin POST /api/vault/{id}/add-assets với OTP + additional assetIds
6. Verify response 200
7. Admin GET /api/vault/{id}/assets → verify assets added
8. Admin PUT /api/vault/{id} với OTP + new name
9. Verify response 200, name updated
10. Admin GET /api/vault → verify vault in list
**Expected**: Vault CRUD lifecycle hoàn chỉnh

---

### Scenario 7: Deposit address và transaction flow
**Actor**: admin/user
**Mô tả**: Lấy deposit address và view transactions
**Steps**:
1. Admin POST /api/vault với OTP + name → tạo vault
2. Admin POST /api/vault/{vaultId}/add-assets với OTP + assetIds
3. User GET /api/vault/deposit-address/{assetId-in-vault} → lấy deposit address
4. Verify response 200, có address
5. User GET /api/transactions → list transactions
6. Verify response 200, paginated list
7. (Nếu có transaction) User GET /api/transactions/{id} → transaction detail
8. Verify response 200, đầy đủ fields: id, asset, type, status, amount, fee, createdAt
**Expected**: Deposit address generated, transactions viewable

---

### Scenario 8: Withdrawal flow
**Actor**: admin
**Mô tả**: Initiate withdrawal từ vault
**Steps**:
1. Admin POST /api/vault/withdrawal với withdrawal details + OTP
2. Verify response 200/201, transaction created
3. Admin GET /api/transactions → verify withdrawal in list
4. Admin GET /api/transactions/{id} → verify status = pending hoặc organization_review
**Expected**: Withdrawal initiated, pending approval

---

### Scenario 9: User assign/remove từ vault
**Actor**: admin
**Mô tả**: Manage vault access cho team members
**Steps**:
1. Admin POST /api/vault với OTP + name → tạo vault
2. Admin POST /api/vault/{id}/assign-users với OTP + userIds
3. Verify response 200, users assigned
4. Admin POST /api/vault/{id}/remove-users với OTP + userIds
5. Verify response 200, users removed
**Expected**: User access management hoạt động đúng

---

### Scenario 10: Guest chỉ access public endpoints
**Actor**: guest (no token)
**Mô tả**: Verify public vs protected endpoints
**Steps**:
1. Guest GET /api/health → expect 200 (public)
2. Guest GET /api/health/ready → expect 200 (public)
3. Guest GET /api/countries → expect 200 (public)
4. Guest GET /api/users/profile → expect 401 (protected)
5. Guest GET /api/vault → expect 401 (protected)
6. Guest GET /api/transactions → expect 401 (protected)
7. Guest GET /api/assets → expect 401 (protected)
8. Guest POST /api/vault → expect 401 (protected)
**Expected**: Public endpoints accessible, protected return 401

---

### Scenario 11: User không có quyền admin actions (RBAC)
**Actor**: user (regular member)
**Mô tả**: Verify user không thể thực hiện admin-only actions
**Steps**:
1. User POST /api/vault → expect 403 (admin only)
2. User PUT /api/vault/{id} → expect 403 (admin only)
3. User POST /api/vault/{id}/add-assets → expect 403 (admin only)
4. User POST /api/vault/{id}/assign-users → expect 403 (admin only)
5. User POST /api/vault/{id}/remove-users → expect 403 (admin only)
6. User POST /api/users/organization/kyb → expect 403 (admin only)
7. User PUT /api/organization/profile → expect 403 (admin only)
**Expected**: All admin actions return 403 for regular users

---

### Scenario 12: Organization profile management
**Actor**: admin
**Mô tả**: View và update organization profile
**Steps**:
1. Admin GET /api/organization/profile
2. Verify response 200, có id, name, email, avatar, kyb, status, createdAt
3. Admin PUT /api/organization/profile với name="Updated Org Name"
4. Verify response 200, name updated
5. Admin GET /api/organization/profile → verify name persisted
**Expected**: Org profile CRUD hoạt động đúng

---

## 8. Special Notes

### Email + Password Authentication
- Hệ thống dùng email/password authentication (không phải wallet-based)
- Register → verify email (OTP) → login → JWT tokens
- Token format: Bearer {accessToken} trong Authorization header
- AccessToken short-lived, refreshToken long-lived

### 2FA (Two-Factor Authentication)
- TOTP-based (Time-based One-Time Password), compatible Google Authenticator
- Required cho: vault creation, vault update, add assets, assign/remove users, withdrawal
- OTP field: string 6 digits

### KYC/KYB Compliance
- KYC handled by Sumsub (third-party), status tracked via API
- KYB submitted directly to Upmount, reviewed internally
- KYB requires legal documents uploaded via pre-signed URLs

### Pre-signed URL Pattern
- Step 1: POST /api/files/presigned-post → nhận URL + fields
- Step 2: Upload file trực tiếp tới S3 via presigned URL
- Step 3: Sử dụng fileId trong subsequent requests (KYB, avatar, etc.)

### Response Format
- Wrapped response: `{ statusCode, message, data }` (ResponseDto pattern)
- Pagination: query params page, limit (assumption)
- Error format: `{ statusCode, message, error? }`

### UUID Usage
- Vault Account IDs: UUID v4 format
- Transaction IDs: UUID v4 format
- File IDs: string (from presigned upload)

### Multi-tier KYB
- Organization có thể có nhiều KYB levels (basic, vip)
- Mỗi tier có independent status

### Soft Delete
- Users/Organizations dùng status field thay vì hard delete (assumption)

### Rate Limiting (Assumption)
- Login endpoint: 5 attempts/minute per email
- Register endpoint: 3 attempts/hour per IP
- OTP endpoints: 3 resends/hour per email
- Vault operations: 10/minute per user
