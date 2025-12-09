import { kvStore } from './kv-store';

/**
 * Action Logger Service
 * Logs agent actions to a time-ordered list for coordination
 */

export interface AgentAction {
  agent_id: string;
  action_type: string;
  target: string;
  summary: string;
  timestamp: number;
}

const ACTION_LOG_KEY = 'coordinator:actions';
const ACTION_RETENTION_DAYS = 7;

export class ActionLogger {
  /**
   * Log an action performed by an agent
   */
  async logAction(
    agent_id: string,
    action_type: string,
    target: string,
    summary: string
  ): Promise<AgentAction> {
    const action: AgentAction = {
      agent_id,
      action_type,
      target,
      summary,
      timestamp: Date.now(),
    };

    // Store action in sorted set with timestamp as score
    const actionStr = JSON.stringify(action);
    await kvStore.zadd(ACTION_LOG_KEY, action.timestamp, actionStr);

    // Clean up old actions (older than retention period)
    const cutoffTime = Date.now() - ACTION_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    await kvStore.zremrangebyscore(ACTION_LOG_KEY, 0, cutoffTime);

    return action;
  }

  /**
   * Get actions within a time window
   */
  async getRecentActions(minutes: number = 30): Promise<AgentAction[]> {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    const now = Date.now();

    const actionStrings = await kvStore.zrangebyscore(
      ACTION_LOG_KEY,
      cutoffTime,
      now
    );

    return actionStrings.map((str) => JSON.parse(str) as AgentAction);
  }

  /**
   * Get actions for a specific agent
   */
  async getAgentActions(
    agent_id: string,
    minutes: number = 30
  ): Promise<AgentAction[]> {
    const allActions = await this.getRecentActions(minutes);
    return allActions.filter((action) => action.agent_id === agent_id);
  }

  /**
   * Get actions for a specific target (e.g., file path)
   */
  async getTargetActions(
    target: string,
    minutes: number = 30
  ): Promise<AgentAction[]> {
    const allActions = await this.getRecentActions(minutes);
    return allActions.filter((action) => action.target === target);
  }

  /**
   * Clear all action logs (for testing/debugging)
   */
  async clearActions(): Promise<void> {
    await kvStore.delete(ACTION_LOG_KEY);
  }
}

// Export singleton instance
export const actionLogger = new ActionLogger();
