# config/test-rules.md

Tài liệu này mô tả business rules, permissions, và scenarios cho **Prediction Market System**.
**QUAN TRỌNG**: AI dùng file này để sinh integration tests và RBAC tests.

---

## 1. Business Rules

### Market Rules
- Market phải có ít nhất 2 outcomes để valid
- Market endTime phải lớn hơn publishedAt
- Market startVoteTime phải nhỏ hơn endVoteTime
- Không thể create order cho market đã expired (current time > endTime)
- Market type phải là SINGLE hoặc MULTIPLE
- resoldMethod phải là AUTOMATICALLY hoặc MANUALLY

### Order Rules
- Order amount phải > 0
- Không thể cancel order đã claimed (status = CLAIMED)
- Không thể claim order chưa filled (status != FILLED)
- User chỉ có thể cancel/claim order của chính mình
- Position balance không được âm (>= 0)
- Order add-liquidity phải provide liquidity cho cả 2 outcomes (YES/NO hoặc tương tự)

### Outcome Rules
- Outcome probability tổng cộng phải = 100%
- Mỗi outcome phải có title unique trong cùng market
- Không thể vote outcome trước startVoteTime hoặc sau endVoteTime

### Comment Rules
- Comment content không được rỗng
- User chỉ có thể update/delete comment của chính mình
- Comment phải thuộc về một market valid

---

## 2. Resource Relations

### User → Orders (1-N)
- User (1) → Orders (N)
- Khi user bị deleted: Orders vẫn được giữ lại (không cascade delete)
- User chỉ có thể xem orders của chính mình (trừ admin thấy all)

### Market → Outcomes (1-N)
- Market (1) → Outcomes (N) - **required: ít nhất 2 outcomes**
- Khi market bị deleted: Outcomes bị xóa theo (cascade delete)
- Relation: bắt buộc, không thể tạo market không có outcome

### Market → Orders (1-N)
- Market (1) → Orders (N)
- Khi market bị deleted: Orders vẫn được giữ lại (soft delete market)
- Orders chỉ có thể được tạo cho markets có status = ACTIVE

### Market → Comments (1-N)
- Market (1) → Comments (N)
- Khi market bị deleted: Comments bị xóa theo (cascade delete)

### Order → Trades (1-N)
- Order (1) → Trades (N)
- Order được filled thông qua trades
- Khi order cancelled: Trades vẫn được giữ lại (historical data)

### Outcome → Orders (1-N)
- Outcome (1) → Orders (N)
- User place order vào specific outcome của market
- Khi outcome resolved: Orders sẽ được settled

---

## 3. Validation Rules

### Field Validations
- **Market title**: 3-200 ký tự, không được chỉ toàn khoảng trắng
- **Market category**: array không rỗng, mỗi category 1-50 ký tự
- **Email**: format email hợp lệ, unique trong hệ thống (nếu có)
- **Order amount**: số dương, min = 0.01, max = 1000000
- **Outcome title**: 1-100 ký tự, unique trong cùng market
- **Comment content**: 1-1000 ký tự

### Cross-field Validations
- **endTime > publishedAt**: Market endTime phải sau publishedAt
- **endVoteTime > startVoteTime**: Vote end phải sau vote start
- **startVoteTime >= endTime**: Vote start phải sau hoặc bằng market endTime
- **Order.outcomeId**: Phải tồn tại trong market.outcomes
- **Position claim**: Chỉ claim được khi market đã resolved

### Unique Constraints
- Market title không bắt buộc unique (có thể có nhiều markets cùng tên)
- Wallet address phải unique
- Outcome title phải unique trong cùng market (không unique globally)

---

## 4. Permission Matrix

> User có `isAdmin: true` được coi là admin. User có `isAdmin: false` là user thường.

