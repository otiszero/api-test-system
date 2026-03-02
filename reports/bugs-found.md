# Bug Reports - Foreon Prediction Market API

**Ngày phát hiện:** 2026-03-02
**Tổng số bugs:** 6

---

## BUG-001: JWT Expired Token Được Chấp Nhận

### Severity: 🔴 CRITICAL

### Endpoint
`GET /orders`

### Mô tả
API chấp nhận JWT token đã expired và trả về data bình thường thay vì reject với 401 Unauthorized.

### Steps to Reproduce
```bash
# Token với exp timestamp đã qua
curl -X GET "https://api.foreon.network/orders" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxMDAwMDAwMDAwfQ.invalid" \
  -H "Content-Type: application/json"
```

### Expected
- Status: 401 Unauthorized
- Body: `{"message": "Expired token"}`

### Actual
- Status: 200 OK
- Body: Data được trả về bình thường

### Impact
- Attacker có thể sử dụng token cũ vô thời hạn
- Không thể revoke access của user bị compromise
- Session không bao giờ expire

### Recommendation
- Verify `exp` claim trong JWT middleware
- Reject tokens với `exp < current_timestamp`
- Implement token refresh flow đúng cách

---

## BUG-002: Malformed Token Gây Server Error 500

### Severity: 🔴 HIGH

### Endpoint
`GET /orders` (và tất cả protected endpoints)

### Mô tả
Khi gửi token không phải JWT format, server crash và trả về 500 Internal Server Error thay vì 401.

### Steps to Reproduce
```bash
curl -X GET "https://api.foreon.network/orders" \
  -H "Authorization: Bearer malformed-not-a-jwt" \
  -H "Content-Type: application/json"
```

### Expected
- Status: 401 Unauthorized
- Body: `{"message": "Invalid token format"}`

### Actual
- Status: 500 Internal Server Error
- Có thể leak stack trace

### Impact
- Có thể bị khai thác để DoS
- Leak thông tin internal (stack trace)
- Log pollution

### Recommendation
- Wrap JWT parsing trong try-catch
- Return 401 cho mọi token parsing errors
- Không expose internal errors ra client

---

## BUG-003: Non-numeric ID Gây Server Error 500

### Severity: 🔴 HIGH

### Endpoint
`GET /markets/{id}`

### Mô tả
Khi truyền ID không phải số vào path param, server crash thay vì trả về 400 Bad Request.

### Steps to Reproduce
```bash
curl -X GET "https://api.foreon.network/markets/not-a-number" \
  -H "Content-Type: application/json"
```

### Expected
- Status: 400 Bad Request
- Body: `{"message": "Invalid ID format"}`

### Actual
- Status: 500 Internal Server Error

### Impact
- Có thể bị khai thác để DoS
- SQL injection vector (nếu không sanitize)
- Application instability

### Recommendation
- Validate path params trước khi xử lý
- Use NestJS ParseIntPipe hoặc custom validation
- Return 400 cho invalid format

---

## BUG-004: Logout Returns Wrong Status Code

### Severity: 🟢 LOW

### Endpoint
`POST /auth/logout`

### Mô tả
API trả về 201 Created cho logout action thay vì 200 OK hoặc 204 No Content.

### Steps to Reproduce
```bash
curl -X POST "https://api.foreon.network/auth/logout" \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json"
```

### Expected
- Status: 200 OK hoặc 204 No Content

### Actual
- Status: 201 Created

### Impact
- Không ảnh hưởng functionality
- Không đúng REST conventions
- Có thể gây confusion cho API consumers

### Recommendation
- Change response status to 200 hoặc 204
- 201 chỉ nên dùng khi tạo resource mới

---

## BUG-005: GET /trades/graph Thiếu Required Params Documentation

### Severity: 🟡 MEDIUM

### Endpoint
`GET /trades/graph`

### Mô tả
Endpoint trả về 400 khi không có query params, nhưng OpenAPI spec không document required params.

### Steps to Reproduce
```bash
curl -X GET "https://api.foreon.network/trades/graph" \
  -H "Content-Type: application/json"
```

### Expected (theo OpenAPI)
- Status: 200 OK

### Actual
- Status: 400 Bad Request
- Body: Missing required params

### Impact
- API consumers không biết params nào required
- Test cases fail do thiếu documentation
- Integration khó khăn

### Recommendation
- Update OpenAPI spec với required params
- Add clear error message chỉ ra params nào thiếu

---

## BUG-006: GET /trades/graph-overrall Thiếu Required Params Documentation

### Severity: 🟡 MEDIUM

### Endpoint
`GET /trades/graph-overrall`

### Mô tả
Tương tự BUG-005. Endpoint yêu cầu query params nhưng không document.

### Steps to Reproduce
```bash
curl -X GET "https://api.foreon.network/trades/graph-overrall" \
  -H "Content-Type: application/json"
```

### Expected (theo OpenAPI)
- Status: 200 OK

### Actual
- Status: 400 Bad Request

### Recommendation
- Update OpenAPI spec
- Document required query parameters

---

## Summary by Severity

| Severity | Count | Bugs |
|----------|-------|------|
| 🔴 CRITICAL | 1 | BUG-001 |
| 🔴 HIGH | 2 | BUG-002, BUG-003 |
| 🟡 MEDIUM | 2 | BUG-005, BUG-006 |
| 🟢 LOW | 1 | BUG-004 |

## Priority Order

1. **BUG-001** - Fix JWT expiration validation ngay lập tức
2. **BUG-002** - Add error handling cho token parsing
3. **BUG-003** - Add input validation cho path params
4. **BUG-005, BUG-006** - Update OpenAPI documentation
5. **BUG-004** - Fix status code (low priority)
