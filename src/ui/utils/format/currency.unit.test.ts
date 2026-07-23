import {
  tokenPriceFormatter,
  formatNumberAbbreviated,
  formatMarketCapAbbreviated,
  formatVolumeAbbreviated,
  formatGasFee,
  formatUsd,
  getUsdValueStr,
  formatPercentage
} from './currency';

describe('currency formatting utils', () => {
  const originalLanguage = navigator.language;

  beforeAll(() => {
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true
    });
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'language', {
      value: originalLanguage,
      configurable: true
    });
  });

  describe('tokenPriceFormatter', () => {
    it('should format values >= 1 with 2 decimal places', () => {
      const result = tokenPriceFormatter(1.5);
      expect(result).toContain('1.50');
    });

    it('should format large values correctly', () => {
      const result = tokenPriceFormatter(1234.56);
      expect(result).toContain('1,234.56');
    });

    it('should handle small values with multiple leading zeros', () => {
      const result = tokenPriceFormatter(0.0001234);
      expect(result).toContain('0');
    });

    it('should handle zero value', () => {
      const result = tokenPriceFormatter(0);
      expect(result).toContain('0');
    });

    it('should use specified currency', () => {
      const result = tokenPriceFormatter(100, 'EUR');
      expect(result).toContain('100');
    });
  });

  describe('formatNumberAbbreviated', () => {
    it('should format large numbers with compact notation', () => {
      const result = formatNumberAbbreviated(1500000, true);
      expect(result).toContain('1.5');
    });

    it('should format numbers under 1M without compact notation', () => {
      const result = formatNumberAbbreviated(500000, true);
      expect(result).toContain('500');
    });

    it('should format non-currency numbers', () => {
      const result = formatNumberAbbreviated(1500000, false);
      expect(result).toContain('1.5');
    });

    it('should handle zero', () => {
      const result = formatNumberAbbreviated(0, true);
      expect(result).toContain('0');
    });
  });

  describe('formatMarketCapAbbreviated', () => {
    it('should calculate and format market cap', () => {
      const result = formatMarketCapAbbreviated(1000000, 6, 10);
      expect(result).toContain('10');
    });

    it('should use compact notation for large market caps', () => {
      const result = formatMarketCapAbbreviated(1000000000000, 6, 100);
      expect(result).toContain('100');
    });

    it('should handle decimals of 0', () => {
      const result = formatMarketCapAbbreviated(100, 0, 10);
      expect(result).toContain('1,000');
    });
  });

  describe('formatVolumeAbbreviated', () => {
    it('should format volume in USD', () => {
      const result = formatVolumeAbbreviated(12345678);
      expect(result).toContain('12');
    });

    it('should use compact notation for volumes >= 100M', () => {
      const result = formatVolumeAbbreviated(150000000);
      expect(result).toContain('150');
    });

    it('should handle zero volume', () => {
      const result = formatVolumeAbbreviated(0);
      expect(result).toContain('0');
    });
  });

  describe('formatGasFee', () => {
    it('should format gas fee with up to 8 decimals', () => {
      const result = formatGasFee('0.00012345');
      expect(result).toBe('0.00012345');
    });

    it('should handle number input', () => {
      const result = formatGasFee(0.00012345);
      expect(result).toBe('0.00012345');
    });

    it('should handle NaN string input', () => {
      const result = formatGasFee('invalid');
      expect(result).toBe('0');
    });

    it('should handle zero', () => {
      const result = formatGasFee(0);
      expect(result).toBe('0');
    });

    it('should handle large gas fee', () => {
      const result = formatGasFee(1234.5678);
      expect(result).toBe('1,234.5678');
    });
  });

  describe('formatUsd', () => {
    it('should format value as USD currency', () => {
      const result = formatUsd(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      const result = formatUsd(0);
      expect(result).toBe('$0.00');
    });

    it('should handle small values', () => {
      const result = formatUsd(0.01);
      expect(result).toBe('$0.01');
    });

    it('should handle large values', () => {
      const result = formatUsd(1000000);
      expect(result).toBe('$1,000,000.00');
    });
  });

  describe('getUsdValueStr', () => {
    it('should return formatted USD value', () => {
      const result = getUsdValueStr(10, '5');
      expect(result).toBe('$50');
    });

    it('should return < $0.01 for small positive values', () => {
      const result = getUsdValueStr(0.001, '1');
      expect(result).toBe('< $0.01');
    });

    it('should return dash for zero or negative values', () => {
      expect(getUsdValueStr(10, '0')).toBe('-');
      expect(getUsdValueStr(10, '-1')).toBe('-');
    });

    it('should handle decimal amounts', () => {
      const result = getUsdValueStr(100, '1.5');
      expect(result).toBe('$150');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      const result = formatPercentage(50);
      expect(result).toBe('50%');
    });

    it('should handle decimal percentages', () => {
      const result = formatPercentage(33.33);
      expect(result).toContain('33.33');
    });

    it('should handle string input', () => {
      const result = formatPercentage('25');
      expect(result).toBe('25%');
    });

    it('should handle zero', () => {
      const result = formatPercentage(0);
      expect(result).toBe('0%');
    });

    it('should handle 100 percent', () => {
      const result = formatPercentage(100);
      expect(result).toBe('100%');
    });

    it('should throw error for NaN input', () => {
      expect(() => formatPercentage('invalid')).toThrow('Invalid value provided to formatPercentage');
    });

    it('should throw error for NaN number input', () => {
      expect(() => formatPercentage(NaN)).toThrow('Invalid value provided to formatPercentage');
    });
  });
});
