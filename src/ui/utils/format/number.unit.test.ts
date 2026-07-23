import BigNumber from 'bignumber.js';
import {
  formatLocaleString,
  formatCompactNumber,
  formatNumberWithDecimal,
  formatTokenBalance,
  getMarketCap,
  formatAndValidateAmount
} from './number';

describe('number formatting utils', () => {
  describe('formatLocaleString', () => {
    it('should format integer with thousand separators', () => {
      const result = formatLocaleString(1234567);
      expect(result).toBe('1,234,567');
    });

    it('should format decimal number', () => {
      const result = formatLocaleString(1234.567);
      expect(result).toBe('1,234.567');
    });

    it('should handle zero', () => {
      const result = formatLocaleString(0);
      expect(result).toBe('0');
    });

    it('should handle negative number', () => {
      const result = formatLocaleString(-1234567);
      expect(result).toBe('-1,234,567');
    });

    it('should handle string input', () => {
      const result = formatLocaleString('1234567');
      expect(result).toBe('1,234,567');
    });

    it('should handle BigNumber input', () => {
      const result = formatLocaleString(new BigNumber(1234567));
      expect(result).toBe('1,234,567');
    });

    it('should handle very large number', () => {
      const result = formatLocaleString('123456789012345678901234567890');
      // BigNumber uses scientific notation for very large numbers
      expect(result).toContain('e+');
    });

    it('should handle small decimal', () => {
      const result = formatLocaleString(0.000123);
      expect(result).toBe('0.000123');
    });
  });

  describe('formatCompactNumber', () => {
    it('should return number unchanged if less than 1000', () => {
      expect(formatCompactNumber(999)).toBe(999);
      expect(formatCompactNumber(0)).toBe(0);
      expect(formatCompactNumber(500)).toBe(500);
    });

    it('should format thousands with K suffix', () => {
      expect(formatCompactNumber(1000)).toBe('1K');
      expect(formatCompactNumber(1500)).toBe('1.5K');
      // 999999 is still in thousands range, so it shows as 1000K
      expect(formatCompactNumber(999999)).toBe('1000K');
    });

    it('should format millions with M suffix', () => {
      expect(formatCompactNumber(1000000)).toBe('1M');
      expect(formatCompactNumber(2500000)).toBe('2.5M');
      // 999999999 is still in millions range, so it shows as 1000M
      expect(formatCompactNumber(999999999)).toBe('1000M');
    });

    it('should format billions with B suffix', () => {
      expect(formatCompactNumber(1000000000)).toBe('1B');
      expect(formatCompactNumber(3500000000)).toBe('3.5B');
      // 999999999999 is still in billions range, so it shows as 1000B
      expect(formatCompactNumber(999999999999)).toBe('1000B');
    });

    it('should format trillions with T suffix', () => {
      expect(formatCompactNumber(1000000000000)).toBe('1T');
      expect(formatCompactNumber(5500000000000)).toBe('5.5T');
    });

    it('should handle very large numbers with T suffix', () => {
      const result = formatCompactNumber(1000000000000000);
      expect(result).toBe('1000T');
    });

    it('should handle negative numbers', () => {
      expect(formatCompactNumber(-500)).toBe('-500');
      expect(formatCompactNumber(-1500)).toBe('-1.5K');
      expect(formatCompactNumber(-2500000)).toBe('-2.5M');
    });

    it('should remove trailing .0', () => {
      expect(formatCompactNumber(1000)).toBe('1K');
      expect(formatCompactNumber(2000000)).toBe('2M');
    });
  });

  describe('formatNumberWithDecimal', () => {
    it('should divide by 10^decimals', () => {
      expect(formatNumberWithDecimal(1000000, 6)).toBe(1);
      expect(formatNumberWithDecimal(100000000, 8)).toBe(1);
    });

    it('should return balance unchanged when decimals is 0', () => {
      expect(formatNumberWithDecimal(100, 0)).toBe(100);
      expect(formatNumberWithDecimal(0, 0)).toBe(0);
    });

    it('should handle string input for balance', () => {
      expect(formatNumberWithDecimal('1000000', 6)).toBe(1);
    });

    it('should handle string input for decimals', () => {
      expect(formatNumberWithDecimal(1000000, '6')).toBe(1);
    });

    it('should throw error for negative decimals', () => {
      expect(() => formatNumberWithDecimal(100, -1)).toThrow('Invalid decimals value');
    });

    it('should throw error for NaN decimals', () => {
      expect(() => formatNumberWithDecimal(100, NaN)).toThrow('Invalid decimals value');
    });

    it('should handle decimal result correctly', () => {
      const result = formatNumberWithDecimal(1234567, 6);
      expect(result).toBeCloseTo(1.234567);
    });
  });

  describe('formatTokenBalance', () => {
    it('should format KASPA token with 0 or 2 decimal places', () => {
      expect(formatTokenBalance(100, 'KASPA', 8)).toBe(100);
      expect(formatTokenBalance(100.5, 'KASPA', 8)).toBe(100.5);
      expect(formatTokenBalance(100.12345, 'KASPA', 8)).toBe(100.12);
    });

    it('should format non-KASPA tokens with decimals', () => {
      expect(formatTokenBalance(1000000, 'TOKEN', 6)).toBe(1);
    });

    it('should handle zero balance', () => {
      expect(formatTokenBalance(0, 'KASPA', 8)).toBe(0);
      expect(formatTokenBalance(0, 'TOKEN', 6)).toBe(0);
    });
  });

  describe('getMarketCap', () => {
    it('should calculate market cap correctly', () => {
      const result = getMarketCap(1000000, 6, 10);
      expect(result).toBe(10);
    });

    it('should handle decimals of 0', () => {
      const result = getMarketCap(100, 0, 10);
      expect(result).toBe(1000);
    });

    it('should handle zero floor price', () => {
      const result = getMarketCap(1000000, 6, 0);
      expect(result).toBe(0);
    });
  });

  describe('formatAndValidateAmount', () => {
    it('should return null when decimal places exceed max', () => {
      const result = formatAndValidateAmount('1.234567', 5);
      expect(result).toBeNull();
    });

    it('should return value when within decimal limit', () => {
      const result = formatAndValidateAmount('1.23', 5);
      expect(result).toBe('1.23');
    });

    it('should add leading zero for values starting with decimal point', () => {
      const result = formatAndValidateAmount('.5', 5);
      expect(result).toBe('0.5');
    });

    it('should handle integer values', () => {
      const result = formatAndValidateAmount('100', 5);
      expect(result).toBe('100');
    });

    it('should handle empty string', () => {
      const result = formatAndValidateAmount('', 5);
      expect(result).toBe('');
    });

    it('should handle value with exact max decimals', () => {
      const result = formatAndValidateAmount('1.12345', 5);
      expect(result).toBe('1.12345');
    });

    it('should handle value with zero decimal places', () => {
      const result = formatAndValidateAmount('1', 0);
      expect(result).toBe('1');
    });

    it('should reject value with decimals when maxDecimals is 0', () => {
      const result = formatAndValidateAmount('1.1', 0);
      expect(result).toBeNull();
    });
  });
});
