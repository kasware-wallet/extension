import { hexToBytes } from '@noble/hashes/utils';
class EthereumJSError extends Error {
  type: any;
  constructor(o, _, j) {
    super(_ ?? o.code), (this.type = o), void 0 !== j && (this.stack = j);
  }
  getMetadata() {
    return this.type;
  }
  toObject() {
    return {
      type: this.getMetadata(),
      message: this.message ?? '',
      stack: this.stack ?? '',
      className: this.constructor.name
    };
  }
}
function EthereumJSErrorWithoutCode(o, _) {
  return new EthereumJSError({ code: 'ETHEREUMJS_DEFAULT_ERROR_CODE' }, o, _);
}
function decodeLength(o) {
  if (0 === o[0]) throw EthereumJSErrorWithoutCode('invalid RLP: extra zeros', undefined);
  return (function parseHexByte(o) {
    const _ = Number.parseInt(o, 16);
    if (Number.isNaN(_)) throw EthereumJSErrorWithoutCode('Invalid byte sequence', undefined);
    return _;
  })(
    (function bytesToHex(o) {
      let _ = '';
      for (let j = 0; j < o.length; j++) _ += Ks[o[j]];
      return _;
    })(o)
  );
}
function safeSlice(o, _, j) {
  if (j > o.length)
    throw EthereumJSErrorWithoutCode('invalid RLP (safeSlice): end slice of Uint8Array out-of-bounds', undefined);
  return o.slice(_, j);
}
function _decode(o) {
  let _, j, $, V, U;
  const Z: Uint8Array[] = [],
    ee = o[0];
  if (ee <= 127) return { data: o.slice(0, 1), remainder: o.subarray(1) };
  if (ee <= 183) {
    if (((_ = ee - 127), ($ = 128 === ee ? Uint8Array.from([]) : safeSlice(o, 1, _)), 2 === _ && $[0] < 128))
      throw EthereumJSErrorWithoutCode(
        'invalid RLP encoding: invalid prefix, single byte < 0x80 are not prefixed',
        undefined
      );
    return { data: $, remainder: o.subarray(_) };
  }
  if (ee <= 191) {
    if (((j = ee - 182), o.length - 1 < j))
      throw EthereumJSErrorWithoutCode('invalid RLP: not enough bytes for string length', undefined);
    if (((_ = decodeLength(safeSlice(o, 1, j))), _ <= 55))
      throw EthereumJSErrorWithoutCode('invalid RLP: expected string length to be greater than 55', undefined);
    return ($ = safeSlice(o, j, _ + j)), { data: $, remainder: o.subarray(_ + j) };
  }
  if (ee <= 247) {
    for (_ = ee - 191, V = safeSlice(o, 1, _); V.length; ) (U = _decode(V)), Z.push(U.data), (V = U.remainder);
    return { data: Z, remainder: o.subarray(_) };
  }
  {
    if (((j = ee - 246), (_ = decodeLength(safeSlice(o, 1, j))), _ < 56))
      throw EthereumJSErrorWithoutCode('invalid RLP: encoded list too short', undefined);
    const $ = j + _;
    if ($ > o.length) throw EthereumJSErrorWithoutCode('invalid RLP: total length is larger than the data', undefined);
    for (V = safeSlice(o, j, $); V.length; ) (U = _decode(V)), Z.push(U.data), (V = U.remainder);
    return { data: Z, remainder: o.subarray($) };
  }
}
const Ks = Array.from({ length: 256 }, (o, _) => _.toString(16).padStart(2, '0'));
// const Ys = 48,
//     Gs = 57,
//     Xs = 65,
//     Zs = 70,
//     Qs = 97,
//     Js = 102;
// function asciiToBase16(o) {
//     return o >= Ys && o <= Gs ? o - Ys : o >= Xs && o <= Zs ? o - (Xs - 10) : o >= Qs && o <= Js ? o - (Qs - 10) : void 0;
// }
// function hexToBytes(o) {
//     if (("0x" === o.slice(0, 2) && (o = o.slice(0, 2)), "string" != typeof o))
//         throw EthereumJSErrorWithoutCode("hex string expected, got " + typeof o, undefined);
//     const _ = o.length,
//         j = _ / 2;
//     if (_ % 2) throw EthereumJSErrorWithoutCode("padded hex string expected, got unpadded hex of length " + _, undefined);
//     const $ = new Uint8Array(j);
//     for (let V = 0, U = 0; V < j; V++, U += 2) {
//         const _ = asciiToBase16(o.charCodeAt(U)),
//             j = asciiToBase16(o.charCodeAt(U + 1));
//         if (void 0 === _ || void 0 === j) {
//             throw EthereumJSErrorWithoutCode(
//                 'hex string expected, got non-hex character "' + (o[U] + o[U + 1]) + '" at index ' + U, undefined
//             );
//         }
//         $[V] = 16 * _ + j;
//     }
//     return $;
// }
function isHexString(o) {
  return o.length >= 2 && '0' === o[0] && 'x' === o[1];
}
function toBytes(o) {
  if (o instanceof Uint8Array) return o;
  if ('string' == typeof o)
    return isHexString(o)
      ? hexToBytes(
          (function padToEven(o) {
            return o.length % 2 ? `0${o}` : o;
          })(
            (function stripHexPrefix(o) {
              return 'string' != typeof o ? o : isHexString(o) ? o.slice(2) : o;
            })(o)
          )
        )
      : (function utf8ToBytes(o) {
          return new TextEncoder().encode(o);
        })(o);
  if ('number' == typeof o || 'bigint' == typeof o)
    return o
      ? hexToBytes(
          (function numberToHex(o) {
            if (o < 0) throw EthereumJSErrorWithoutCode('Invalid integer as argument, must be unsigned!', undefined);
            const _ = o.toString(16);
            return _.length % 2 ? `0${_}` : _;
          })(o)
        )
      : Uint8Array.from([]);
  if (null == o) return Uint8Array.from([]);
  throw EthereumJSErrorWithoutCode('toBytes: received unsupported type ' + typeof o, undefined);
}
function decode(o, _ = !1) {
  if (null == o || 0 === o.length) return Uint8Array.from([]);
  const j = _decode(toBytes(o));
  if (_) return { data: j.data, remainder: j.remainder.slice() };
  if (0 !== j.remainder.length) throw EthereumJSErrorWithoutCode('invalid RLP: remainder must be zero', undefined);
  return j.data;
}
export const IGRA_HEX = '97b1';
export const KASPLEX_HEX = '6b6173706c6578';
export const KASPLEX_L2_BRIDGE_HEX = '3078'; // 3078 means '0x'
const kasplexPayloadType = { '00': 'json', '01': 'binary', 80: 'json_zlib', 81: 'binary_zlib' };
const hexToU8 = (o) => Uint8Array.from(o.match(/.{1,2}/g).map((o) => parseInt(o, 16)));
const u8ToHex = (o) => [...o].map((o) => o.toString(16).padStart(2, '0')).join('');
function decodeIgraPayload(o) {
  const _ = o.slice(4, 6);
  if ('a2' !== _) return { error: 'Unsupported IGRA format (not zipped)' };
  try {
    // const _ = Hs(hexToU8(o.slice(6))),
    const _ = hexToU8(o.slice(6)),
      j = u8ToHex(_);
    if (!j.startsWith('02')) return { rawHex: j };
    return {
      txType: '0x02 (EIP-1559)',
      fields: decode(Buffer.from(j.slice(2), 'hex')).map((o) => (o instanceof Uint8Array ? u8ToHex(o) : o))
    };
  } catch (BE: unknown) {
    return {
      error: `Failed to decode IGRA L2 payload: ${BE instanceof Error ? BE.message : 'Unknown error'}`
    };
  }
}
function decodeKasplexPayload(o) {
  if (!o.startsWith(KASPLEX_HEX)) return { error: 'Not Kasplex payload' };
  const _ = o.slice(14, 16).toLowerCase();
  let j = o.slice(16);
  //   ("80" !== _ && "81" !== _) || (j = u8ToHex(Hs(hexToU8(j))));
  ('80' !== _ && '81' !== _) || (j = u8ToHex(hexToU8(j)));
  if ('00' === _ || '80' === _)
    return {
      txType: 'KASPLEX_JSON',
      byteCode: kasplexPayloadType[_],
      json: Buffer.from(j, 'hex').toString('utf8')
    };
  const $ = j.startsWith('02'),
    V = $ ? j.slice(2) : j;
  try {
    const o = decode(Buffer.from(V, 'hex'));
    if ($ && Array.isArray(o) && o.length >= 12) {
      const [j, $, V, U, Z, ee, ie, ae, le, ce, de, fe] = o.map((o) => (o instanceof Uint8Array ? u8ToHex(o) : o));
      return {
        txType: 'KASPLEX_EIP1559',
        byteCode: kasplexPayloadType[_],
        fields: {
          chainId: j,
          nonce: $,
          maxPriorityFeePerGas: V,
          maxFeePerGas: U,
          gasLimit: Z,
          to: ee,
          value: ie,
          data: ae,
          accessList: le,
          v: ce,
          r: de,
          s: fe
        }
      };
    }
    if (Array.isArray(o)) {
      const [j, $, V, U, Z, ee, ie, ae, le] = o.map((o) => (o instanceof Uint8Array ? u8ToHex(o) : o));
      return {
        txType: 'KASPLEX_LEGACY',
        byteCode: kasplexPayloadType[_],
        fields: { nonce: j, gasPrice: $, gasLimit: V, to: U, value: Z, data: ee, v: ie, r: ae, s: le }
      };
    }
  } catch (BE: unknown) {
    console.error(`Failed to decode Kasplex L2 payload: ${BE instanceof Error ? BE.message : 'Unknown error'}`); // eslint-disable-line no-console
  }
  return { txType: 'KASPLEX_RAW', byteCode: kasplexPayloadType[_], rawHex: j };
}

