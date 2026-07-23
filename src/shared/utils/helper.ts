import { Buffer } from 'buffer';

function hexToBuf(hex: string) {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error('hex string must have even length');
  return Buffer.from(hex, 'hex');
}

function addr20FromHex(hexAddr: string) {
  const b = hexToBuf(hexAddr);
  if (b.length !== 20) throw new Error('address must be 20 bytes');
  return b;
}

function u32BE(n: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(n >>> 0);
  return buf;
}

function u64LE(big: bigint) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(big);
  return buf;
}

// reference link:https://github.com/argonmining/igra-kas-bridge
// ### Payload Structure (33 bytes)
// ```
// [Prefix: 1 byte] [L2 Address: 20 bytes] [Amount: 8 bytes] [Nonce: 4 bytes]
// ```
// | Offset | Length | Field | Description |
// |--------|--------|-------|-------------|
// | 0 | 1 | Prefix | `0x92` — Version (0x9) + TxTypeId (0x2) |
// | 1 | 20 | L2 Address | Recipient's Ethereum-style address (without 0x prefix) |
// | 21 | 8 | Amount | Amount in SOMPI, unsigned 64-bit **little-endian** |
// | 29 | 4 | Nonce | Mining nonce, unsigned 32-bit **big-endian** |
export function buildIgraEntryPayload({
  l2AddressHex,
  amount,
  nonce
}: {
  l2AddressHex: string;
  amount: bigint;
  nonce: number;
}) {
  const version = 0x92;
  const head = Buffer.from([version]);
  const addr = addr20FromHex(l2AddressHex);
  const amt = u64LE(amount);
  const non = u32BE(nonce); // Nonce is always big-endian per IGRA spec
  return Buffer.concat([head, addr, amt, non]); // 33 bytes
}

export function decodeIgraEntryPayload(payload: Buffer | string) {
  const buf = typeof payload === 'string' ? hexToBuf(payload) : payload;
  if (buf.length !== 33) throw new Error('entry payload must be 33 bytes');
  const prefix = buf.readUInt8(0);
  if (prefix !== 0x92) throw new Error('invalid IGRA entry prefix: expected 0x92');
  const l2AddressHex = '0x' + buf.subarray(1, 21).toString('hex');
  const amount = buf.readBigUInt64LE(21).toString();
  const nonce = buf.readUInt32BE(29);
  return { prefix, l2AddressHex, amount, nonce };
}

export const stringToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};
