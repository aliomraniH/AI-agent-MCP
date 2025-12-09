#!/bin/bash

API_URL="https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app"

echo "🔍 Testing Agent Coordinator MCP Deployment"
echo "==========================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check..."
HEALTH=$(curl -s "$API_URL/health")
echo "$HEALTH" | jq .
if echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi
echo ""

# Test 2: List Tools
echo "2️⃣  List Tools..."
TOOLS=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
TOOL_COUNT=$(echo "$TOOLS" | jq '.result.tools | length')
echo "Found $TOOL_COUNT tools"
if [ "$TOOL_COUNT" -eq 8 ]; then
  echo "✅ All 8 tools available"
else
  echo "❌ Expected 8 tools, found $TOOL_COUNT"
fi
echo ""

# Test 3: Log Action
echo "3️⃣  Log Action..."
LOG_RESULT=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"coordinator_log_action",
      "arguments":{
        "agent_id":"test-script",
        "action_type":"test",
        "target":"deployment",
        "summary":"Automated test"
      }
    }
  }')
LOG_SUCCESS=$(echo "$LOG_RESULT" | jq '.result.content[0].text | fromjson | .success')
if [ "$LOG_SUCCESS" = "true" ]; then
  echo "✅ Action logged successfully"
else
  echo "❌ Failed to log action"
  echo "$LOG_RESULT" | jq .
fi
echo ""

# Test 4: Get Context
echo "4️⃣  Get Context..."
CONTEXT=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"coordinator_get_context",
      "arguments":{"minutes":5}
    }
  }')
CONTEXT_COUNT=$(echo "$CONTEXT" | jq '.result.content[0].text | fromjson | .count')
echo "Found $CONTEXT_COUNT recent actions"
if [ "$CONTEXT_COUNT" -ge 1 ]; then
  echo "✅ Context retrieved (including our test action)"
else
  echo "⚠️  No recent actions found"
fi
echo ""

# Test 5: Claim Lock
echo "5️⃣  Claim Lock..."
LOCK_RESULT=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":4,
    "method":"tools/call",
    "params":{
      "name":"coordinator_claim_lock",
      "arguments":{
        "agent_id":"test-script",
        "resource":"test-file.ts",
        "duration_seconds":60
      }
    }
  }')
LOCK_SUCCESS=$(echo "$LOCK_RESULT" | jq '.result.content[0].text | fromjson | .success')
if [ "$LOCK_SUCCESS" = "true" ]; then
  echo "✅ Lock claimed successfully"
else
  echo "❌ Failed to claim lock"
  echo "$LOCK_RESULT" | jq .
fi
echo ""

# Test 6: Check Lock
echo "6️⃣  Check Lock..."
CHECK_RESULT=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":5,
    "method":"tools/call",
    "params":{
      "name":"coordinator_check_lock",
      "arguments":{"resource":"test-file.ts"}
    }
  }')
IS_LOCKED=$(echo "$CHECK_RESULT" | jq '.result.content[0].text | fromjson | .is_locked')
if [ "$IS_LOCKED" = "true" ]; then
  echo "✅ Lock verified (resource is locked)"
else
  echo "❌ Lock check failed (should be locked)"
fi
echo ""

# Test 7: Release Lock
echo "7️⃣  Release Lock..."
RELEASE_RESULT=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":6,
    "method":"tools/call",
    "params":{
      "name":"coordinator_release_lock",
      "arguments":{
        "agent_id":"test-script",
        "resource":"test-file.ts"
      }
    }
  }')
RELEASE_SUCCESS=$(echo "$RELEASE_RESULT" | jq '.result.content[0].text | fromjson | .success')
if [ "$RELEASE_SUCCESS" = "true" ]; then
  echo "✅ Lock released successfully"
else
  echo "❌ Failed to release lock"
fi
echo ""

# Test 8: Set State
echo "8️⃣  Set State..."
STATE_SET=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":7,
    "method":"tools/call",
    "params":{
      "name":"coordinator_set_state",
      "arguments":{
        "key":"test_key",
        "value":"test_value",
        "ttl_seconds":300
      }
    }
  }')
SET_SUCCESS=$(echo "$STATE_SET" | jq '.result.content[0].text | fromjson | .success')
if [ "$SET_SUCCESS" = "true" ]; then
  echo "✅ State set successfully"
else
  echo "❌ Failed to set state"
fi
echo ""

# Test 9: Get State
echo "9️⃣  Get State..."
STATE_GET=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":8,
    "method":"tools/call",
    "params":{
      "name":"coordinator_get_state",
      "arguments":{"key":"test_key"}
    }
  }')
STATE_EXISTS=$(echo "$STATE_GET" | jq '.result.content[0].text | fromjson | .exists')
if [ "$STATE_EXISTS" = "true" ]; then
  echo "✅ State retrieved successfully"
else
  echo "❌ Failed to retrieve state"
fi
echo ""

# Test 10: List State
echo "🔟 List State..."
STATE_LIST=$(curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":9,
    "method":"tools/call",
    "params":{
      "name":"coordinator_list_state"
    }
  }')
STATE_COUNT=$(echo "$STATE_LIST" | jq '.result.content[0].text | fromjson | .count')
echo "Found $STATE_COUNT state keys"
if [ "$STATE_COUNT" -ge 1 ]; then
  echo "✅ State listing works"
else
  echo "⚠️  No state keys found"
fi
echo ""

echo "=========================================="
echo "✅ All tests completed!"
echo ""
echo "Next steps:"
echo "1. Configure Claude Code (see CLAUDE_CONFIG.md)"
echo "2. Add to ~/.claude/claude_code_config.json:"
echo ""
echo '{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}'
