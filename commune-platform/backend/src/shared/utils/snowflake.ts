// ============================================================
// SNOWFLAKE ID GENERATOR
// Distributed unique ID generation for 100k+ concurrent users
// ============================================================

// Discord epoch (January 1, 2015)
const DISCORD_EPOCH = 1420070400000n;

// Custom epoch (can be adjusted)
const CUSTOM_EPOCH = 1609459200000n; // January 1, 2021

// Bit lengths
const TIMESTAMP_BITS = 42n;
const WORKER_ID_BITS = 5n;
const DATACENTER_ID_BITS = 5n;
const SEQUENCE_BITS = 12n;

// Maximum values
const MAX_WORKER_ID = (1n << WORKER_ID_BITS) - 1n;
const MAX_DATACENTER_ID = (1n << DATACENTER_ID_BITS) - 1n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

// Shifts
const WORKER_ID_SHIFT = SEQUENCE_BITS;
const DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
const TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS;

export interface SnowflakeConfig {
  workerId?: number;
  datacenterId?: number;
  epoch?: bigint;
}

export class Snowflake {
  private workerId: bigint;
  private datacenterId: bigint;
  private epoch: bigint;
  private sequence: bigint = 0n;
  private lastTimestamp: bigint = -1n;
  private lock: boolean = false;

  constructor(config: SnowflakeConfig = {}) {
    this.workerId = BigInt(config.workerId ?? 1) & MAX_WORKER_ID;
    this.datacenterId = BigInt(config.datacenterId ?? 1) & MAX_DATACENTER_ID;
    this.epoch = config.epoch ?? CUSTOM_EPOCH;

    if (this.workerId < 0n || this.workerId > MAX_WORKER_ID) {
      throw new Error(`Worker ID must be between 0 and ${MAX_WORKER_ID}`);
    }

    if (this.datacenterId < 0n || this.datacenterId > MAX_DATACENTER_ID) {
      throw new Error(`Datacenter ID must be between 0 and ${MAX_DATACENTER_ID}`);
    }
  }

  /**
   * Generate a new Snowflake ID
   */
  generate(): bigint {
    let timestamp = this.currentTimestamp();

    // Handle clock moving backwards
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate ID');
    }

    // Same millisecond, increment sequence
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      
      // Sequence overflow, wait for next millisecond
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      // New millisecond, reset sequence
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    // Compose the ID
    return (
      ((timestamp - this.epoch) << TIMESTAMP_SHIFT) |
      (this.datacenterId << DATACENTER_ID_SHIFT) |
      (this.workerId << WORKER_ID_SHIFT) |
      this.sequence
    );
  }

  /**
   * Generate ID as string
   */
  generateString(): string {
    return this.generate().toString();
  }

  /**
   * Get current timestamp in milliseconds
   */
  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  /**
   * Wait until next millisecond
   */
  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }

  /**
   * Deconstruct a Snowflake ID into its components
   */
  static deconstruct(snowflake: bigint | string): {
    timestamp: Date;
    workerId: number;
    datacenterId: number;
    sequence: number;
    epoch: bigint;
  } {
    const id = typeof snowflake === 'string' ? BigInt(snowflake) : snowflake;
    
    const timestamp = (id >> TIMESTAMP_SHIFT) + CUSTOM_EPOCH;
    const workerId = Number((id >> WORKER_ID_SHIFT) & MAX_WORKER_ID);
    const datacenterId = Number((id >> DATACENTER_ID_SHIFT) & MAX_DATACENTER_ID);
    const sequence = Number(id & MAX_SEQUENCE);

    return {
      timestamp: new Date(Number(timestamp)),
      workerId,
      datacenterId,
      sequence,
      epoch: CUSTOM_EPOCH,
    };
  }

  /**
   * Get timestamp from Snowflake ID
   */
  static getTimestamp(snowflake: bigint | string): Date {
    const id = typeof snowflake === 'string' ? BigInt(snowflake) : snowflake;
    const timestamp = (id >> TIMESTAMP_SHIFT) + CUSTOM_EPOCH;
    return new Date(Number(timestamp));
  }

  /**
   * Compare two Snowflake IDs (for sorting)
   */
  static compare(a: bigint | string, b: bigint | string): number {
    const idA = typeof a === 'string' ? BigInt(a) : a;
    const idB = typeof b === 'string' ? BigInt(b) : b;
    
    if (idA < idB) return -1;
    if (idA > idB) return 1;
    return 0;
  }

  /**
   * Check if ID is valid Snowflake
   */
  static isValid(snowflake: string | bigint): boolean {
    try {
      const id = typeof snowflake === 'string' ? BigInt(snowflake) : snowflake;
      return id > 0n && id < (1n << 63n);
    } catch {
      return false;
    }
  }
}

// Singleton instance for the application
export const snowflake = new Snowflake({
  workerId: parseInt(process.env.WORKER_ID || '1'),
  datacenterId: parseInt(process.env.DATACENTER_ID || '1'),
});

// Utility function for quick ID generation
export function generateId(): bigint {
  return snowflake.generate();
}

export function generateIdString(): string {
  return snowflake.generateString();
}
