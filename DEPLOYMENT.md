# Claude Code Deployment Instructions

## Overview
This document provides step-by-step instructions for deploying the Agent Coordinator MCP server from Claude Code to GitHub and Vercel.

---

## Prerequisites
- Git configured with GitHub access
- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- GitHub repository: https://github.com/aliomraniH/AI-agent-MCP.git

---

## Step 1: Clone or Initialize Repository

```bash
# Option A: If repo already exists, clone it
git clone https://github.com/aliomraniH/AI-agent-MCP.git
cd AI-agent-MCP

# Option B: If starting fresh in existing directory
git init
git remote add origin https://github.com/aliomraniH/AI-agent-MCP.git
```

---

## Step 2: Copy Project Files

Copy all files from the generated project structure:

```
agent-coordinator-mcp/
├── package.json
├── tsconfig.json
├── vercel.json
├── .gitignore
├── .env.example
├── README.md
├── DEPLOYMENT.md
└── src/
    ├── index.ts
    └── services/
        ├── kv-store.ts
        ├── action-logger.ts
        ├── lock-manager.ts
        └── state-manager.ts
```

---

## Step 3: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify build succeeded
ls -la dist/
```

Expected output in `dist/`:
- `index.js`
- `index.d.ts`
- `services/` directory with compiled files

---

## Step 4: Test Locally (Optional)

```bash
# Start local server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3000/health

# Test listing tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Step 5: Commit and Push to GitHub

```bash
# Stage all files
git add .

# Commit
git commit -m "Add Agent Coordinator MCP server

- Action logging for agent coordination
- Resource locking to prevent conflicts
- State synchronization between agents
- Vercel KV storage backend
- HTTP transport for remote access"

# Push to GitHub
git push -u origin main
```

---

## Step 6: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Login to Vercel (if not already)
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? agent-coordinator-mcp
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import from GitHub: `aliomraniH/AI-agent-MCP`
3. Configure:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Click Deploy

---

## Step 7: Configure Vercel KV Storage

1. Go to Vercel Dashboard → Your Project
2. Click "Storage" tab
3. Click "Create Database"
4. Select "KV" (Vercel KV)
5. Name it: `agent-coordinator-kv`
6. Click "Create"
7. The environment variables are automatically linked

---

## Step 8: Verify Deployment

```bash
# Get your deployment URL (e.g., agent-coordinator-mcp.vercel.app)
DEPLOY_URL="https://your-deployment.vercel.app"

# Test health
curl $DEPLOY_URL/health

# Test tools list
curl -X POST $DEPLOY_URL/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Test logging an action
curl -X POST $DEPLOY_URL/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"coordinator_log_action",
      "arguments":{
        "agent_id":"claude-code",
        "action_type":"deploy",
        "target":"agent-coordinator-mcp",
        "summary":"Initial deployment to Vercel"
      }
    }
  }'
```

---

## Step 9: Connect Claude Code

Add to `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "agent-coordinator": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "transport": "http"
    }
  }
}
```

Restart Claude Code to load the new MCP server.

---

## Step 10: Connect Replit

Create a helper module in your Replit project:

```javascript
// agent-coordinator.js
const MCP_URL = 'https://your-deployment.vercel.app/api/mcp';

async function callMCP(method, params = {}) {
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });
  return response.json();
}

export async function logAction(agent_id, action_type, target, summary) {
  return callMCP('tools/call', {
    name: 'coordinator_log_action',
    arguments: { agent_id, action_type, target, summary }
  });
}

export async function getContext(minutes = 30) {
  return callMCP('tools/call', {
    name: 'coordinator_get_context',
    arguments: { minutes }
  });
}

export async function claimLock(agent_id, resource) {
  return callMCP('tools/call', {
    name: 'coordinator_claim_lock',
    arguments: { agent_id, resource }
  });
}

export async function releaseLock(agent_id, resource) {
  return callMCP('tools/call', {
    name: 'coordinator_release_lock',
    arguments: { agent_id, resource }
  });
}
```

---

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Vercel Deploy Fails

Check build logs in Vercel dashboard. Common issues:
- Missing dependencies: Ensure all imports are in package.json
- TypeScript errors: Run `npm run typecheck` locally first

### KV Connection Issues

1. Verify KV is linked: Vercel Dashboard → Storage → Check connection
2. Check environment variables are set: Settings → Environment Variables
3. Redeploy after linking KV: `vercel --prod`

### MCP Not Responding

```bash
# Check the endpoint is working
curl -v https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Start local dev server
npm run build        # Build TypeScript
npm run typecheck    # Type check without build

# Deployment
vercel               # Deploy preview
vercel --prod        # Deploy production

# Git
git status           # Check changes
git add .            # Stage all
git commit -m "msg"  # Commit
git push             # Push to GitHub
```
