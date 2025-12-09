import { kvStore } from './kv-store';

/**
 * Lock Manager Service
 * Manages resource locks to prevent concurrent modifications
 */

export interface ResourceLock {
  resource: string;
  holder_id: string;
  claimed_at: number;
  expires_at: number;
}

const LOCK_PREFIX = 'coordinator:lock:';
const DEFAULT_LOCK_DURATION = 300; // 5 minutes

export class LockManager {
  /**
   * Claim a lock on a resource
   */
  async claimLock(
    agent_id: string,
    resource: string,
    durationSeconds: number = DEFAULT_LOCK_DURATION
  ): Promise<ResourceLock> {
    const lockKey = this.getLockKey(resource);

    // Check if lock already exists
    const existingLock = await this.checkLock(resource);
    if (existingLock.is_locked && existingLock.holder_id !== agent_id) {
      throw new Error(
        `Resource ${resource} is already locked by ${existingLock.holder_id}`
      );
    }

    const now = Date.now();
    const lock: ResourceLock = {
      resource,
      holder_id: agent_id,
      claimed_at: now,
      expires_at: now + durationSeconds * 1000,
    };

    // Store lock with TTL
    await kvStore.set(lockKey, JSON.stringify(lock), durationSeconds);

    return lock;
  }

  /**
   * Release a lock on a resource
   */
  async releaseLock(agent_id: string, resource: string): Promise<void> {
    const lockKey = this.getLockKey(resource);

    // Verify the agent owns the lock
    const existingLock = await this.checkLock(resource);
    if (existingLock.is_locked && existingLock.holder_id !== agent_id) {
      throw new Error(
        `Cannot release lock: ${resource} is locked by ${existingLock.holder_id}`
      );
    }

    await kvStore.delete(lockKey);
  }

  /**
   * Check if a resource is locked
   */
  async checkLock(resource: string): Promise<{
    is_locked: boolean;
    holder_id?: string;
    expires_at?: number;
    time_remaining_seconds?: number;
  }> {
    const lockKey = this.getLockKey(resource);
    const lockStr = await kvStore.get(lockKey);

    if (!lockStr) {
      return { is_locked: false };
    }

    const lock: ResourceLock = JSON.parse(lockStr);
    const now = Date.now();

    // Check if lock has expired
    if (lock.expires_at < now) {
      await kvStore.delete(lockKey);
      return { is_locked: false };
    }

    return {
      is_locked: true,
      holder_id: lock.holder_id,
      expires_at: lock.expires_at,
      time_remaining_seconds: Math.floor((lock.expires_at - now) / 1000),
    };
  }

  /**
   * List all active locks
   */
  async listLocks(): Promise<ResourceLock[]> {
    const lockKeys = await kvStore.keys(`${LOCK_PREFIX}*`);
    const locks: ResourceLock[] = [];

    for (const key of lockKeys) {
      const lockStr = await kvStore.get(key);
      if (lockStr) {
        const lock: ResourceLock = JSON.parse(lockStr);
        const now = Date.now();

        // Only include non-expired locks
        if (lock.expires_at >= now) {
          locks.push(lock);
        }
      }
    }

    return locks;
  }

  /**
   * Force release a lock (admin function)
   */
  async forceRelease(resource: string): Promise<void> {
    const lockKey = this.getLockKey(resource);
    await kvStore.delete(lockKey);
  }

  /**
   * Get lock key for a resource
   */
  private getLockKey(resource: string): string {
    // Sanitize resource name for use as key
    const sanitized = resource.replace(/[^a-zA-Z0-9_\-./]/g, '_');
    return `${LOCK_PREFIX}${sanitized}`;
  }
}

// Export singleton instance
export const lockManager = new LockManager();
