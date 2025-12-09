import { kv } from '@vercel/kv';

/**
 * KV Store Service
 * Wrapper around Vercel KV for type safety and consistent error handling
 */

export class KVStore {
  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await kv.setex(key, ttlSeconds, value);
      } else {
        await kv.set(key, value);
      }
    } catch (error) {
      console.error(`KV set error for key ${key}:`, error);
      throw new Error(`Failed to set key: ${key}`);
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await kv.get<string>(key);
      return value;
    } catch (error) {
      console.error(`KV get error for key ${key}:`, error);
      throw new Error(`Failed to get key: ${key}`);
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.error(`KV delete error for key ${key}:`, error);
      throw new Error(`Failed to delete key: ${key}`);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await kv.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`KV exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await kv.keys(pattern);
      return keys;
    } catch (error) {
      console.error(`KV keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Add member to sorted set with score
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    try {
      await kv.zadd(key, { score, member });
    } catch (error) {
      console.error(`KV zadd error for key ${key}:`, error);
      throw new Error(`Failed to add to sorted set: ${key}`);
    }
  }

  /**
   * Get members from sorted set by score range
   */
  async zrangebyscore(
    key: string,
    min: number,
    max: number
  ): Promise<string[]> {
    try {
      // Vercel KV uses zrange with BYSCORE option
      const members = await kv.zrange(key, min, max, { byScore: true });
      return members as string[];
    } catch (error) {
      console.error(`KV zrangebyscore error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Remove members from sorted set by score range
   */
  async zremrangebyscore(key: string, min: number, max: number): Promise<void> {
    try {
      await kv.zremrangebyscore(key, min, max);
    } catch (error) {
      console.error(`KV zremrangebyscore error for key ${key}:`, error);
      throw new Error(`Failed to remove from sorted set: ${key}`);
    }
  }

  /**
   * Get TTL of a key in seconds
   */
  async ttl(key: string): Promise<number> {
    try {
      const ttl = await kv.ttl(key);
      return ttl;
    } catch (error) {
      console.error(`KV ttl error for key ${key}:`, error);
      return -1;
    }
  }
}

// Export singleton instance
export const kvStore = new KVStore();
