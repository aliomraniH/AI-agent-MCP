# Testing the Agent Coordinator MCP Server

## Deployment Information

- **Deployment URL**: https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app
- **MCP Endpoint**: https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp
- **Health Check**: https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/health

---

## Quick Test Commands

### 1. Health Check

```bash
curl https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "agent-coordinator-mcp",
  "version": "1.0.0",
  "timestamp": "2025-12-09T..."
}
```

---

### 2. List Available Tools

```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "coordinator_log_action",
        "description": "Log an action being performed by an agent..."
      },
      ...
    ]
  }
}
```

---

### 3. Test Action Logging

```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "coordinator_log_action",
      "arguments": {
        "agent_id": "test-agent",
        "action_type": "test",
        "target": "deployment",
        "summary": "Testing deployment from curl"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{
          \"success\": true,
          \"action\": {
            \"agent_id\": \"test-agent\",
            \"action_type\": \"test\",
            \"target\": \"deployment\",
            \"summary\": \"Testing deployment from curl\",
            \"timestamp\": 1733703600000
          }
        }"
      }
    ]
  }
}
```

---

### 4. Get Recent Context

```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "coordinator_get_context",
      "arguments": {
        "minutes": 30
      }
    }
  }'
```

---

### 5. Test Resource Locking

**Claim Lock:**
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "coordinator_claim_lock",
      "arguments": {
        "agent_id": "test-agent",
        "resource": "src/index.ts",
        "duration_seconds": 300
      }
    }
  }'
```

**Check Lock:**
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "coordinator_check_lock",
      "arguments": {
        "resource": "src/index.ts"
      }
    }
  }'
```

**Release Lock:**
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "coordinator_release_lock",
      "arguments": {
        "agent_id": "test-agent",
        "resource": "src/index.ts"
      }
    }
  }'
```

---

### 6. Test State Management

**Set State:**
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "tools/call",
    "params": {
      "name": "coordinator_set_state",
      "arguments": {
        "key": "deployment_status",
        "value": "{\"status\":\"deployed\",\"version\":\"1.0.0\",\"timestamp\":1733703600000}",
        "ttl_seconds": 3600
      }
    }
  }'
```

**Get State:**
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "tools/call",
    "params": {
      "name": "coordinator_get_state",
      "arguments": {
        "key": "deployment_status"
      }
    }
  }'
```

**List State Keys:**
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 9,
    "method": "tools/call",
    "params": {
      "name": "coordinator_list_state"
    }
  }'
```

---

## Automated Test Script

Save this as `test-deployment.sh`:

```bash
#!/bin/bash

API_URL="https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app"

echo "🔍 Testing Agent Coordinator MCP Deployment"
echo "==========================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check..."
curl -s "$API_URL/health" | jq .
echo ""

# Test 2: List Tools
echo "2️⃣  List Tools..."
curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
echo ""

# Test 3: Log Action
echo "3️⃣  Log Action..."
curl -s -X POST "$API_URL/api/mcp" \
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
  }' | jq '.result.content[0].text | fromjson | .success'
echo ""

# Test 4: Get Context
echo "4️⃣  Get Context..."
curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"coordinator_get_context",
      "arguments":{"minutes":5}
    }
  }' | jq '.result.content[0].text | fromjson | .count'
echo ""

# Test 5: Claim Lock
echo "5️⃣  Claim Lock..."
curl -s -X POST "$API_URL/api/mcp" \
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
  }' | jq '.result.content[0].text | fromjson | .success'
echo ""

# Test 6: Check Lock
echo "6️⃣  Check Lock..."
curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":5,
    "method":"tools/call",
    "params":{
      "name":"coordinator_check_lock",
      "arguments":{"resource":"test-file.ts"}
    }
  }' | jq '.result.content[0].text | fromjson | .is_locked'
echo ""

# Test 7: Release Lock
echo "7️⃣  Release Lock..."
curl -s -X POST "$API_URL/api/mcp" \
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
  }' | jq '.result.content[0].text | fromjson | .success'
echo ""

# Test 8: Set State
echo "8️⃣  Set State..."
curl -s -X POST "$API_URL/api/mcp" \
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
  }' | jq '.result.content[0].text | fromjson | .success'
echo ""

# Test 9: Get State
echo "9️⃣  Get State..."
curl -s -X POST "$API_URL/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":8,
    "method":"tools/call",
    "params":{
      "name":"coordinator_get_state",
      "arguments":{"key":"test_key"}
    }
  }' | jq '.result.content[0].text | fromjson | .exists'
echo ""

echo "✅ All tests completed!"
```

**Run the script:**
```bash
chmod +x test-deployment.sh
./test-deployment.sh
```

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Possible causes:**
1. Vercel KV not configured
2. Environment variables missing

**Solution:**
1. Go to Vercel Dashboard → Storage
2. Create KV database named `agent-coordinator-kv`
3. Link it to your project
4. Redeploy: `vercel --prod`

### Issue: CORS Errors

**Solution:**
Add CORS headers to Express app in `src/index.ts`:
```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### Issue: Timeout Errors

**Possible causes:**
- Cold start on Vercel
- KV connection issues

**Solution:**
- Wait 10-15 seconds and retry
- Check Vercel function logs

---

## Next Steps

After successful testing:
1. ✅ Configure Claude Code (see CLAUDE_CONFIG.md)
2. ✅ Set up Replit integration (see README.md)
3. ✅ Start coordinating agents!
