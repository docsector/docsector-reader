/**
 * Stable string hashing for keys and deterministic picks that must agree
 * between the server render and the client (no randomness, no clock).
 */

// : djb2-xor hash of `value` as an unsigned 32-bit integer — `^` coerces to
//   int32 at every step, so Node and every browser get the same number
export function hashString (value) {
  const text = String(value ?? '')

  let hash = 5381
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 33) ^ text.charCodeAt(index)
  }

  return hash >>> 0
}
