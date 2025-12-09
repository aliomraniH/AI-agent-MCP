# Agent Coordinator MCP Server

A Model Context Protocol (MCP) server for coordinating multiple AI agents working on the same codebase or project. Prevents conflicts and enables collaboration through action logging, resource locking, and state synchronization.

## Features

### 🎯 Action Logging
Track what each agent is doing in real-time:
- Log agent actions with timestamps
- Query recent activity context
- Prevent duplicate work

### 🔒 Resource Locking
Coordinate access to shared resources:
- Claim locks on files, directories, or arbitrary resources
- Automatic lock expiration (5 minutes default)
- Check lock status before making changes

### 🔄 State Synchronization
Share state between agents:
- Set and get shared state variables
- Time-to-live (TTL) support
- List all active state keys

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Local Development

```bash
npm run dev
```

Server runs on http://localhost:3000

### Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

```bash
vercel --prod
```

## MCP Tools

### coordinator_log_action
Log an action being performed by an agent.

**Arguments:**
- `agent_id` (string): Identifier for the agent
- `action_type` (string): Type of action (e.g., "edit", "create", "delete")
- `target` (string): Target resource (e.g., file path)
- `summary` (string): Brief description

**Example:**
```json
{
  "agent_id": "claude-code",
  "action_type": "edit",
  "target": "src/index.ts",
  "summary": "Added error handling"
}
```

### coordinator_get_context
Get recent actions from all agents to understand current state.

**Arguments:**
- `minutes` (number, optional): Look back period in minutes (default: 30)

**Returns:** Array of recent actions with timestamps

### coordinator_claim_lock
Claim exclusive access to a resource.

**Arguments:**
- `agent_id` (string): Agent claiming the lock
- `resource` (string): Resource identifier
- `duration_seconds` (number, optional): Lock duration (default: 300)

**Returns:** Success status and lock expiration time

### coordinator_release_lock
Release a previously claimed lock.

**Arguments:**
- `agent_id` (string): Agent releasing the lock
- `resource` (string): Resource identifier

### coordinator_check_lock
Check if a resource is locked.

**Arguments:**
- `resource` (string): Resource identifier

**Returns:** Lock status and holder information

### coordinator_set_state
Store shared state accessible to all agents.

**Arguments:**
- `key` (string): State key
- `value` (string): State value (JSON stringified)
- `ttl_seconds` (number, optional): Time to live

### coordinator_get_state
Retrieve shared state.

**Arguments:**
- `key` (string): State key

### coordinator_list_state
List all active state keys.

**Returns:** Array of state keys

## Architecture

```
┌─────────────────┐
│  Claude Code    │
│    (Agent 1)    │
└────────┬────────┘
         │
         │ HTTP/MCP
         ▼
┌─────────────────────┐      ┌──────────────┐
│  MCP Server         │◄────►│  Vercel KV   │
│  (Coordinator)      │      │  (Storage)   │
└─────────────────────┘      └──────────────┘
         ▲
         │ HTTP/MCP
         │
┌────────┴────────┐
│  Replit Agent   │
│    (Agent 2)    │
└─────────────────┘
```

## Use Cases

### 1. Prevent Edit Conflicts
```javascript
// Agent checks lock before editing
const lock = await checkLock('src/index.ts');
if (lock.is_locked) {
  console.log(`File locked by ${lock.holder_id}`);
  return;
}

// Claim lock
await claimLock('claude-code', 'src/index.ts');

// Make edits...

// Release lock
await releaseLock('claude-code', 'src/index.ts');
```

### 2. Coordinate Deployments
```javascript
// Log deployment start
await logAction('claude-code', 'deploy_start', 'production', 'Starting deployment');

// Get context to see if another agent is deploying
const context = await getContext(5);
const otherDeployments = context.filter(
  a => a.action_type.includes('deploy') && a.agent_id !== 'claude-code'
);

if (otherDeployments.length > 0) {
  console.log('Another deployment in progress, waiting...');
}
```

### 3. Share Build State
```javascript
// Agent 1: Store build status
await setState('last_build_status', JSON.stringify({
  success: true,
  timestamp: Date.now(),
  commit: 'abc123'
}));

// Agent 2: Check build status
const status = await getState('last_build_status');
console.log('Last build:', JSON.parse(status));
```

## Environment Variables

Automatically set by Vercel when KV is linked:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## API Endpoints

- `GET /health` - Health check
- `POST /api/mcp` - MCP protocol endpoint

## Storage Backend

Uses Vercel KV (Redis-compatible) for:
- Action logs (sorted sets by timestamp)
- Resource locks (with expiration)
- Shared state (key-value pairs)

## License

MIT
