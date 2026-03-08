# Bug Reports — Upmount Custody Platform

**Ngày phát hiện:** 2026-03-05
**Môi trường:** DEV (`https://dev.api.upmount.sotatek.works`)
**Tổng bugs:** 8

---

## BUG-001: Server 500 trên POST /api/users/files/upload-image

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Endpoint** | `POST /api/users/files/upload-image` |
| **Layer** | Smoke |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X POST https://dev.api.upmount.sotatek.works/api/users/files/upload-image \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected
HTTP 400 hoặc 422 (validation error khi không có file)

### Actual
HTTP 500 — Internal Server Error

### Impact
Server crash khi nhận request upload không có file. Có thể là unhandled null/undefined khi parse multipart body.

---

## BUG-002: Server 500 trên GET /api/users/vault-accounts/{id}/users

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Endpoint** | `GET /api/users/vault-accounts/{id}/users` |
| **Layer** | Smoke |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X GET https://dev.api.upmount.sotatek.works/api/users/vault-accounts/1/users \
  -H "Authorization: Bearer <owner_token>"
```

### Expected
HTTP 200 (danh sách users) hoặc 404 (vault not found)

### Actual
HTTP 500 — Internal Server Error

### Impact
Không thể xem users thuộc vault. Có thể do query join lỗi hoặc null reference.

---

## BUG-003: Server 500 trên GET /api/users/transactions/{transactionId}

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Endpoint** | `GET /api/users/transactions/{transactionId}` |
| **Layer** | Smoke |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X GET https://dev.api.upmount.sotatek.works/api/users/transactions/1 \
  -H "Authorization: Bearer <owner_token>"
```

### Expected
HTTP 200 (transaction detail) hoặc 404 (not found)

### Actual
HTTP 500 — Internal Server Error

### Impact
Không thể xem chi tiết transaction. Possible null dereference hoặc missing DB relation.

---

## BUG-004: Error response thiếu field `message`

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Endpoint** | Tất cả endpoints trả error |
| **Layer** | Contract |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X POST https://dev.api.upmount.sotatek.works/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected (theo OpenAPI spec)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "data": null
}
```

### Actual
```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "statusCode": 400,
  "data": null
}
```

### Impact
Error response không có field `message` — vi phạm ResponseDto contract trong OpenAPI spec. 44 contract tests fail. Frontend có thể không hiển thị error message cho user.

### Note
Có thể API đã thay đổi error format (thêm `success` + `errorCode`, bỏ `message`). Cần confirm với dev team: đây là intentional change hay bug.

---

## BUG-005: IDOR — GET /api/users/organization/999999 trả 400 thay vì 403/404

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Endpoint** | `GET /api/users/organization/{id}` |
| **Layer** | Security |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X GET https://dev.api.upmount.sotatek.works/api/users/organization/999999 \
  -H "Authorization: Bearer <owner_token>"
```

### Expected
HTTP 403 (forbidden — không phải org của user) hoặc 404 (not found)

### Actual
HTTP 400 — Bad Request

### Impact
Status code 400 không chính xác cho trường hợp này. Nên trả 404 (ẩn sự tồn tại) hoặc 403 (access denied). Trả 400 có thể leak thông tin cho attacker biết API nhận org ID nhưng ID format sai, giúp họ probe valid format.

---

## BUG-006: Oversized Content-Length gây timeout thay vì reject

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Endpoint** | `POST /api/users/auth/login` |
| **Layer** | Security |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X POST https://dev.api.upmount.sotatek.works/api/users/auth/login \
  -H "Content-Type: application/json" \
  -H "Content-Length: 99999999" \
  -d '{"email":"test@test.com","password":"test"}'
```

### Expected
Server reject nhanh (413 Payload Too Large hoặc 400) trong <2s

### Actual
Request timeout sau 10s — server chờ đọc 99MB data không tồn tại

### Impact
Potential DoS vector. Attacker gửi nhiều request với Content-Length lớn → server giữ connections chờ → resource exhaustion. Cần set `maxBodyLength` limit ở reverse proxy hoặc Express.

---

## BUG-007: 2FA endpoints trả 403 thay vì 400/422 cho invalid OTP

| Field | Value |
|-------|-------|
| **Severity** | 🟢 Low |
| **Endpoint** | `POST /api/users/auth/two-factor/*` |
| **Layer** | Single API |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X POST https://dev.api.upmount.sotatek.works/api/users/auth/two-factor/verify-setup \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{"otp":"000000"}'
```

### Expected
HTTP 400 hoặc 422 (invalid OTP format/value)

### Actual
HTTP 403 — Forbidden

### Impact
Không nghiêm trọng, nhưng 403 semantically sai cho invalid input. 403 = "bạn không có quyền", 400 = "input sai". User/frontend có thể hiểu nhầm nguyên nhân lỗi.

---

## BUG-008: POST /api/users/profile/me trả 201 thay vì 200

| Field | Value |
|-------|-------|
| **Severity** | 🟢 Low |
| **Endpoint** | `POST /api/users/profile/me` |
| **Layer** | Single API |
| **Status** | Open |

### Steps to Reproduce
```bash
curl -X POST https://dev.api.upmount.sotatek.works/api/users/profile/me \
  -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected
HTTP 200 (update thành công) hoặc 400 (validation error)

### Actual
HTTP 201 — Created

### Impact
Profile update nên trả 200 (OK) vì đang update resource, không tạo mới. 201 (Created) chỉ dùng cho POST tạo resource mới. Vi phạm REST convention nhưng không ảnh hưởng chức năng.

---

## Tổng hợp theo Severity

| Severity | Count | Bugs |
|----------|-------|------|
| 🔴 Critical | 3 | BUG-001, BUG-002, BUG-003 (Server 500) |
| 🟡 Medium | 3 | BUG-004 (error envelope), BUG-005 (IDOR), BUG-006 (DoS) |
| 🟢 Low | 2 | BUG-007 (403 vs 400), BUG-008 (201 vs 200) |

> ⚠️ **Lưu ý:** ~80 test failures khác do JWT token hết hạn — KHÔNG phải bug API. Cần refresh token rồi chạy lại test.
