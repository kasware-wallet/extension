import { Buffer } from 'buffer';
import { buildIgraEntryPayload, decodeIgraEntryPayload } from './helper';

describe('entry payload encode/decode', () => {
  const l2AddressHex = '0xf0719ecd7e66dd1f5b1097c330a7a992d26be0d9';
  const amount = BigInt('38000000000');
  const amountStr = '38000000000';
  const nonce = 3574308205;

  describe('buildIgraEntryPayload', () => {
    it('should produce a 33-byte buffer', () => {
      const buf = buildIgraEntryPayload({ l2AddressHex, amount, nonce });
      expect(buf.length).toBe(33);
    });

    it('should encode prefix as 0x92', () => {
      const buf = buildIgraEntryPayload({ l2AddressHex, amount, nonce });
      expect(buf.readUInt8(0)).toBe(0x92);
    });

    it('should match known hex output', () => {
      const buf = buildIgraEntryPayload({ l2AddressHex, amount, nonce });
      expect(buf.toString('hex')).toBe('92f0719ecd7e66dd1f5b1097c330a7a992d26be0d900fcf9d808000000d50b9d6d');
    });
  });

  describe('decodeIgraEntryPayload', () => {
    const hexPayload = '92f0719ecd7e66dd1f5b1097c330a7a992d26be0d900fcf9d808000000d50b9d6d';

    it('should decode from hex string', () => {
      const result = decodeIgraEntryPayload(hexPayload);
      expect(result.prefix).toBe(0x92);
      expect(result.l2AddressHex).toBe(l2AddressHex);
      expect(result.amount).toBe(amountStr);
      expect(result.nonce).toBe(nonce);
    });

    it('should decode from Buffer', () => {
      const buf = Buffer.from(hexPayload, 'hex');
      const result = decodeIgraEntryPayload(buf);
      expect(result.prefix).toBe(0x92);
      expect(result.l2AddressHex).toBe(l2AddressHex);
      expect(result.amount).toBe(amountStr);
      expect(result.nonce).toBe(nonce);
    });

    it('should strip 0x prefix from hex string input', () => {
      const result = decodeIgraEntryPayload('0x' + hexPayload);
      expect(result.prefix).toBe(0x92);
      expect(result.l2AddressHex).toBe(l2AddressHex);
    });

    it('should throw on invalid payload length', () => {
      expect(() => decodeIgraEntryPayload('92f071')).toThrow('entry payload must be 33 bytes');
      expect(() => decodeIgraEntryPayload(Buffer.alloc(32))).toThrow('entry payload must be 33 bytes');
      expect(() => decodeIgraEntryPayload(Buffer.alloc(34))).toThrow('entry payload must be 33 bytes');
    });

    it('should throw on valid-length payload with wrong prefix byte', () => {
      const wrongPrefix = Buffer.alloc(33);
      wrongPrefix.writeUInt8(0x6b, 0); // KASPLEX prefix, not IGRA
      expect(() => decodeIgraEntryPayload(wrongPrefix)).toThrow('invalid IGRA entry prefix');
    });
  });

  describe('round-trip', () => {
    it('encode -> decode should return original values', () => {
      const buf = buildIgraEntryPayload({ l2AddressHex, amount, nonce });
      const result = decodeIgraEntryPayload(buf);
      expect(result.prefix).toBe(0x92);
      expect(result.l2AddressHex).toBe(l2AddressHex);
      expect(result.amount).toBe(amountStr);
      expect(result.nonce).toBe(nonce);
    });

    it('decode -> encode should reproduce original hex', () => {
      const hexPayload = '92f0719ecd7e66dd1f5b1097c330a7a992d26be0d900fcf9d808000000d50b9d6d';
      const decoded = decodeIgraEntryPayload(hexPayload);
      const reencoded = buildIgraEntryPayload({
        l2AddressHex: decoded.l2AddressHex,
        amount: BigInt(decoded.amount),
        nonce: decoded.nonce
      });
      expect(reencoded.toString('hex')).toBe(hexPayload);
    });
  });
});
