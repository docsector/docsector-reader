/**
 * Page version status — the menu chip a page earns from the release that shipped
 * it (`config.version`) and the releases that updated it (`config.updated`),
 * measured against the latest released docs version — the highest released
 * entry of the versions selector (`versions` of `virtual:docsector-books`).
 *
 * A chip lasts for its whole minor (`X.Y`): a page shipped or updated in v2.1.0
 * keeps it through every v2.1.x release and loses it at v2.2.0. A release not
 * out yet — a newer patch, or the final of a released prerelease — is a future
 * one.
 *
 * | Condition                               | kind       | reason   |
 * |-----------------------------------------|------------|----------|
 * | manual `status: 'draft'` / `'empty'`    | draft/empty | —       |
 * | `version` newer than latest released    | `soon`     | `page`   |
 * | `version` in the latest released minor  | `new`      | `page`   |
 * | an `updated` released, in that minor    | `updated`  | `update` |
 * | an `updated` newer than latest released | `updating` | `update` |
 *
 * `soon` is kept for a page whose feature is not out yet; a page that already
 * exists and only gets an update in a future release is `updating`.
 */

/**
 * Parse a version id such as `v1.3.0`, `1.3`, or `v1.0.0-beta.6`. A major alone,
 * a date (`2024-05-01`) or a wildcard (`v1.x`) is not a version.
 *
 * @param {unknown} value - Version id.
 * @returns {{ major: number, minor: number, patch: number, prerelease: string | null } | null} Parsed version, or null when unparseable.
 */
export const parse = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const match = value.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9a-z.-]+))?(?:\+[0-9a-z.-]+)?$/i)
  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
    prerelease: match[4]?.toLowerCase() ?? null
  }
}

/**
 * Compare two parsed versions at minor granularity.
 *
 * @returns {number} Negative when a < b, 0 when the same minor, positive when a > b.
 */
const compareMinor = (a, b) => (a.major - b.major) || (a.minor - b.minor)

/**
 * Compare two prerelease tags by SemVer precedence, case-insensitive (`parse()`
 * lowercases them): none ranks above any tag, numeric identifiers compare as
 * numbers and below alphanumeric ones.
 */
const comparePrerelease = (a, b) => {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1

  const left = a.split('.')
  const right = b.split('.')
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] === undefined) return -1
    if (right[i] === undefined) return 1
    if (left[i] === right[i]) continue

    const x = /^\d+$/.test(left[i]) ? Number(left[i]) : null
    const y = /^\d+$/.test(right[i]) ? Number(right[i]) : null
    if (x !== null && y !== null) {
      if (x !== y) return x - y
      continue
    }
    if (x !== null) return -1
    if (y !== null) return 1
    return left[i] < right[i] ? -1 : 1
  }

  return 0
}

const compareFull = (a, b) => compareMinor(a, b) || (a.patch - b.patch) || comparePrerelease(a.prerelease, b.prerelease)

/**
 * Latest released version of the docs: the highest parseable entry of the
 * versions selector that is released. The selector entries are the normalized
 * descriptors of `virtual:docsector-books` (`{ id, released }`), so the release
 * rules (`released`, `status`/`releaseStatus`, `deprecated`) live in one place.
 *
 * @param {Array<{ id?: string, released?: boolean } | string>} [versions] - Normalized version descriptors.
 * @returns {string | null} Latest released version id, or null when none parses.
 */
export const latest = (versions = []) => {
  let best = null
  let bestId = null

  for (const entry of Array.isArray(versions) ? versions : []) {
    const id = typeof entry === 'string' ? entry : entry?.id
    const released = typeof entry === 'string' || entry?.released === true
    const parsed = released ? parse(id) : null

    if (parsed && (best === null || compareFull(parsed, best) > 0)) {
      best = parsed
      bestId = id.trim()
    }
  }

  return bestId
}

