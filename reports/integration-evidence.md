# Integration Test Evidence Report

**Generated:** 2026-03-02T04:19:44.536Z
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

**Expected:** 200 | **Actual:** 200 | **Duration:** 1151ms

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

**Expected:** 200 | **Actual:** 200 | **Duration:** 216ms

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

**Expected:** 200 | 201 | **Actual:** 401 | **Duration:** 194ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/markets/529/favorite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 401 | **Duration:** 196ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/favorites" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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
{"code":200,"data":[{"id":2044,"address":"addr_test1qr9gcnk28lenmstprxcanfmlm9w5u3a5r9klqk8ltg525psf9lcknt9fxdx7ge9aqdt6q65u7dkwla2cvkmhj0er2ryqlel834","type":1,"side":1,"outcomeType":1,"status":4,"price":0.9,"averagePrice":0.9,"amount":200,"filledAmount":200,"remainingAmount":0,"total":180,"payback":0,"txHash":"1240be53d8dd1f4b2468606247fa092f89dc42264afb0aa3a39c3f5e2187c561","outputIndex":1,"createdAt":"2026-01-22T12:35:05.000Z","outcome":{"id":770,"title":"Outcome 1","result":null},"market":{...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 304ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 401 | **Duration:** 227ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders/position" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 401 | **Duration:** 198ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/orders/position-claims" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 200 | **Duration:** 194ms

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

**Expected:** 200 | **Actual:** 200 | **Duration:** 211ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/trades" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
```

### ✅ Step 3: GET /trades/history

**Request:**
```http
GET /trades/history
```

**Response:** `200`
```json
{"code":200,"data":[{"market_title":"Test multi outcome 2","market_id":497,"market_type":1,"outcome_title":"Outcome 1","outcome_id":770,"id":2044,"outcome_type":1,"trade_id":783,"method":2,"order_id":2044,"user_id":91,"price":0.9,"filled_amount":200,"created_at":"2026-01-22T12:37:39.000Z","order_hash":"1240be53d8dd1f4b2468606247fa092f89dc42264afb0aa3a39c3f5e2187c561","tx_hash":"e870bda069e5c04a1a3ee1c182aef32b205d79799c5631d7b2e5db45c37a2667","action":"buy","total":180},{"market_title":"Test mul...
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 223ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/trades/history" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 200 | **Duration:** 248ms

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
    "timestamp": "2026-03-02T04:19:41.988Z"
  }
}
```

**Expected:** 200 | 404 | **Actual:** 200 | **Duration:** 199ms

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
  "content": "Test comment 1772425182068"
}
```

**Response:** `401`
```json
{
  "data": {},
  "message": "Expired token"
}
```

**Expected:** 200 | 201 | 400 | 422 | **Actual:** 401 | **Duration:** 199ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw" \
  -d '{"marketId":529,"content":"Test comment 1772425182068"}'
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
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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
    "timestamp": "2026-03-02T04:19:42.579Z"
  }
}
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 196ms

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

**Expected:** 200 | **Actual:** 200 | **Duration:** 208ms

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

**Expected:** 200 | **Actual:** 401 | **Duration:** 197ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/auth/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 401 | **Duration:** 194ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/auth/asset" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 401 | **Duration:** 196ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/proposed" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | 404 | 500 | **Actual:** 401 | **Duration:** 195ms

**Curl (Copy to Retest):**
```bash
curl -X GET "https://api.foreon.network/markets/proposed-detail/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTEsIndhbGxldEFkZHJlc3MiOiJhZGRyX3Rlc3QxcXI5Z2NuazI4bGVubXN0cHJ4Y2FuZm1sbTl3NXUzYTVyOWtscWs4bHRnNTI1cHNmOWxja250OWZ4ZHg3Z2U5YXFkdDZxNjV1N2Rrd2xhMmN2a21oajBlcjJyeXFsZWw4MzQiLCJyb2xlIjoidXNlciIsImp0aSI6IjkxIiwic3ViIjoiOTEiLCJpYXQiOjE3NzI0MjAyNjEsImV4cCI6MTc3MjQzODI2MX0.jXD0Ufqb-7mfg1Ye0huQJ0sihoi6QZTXdkspZEZqROw"
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

**Expected:** 200 | **Actual:** 200 | **Duration:** 264ms

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
    "timestamp": "2026-03-02T04:19:44.037Z"
  }
}
```

**Expected:** 200 | **Actual:** 200 | **Duration:** 202ms

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

**Expected:** 401 | **Actual:** 401 | **Duration:** 209ms

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

**Expected:** 401 | **Actual:** 401 | **Duration:** 198ms

**Curl (Copy to Retest):**
```bash
curl -X POST "https://api.foreon.network/comments" \
  -H "Content-Type: application/json" \
  -d '{"content":"test"}'
```

