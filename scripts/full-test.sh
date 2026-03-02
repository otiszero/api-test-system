#!/bin/bash

# ============================================
# FULL QC WORKFLOW
# Chạy toàn bộ test workflow từ assess đến report
# Usage:
#   npm run full-test           # Interactive mode
#   npm run full-test -- --ci   # Non-interactive (CI mode)
# ============================================

# Check for CI mode flag
CI_MODE=false
for arg in "$@"; do
    if [ "$arg" = "--ci" ] || [ "$arg" = "-y" ]; then
        CI_MODE=true
    fi
done

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="reports"

echo ""
echo "============================================"
echo "  FULL QC WORKFLOW - API Test System"
echo "  Started: $(date)"
echo "============================================"
echo ""

# ============================================
# STEP 1: ASSESS - Check configs
# ============================================
echo -e "${BLUE}[1/5] ASSESS - Checking configurations...${NC}"

# Check if configs exist
if [ ! -f "config/api.config.json" ]; then
    echo -e "${RED}ERROR: config/api.config.json not found${NC}"
    exit 1
fi

if [ ! -f "config/auth.config.json" ]; then
    echo -e "${RED}ERROR: config/auth.config.json not found${NC}"
    exit 1
fi

# Extract base URL
BASE_URL=$(cat config/api.config.json | grep -o '"baseUrl"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
echo -e "  Base URL: ${GREEN}$BASE_URL${NC}"

# Quick connectivity check
echo -e "  Testing connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" --max-time 10 || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}  ERROR: Cannot connect to $BASE_URL${NC}"
    exit 1
else
    echo -e "  ${GREEN}✓ API reachable (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# ============================================
# STEP 2: RUN SMOKE TESTS
# ============================================
echo -e "${BLUE}[2/5] SMOKE TESTS - Quick health check...${NC}"

npm run test:smoke 2>&1 | tail -10

SMOKE_EXIT=${PIPESTATUS[0]}
if [ $SMOKE_EXIT -ne 0 ]; then
    if [ "$CI_MODE" = true ]; then
        echo -e "${YELLOW}  ⚠️  Some smoke tests failed. Continuing in CI mode...${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Some smoke tests failed. Continue anyway? (y/n)${NC}"
        read -r CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            echo "Aborted by user."
            exit 1
        fi
    fi
fi
echo ""

# ============================================
# STEP 3: RUN ALL TESTS
# ============================================
echo -e "${BLUE}[3/5] RUNNING ALL TESTS...${NC}"
echo ""

npm test 2>&1 | tee "$REPORT_DIR/test-output-$TIMESTAMP.log"

echo ""

# ============================================
# STEP 4: RUN DB VERIFICATION (if enabled)
# ============================================
DB_ENABLED=$(cat config/db.config.json 2>/dev/null | grep -o '"enabled"[[:space:]]*:[[:space:]]*true' || echo "")
if [ -n "$DB_ENABLED" ]; then
    echo -e "${BLUE}[4/5] DB VERIFICATION...${NC}"
    npm run test:db 2>&1 | tail -20
else
    echo -e "${YELLOW}[4/5] DB VERIFICATION - Skipped (disabled in config)${NC}"
fi

echo ""

# ============================================
# STEP 5: GENERATE SUMMARY
# ============================================
echo -e "${BLUE}[5/5] GENERATING SUMMARY...${NC}"

# Count results from HTML report if exists
if [ -f "$REPORT_DIR/html/index.html" ]; then
    echo -e "  ${GREEN}✓ HTML Report: $REPORT_DIR/html/index.html${NC}"
fi

if [ -f "$REPORT_DIR/latest-report.md" ]; then
    echo -e "  ${GREEN}✓ Summary Report: $REPORT_DIR/latest-report.md${NC}"
fi

if [ -f "$REPORT_DIR/bugs-found.md" ]; then
    echo -e "  ${GREEN}✓ Bug Report: $REPORT_DIR/bugs-found.md${NC}"
fi

if [ -f "$REPORT_DIR/integration-evidence.md" ]; then
    echo -e "  ${GREEN}✓ Integration Evidence: $REPORT_DIR/integration-evidence.md${NC}"
fi

echo ""
echo "============================================"
echo "  WORKFLOW COMPLETE"
echo "  Finished: $(date)"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. View HTML report: npx vite preview --outDir reports/html"
echo "  2. View summary: cat reports/latest-report.md"
echo "  3. View bugs: cat reports/bugs-found.md"
echo ""
