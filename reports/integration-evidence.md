# Integration Test Evidence Report

**Generated:** 2026-03-02T08:01:30.758Z
**Scenarios Config:** `config/integration-scenarios.json`

> **💡 Tip:** QC có thể customize scenarios trong file config trên và regenerate tests.

## Summary

| Total | Passed | Failed |
|-------|--------|--------|
| 25 | ✅ 15 | ❌ 10 |

---

## S01: User views markets and favorites

### ✅ Step 1: GET /markets

**Request:**
```http
GET /markets
```

**Response:** `200`
```json
{"code":200,"data":[{"id":529,"userId":null,"imageUrl":"https://dev.api.foreon-network.sotatek.works/markets/ipfs/QmXpWXTT8SUaaji2uLy2HQprShbjoKiJ3gz9A3239n6wdv","title":"Will Anyone Be Jailed In February Over Epstein Disclosures?","marketRule":"This market will resolve to “Yes” if, by February 28th, 2026, 11:59 PM, any individual serves any time in a federal, state, or local U.S. jail or prison, and the cause of that incarceration is attributed to information contained in files related to Jeffr...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 1266ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets" \
  -H "Content-Type: application/json"
```

### ✅ Step 2: GET /markets/${marketList.data[0].id}

**Request:**
```http
GET /markets/529
```

**Response:** `200`
```json
{"code":200,"data":{"id":529,"userId":null,"imageUrl":"https://dev.api.foreon-network.sotatek.works/markets/ipfs/QmXpWXTT8SUaaji2uLy2HQprShbjoKiJ3gz9A3239n6wdv","title":"Will Anyone Be Jailed In February Over Epstein Disclosures?","marketRule":"This market will resolve to “Yes” if, by February 28th, 2026, 11:59 PM, any individual serves any time in a federal, state, or local U.S. jail or prison, and the cause of that incarceration is attributed to information contained in files related to Jeffre...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 237ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/529" \
  -H "Content-Type: application/json"
```

### ❌ Step 3: POST /markets/${marketDetail.data.id}/favorite

**Request:**
```http
POST /markets/529/favorite
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | 201 | **Actual:** 401 | **Duration:** 205ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/markets/529/favorite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ❌ Step 4: GET /markets/favorites

**Request:**
```http
GET /markets/favorites
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | **Actual:** 401 | **Duration:** 213ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/favorites" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

---

## S02: User views orders and positions

### ✅ Step 1: GET /orders

**Request:**
```http
GET /orders
```

**Response:** `200`
```json
{"code":200,"data":[{"id":2055,"address":"addr_test1qr7lcuv3rvtpekk34pet26ppp5lafgmrjaelj66uqp6mp2cnsa7060msaaywzmyefgxdckhrctrr9zpteujyl6mky5qs5yz04r","type":1,"side":1,"outcomeType":1,"status":-2,"price":0.5,"averagePrice":0,"amount":50,"filledAmount":0,"remainingAmount":50,"total":25,"payback":0,"txHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","outputIndex":0,"createdAt":"2026-02-28T14:40:35.000Z","outcome":{"id":809,"title":"Will Anyone Be Jailed In February Over E...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 241ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ❌ Step 2: GET /orders/position

**Request:**
```http
GET /orders/position
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | **Actual:** 401 | **Duration:** 207ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders/position" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ❌ Step 3: GET /orders/position-claims

