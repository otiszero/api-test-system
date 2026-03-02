# Bug Reports - Foreon Prediction Market API

**Ngày phát hiện:** 2026-03-02
**Tổng số bugs:** 8

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

## BUG-007: Orphan Orders - Foreign Key Integrity Violation

### Severity: 🔴 HIGH

### Source
DB Verification Test - Direct Database Query

### Mô tả
Có 4 orders trong database tham chiếu đến market_id=155, nhưng market này không tồn tại trong bảng markets.

### Evidence
```sql
SELECT o.id, o.market_id
FROM orders o
LEFT JOIN markets m ON o.market_id = m.id
WHERE m.id IS NULL;

-- Results:
-- id: 1342, market_id: 155
-- id: 1343, market_id: 155
-- id: 1344, market_id: 155
-- id: 1345, market_id: 155
```

### Impact
- Data integrity violation
- Application có thể crash khi load orders với invalid market reference
- Business logic errors khi process orders
- Reports và analytics bị sai

### Root Cause
- Market 155 có thể đã bị hard delete thay vì soft delete
- Hoặc orders được tạo với invalid market_id
- Foreign key constraint không được enforce ở DB level

### Recommendation
1. Add foreign key constraint: `orders.market_id → markets.id`
2. Investigate tại sao market 155 bị delete mà orders còn
3. Implement soft delete cho markets thay vì hard delete
4. Clean up orphan orders hoặc restore market 155

---

## BUG-008: Markets với ended_at = NULL (Invalid Date)

### Severity: 🟡 MEDIUM

### Source
DB Verification Test - Direct Database Query

### Mô tả
Có ít nhất 5 markets có field `ended_at` = NULL hoặc invalid, dẫn đến Invalid Date khi parse.

### Evidence
```sql
SELECT id, title, ended_at, created_at
FROM markets
WHERE ended_at IS NULL OR ended_at <= created_at;

-- Results (sample):
-- id: 566, title: 'Market-7V4pVj-1772177948972', ended_at: NULL
-- id: 578, title: 'Market-xWkn8M-1772177961644', ended_at: NULL
-- id: 635, title: 'Market-WCX7CG-1772180658040', ended_at: NULL
-- id: 647, title: 'Market-FXMADp-1772180666976', ended_at: NULL
-- id: 699, title: 'Market-D0PePX-1772180715148', ended_at: NULL
```

### Impact
- Markets không có end date sẽ không bao giờ resolve
- Business logic errors khi check market status
- UI có thể hiển thị "Invalid Date"
- Reports bị ảnh hưởng

### Root Cause
- Validation thiếu khi tạo market
- `ended_at` không được mark as required
- Test data không clean up

### Recommendation
1. Add NOT NULL constraint cho `ended_at` column
2. Add validation: `ended_at > created_at`
3. Clean up hoặc set proper ended_at cho affected markets
4. Review market creation flow để ensure ended_at always set

---

## Summary by Severity

| Severity | Count | Bugs |
|----------|-------|------|
| 🔴 CRITICAL | 1 | BUG-001 |
| 🔴 HIGH | 3 | BUG-002, BUG-003, BUG-007 |
| 🟡 MEDIUM | 3 | BUG-005, BUG-006, BUG-008 |
| 🟢 LOW | 1 | BUG-004 |

## Priority Order

1. **BUG-001** - Fix JWT expiration validation ngay lập tức
2. **BUG-002** - Add error handling cho token parsing
3. **BUG-003** - Add input validation cho path params
4. **BUG-007** - Fix FK integrity + investigate orphan orders
5. **BUG-008** - Fix markets với invalid ended_at
6. **BUG-005, BUG-006** - Update OpenAPI documentation
7. **BUG-004** - Fix status code (low priority)
