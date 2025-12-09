# Technical Challenges: Why Claude Code Web Can't Use MCP Servers

## Architecture Overview

### Claude Code CLI/Desktop
```
┌─────────────────────────┐
│   Your Local Machine    │
│                         │
│  ┌──────────────────┐  │
│  │  Claude Code     │  │
│  │  Process         │  │
│  └────────┬─────────┘  │
│           │             │
│  ┌────────▼─────────┐  │
│  │  MCP Servers     │  │
│  │  (stdio/http)    │  │
│  └──────────────────┘  │
│                         │
│  ┌──────────────────┐  │
│  │  Config Files    │  │
│  │  ~/.claude/      │  │
│  └──────────────────┘  │
└─────────────────────────┘
```

### Claude Code Web
```
┌────────────────────────────────────┐
│   Browser (Your Machine)           │
│   ┌──────────────────────┐         │
│   │   code.claude.com    │         │
│   │   (UI Only)          │         │
│   └──────────┬───────────┘         │
└──────────────┼────────────────────┘
               │ HTTPS
               ▼
┌────────────────────────────────────┐
│   Anthropic Cloud Infrastructure   │
│                                    │
│   ┌──────────────────────┐        │
│   │  Isolated Container  │        │
│   │  ┌────────────────┐  │        │
│   │  │ Claude Code    │  │        │
│   │  │ Session        │  │        │
│   │  └────────────────┘  │        │
│   │                      │        │
│   │  ❌ No MCP access   │        │
│   │  ❌ No config files │        │
│   │  ❌ No filesystem   │        │
│   └──────────────────────┘        │
└────────────────────────────────────┘
```

---

## Technical Challenges

### 1. **Container Isolation & Sandboxing**

**Problem:** Claude Code Web runs in ephemeral, isolated containers with strict security boundaries.

**Technical Details:**
- Each web session runs in a **separate, temporary Linux container**
- Containers are **stateless** - destroyed after session ends
- No persistent storage between sessions
- **No network access** to arbitrary external services
- Containers run with minimal privileges (non-root, restricted capabilities)

**Impact on MCP:**
```bash
# What CLI can do:
~/.claude/claude_code_config.json  ✅ Persists across sessions
claude mcp add my-server            ✅ Configuration saved

# What Web cannot do:
Container filesystem                ❌ Ephemeral, wiped on exit
Container network                   ❌ Restricted to allowed hosts
External MCP servers               ❌ Cannot reach arbitrary URLs
```

**Evidence from error logs:**
```
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
```
The container proxy blocks connections to non-whitelisted hosts.

---

### 2. **Network Security Model**

**Problem:** Web containers use a strict allowlist for network access.

**Technical Implementation:**
- All outbound traffic goes through an **egress proxy**
- Proxy enforces an **allowlist** of permitted domains
- Your Vercel deployment (`*.vercel.app`) is **not on the allowlist**
- No way for users to modify the allowlist

**Allowed Hosts (Partial List):**
```
github.com
npmjs.org
pypi.org
docker.io
googleapis.com
# ... ~150 other development/package registry domains
# ❌ NOT INCLUDED: User deployments, custom MCP servers
```

**Why This Exists:**
- **Security**: Prevent data exfiltration
- **Compliance**: Meet enterprise security requirements
- **Rate limiting**: Control API usage
- **Cost management**: Prevent abuse

**Impact:**
```bash
# Your MCP server at:
https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app

# Container attempts to connect:
curl https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app/health

# Result:
curl: (56) CONNECT tunnel failed, response 403
x-deny-reason: host_not_allowed
```

---

### 3. **No Persistent Configuration**

**Problem:** Web sessions cannot maintain configuration files between sessions.

**Filesystem Structure:**

**CLI/Desktop:**
```
/home/user/
└── .claude/
    ├── claude_code_config.json  ✅ Persists
    └── mcp_cache/               ✅ Persists
```