| Endpoint | Method | admin (isAdmin=true) | user (isAdmin=false) | guest (no token) |
|---|---|---|---|---|
| **Markets** |
| /markets | GET | ✅ | ✅ | ✅ |
| /markets | POST | ✅ | ✅ | ❌ |
| /markets/{id} | GET | ✅ | ✅ | ✅ |
| /markets/{id} | PUT | ✅ | 🔒 (creator only) | ❌ |
| /markets/{id} | DELETE | ✅ | ❌ | ❌ |
| /markets/pending-markets | GET | ✅ | ✅ | ✅ |
| /markets/new-markets | GET | ✅ | ✅ | ✅ |
| /markets/popular-markets | GET | ✅ | ✅ | ✅ |
| **Orders** |
| /orders | GET | ✅ (all) | 🔒 (own only) | ❌ |
| /orders | POST | ✅ | ✅ | ❌ |
| /orders/{id}/cancelled | PUT | ✅ (all) | 🔒 (own only) | ❌ |
| /orders/{id}/claimed | PUT | ✅ (all) | 🔒 (own only) | ❌ |
| /orders/position | GET | ✅ (all users) | 🔒 (own only) | ❌ |
| /orders/position-claims | GET | ✅ | 🔒 | ❌ |
| /orders/position-claims | POST | ✅ | ✅ | ❌ |
| /orders/add-liquidity | POST | ✅ | ✅ | ❌ |
| /orders/activity | GET | ✅ (all) | 🔒 (own only) | ❌ |
| **Trades** |
| /trades | GET | ✅ | ✅ | ✅ |
| /trades/activity | GET | ✅ | ✅ | ✅ |
| **Orderbook** |
| /orderbook | GET | ✅ | ✅ | ✅ |
| /orderbook/add-liquidity | POST | ✅ | ✅ | ❌ |
| **Comments** |
| /comments | GET | ✅ | ✅ | ✅ |
| /comments | POST | ✅ | ✅ | ❌ |
| /comments/{id} | PUT | ✅ (all) | 🔒 (own only) | ❌ |
| /comments/{id} | DELETE | ✅ (all) | 🔒 (own only) | ❌ |
| **Statistic** |
| /statistic/market/{id} | GET | ✅ | ✅ | ✅ |
| /statistic/outcome/{id} | GET | ✅ | ✅ | ✅ |
| /statistic/volume | GET | ✅ | ✅ | ✅ |
| **Auth** |
| /auth/connect-wallet | POST | ✅ | ✅ | ✅ |
| /auth/register-wallet | POST | ✅ | ✅ | ✅ |
| /auth/nonce | GET | ✅ | ✅ | ✅ |
| /auth/login-wallet | POST | ✅ | ✅ | ✅ |
| /auth/logout | POST | ✅ | ✅ | ❌ |
| /auth/refresh-token | POST | ✅ | ✅ | ❌ |
| /auth/me | GET | ✅ | ✅ | ❌ |
| /auth/me | PUT | ✅ | ✅ | ❌ |
| /auth/verify-wallet | GET | ✅ | ✅ | ✅ |

> **Ghi chú 🔒**: User chỉ có thể access/modify resource của chính họ (own orders, own comments).
> Admin (isAdmin=true) có thể access tất cả resources.

---

## 5. Field-level Permissions

> Trường nào được trả về / được phép chỉnh sửa tùy theo role.

| Field | admin (read) | admin (write) | user (read) | user (write) |
|---|---|---|---|---|
| **User fields** |
| id | ✅ | — | ✅ | — |
| walletAddress | ✅ | — | ✅ | — |
| isAdmin | ✅ | ✅ | ✅ | ❌ |
| isDeleted | ✅ | ✅ | ❌ | ❌ |
| hashAddress | ✅ | — | ✅ | — |
| **Market fields** |
| status | ✅ | ✅ | ✅ | ❌ |
| creatorId | ✅ | — | ✅ | — |
| all other fields | ✅ | ✅ | ✅ | 🔒 (creator only) |
| **Order fields** |
| userId | ✅ | — | ✅ | — |
| status | ✅ | ✅ | ✅ | ❌ |
| amount | ✅ | — | ✅ | — |

---

## 6. State Machines

### Order Status
```
Order lifecycle:
  OPEN → FILLED        (khi order được match/filled)
  OPEN → CANCELLED     (user action: cancel order)
  FILLED → CLAIMED     (user action: claim profit sau khi market resolved)

  Invalid transitions (expect 400/422):
  CLAIMED → OPEN       (không thể quay lại open)
  CLAIMED → CANCELLED  (không thể cancel sau khi claimed)
  CANCELLED → FILLED   (không thể fill order đã cancelled)
  FILLED → OPEN        (không thể revert filled order)
```

### Market Status
```
Market lifecycle:
  PENDING → ACTIVE     (admin approve market)
  PENDING → REJECTED   (admin reject market)
  ACTIVE → CLOSED      (endTime reached)
  CLOSED → RESOLVED    (outcome được xác định, ready for claim)

  Invalid transitions:
  REJECTED → ACTIVE    (không thể active market đã rejected)
  RESOLVED → CLOSED    (không thể quay lại closed sau khi resolved)
  ACTIVE → PENDING     (không thể quay lại pending)
```

### Position Claim Status
```
Claim lifecycle:
  PENDING → CLAIMED    (claim thành công)
  PENDING → FAILED     (claim thất bại)

  Conditions:
  - Chỉ claim được khi market.status = RESOLVED
  - Chỉ claim được khi order.status = FILLED
  - Không thể claim 2 lần cho cùng position
```

---

## 7. Integration Scenarios

### Scenario 1: User tạo market và place order thành công
**Actor**: user (isAdmin=false)
**Mô tả**: User tạo prediction market, place order vào outcome YES
**Steps**:
1. User POST /markets với title "BTC > $100k by 2026?", 2 outcomes: [YES, NO], endTime = 2026-12-31
2. Verify response 201, market.status = PENDING
3. Admin approve market (manual step - skip in test, assume approved → ACTIVE)
4. User GET /markets/{id} → verify status = ACTIVE
5. User POST /orders với marketId, outcomeId = YES, amount = 100
6. Verify response 201, order.status = OPEN
7. User GET /orders/position → verify position có 100 tokens vào outcome YES
**Expected**: Market created, order placed successfully, position updated

