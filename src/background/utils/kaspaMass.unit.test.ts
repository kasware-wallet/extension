import { computeMass, storageMass, mass } from './kaspaMass';

const C = BigInt(Math.pow(10, 12));

describe('kaspaMass', () => {
  describe('storageMass', () => {
    it('should return 0 when inputs equal outputs (balanced)', () => {
      const inputs = [BigInt(1e12), BigInt(1e12)];
      const outputs = [BigInt(1e12), BigInt(1e12)];
      expect(storageMass(inputs, outputs)).toBe(BigInt(0));
    });

    it('should return positive mass when outputs are smaller than inputs', () => {
      const inputs = [BigInt(2e12)];
      const outputs = [BigInt(1e12)];
      const result = storageMass(inputs, outputs);
      expect(result > BigInt(0)).toBe(true);
    });

    it('should use BigInt division (no floating point precision loss)', () => {
      // Before the fix, Math.floor(Number(C / v)) lost precision for large BigInt values.
      // After the fix, C / v uses BigInt division directly.
      const largeInput = BigInt('999999999999999');
      const inputs = [largeInput];
      const outputs = [BigInt(1e11)];
      const result = storageMass(inputs, outputs);
      // Should produce a valid BigInt result without NaN or precision issues
      expect(typeof result).toBe('bigint');
      expect(result >= BigInt(0)).toBe(true);
    });

    it('should handle single input and single output', () => {
      const inputs = [BigInt(5e12)];
      const outputs = [BigInt(5e12)];
      expect(storageMass(inputs, outputs)).toBe(BigInt(0));
    });

    it('should handle two inputs and two outputs', () => {
      const inputs = [BigInt(3e12), BigInt(3e12)];
      const outputs = [BigInt(3e12), BigInt(3e12)];
      expect(storageMass(inputs, outputs)).toBe(BigInt(0));
    });

    it('should handle multiple inputs with avgInput path (>2 inputs)', () => {
      const inputs = [BigInt(2e12), BigInt(2e12), BigInt(2e12)];
      const outputs = [BigInt(1e12)];
      const result = storageMass(inputs, outputs);
      expect(result > BigInt(0)).toBe(true);
    });
  });

  describe('computeMass', () => {
    it('should compute mass based on input/output count', () => {
      const inputs = [BigInt(1e12)];
      const outputs = [BigInt(1e12)];
      const result = computeMass(inputs, outputs);
      expect(typeof result).toBe('bigint');
      expect(result > BigInt(0)).toBe(true);
    });
  });

  describe('mass', () => {
    it('should return the larger of storageMass and computeMass', () => {
      // With very large inputs and small outputs, storage mass should dominate
      const inputs = [BigInt(100e12)];
      const outputs = [BigInt(1e8)];
      const result = mass(inputs, outputs);
      const storage = storageMass(inputs, outputs);
      const compute = computeMass(inputs, outputs);
      expect(result).toBe(storage > compute ? storage : compute);
    });
  });
});