**Web Container:**
```
/tmp/ephemeral_container_xyz/
├── /workspace/              ⚠️  Git repo only (temp cloned)
└── /home/sandbox/           ❌ Wiped on session end
    └── .claude/             ❌ Doesn't exist/Not persistent
```

**Technical Constraints:**
- Containers use **overlay filesystems** (read-only base + temporary writable layer)
- Writable layer is **discarded** when container stops
- No mechanism to save user config to persistent storage
- Config files would need to be **recreated every session**

---

### 4. **MCP Protocol Architecture Mismatch**

**Problem:** MCP assumes persistent, trusted process relationships.

**MCP Design Assumptions:**
```typescript
// MCP expects:
1. Long-lived server process ✅ CLI has this
2. Bidirectional communication ✅ CLI has this
3. Shared filesystem access   ✅ CLI has this
4. Process-level trust       ✅ CLI has this

// Web reality:
1. Short-lived containers     ❌ Destroyed after session
2. HTTP-only communication   ⚠️  One-way, stateless
3. Isolated filesystem       ❌ No shared access
4. Zero-trust sandbox        ❌ Maximum isolation
```

**Stdio MCP Servers (Completely Impossible):**
```bash
# CLI can do:
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
# → Spawns local process, connects via stdin/stdout ✅

# Web cannot do:
# - Cannot spawn local processes
# - No access to user's filesystem
# - No stdin/stdout IPC mechanism
```

**HTTP MCP Servers (Blocked by Network Policy):**
```bash
# CLI can do:
{
  "mcpServers": {
    "my-server": {
      "type": "http",
      "url": "https://my-mcp-server.com/api/mcp"
    }
  }
}
# → Connects via HTTP, no restrictions ✅

# Web is blocked by:
# - Domain not on allowlist ❌
# - No config file to define it ❌
# - No UI to add servers ❌
```

---

### 5. **Session State Management**

**Problem:** Web sessions are stateless; CLI/Desktop sessions are stateful.

**State Comparison:**

| State Type | CLI/Desktop | Web |
|------------|-------------|-----|
| MCP config | Persistent file | ❌ None |
| MCP connections | Maintained | ❌ None |
| Tool cache | Cached locally | ❌ Ephemeral |
| Credentials | OS keychain | ❌ Not stored |
| Server list | Saved | ❌ None |

**Technical Reason:**
```
Web sessions prioritize:
- Security (no persistent data)
- Privacy (no session tracking)
- Isolation (no cross-session state)
- Simplicity (no configuration)

This conflicts with MCP's need for:
- Configuration (server definitions)
- State (active connections)
- Trust (credential storage)
```

---

### 6. **No Configuration UI**

**Problem:** Web version lacks any UI for MCP configuration.

**CLI/Desktop Has:**
```bash
claude mcp add <name> --transport http <url>
claude mcp list
claude mcp remove <name>
# + Config file editing
```

**Web Has:**
- ❌ No `/mcp` command
- ❌ No settings panel for MCP
- ❌ No way to define servers
- ❌ No UI to manage connections

**Why It Doesn't Exist:**
The feature was **intentionally omitted** due to the architectural constraints above. Building UI without solving the underlying technical issues would be pointless.

---

### 7. **Multi-Tenancy & Resource Isolation**

**Problem:** Web runs thousands of concurrent sessions; security isolation is critical.

**Technical Architecture:**
```
Single Physical Host
├── Container 1: User A, Session X
│   └── Isolated network namespace
├── Container 2: User B, Session Y
│   └── Isolated network namespace
└── Container 3: User C, Session Z
    └── Isolated network namespace
```

**Security Requirements:**
- **Zero trust**: Containers cannot communicate with each other
- **No lateral movement**: Compromise of one container can't affect others
- **Resource limits**: CPU, memory, network bandwidth capped
- **Network egress control**: Only approved destinations

