import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { actionLogger } from './services/action-logger';
import { lockManager } from './services/lock-manager';
import { stateManager } from './services/state-manager';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MCP Server instance
const mcpServer = new Server(
  {
    name: 'agent-coordinator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'coordinator_log_action',
    description:
      'Log an action being performed by an agent for coordination purposes',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Unique identifier for the agent',
        },
        action_type: {
          type: 'string',
          description: 'Type of action (e.g., "edit", "create", "delete")',
        },
        target: {
          type: 'string',
          description: 'Target resource (e.g., file path)',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of the action',
        },
      },
      required: ['agent_id', 'action_type', 'target', 'summary'],
    },
  },
  {
    name: 'coordinator_get_context',
    description:
      'Get recent actions from all agents to understand current coordination state',
    inputSchema: {
      type: 'object',
      properties: {
        minutes: {
          type: 'number',
          description: 'How many minutes of history to retrieve (default: 30)',
          default: 30,
        },
      },
    },
  },
  {
    name: 'coordinator_claim_lock',
    description: 'Claim exclusive access to a resource',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Agent claiming the lock',
        },
        resource: {
          type: 'string',
          description: 'Resource identifier (e.g., file path)',
        },
        duration_seconds: {
          type: 'number',
          description: 'Lock duration in seconds (default: 300)',
          default: 300,
        },
      },
      required: ['agent_id', 'resource'],
    },
  },
  {
    name: 'coordinator_release_lock',
    description: 'Release a previously claimed lock',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Agent releasing the lock',
        },
        resource: {
          type: 'string',
          description: 'Resource identifier',
        },
      },
      required: ['agent_id', 'resource'],
    },
  },
  {
    name: 'coordinator_check_lock',
    description: 'Check if a resource is currently locked',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: 'Resource identifier to check',
        },
      },
      required: ['resource'],
    },
  },
  {
    name: 'coordinator_set_state',
    description: 'Store shared state accessible to all agents',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'State key',
        },
        value: {
          type: 'string',
          description: 'State value (should be JSON stringified for complex data)',
        },
        ttl_seconds: {
          type: 'number',
          description: 'Time to live in seconds (optional)',
        },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'coordinator_get_state',
    description: 'Retrieve shared state by key',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'State key to retrieve',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'coordinator_list_state',
    description: 'List all active state keys',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Register tool handlers
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'coordinator_log_action': {
        const { agent_id, action_type, target, summary } = args as {
          agent_id: string;
          action_type: string;
          target: string;
          summary: string;
        };
        const action = await actionLogger.logAction(
          agent_id,
          action_type,
          target,
          summary
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  action,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_get_context': {
        const { minutes = 30 } = args as { minutes?: number };
        const actions = await actionLogger.getRecentActions(minutes);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  actions,
                  count: actions.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_claim_lock': {
        const { agent_id, resource, duration_seconds = 300 } = args as {
          agent_id: string;
          resource: string;
          duration_seconds?: number;
        };
        const lock = await lockManager.claimLock(
          agent_id,
          resource,
          duration_seconds
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  lock,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_release_lock': {
        const { agent_id, resource } = args as {
          agent_id: string;
          resource: string;
        };
        await lockManager.releaseLock(agent_id, resource);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Lock released for resource: ${resource}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_check_lock': {
        const { resource } = args as { resource: string };
        const lockStatus = await lockManager.checkLock(resource);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  ...lockStatus,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_set_state': {
        const { key, value, ttl_seconds } = args as {
          key: string;
          value: string;
          ttl_seconds?: number;
        };
        await stateManager.setState(key, value, ttl_seconds);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `State set for key: ${key}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_get_state': {
        const { key } = args as { key: string };
        const value = await stateManager.getState(key);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  key,
                  value,
                  exists: value !== null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'coordinator_list_state': {
        const keys = await stateManager.listStateKeys();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  keys,
                  count: keys.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// HTTP endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'agent-coordinator-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// MCP over HTTP endpoint
app.post('/api/mcp', async (req: Request, res: Response) => {
  try {
    const request = req.body;

    // Handle different MCP methods
    if (request.method === 'tools/list') {
      const response = await mcpServer.request(
        { method: 'tools/list', params: {} },
        ListToolsRequestSchema
      );
      res.json({
        jsonrpc: '2.0',
        id: request.id,
        result: response,
      });
    } else if (request.method === 'tools/call') {
      const response = await mcpServer.request(
        {
          method: 'tools/call',
          params: request.params,
        },
        CallToolRequestSchema
      );
      res.json({
        jsonrpc: '2.0',
        id: request.id,
        result: response,
      });
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`,
        },
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: errorMessage,
      },
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Agent Coordinator MCP server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/api/mcp`);
  });
}

// Export for Vercel serverless
export default app;
