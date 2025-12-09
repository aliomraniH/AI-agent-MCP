import { kvStore } from './kv-store';

/**
 * State Manager Service
 * Manages shared state between agents
 */

const STATE_PREFIX = 'coordinator:state:';

export class StateManager {
  /**
   * Set a state value
   */
  async setState(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<void> {
    const stateKey = this.getStateKey(key);
    await kvStore.set(stateKey, value, ttlSeconds);
  }

  /**
   * Get a state value
   */
  async getState(key: string): Promise<string | null> {
    const stateKey = this.getStateKey(key);
    return await kvStore.get(stateKey);
  }

  /**
   * Delete a state value
   */
  async deleteState(key: string): Promise<void> {
    const stateKey = this.getStateKey(key);
    await kvStore.delete(stateKey);
  }

  /**
   * Check if a state key exists
   */
  async hasState(key: string): Promise<boolean> {
    const stateKey = this.getStateKey(key);
    return await kvStore.exists(stateKey);
  }

  /**
   * List all state keys
   */
  async listStateKeys(): Promise<string[]> {
    const stateKeys = await kvStore.keys(`${STATE_PREFIX}*`);
    // Remove prefix from keys
    return stateKeys.map((key) => key.replace(STATE_PREFIX, ''));
  }

  /**
   * Get TTL of a state key
   */
  async getStateTTL(key: string): Promise<number> {
    const stateKey = this.getStateKey(key);
    return await kvStore.ttl(stateKey);
  }

  /**
   * Get state key with prefix
   */
  private getStateKey(key: string): string {
    return `${STATE_PREFIX}${key}`;
  }
}

// Export singleton instance
export const stateManager = new StateManager();
