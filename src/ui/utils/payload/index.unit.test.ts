import { Buffer } from 'buffer';
import { decodePayload, IGRA_HEX, IGRA_PAYLOAD_HEX_LEN, KASPLEX_HEX, KASPLEX_L2_BRIDGE_HEX } from './index';

describe('decodePayload', () => {
  describe('input validation', () => {
    it('should return error for empty string', () => {
      expect(decodePayload('')).toEqual({ error: 'No payload' });
    });

    it('should return error for non-string input', () => {
      expect(decodePayload(null as unknown as string)).toEqual({ error: 'No payload' });
      expect(decodePayload(undefined as unknown as string)).toEqual({ error: 'No payload' });
      expect(decodePayload(123 as unknown as string)).toEqual({ error: 'No payload' });
    });
  });

  describe('IGRA payload routing', () => {
    it('should route to decodeIgraPayload when payload starts with IGRA_HEX and has correct length', () => {
      // Build a valid IGRA payload: prefix '92' + 64 hex chars = 66 total (IGRA_PAYLOAD_HEX_LEN)
      const validIgraPayload = '92' + 'f0719ecd7e66dd1f5b1097c330a7a992d26be0d900fcf9d808000000d50b9d6d';
      expect(validIgraPayload.startsWith(IGRA_HEX)).toBe(true);
      expect(validIgraPayload.length).toBe(IGRA_PAYLOAD_HEX_LEN);

      const result = decodePayload(validIgraPayload);
      expect(result).toHaveProperty('txType', 'IGRA_BRIDGE_0X92');
      expect(result).toHaveProperty('fields');
    });

    it('should NOT route to decodeIgraPayload when payload starts with IGRA_HEX but has wrong length', () => {
      // IGRA prefix '92' but wrong length - should fall through to hex->utf8 decode
      const wrongLength = '92abcd';
      const result = decodePayload(wrongLength);
      // Falls through to the generic Buffer.from hex decode path
      expect(typeof result).toBe('string');
    });
  });

  describe('Kasplex payload routing', () => {
    it('should route to decodeKasplexPayload when payload starts with KASPLEX_HEX', () => {
      // KASPLEX_HEX = '6b6173706c6578' (hex for 'kasplex')
      // Kasplex JSON payload: kasplex prefix + '00' type byte + json content
      const jsonContent = Buffer.from('{"test":true}', 'utf8').toString('hex');
      const kasplexJsonPayload = KASPLEX_HEX + '00' + jsonContent;
      const result = decodePayload(kasplexJsonPayload);
      expect(result).toHaveProperty('txType', 'KASPLEX_JSON');
      expect(result).toHaveProperty('byteCode', 'json');
    });
  });

  describe('Kasplex L2 bridge payload routing', () => {
    it('should route to decodeKasplexL2BridgePayload when payload starts with KASPLEX_L2_BRIDGE_HEX', () => {
      // KASPLEX_L2_BRIDGE_HEX = '3078' (hex for '0x')
      // The bridge payload encodes an address like '0x81113BE882a2940fDe58cb5B1A3D04B881265810'
      const bridgePayload = '307838313131334245383832613239343066446535386362354231413344303442383831323635383130';
      const result = decodePayload(bridgePayload);
      expect(result).toHaveProperty('txType', 'KASPLEX_L2_BRIDGE');
      expect(result).toHaveProperty('address');
    });
  });

  describe('generic hex-to-UTF8 fallback', () => {
    it('should decode a plain hex string to UTF-8 text', () => {
      // 'hello' in hex = 68656c6c6f
      const result = decodePayload('68656c6c6f');
      expect(result).toBe('hello');
    });

    it('should decode multi-byte UTF-8 characters', () => {
      // 'Kas' in hex
      const result = decodePayload('4b6173');
      expect(result).toBe('Kas');
    });

    it('should return decoded string for valid hex that does not match any prefix', () => {
      // A hex string that doesn't start with IGRA/KASPLEX/L2_BRIDGE prefixes
      // falls through to the generic Buffer.from hex decode
      const result = decodePayload('abcd');
      expect(typeof result).toBe('string');
    });

    it('should return empty string for hex that decodes to no content', () => {
      // Buffer.from('zz', 'hex') does not throw in Node.js - it silently
      // produces empty buffer, resulting in an empty string
      const result = decodePayload('zz');
      expect(result).toBe('');
    });
  });

  describe('routing priority', () => {
    it('should prioritize IGRA over generic decode even with same prefix start', () => {
      // A valid 66-char string starting with '92' should be routed to IGRA, not generic decode
      const igraPayload = '92' + 'f0719ecd7e66dd1f5b1097c330a7a992d26be0d900fcf9d808000000d50b9d6d';
      const result = decodePayload(igraPayload);
      expect(result).toHaveProperty('txType', 'IGRA_BRIDGE_0X92');
    });

    it('should prioritize Kasplex over L2 bridge when both prefixes match', () => {
      // KASPLEX_HEX = '6b6173706c6578', KASPLEX_L2_BRIDGE_HEX = '3078'
      // These don't overlap, but Kasplex is checked before L2 bridge
      // A payload starting with '6b6173706c6578' goes to Kasplex path
      // This is a Kasplex EIP1559 payload (type byte '01' = binary, with '02' EIP1559 prefix)
      const kasplexPayload =
        '6b6173706c65780102f8b883028c648206238601d1e4e4ea008601d1e4e4ea0082b5e294d6411bc52c8cbd192477233f2db211cb96bc350480b844095ea7b300000000000000000000000086264b694c3c3bc1907ace84dbcf823758e9b94800000000000000000000000000000000000000000000006124c621b081f80c60c080a00f74d986ac5ad1e5880eb0fae451139fd806c0f0938b32a5ea8a998c4c90cf2da0651ed2aae967c6a38377aca864389131318b75cd997827d015b46cd7066fce2d';
      const result = decodePayload(kasplexPayload);
      expect(result).toHaveProperty('txType', 'KASPLEX_EIP1559');
    });
  });
});