---

### Scenario 2: User cancel order trước khi filled
**Actor**: user
**Mô tả**: User place order nhưng muốn cancel trước khi order được fill
**Steps**:
1. User POST /orders với amount = 50, outcome = NO
2. Verify order.status = OPEN
3. User PUT /orders/{id}/cancelled
4. Verify response 200, order.status = CANCELLED
5. User GET /orders/position → verify position không tăng (vì đã cancelled)
**Expected**: Order cancelled thành công, position không thay đổi

---

### Scenario 3: User không thể cancel order đã claimed
**Actor**: user
**Mô tả**: Negative test - user cố cancel order đã claimed
**Steps**:
1. User có order với status = CLAIMED (assume market đã resolved và user đã claim)
2. User PUT /orders/{id}/cancelled
3. Verify response 400 hoặc 422 với message "Cannot cancel claimed order"
**Expected**: API reject cancel request

---

### Scenario 4: User claim profit sau khi market resolved
**Actor**: user
**Mô tả**: Happy path - user claim profit sau khi market kết thúc và outcome được xác định
**Steps**:
1. User có order với status = FILLED, outcome = YES
2. Market status = RESOLVED, winning outcome = YES
3. User PUT /orders/{id}/claimed
4. Verify response 200, order.status = CLAIMED
5. User GET /orders/position-claims → verify claim record exists
**Expected**: User claim thành công, nhận được profit

---

### Scenario 5: User A không thể cancel order của User B (IDOR test)
**Actor**: user_a, user_b
**Mô tả**: Security test - IDOR protection
**Steps**:
1. User B POST /orders → tạo order, lưu orderId
2. User A (với token khác) PUT /orders/{user_b_order_id}/cancelled
3. Verify response 403 hoặc 404 với message "Forbidden" hoặc "Order not found"
**Expected**: API reject request, User A không thể cancel order của User B

---

### Scenario 6: User add liquidity vào market
**Actor**: user
**Mô tả**: User provide liquidity cho orderbook
**Steps**:
1. User POST /orderbook/add-liquidity với marketId, amounts cho cả YES và NO outcomes
2. Verify response 201
3. User GET /orderbook?marketId={id} → verify liquidity tăng lên
4. User GET /orders/position → verify position được cập nhật
**Expected**: Liquidity added, orderbook updated

---

### Scenario 7: User comment vào market và update comment
**Actor**: user
**Mô tả**: User tương tác với comments
**Steps**:
1. User POST /comments với marketId, content = "This market looks interesting!"
2. Verify response 201, comment.userId = current user ID
3. User PUT /comments/{id} với content = "Updated: Very interesting market"
4. Verify response 200, comment.content updated
5. User DELETE /comments/{id}
6. Verify response 200 hoặc 204
7. User GET /comments?marketId={id} → verify comment không còn tồn tại
**Expected**: Comment CRUD lifecycle hoàn chỉnh

---

### Scenario 8: Guest user chỉ có thể read public data
**Actor**: guest (no token)
**Mô tả**: Test public endpoints
**Steps**:
1. Guest GET /markets → expect 200 (public endpoint)
2. Guest GET /markets/{id} → expect 200
3. Guest GET /trades → expect 200
4. Guest POST /orders → expect 401 (requires auth)
5. Guest GET /orders → expect 401 (requires auth)
**Expected**: Public endpoints accessible, secured endpoints return 401

---

## 8. Special Notes

### Wallet-based Authentication
- Hệ thống dùng Cardano wallet addresses (addr_test1...)
- Auth flow: connect wallet → get nonce → sign message → login → receive JWT token
- Token có claim `isAdmin: true/false` để phân biệt admin vs user

### Soft Delete
- User records dùng `isDeleted` flag thay vì xóa thật khỏi DB
- Market có thể dùng soft delete (cần verify)

### Timestamp Validations
- Mọi datetime fields phải format ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Server validate endTime > publishedAt, startVoteTime < endVoteTime

### Position & Balance Tracking
- User positions được track real-time qua /orders/position
- Position balance phải non-negative
- Position claims được record vào separate table

### Market Resolution
- Market được resolve manually hoặc automatically (tùy resoldMethod)
- AUTOMATICALLY: hệ thống tự động crawl outcome từ reliable URL
- MANUALLY: admin set outcome manually

### Rate Limiting (Assumption)
- Login endpoint: giới hạn 10 lần/phút per wallet address (prevent brute force)
- Comment creation: giới hạn 5 comments/phút per user (prevent spam)
- Order creation: giới hạn 20 orders/phút per user

### Multi-language Support (if exists)
- Market title/description có thể support multiple languages
- Comment content support UTF-8 characters

### Liquidity Provision
- Users có thể add liquidity vào market orderbook
- Liquidity providers earn fees từ trades (assume 0.1-0.5% fee)
