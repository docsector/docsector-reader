/**
 * Web Bot Auth request signing helper.
 *
 * This utility prepares Signature-Agent, Signature-Input and Signature headers
 * for outbound bot/agent requests following the Web Bot Auth profile.
 */

const encoder = new TextEncoder()

function bytesToBase64 (bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  if (typeof btoa === 'function') {
    return btoa(binary)
  }

  return Buffer.from(bytes).toString('base64')
}

function assertHttpsUrl (value, fieldName) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${fieldName} must be a valid URL`)
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${fieldName} must use https://`)
  }

  return url
}

async function importPrivateKey (privateJwk) {
  if (!privateJwk || privateJwk.kty !== 'OKP' || privateJwk.crv !== 'Ed25519' || !privateJwk.d || !privateJwk.x) {
    throw new Error('privateJwk must be an Ed25519 private JWK with kty=OKP, crv=Ed25519, d and x')
  }

  return crypto.subtle.importKey('jwk', privateJwk, { name: 'Ed25519' }, false, ['sign'])
}

function formatSignatureParams ({ label, keyId, created, expires }) {
  return `${label}=("@authority" "signature-agent");created=${created};expires=${expires};keyid="${keyId}";alg="ed25519";tag="web-bot-auth"`
}

function formatSignatureBase ({ authority, signatureAgentHeader, params }) {
  return `"@authority": ${authority}\n"signature-agent": ${signatureAgentHeader}\n"@signature-params": ${params}`
}

/**
 * Build Web Bot Auth headers for an outbound request.
 *
 * @param {Object} options
 * @param {string} options.url - Target request URL.
 * @param {Object} options.privateJwk - Private Ed25519 JWK.
 * @param {string} options.keyId - JWK thumbprint or configured key id.
 * @param {string} options.signatureAgent - HTTPS URL of your signatures directory.
 * @param {number} [options.expiresIn=60] - Signature validity window in seconds.
 * @param {number} [options.createdAt] - Optional created timestamp (unix seconds).
 * @param {string} [options.label='sig1'] - Signature label.
 * @returns {Promise<Object>} Headers object with Signature-Agent, Signature-Input and Signature.
 */
export async function createWebBotAuthHeaders ({
  url,
  privateJwk,
  keyId,
  signatureAgent,
  expiresIn = 60,
  createdAt,
  label = 'sig1'
}) {
  if (!keyId || typeof keyId !== 'string') {
    throw new Error('keyId is required')
  }

  const target = assertHttpsUrl(url, 'url')
  const signatureAgentUrl = assertHttpsUrl(signatureAgent, 'signatureAgent')
  const signatureAgentHeader = `"${signatureAgentUrl.toString()}"`

  const created = Number.isFinite(createdAt) ? Math.floor(createdAt) : Math.floor(Date.now() / 1000)
  const ttl = Number.isFinite(expiresIn) ? Math.max(30, Math.floor(expiresIn)) : 60
  const expires = created + ttl

  const params = formatSignatureParams({ label, keyId, created, expires })
  const paramsValue = params.slice(label.length + 1)
  const base = formatSignatureBase({
    authority: target.host,
    signatureAgentHeader,
    params: paramsValue
  })

  const privateKey = await importPrivateKey(privateJwk)
  const signatureBytes = await crypto.subtle.sign('Ed25519', privateKey, encoder.encode(base))
  const signature = `${label}=:${bytesToBase64(new Uint8Array(signatureBytes))}:`

  return {
    'Signature-Agent': signatureAgentHeader,
    'Signature-Input': params,
    Signature: signature
  }
}

/**
 * Mutates a Headers object by adding Web Bot Auth headers.
 *
 * @param {Headers} headers - Headers instance to mutate.
 * @param {Object} options - Same options accepted by createWebBotAuthHeaders.
 * @returns {Promise<Headers>} The same headers instance with Web Bot Auth headers.
 */
export async function applyWebBotAuthHeaders (headers, options) {
  const signedHeaders = await createWebBotAuthHeaders(options)
  for (const [name, value] of Object.entries(signedHeaders)) {
    headers.set(name, value)
  }

  return headers
}