function decodeKasplexL2BridgePayload(o) {
  if (!o.startsWith(KASPLEX_L2_BRIDGE_HEX)) return { error: 'Not kasplex L2 bridge payload' };

  const j = u8ToHex(hexToU8(o));

  return {
    txType: 'KASPLEX_L2_BRIDGE',
    address: Buffer.from(j, 'hex').toString('utf8')
  };
}
export function decodePayload(o: string) {
  return o && 'string' == typeof o
    ? o.startsWith(IGRA_HEX)
      ? decodeIgraPayload(o)
      : o.startsWith(KASPLEX_HEX)
      ? decodeKasplexPayload(o)
      : o.startsWith(KASPLEX_L2_BRIDGE_HEX)
      ? decodeKasplexL2BridgePayload(o)
      : { error: 'Unsupported payload prefix' }
    : { error: 'No payload' };
}

// const payload = '6b6173706c65780102f8b883028c648206238601d1e4e4ea008601d1e4e4ea0082b5e294d6411bc52c8cbd192477233f2db211cb96bc350480b844095ea7b300000000000000000000000086264b694c3c3bc1907ace84dbcf823758e9b94800000000000000000000000000000000000000000000006124c621b081f80c60c080a00f74d986ac5ad1e5880eb0fae451139fd806c0f0938b32a5ea8a998c4c90cf2da0651ed2aae967c6a38377aca864389131318b75cd997827d015b46cd7066fce2d'

// const payload = '307838313131334245383832613239343066446535386362354231413344303442383831323635383130'; // kasplex L2 bridge
// console.log(decodePayload(payload));
