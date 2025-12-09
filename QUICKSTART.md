# Quick Start Guide

## ✅ Deployment Complete!

Your Agent Coordinator MCP server is deployed at:
**https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app**

---

## 🧪 Step 1: Test the Deployment

Run these commands from your **local machine** (not in this environment):

### Test Health Endpoint
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

### Test MCP Tools List
```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Run Full Test Suite
```bash
# Download and run the test script
chmod +x test-deployment.sh
./test-deployment.sh
```

---

## 🔧 Step 2: Configure Claude Code

### Option A: Quick Config (Recommended)

Create or edit `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}
```

### Option B: Command Line Setup

```bash
# Create config directory if it doesn't exist
mkdir -p ~/.claude

# Add configuration
cat > ~/.claude/claude_code_config.json << 'EOF'
{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}
EOF

# Verify the config
cat ~/.claude/claude_code_config.json
```

---

## 🔄 Step 3: Restart Claude Code

After updating the configuration:
- **Terminal**: Restart the Claude Code process
- **VS Code**: Reload window (Ctrl+Shift+P → "Developer: Reload Window")

---

## ✨ Step 4: Verify in Claude Code

Ask Claude to test the connection:

```
You: List all available MCP tools

Expected: You should see 8 coordinator tools:
- coordinator_log_action
- coordinator_get_context
- coordinator_claim_lock
- coordinator_release_lock
- coordinator_check_lock
- coordinator_set_state
- coordinator_get_state
- coordinator_list_state
```

---

## 🎯 Step 5: Use It!

### Example 1: Log an Action
```
You: Log an action to the coordinator: agent_id "claude-code", action_type "setup", target "mcp-server", summary "Testing coordinator integration"
```

### Example 2: Claim a Lock Before Editing
```
You: Before editing src/index.ts, claim a lock on it using the coordinator with agent_id "claude-code"
```

### Example 3: Check Recent Activity
```
You: Show me what actions have been logged in the last 30 minutes using the coordinator
```

### Example 4: Share State
```
You: Set a shared state key "deployment_version" with value "1.0.0" using the coordinator
```

---

## 🔍 Troubleshooting

### Issue: Health check returns 404 or error

**Possible causes:**
- Vercel deployment hasn't completed
- Vercel KV database not configured

**Solutions:**
1. Check Vercel deployment status: https://vercel.com/dashboard
2. Ensure Vercel KV is created and linked (see DEPLOYMENT.md)
3. Redeploy: `vercel --prod`

### Issue: MCP tools not showing in Claude Code

**Solutions:**
1. Verify config file location: `cat ~/.claude/claude_code_config.json`
2. Check JSON syntax (use a validator)
3. Restart Claude Code completely
4. Check Claude Code logs for connection errors

### Issue: Tools return 500 errors

**Cause:** Vercel KV not configured

**Solution:**
1. Go to Vercel Dashboard → Your Project → Storage
2. Create KV database: `agent-coordinator-kv`
3. Link to project
4. Redeploy: `vercel --prod`

---

## 📚 More Information

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide with all API examples
- **[CLAUDE_CONFIG.md](./CLAUDE_CONFIG.md)** - Detailed Claude Code configuration
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full deployment documentation
- **[README.md](./README.md)** - Complete project documentation

---

## 🚀 Next Steps

1. ✅ Test deployment (Step 1)
2. ✅ Configure Claude Code (Step 2)
3. ✅ Verify connection (Steps 3-4)
4. ✅ Start coordinating! (Step 5)

### Advanced Usage

- **Replit Integration**: See README.md for JavaScript helper functions
- **Custom Workflows**: Use coordinator before deploys, edits, and builds
- **Multi-Agent Projects**: Prevent conflicts when multiple agents work together

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Health endpoint returns `{"status":"ok"}`
- ✅ Claude Code shows 8 coordinator tools
- ✅ You can log actions and retrieve context
- ✅ Locks can be claimed and released
- ✅ State can be stored and retrieved

---

## 📞 Support

If you encounter issues:

1. Run the test script: `./test-deployment.sh`
2. Check Vercel logs in dashboard
3. Verify Vercel KV is configured
4. Review error messages in Claude Code logs

Deployment: **https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app**
