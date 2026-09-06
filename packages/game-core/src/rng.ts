/**
 * packages/game-core/src/rng.ts
 *
 * Seeded random number generator (Mersenne Twister MT19937)
 *
 * Provides deterministic randomness for:
 * - Combat dice rolls
 * - Board generation
 * - Any other game randomness
 *
 * Same seed always produces same sequence of random numbers.
 */

/**
 * Mersenne Twister MT19937 implementation
 *
 * This is a deterministic PRNG that produces the same sequence of numbers
 * when seeded with the same value. Essential for replay capability and
 * future server-side validation.
 */
export interface RNGState {
  readonly values: readonly number[];
  readonly index: number;
}

export class SeededRNG {
  private N = 624;
  private M = 397;
  private MATRIX_A = 0x9908b0df;
  private UPPER_MASK = 0x80000000;
  private LOWER_MASK = 0x7fffffff;

  private mt: number[] = [];
  private mti: number = this.N + 1;

  constructor(seed: number) {
    if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be a safe integer');
    this.initGenRand(seed);
  }

  public getState(): RNGState {
    return { values: this.mt.map(value => value >>> 0), index: this.mti };
  }

  public static fromState(state: RNGState): SeededRNG {
    if (state.values.length !== 624 || !Number.isInteger(state.index) || state.index < 0 || state.index > 624 ||
        state.values.some(value => !Number.isInteger(value) || value < 0 || value > 0xffffffff)) {
      throw new RangeError('Invalid RNG state');
    }
    const rng = new SeededRNG(0);
    rng.mt = [...state.values];
    rng.mti = state.index;
    return rng;
  }

  private initGenRand(s: number): void {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < this.N; this.mti++) {
      const prev = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
      this.mt[this.mti] = (((((prev & 0xffff0000) >>> 16) * 1812433253) << 16) +
        (prev & 0x0000ffff) * 1812433253) + this.mti;
      this.mt[this.mti] >>>= 0;
    }
  }

  private genrandInt32(): number {
    let y: number;
    const mag01 = [0, this.MATRIX_A];

    if (this.mti >= this.N) {
      if (this.mti === this.N + 1) {
        this.initGenRand(5489);
      }

      let kk = 0;
      for (; kk < this.N - this.M; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 1];
      }

      for (; kk < this.N - 1; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 1];
      }

      y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
      this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 1];

      this.mti = 0;
    }

    y = this.mt[this.mti++];

    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    return y >>> 0;
  }

  /**
   * Generate a random integer in [0, max)
   *
   * @param max - Upper bound (exclusive)
   * @returns Random integer [0, max)
   */
  public nextInt(max: number): number {
    if (!Number.isSafeInteger(max) || max <= 0 || max > 0x100000000) {
      throw new Error('Max must be positive');
    }
    return this.genrandInt32() % max;
  }

  /**
   * Generate a random float in [0, 1)
   *
   * @returns Random float [0, 1)
   */
  public nextFloat(): number {
    return this.genrandInt32() * (1.0 / 4294967296.0);
  }

  /**
   * Roll a d6 (1-6)
   *
   * @returns Random integer [1, 6]
   */
  public d6(): number {
    return this.nextInt(6) + 1;
  }

  /**
   * Roll multiple d6 dice
   *
   * @param count - Number of dice to roll
   * @returns Array of roll results [1-6 for each]
   */
  public rollDice(count: number): number[] {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Invalid dice count');
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.d6());
    }
    return results;
  }
}

/**
 * Create a new seeded RNG
 *
 * @param seed - Seed value (determines all future random numbers)
 * @returns SeededRNG instance
 *
 * @example
 * const rng = createRNG(42);
 * const roll1 = rng.d6();  // Always same value when seeded with 42
 * const roll2 = rng.d6();  // Next value in deterministic sequence
 */
export function createRNG(seed: number): SeededRNG {
  return new SeededRNG(seed);
}