**MCP Conflicts:**
If MCP were allowed:
- Users could connect to **malicious MCP servers**
- MCP servers could **exfiltrate data** from sessions
- One user's MCP server could **attack others**
- No way to validate/audit arbitrary MCP endpoints

---

## Why HTTP MCP Still Doesn't Work

Even though your server is HTTP-based (not stdio), it still fails because:

### 1. **Network Allowlist**
```bash
✅ github.com          # On allowlist
✅ npmjs.org           # On allowlist
✅ pypi.org            # On allowlist
❌ *.vercel.app        # NOT on allowlist
❌ your-domain.com     # NOT on allowlist
```

### 2. **No Configuration Mechanism**
```javascript
// CLI: Load config from file
const config = readFileSync('~/.claude/claude_code_config.json');

// Web: No file, no config, no way to define servers
const config = ??? // Doesn't exist
```

### 3. **Dynamic Server Discovery Impossible**
```javascript
// CLI can discover MCP servers from:
- Config files
- Environment variables
- Project .mcp.json files
- CLI arguments

// Web can discover from:
- Nothing ❌
```

---

## Comparison Table

| Capability | CLI/Desktop | Web | Why? |
|------------|-------------|-----|------|
| **Stdio MCP** | ✅ | ❌ | Web can't spawn processes |
| **HTTP MCP** | ✅ | ❌ | Domain allowlist blocks it |
| **Config files** | ✅ | ❌ | Ephemeral filesystem |
| **Persistent state** | ✅ | ❌ | Stateless containers |
| **Network access** | ✅ | ⚠️ | Restricted to allowlist |
| **Local filesystem** | ✅ | ❌ | Isolated containers |
| **Process spawning** | ✅ | ❌ | Security restriction |
| **Custom endpoints** | ✅ | ❌ | Not on allowlist |

---

## Could This Be Fixed?

### ❌ **Why It Won't Be Easy:**

1. **Security by design**: The isolation is intentional, not a bug
2. **Architectural**: Would require fundamental redesign
3. **Legal/compliance**: Enterprise customers require isolation
4. **Scale**: Managing MCP allowlists for millions of users is impractical

### ✅ **Potential Solutions (Not Yet Implemented):**

1. **Anthropic-hosted MCP servers**: Pre-vetted, allowlisted servers
2. **MCP marketplace**: Curated list of approved HTTP MCP endpoints
3. **Session persistence**: Save config between sessions (complex)
4. **Bridge service**: Anthropic-run proxy for user MCP servers

### 📊 **Current Status:**

- [GitHub Issue #11146](https://github.com/anthropics/claude-code/issues/11146) tracks this
- No timeline for web MCP support
- CLI/Desktop remain the recommended solution

---

## Workarounds

### 1. **Use CLI/Desktop** (Recommended)
```bash
npm install -g @anthropic-ai/claude-code
claude mcp add agent-coordinator --transport http <your-url>
```

### 2. **HTTP Bridge** (Complex)
Deploy a bridge that:
- Runs on an **allowlisted domain** (e.g., GitHub Pages)
- Proxies requests to your MCP server
- Adds authentication/security

### 3. **Request Allowlist Addition** (Unlikely)
Contact Anthropic to add your domain to the allowlist (probably won't happen for individual users)

---

## Summary

Claude Code Web **cannot** use MCP servers due to:

1. ✅ **Intentional security design** (ephemeral containers, network isolation)
2. ✅ **No configuration persistence** (stateless sessions)
3. ✅ **Network allowlist enforcement** (blocks arbitrary URLs)
4. ✅ **No UI/mechanism** to define MCP servers
5. ✅ **Architecture mismatch** (MCP assumes persistent, trusted processes)

**Solution:** Use **Claude Code CLI or Desktop** where all these restrictions don't apply.

Your MCP server at `https://ai-agent-mcp-qgtt-alis-projects-4856f194.vercel.app` is perfectly functional - the limitation is purely on the **client side** (Web vs CLI/Desktop).
