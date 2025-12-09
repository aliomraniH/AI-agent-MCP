# Claude Code CLI/Desktop Configuration

## ⚠️ Important: Web Version Limitation

**Claude Code Web does NOT support MCP servers.** You must use the CLI or Desktop version.

---

## ✅ Setup for CLI/Desktop Version

### Installation

**Install Claude Code CLI:**
```bash
npm install -g @anthropic-ai/claude-code
```

**Or download Claude Code Desktop:**
- Visit https://claude.ai/download
- Install the desktop application

---

## Configuration Methods

### Method 1: Using CLI Command (Easiest)

```bash
claude mcp add agent-coordinator \
  --transport http \
  https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp
```

### Method 2: Manual Configuration File

**Configuration File Locations:**

- **Linux/CLI**: `~/.claude.json` or `~/.claude/claude_code_config.json`
- **macOS Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows Desktop**: `%APPDATA%\Claude\claude_desktop_config.json`

**Add this configuration:**

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "type": "http",
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp"
    }
  }
}
```

### Method 3: With Authentication (If Needed Later)

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "type": "http",
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}",
        "X-API-Key": "${API_KEY}"
      }
    }
  }
}
```

Environment variables use `${VAR_NAME}` syntax and are resolved at runtime.

---

## Verification

### List Configured MCP Servers

```bash
claude mcp list
```

**Expected output:**
```
agent-coordinator (http)
  URL: https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp
  Status: Connected
```

### Test in Conversation

```bash
claude
```

Then ask:
```
List all available MCP tools
```

You should see the 8 coordinator tools:
- coordinator_log_action
- coordinator_get_context
- coordinator_claim_lock
- coordinator_release_lock
- coordinator_check_lock
- coordinator_set_state
- coordinator_get_state
- coordinator_list_state

---

## Project-Specific Configuration

For project-specific MCP servers, create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "type": "http",
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp"
    }
  }
}
```

This configuration applies only when working in that project directory.

---

## Troubleshooting

### Issue: MCP server not showing up

**Check configuration file:**
```bash
cat ~/.claude/claude_code_config.json
# or
cat ~/.claude.json
```

**Verify JSON syntax:**
```bash
python3 -m json.tool ~/.claude/claude_code_config.json
```

### Issue: Connection timeout

**Test the URL directly:**
```bash
curl https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/health
```

Should return:
```json
{"status":"ok","service":"agent-coordinator-mcp","version":"1.0.0"}
```

### Issue: Tools not available

**Restart Claude Code:**
- **CLI**: Exit and restart with `claude`
- **Desktop**: Quit and relaunch the application

**Check logs:**
- **CLI**: Look for MCP connection errors in terminal
- **Desktop**: Check application logs

---

## Feature Comparison

| Feature | Web Version | CLI/Desktop |
|---------|-------------|-------------|
| MCP Server Support | ❌ No | ✅ Yes |
| HTTP MCP Servers | ❌ No | ✅ Yes |
| Stdio MCP Servers | ❌ No | ✅ Yes |
| Config File | ❌ No | ✅ Yes |
| Your Coordinator | ❌ Won't work | ✅ Works |

---

## Alternative: VS Code Extension

The Claude Code VS Code extension also supports MCP servers:

1. Install "Claude Code" extension in VS Code
2. Open VS Code Settings
3. Search for "Claude Code MCP"
4. Add server configuration
5. Restart VS Code

---

## Next Steps

1. ✅ Install Claude Code CLI or Desktop
2. ✅ Add the HTTP MCP server configuration
3. ✅ Verify with `claude mcp list`
4. ✅ Test by listing tools in conversation
5. ✅ Start using coordinator tools!

---

## Configuration Template

Copy-paste ready configuration:

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "type": "http",
      "url": "https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/api/mcp"
    }
  }
}
```

Save to:
- Linux: `~/.claude/claude_code_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Then restart Claude Code!

---

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [MCP Configuration Guide](https://docs.anthropic.com/claude-code/mcp)
- [GitHub Issue: Web MCP Support](https://github.com/anthropics/claude-code/issues/11146)

**Deployment URL**: https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app