**Request:**
```http
GET /orders/position-claims
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | **Actual:** 401 | **Duration:** 200ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders/position-claims" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ✅ Step 4: GET /orders/activity

**Request:**
```http
GET /orders/activity
```

**Response:** `200`
```json
{"code":200,"data":[{"id":2055,"address":"addr_test1qr7lcuv3rvtpekk34pet26ppp5lafgmrjaelj66uqp6mp2cnsa7060msaaywzmyefgxdckhrctrr9zpteujyl6mky5qs5yz04r","type":1,"side":1,"outcomeType":1,"status":-2,"price":0.5,"averagePrice":0,"amount":50,"filledAmount":0,"remainingAmount":50,"total":25,"payback":0,"txHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","createdAt":"2026-02-28T14:40:35.000Z","outcome":{"id":809,"imageUrl":"https://dev.api.foreon-network.sotatek.works/markets/...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 232ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders/activity" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

---

## S03: User views trades

### ✅ Step 1: GET /trades/market-trade

**Request:**
```http
GET /trades/market-trade
```

**Response:** `200`
```json
{
  "code": 200,
  "data": {},
  "metadata": {}
}
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 195ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/trades/market-trade" \
  -H "Content-Type: application/json"
```

### ✅ Step 2: GET /trades

**Request:**
```http
GET /trades
```

**Response:** `200`
```json
{"code":200,"data":[{"id":524,"marketId":234,"outcomeId":353,"sellOrderId":1356,"buyOrderId":1357,"sellAddress":"addr_test1qpyf9ywseuegvcq6xgksz2awuhjyj6qhfvx7ag4hnm9f0l342u24wg9xvfacvv52rndypurdd7nwa5u6lyswyxzly76qmdjqz3","buyAddress":"addr_test1qpyf9ywseuegvcq6xgksz2awuhjyj6qhfvx7ag4hnm9f0l342u24wg9xvfacvv52rndypurdd7nwa5u6lyswyxzly76qmdjqz3","sellUserId":46,"buyUserId":46,"filledAmount":50,"price":0.25,"sellOrderPrice":0.25,"buyOrderPrice":0.75,"type":1,"sellOrderOutcomeType":1,"buyOrderOutco...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 206ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/trades" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ✅ Step 3: GET /trades/history

**Request:**
```http
GET /trades/history
```

**Response:** `200`
```json
{"code":200,"data":[{"market_title":"Create market test 9 from admin","market_id":523,"market_type":0,"outcome_title":"Create market test 9 from admin","outcome_id":800,"id":2034,"outcome_type":0,"trade_id":779,"method":2,"order_id":2034,"user_id":17,"price":0.4,"filled_amount":200,"created_at":"2025-12-08T08:11:19.000Z","order_hash":"46dbe46085941e5a8fa4e3fa849d2bd6b2a2ddf3b840ffc92e91e256851ced6c","tx_hash":"75fca43dc365a390c261c78277558b35f7ea9cc56689bc3b7be54345f7e40d96","action":"buy","tota...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 208ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/trades/history" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

---

## S04: Comment lifecycle

### ✅ Step 1: GET /markets

**Request:**
```http
GET /markets
```

**Response:** `200`
```json
{"code":200,"data":[{"id":529,"userId":null,"imageUrl":"https://dev.api.foreon-network.sotatek.works/markets/ipfs/QmXpWXTT8SUaaji2uLy2HQprShbjoKiJ3gz9A3239n6wdv","title":"Will Anyone Be Jailed In February Over Epstein Disclosures?","marketRule":"This market will resolve to “Yes” if, by February 28th, 2026, 11:59 PM, any individual serves any time in a federal, state, or local U.S. jail or prison, and the cause of that incarceration is attributed to information contained in files related to Jeffr...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 233ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets" \
  -H "Content-Type: application/json"
```

### ✅ Step 2: GET /comments/market/${markets.data[0].id}

**Request:**
```http
GET /comments/market/529
```

**Response:** `200`
```json
{
  "code": 200,
  "data": [],
  "metadata": {
    "page": 1,
    "totalPage": 0,
    "total": 0,
    "limit": 50,
    "timestamp": "2026-03-02T08:01:28.194Z"
  }
}
```

**Expected:** 200 | 404 | **Actual:** 200 | **Duration:** 202ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/comments/market/529" \
  -H "Content-Type: application/json"
```

### ❌ Step 3: POST /comments

**Request:**
```http
POST /comments

{
  "marketId": 529,
  "content": "Test comment 1772438488279"
}
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | 201 | 400 | 422 | **Actual:** 401 | **Duration:** 195ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo" \
  -d '{"marketId":529,"content":"Test comment 1772438488279"}'
```

### ❌ Step 4: POST /comments/1/like

**Request:**
```http
POST /comments/1/like
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | 201 | 404 | **Actual:** 401 | **Duration:** 195ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/comments/1/like" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

---

## S05: Orderbook and statistics

### ✅ Step 1: GET /orderbook

**Request:**
```http
GET /orderbook
```

**Response:** `200`
```json
{
  "code": 200,
  "data": {
    "asks": [],
    "bids": []
  },
  "metadata": {
    "timestamp": "2026-03-02T08:01:28.781Z"
  }
}
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 192ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orderbook" \
  -H "Content-Type: application/json"
```

### ✅ Step 2: GET /statistic/rank

**Request:**
```http
GET /statistic/rank
```

**Response:** `200`
```json
{"code":200,"data":[{"id":70,"walletAddress":"addr_test1qqu7w7xjddl0e7lta9jnuk4hmelt8w36hl54c79tq924c5r3d3h404prdhl3yrjj92n6vsshz7jt5fh3cx3mhgat654quy4um2","totalAmount":3782.79,"totalReward":5939.587279},{"id":90,"walletAddress":"addr_test1qqgk4kplwmpl65484mhmrwfe58c2mfe8gp59g78fnkhymwckcr3d8qcqhsu7pz7nuzl6udwdeq3k44s4h527svpyyr6s3fchql","totalAmount":3079,"totalReward":1200},{"id":31,"walletAddress":"addr_test1qqukq6stggvnvl832nlx84jd6kdsmjzy94sldu5hdwl7naj2gr4apkl02y28zr5vg68aneugnd0j78dnz06u...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 204ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/statistic/rank" \
  -H "Content-Type: application/json"
```

---

## S06: User profile and assets

### ❌ Step 1: GET /auth/me

**Request:**
```http
GET /auth/me
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | **Actual:** 401 | **Duration:** 212ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/auth/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ❌ Step 2: GET /auth/asset

**Request:**
```http
GET /auth/asset
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | **Actual:** 401 | **Duration:** 222ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/auth/asset" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

---

## S07: Proposed markets flow

### ❌ Step 1: GET /markets/proposed

**Request:**
```http
GET /markets/proposed
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | **Actual:** 401 | **Duration:** 195ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/proposed" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

### ❌ Step 2: GET /markets/proposed-detail/1

**Request:**
```http
GET /markets/proposed-detail/1
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | 404 | 500 | **Actual:** 401 | **Duration:** 198ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/proposed-detail/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI3bGN1djNydnRwZWtrMzRwZXQyNnBwcDVsYWZnbXJqYWVsajY2dXFwNm1wMmNuc2E3MDYwbXNhYXl3em15ZWZneGRja2hyY3Rycjl6cHRldWp5bDZta3k1cXM1eXowNHIiLCJyb2xlIjoidXNlciIsImp0aSI6IjE3Iiwic3ViIjoiMTciLCJpYXQiOjE3NzI0Mzg0MDIsImV4cCI6MTc3MjQ1NjQwMn0.bcsZgxR_G1AqlNPCoKY1B02lQONEKEdboVc-w3nVEbo"
```

---

## S08: Guest vs authenticated access

### ✅ Step 1: GET /markets

**Request:**
```http
GET /markets
```

**Response:** `200`
```json
{"code":200,"data":[{"id":529,"userId":null,"imageUrl":"https://dev.api.foreon-network.sotatek.works/markets/ipfs/QmXpWXTT8SUaaji2uLy2HQprShbjoKiJ3gz9A3239n6wdv","title":"Will Anyone Be Jailed In February Over Epstein Disclosures?","marketRule":"This market will resolve to “Yes” if, by February 28th, 2026, 11:59 PM, any individual serves any time in a federal, state, or local U.S. jail or prison, and the cause of that incarceration is attributed to information contained in files related to Jeffr...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 253ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets" \
  -H "Content-Type: application/json"
```

### ✅ Step 2: GET /orderbook

**Request:**
```http
GET /orderbook
```

**Response:** `200`
```json
{
  "code": 200,
  "data": {
    "asks": [],
    "bids": []
  },
  "metadata": {
    "timestamp": "2026-03-02T08:01:30.261Z"
  }
}
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 194ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orderbook" \
  -H "Content-Type: application/json"
```

### ✅ Step 3: GET /orders

**Request:**
```http
GET /orders
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Unauthorized"
}
```

**Expected:** 401 | **Actual:** 401 | **Duration:** 191ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders" \
  -H "Content-Type: application/json"
```

### ✅ Step 4: POST /comments

**Request:**
```http
POST /comments

{
  "content": "test"
}
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Authorization: Bearer <token> header missing"
}
```

**Expected:** 401 | **Actual:** 401 | **Duration:** 205ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/comments" \
  -H "Content-Type: application/json" \
  -d '{"content":"test"}'
```

