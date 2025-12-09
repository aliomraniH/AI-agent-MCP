# Claude Code Configuration Guide

## Quick Setup

Add this configuration to your Claude Code config file:

**Location:** `~/.claude/claude_code_config.json`

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

---

## Full Configuration Example

If you have other MCP servers, add it alongside them:

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "transport": "http"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

---

## Restart Claude Code

After updating the configuration:

```bash
# If running in terminal, restart the process
# If using VS Code extension, reload window
# Command: Ctrl+Shift+P → "Developer: Reload Window"
```

---

## Verify Connection

Once Claude Code restarts, you can verify the connection by asking Claude to use the coordination tools:

```
You: List the available MCP tools

Claude: [Should show coordinator_log_action, coordinator_get_context, etc.]
```

Or test directly:

```
You: Log an action using the coordinator: agent_id "claude-code", action_type "test", target "config", summary "Testing coordinator connection"

Claude: [Should successfully log the action and return confirmation]
```

---

## Available Tools

Once connected, Claude Code will have access to these tools:

### 📝 Action Logging
- **coordinator_log_action** - Log what you're doing
- **coordinator_get_context** - See what other agents are doing

### 🔒 Resource Locking
- **coordinator_claim_lock** - Claim exclusive access to a file/resource
- **coordinator_release_lock** - Release a lock
- **coordinator_check_lock** - Check if something is locked

### 💾 State Sharing
- **coordinator_set_state** - Store shared data
- **coordinator_get_state** - Retrieve shared data
- **coordinator_list_state** - List all state keys

---

## Usage Examples

### Example 1: Prevent Edit Conflicts

```
You: Before editing src/index.ts, check if it's locked and claim a lock if available

Claude: [Checks lock status, claims lock if free, proceeds with edit]
```

### Example 2: Coordinate with Other Agents

```
You: What have other agents been doing in the last 30 minutes?

Claude: [Retrieves context from coordinator showing recent actions]
```

### Example 3: Share Build Status

```
You: After building, store the build status in shared state

Claude: [Builds the project, then stores status using coordinator_set_state]
```

---

## Alternative: Environment Variable

You can also set the MCP server URL via environment variable:

```bash
export CLAUDE_MCP_SERVERS='{"agent-coordinator":{"url":"https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp","transport":"http"}}'
```

---

## Troubleshooting

### Issue: Tools Not Showing Up

**Solution:**
1. Verify config file location: `~/.claude/claude_code_config.json`
2. Check JSON syntax (use a JSON validator)
3. Restart Claude Code completely
4. Check Claude Code logs for errors

### Issue: Connection Timeout

**Solution:**
1. Verify URL is accessible: `curl https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/health`
2. Check your internet connection
3. Try again (Vercel cold starts can be slow)

### Issue: Permission Denied

**Solution:**
1. Ensure config file has correct permissions: `chmod 644 ~/.claude/claude_code_config.json`
2. Check file ownership

---

## Advanced Configuration

### Custom Timeout

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "transport": "http",
      "timeout": 30000
    }
  }
}
```

### With Authentication Headers (if added later)

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer your-token-here"
      }
    }
  }
}
```

---

## Testing the Connection

Run this command to verify the MCP server is accessible:

```bash
curl -X POST https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

You should see a list of 8 coordinator tools.

---

## Next Steps

1. ✅ Test basic coordination: Log an action
2. ✅ Test locking: Claim and release a lock on a test file
3. ✅ Test state: Store and retrieve a test value
4. ✅ Integrate into your workflow: Use before editing files, deployments, etc.

---

## Support

If you encounter issues:
1. Check TESTING.md for deployment verification
2. Review Vercel logs for errors
3. Ensure Vercel KV is properly configured
4. Check that environment variables are set