/**
 * Tell whether a version is not out yet: newer than the latest release, a newer
 * patch or the final of a released prerelease included.
 *
 * @param {string} version - Version id.
 * @param {string | null} released - Latest released version id.
 * @returns {boolean} True when both parse and `version` is newer than `released`.
 */
export const upcoming = (version, released) => {
  const a = parse(version)
  const b = parse(released)

  return a !== null && b !== null && compareFull(a, b) > 0
}

/**
 * Normalize `config.updated` into a sorted, deduplicated list of parseable ids.
 *
 * @param {unknown} updated - A version id or an array of them.
 * @returns {string[]} Version ids, oldest first.
 */
export const normalize = (updated) => {
  const values = Array.isArray(updated) ? updated : (updated == null ? [] : [updated])
  const seen = new Set()
  const ids = []

  for (const value of values) {
    if (typeof value !== 'string' || !parse(value)) {
      continue
    }

    const id = value.trim()
    if (!seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }

  return ids.sort((a, b) => compareFull(parse(a), parse(b)))
}

/**
 * Resolve the chip of a page.
 *
 * A legacy `status: 'new'` with no parseable `version` keeps the static "new" chip.
 *
 * @param {{ status?: string, version?: string, updated?: string[] }} page - Page meta.
 * @param {string | null} released - Latest released version id (see `latest()`).
 * @returns {{ kind: 'soon'|'new'|'updated'|'updating'|'draft'|'empty'|null, version: string|null, reason: 'page'|'update'|null }} The chip.
 */
export const resolve = (page = {}, released = null) => {
  const status = page?.status
  if (status === 'draft' || status === 'empty') {
    return { kind: status, version: null, reason: null }
  }

  const version = typeof page?.version === 'string' ? page.version.trim() : ''
  const shipped = parse(version)
  const current = parse(released)
  const legacy = status === 'new'
    ? { kind: 'new', version: shipped ? version : null, reason: 'page' }
    : { kind: null, version: null, reason: null }

  // ? Nothing to compare against, or a legacy 'new' with no version: the static chip
  if (!current || (!shipped && status === 'new')) {
    return legacy
  }

  // @ The page itself
  if (shipped) {
    if (compareFull(shipped, current) > 0) {
      return { kind: 'soon', version, reason: 'page' }
    }
    if (compareMinor(shipped, current) === 0) {
      return { kind: 'new', version, reason: 'page' }
    }
  }

  // @ Its updates — the newest released one of the latest minor, else the next upcoming one
  const updates = normalize(page?.updated)
  const recent = updates.filter(id => compareMinor(parse(id), current) === 0 && compareFull(parse(id), current) <= 0)
  if (recent.length > 0) {
    return { kind: 'updated', version: recent.at(-1), reason: 'update' }
  }

  const future = updates.filter(id => compareFull(parse(id), current) > 0)
  if (future.length > 0) {
    return { kind: 'updating', version: future[0], reason: 'update' }
  }

  // ? A stale manual 'new' on a page whose version says otherwise is dropped
  return { kind: null, version: null, reason: null }
}

// ! Chip colours per kind: [badge color, text color]
const COLORS = {
  new: ['positive', 'white'],
  soon: ['warning', 'dark'],
  updated: ['info', 'white'],
  updating: ['deep-purple', 'white'],
  draft: ['orange', 'dark'],
  empty: ['red', 'white']
}

/**
 * Describe the menu chip of a route: kind, colours and the i18n keys of its
 * label and tooltip. `soon` and `updating` speak in the future tense.
 *
 * @param {{ status?: string, pageVersion?: string, pageUpdated?: string[] }} meta - Route meta.
 * @param {string | null} released - Latest released version id (see `latest()`).
 * @returns {{ kind: string, color: string, textColor: string, label: string, tooltip: string, version: string|null } | null} The chip, or null for none.
 */
export const describe = (meta, released) => {
  if (!meta) {
    return null
  }

  const chip = resolve({ status: meta.status, version: meta.pageVersion, updated: meta.pageUpdated }, released)
  if (chip.kind === null) {
    return null
  }

  const tooltip = chip.version === null
    ? `menu.status.${chip.kind}.tooltip`
    : `menu.status.${chip.kind}.tooltipVersion`

  const [color, textColor] = COLORS[chip.kind]

  return { kind: chip.kind, color, textColor, label: `menu.status.${chip.kind}._`, tooltip, version: chip.version }
}

/**
 * Lay out the release lines of the page bar: the page's own release (past or
 * future tense) and its updates split into the ones out and the ones to come.
 *
 * @param {{ pageVersion?: string, pageUpdated?: string[] }} meta - Route meta.
 * @param {string | null} released - Latest released version id.
 * @returns {{ version: string, versionLabel: string, past: string, future: string }} Texts to show; empty strings hide a line.
 */
export const timeline = (meta, released) => {
  const version = typeof meta?.pageVersion === 'string' ? meta.pageVersion.trim() : ''
  const updates = normalize(meta?.pageUpdated)

  return {
    version,
    versionLabel: upcoming(version, released) ? 'page.comingVersion' : 'page.newVersion',
    past: updates.filter(id => !upcoming(id, released)).join(', '),
    future: updates.filter(id => upcoming(id, released)).join(', ')
  }
}

/**
 * Current docs version: the selector entry marked `current`, else the first one.
 *
 * @param {Array<{ id?: string, current?: boolean } | string>} [versions] - Normalized version descriptors.
 * @returns {string | null} Version id, or null with no entry.
 */
export const current = (versions = []) => {
  const entries = (Array.isArray(versions) ? versions : []).filter(Boolean)
  const entry = entries.find(item => typeof item === 'object' && item.current === true) ?? entries[0]

  return (typeof entry === 'string' ? entry : entry?.id) ?? null
}

/**
 * Versions in development: the releases newer than the latest release that the
 * current docs already name — as the release that ships a page (`pageVersion`)
 * or as one that updates it (`pageUpdated`). Only routes of the current docs
 * version count (an archived or preview version has docs of its own), and a
 * `draft` or `empty` page does not. A release the selector already lists — an
 * unreleased entry of the same `X.Y.Z` (`v1.4.0-dev`) included — is skipped.
 * Ids are written `vX.Y.Z[-prerelease]`.
 *
 * @param {Array<{ version?: string, status?: string, pageVersion?: string, pageUpdated?: string[] } | null | undefined>} metas - Route metas.
 * @param {Array<{ id?: string, released?: boolean, current?: boolean } | string>} [versions] - Normalized version descriptors.
 * @returns {string[]} Version ids, newest first; empty with no released version to compare.
 */
export const unreleased = (metas, versions = []) => {
  const released = latest(versions)
  if (released === null) {
    return []
  }

  const docs = current(versions)
  const configured = (Array.isArray(versions) ? versions : [])
    .map(entry => ({
      parsed: parse(typeof entry === 'string' ? entry : entry?.id),
      released: typeof entry === 'string' || entry?.released === true
    }))
    .filter(entry => entry.parsed !== null)
  const listed = (parsed) => configured.some(entry => entry.released
    ? compareFull(entry.parsed, parsed) === 0
    : (compareMinor(entry.parsed, parsed) === 0 && entry.parsed.patch === parsed.patch))
  const found = []

  for (const meta of Array.isArray(metas) ? metas : []) {
    if (!meta || meta.version !== docs || meta.status === 'draft' || meta.status === 'empty') {
      continue
    }

    for (const candidate of [meta.pageVersion, ...normalize(meta.pageUpdated)]) {
      if (typeof candidate !== 'string' || !upcoming(candidate, released)) {
        continue
      }

      const parsed = parse(candidate)
      if (!listed(parsed) && !found.some(other => compareFull(other, parsed) === 0)) {
        found.push(parsed)
      }
    }
  }

  return found
    .sort((a, b) => compareFull(b, a))
    .map(v => `v${v.major}.${v.minor}.${v.patch}${v.prerelease ? `-${v.prerelease}` : ''}`)
}
