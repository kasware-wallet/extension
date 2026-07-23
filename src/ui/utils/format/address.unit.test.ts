import { truncateAddress, truncateWord, shortAddress, ellipsisOverflowedText, hex2Text, shortDesc } from './address';

describe('address formatting utils', () => {
  describe('truncateAddress', () => {
    it('should truncate long address correctly', () => {
      const address = 'kaspa:qpm2qspnhq0wdq8s9xq0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5';
      const result = truncateAddress(address);
      // Takes first 10 chars and last 6 chars
      expect(result).toBe('kaspa:qpm2.....q5q0q5');
    });

    it('should handle short address', () => {
      const address = 'short';
      const result = truncateAddress(address);
      // Takes first 10 chars (only 5 available) and last 6 chars (only 5 available)
      expect(result).toBe('short.....short');
    });

    it('should handle empty string', () => {
      const result = truncateAddress('');
      expect(result).toBe('.....');
    });

    it('should handle exact boundary length (16 chars)', () => {
      const address = '1234567890123456';
      const result = truncateAddress(address);
      // First 10: 1234567890, Last 6: 123456
      expect(result).toBe('1234567890.....123456');
    });
  });

  describe('truncateWord', () => {
    it('should not truncate words shorter than 20 characters', () => {
      const result = truncateWord('shortword');
      expect(result).toBe('shortword');
    });

    it('should truncate words longer than 20 characters', () => {
      const longWord = 'thisisaverylongwordthatneedstruncation';
      const result = truncateWord(longWord);
      expect(result).toBe('thisisaverylongwordt...');
    });

    it('should handle exactly 20 characters', () => {
      const word = '12345678901234567890';
      const result = truncateWord(word);
      expect(result).toBe('12345678901234567890');
    });

    it('should handle empty string', () => {
      const result = truncateWord('');
      expect(result).toBe('');
    });

    it('should handle 21 characters', () => {
      const word = '123456789012345678901';
      const result = truncateWord(word);
      expect(result).toBe('12345678901234567890...');
    });
  });

  describe('shortAddress', () => {
    it('should return empty string for undefined input', () => {
      expect(shortAddress(undefined)).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(shortAddress(null as unknown as string)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(shortAddress('')).toBe('');
    });

    describe('kaspa addresses', () => {
      it('should format kaspa mainnet address', () => {
        const address = 'kaspa:qpm2qspnhq0wdq8s9xq0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5';
        const result = shortAddress(address, 6);
        expect(result).toBe('kaspa:qpm2qs...q5q0q5');
      });

      it('should format kaspa testnet address', () => {
        const address = 'kaspatest:qpm2qspnhq0wdq8s9xq0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5';
        const result = shortAddress(address, 6);
        expect(result).toBe('kaspatest:qpm2qs...q5q0q5');
      });

      it('should respect custom length parameter', () => {
        const address = 'kaspa:qpm2qspnhq0wdq8s9xq0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5q0q5';
        const result = shortAddress(address, 8);
        expect(result).toBe('kaspa:qpm2qspn...q0q5q0q5');
      });
    });

    describe('non-kaspa addresses', () => {
      it('should format EVM address', () => {
        const address = '0x1234567890abcdef1234567890abcdef12345678';
        const result = shortAddress(address, 6);
        // Takes len+2=8 chars from start, len=6 from end
        expect(result).toBe('0x123456...345678');
      });

      it('should return address unchanged if shorter than len*2', () => {
        const address = 'short';
        const result = shortAddress(address, 6);
        expect(result).toBe('short');
      });

      it('should handle exact boundary length', () => {
        const address = '12345678901234'; // 14 chars = len*2 with len=7
        const result = shortAddress(address, 7);
        expect(result).toBe('12345678901234');
      });

      it('should truncate address longer than len*2', () => {
        const address = '123456789012345'; // 15 chars > len*2 with len=7
        const result = shortAddress(address, 7);
        expect(result).toBe('123456789...9012345');
      });
    });
  });

  describe('ellipsisOverflowedText', () => {
    it('should return original string if shorter than length', () => {
      const result = ellipsisOverflowedText('short', 10);
      expect(result).toBe('short');
    });

    it('should return original string if equal to length', () => {
      const result = ellipsisOverflowedText('exact', 5);
      expect(result).toBe('exact');
    });

    it('should truncate string longer than length', () => {
      const result = ellipsisOverflowedText('verylongstring', 5);
      expect(result).toBe('veryl...');
    });

    it('should remove trailing comma when removeLastComma is true', () => {
      // 'hello,' is 6 chars, truncated to 5 chars 'hello', no comma at end to remove
      const result = ellipsisOverflowedText('hello,', 5, true);
      expect(result).toBe('hello...');
    });

    it('should remove comma when truncated string ends with comma', () => {
      // With length 2, 'a,' is 2 chars, but 'a,b' is 3 chars > 2, so truncated to 'a,'
      // which ends with comma, so it becomes 'a...'
      const result = ellipsisOverflowedText('a,bcdef', 2, true);
      expect(result).toBe('a...');
    });

    it('should not remove trailing comma when removeLastComma is false', () => {
      const result = ellipsisOverflowedText('hello,', 5, false);
      expect(result).toBe('hello...');
    });

    it('should handle empty string', () => {
      const result = ellipsisOverflowedText('', 5);
      expect(result).toBe('');
    });

    it('should use default length of 5', () => {
      const result = ellipsisOverflowedText('abcdefghijk');
      expect(result).toBe('abcde...');
    });
  });

  describe('hex2Text', () => {
    it('should convert hex string to text', () => {
      const hex = '0x48656c6c6f20576f726c64'; // "Hello World"
      const result = hex2Text(hex);
      expect(result).toBe('Hello World');
    });

    it('should return original string if not starting with 0x', () => {
      const text = 'Hello World';
      const result = hex2Text(text);
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const result = hex2Text('');
      expect(result).toBe('');
    });

    it('should handle invalid hex gracefully', () => {
      const invalidHex = '0xGGGG';
      const result = hex2Text(invalidHex);
      // Function strips 0x prefix and returns remaining string on decode error
      expect(result).toBe('GGGG');
    });

    it('should handle special characters', () => {
      // 0x2f = '/', 0x5c = '\', 0x6e = 'n' -> '/\n' as text (literal backslash-n)
      const hex = '0x2f5c6e';
      const result = hex2Text(hex);
      expect(result).toBe('/\\n');
    });
  });

  describe('shortDesc', () => {
    it('should return empty string for undefined input', () => {
      expect(shortDesc(undefined)).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(shortDesc(null as unknown as string)).toBe('');
    });

    it('should return original description if shorter than limit', () => {
      const desc = 'Short description';
      const result = shortDesc(desc, 50);
      expect(result).toBe(desc);
    });

    it('should truncate description longer than limit', () => {
      const desc = 'This is a very long description that needs to be truncated';
      const result = shortDesc(desc, 20);
      expect(result).toBe('This is a very long ...');
    });

    it('should use default length of 50', () => {
      const desc = 'a'.repeat(60);
      const result = shortDesc(desc);
      expect(result.length).toBe(53); // 50 chars + '...'
    });

    it('should handle exact boundary length', () => {
      const desc = 'a'.repeat(50);
      const result = shortDesc(desc, 50);
      expect(result).toBe(desc);
    });

    it('should handle one character over boundary', () => {
      const desc = 'a'.repeat(51);
      const result = shortDesc(desc, 50);
      expect(result).toBe('a'.repeat(50) + '...');
    });
  });
});
