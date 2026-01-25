#!/bin/bash

BASE_URL="https://fatah-commander.cloud/api"
TOKEN_FILE="/tmp/test_token.txt"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

test_route() {
    local METHOD=$1
    local ENDPOINT=$2
    local DESCRIPTION=$3
    
    TOTAL=$((TOTAL + 1))
    
    if [ -f "$TOKEN_FILE" ]; then
        TOKEN=$(cat "$TOKEN_FILE")
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" -H "Authorization: Bearer $TOKEN" 2>&1)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" 2>&1)
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo -e "${GREEN}✓${NC} $METHOD $ENDPOINT - $DESCRIPTION [$HTTP_CODE]"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $METHOD $ENDPOINT - $DESCRIPTION [$HTTP_CODE]"
        FAILED=$((FAILED + 1))
    fi
}

echo -e "\n${BLUE}=== TEST DES ROUTES API ===${NC}\n"

# 1. Login
echo -e "${YELLOW}📁 AUTH${NC}"
curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" > "$TOKEN_FILE" 2>/dev/null
if [ -f "$TOKEN_FILE" ] && [ -s "$TOKEN_FILE" ]; then
    echo -e "${GREEN}✓${NC} POST /auth/login - Login successful"
    PASSED=$((PASSED + 1))
    TOTAL=$((TOTAL + 1))
else
    echo -e "${RED}✗${NC} POST /auth/login - Login failed"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
    exit 1
fi

test_route "GET" "/auth/me" "Get current user"
test_route "GET" "/health" "Health check"

# 2. Products
echo -e "\n${YELLOW}📁 PRODUCTS${NC}"
test_route "GET" "/products?limit=5" "List products"
test_route "GET" "/products/search?q=tomate" "Search products"
test_route "GET" "/products/categories" "Get categories"

# 3. Categories
echo -e "\n${YELLOW}📁 CATEGORIES${NC}"
test_route "GET" "/categories" "List categories"

# 4. Orders
echo -e "\n${YELLOW}📁 ORDERS${NC}"
test_route "GET" "/orders?limit=5" "List orders"
test_route "GET" "/orders?status=NEW" "Filter orders by status"

# 5. Shops
echo -e "\n${YELLOW}📁 SHOPS${NC}"
test_route "GET" "/shops" "List shops"

# 6. Admin
echo -e "\n${YELLOW}📁 ADMIN${NC}"
test_route "GET" "/admin/users?limit=5" "List users"
test_route "GET" "/admin/stats/dashboard" "Dashboard stats"

# 7. Others
echo -e "\n${YELLOW}📁 OTHER ROUTES${NC}"
test_route "GET" "/recurring-orders" "Recurring orders"
test_route "GET" "/invoices" "Invoices"
test_route "GET" "/payments" "Payments"
test_route "GET" "/stock" "Stock"
test_route "GET" "/notifications" "Notifications"
test_route "GET" "/messages" "Messages"
test_route "GET" "/promotions" "Promotions"

# Summary
echo -e "\n${BLUE}=== RÉSUMÉ ===${NC}"
echo -e "Total: $TOTAL"
echo -e "${GREEN}Réussis: $PASSED${NC}"
echo -e "${RED}Échoués: $FAILED${NC}"
PERCENTAGE=$((PASSED * 100 / TOTAL))
echo -e "Taux de réussite: ${PERCENTAGE}%\n"

rm -f "$TOKEN_FILE"
